import fs from "node:fs/promises";
import path from "node:path";

const ADAPTER_CACHE_KEY = "__KAR_NEWS_PERSISTENCE_ADAPTER_V1__";
const DEFAULT_FILE_PATH = process.env.KAR_NEWS_STORE_PATH || path.join(process.cwd(), ".cache", "kar-high-capacity-news-store.json");
const DEFAULT_REDIS_KEY = process.env.KAR_NEWS_REDIS_KEY || "kar:news:high-capacity:snapshot";
const DEFAULT_POSTGRES_TABLE = process.env.KAR_NEWS_POSTGRES_TABLE || "kar_news_snapshots";
const SNAPSHOT_RECORD_KEY = process.env.KAR_NEWS_POSTGRES_KEY || "default";

function nowIso() {
  return new Date().toISOString();
}

function canUseNodeFs() {
  return typeof process !== "undefined" && process.release?.name === "node";
}

function normalizeMode(value = "file") {
  const mode = String(value || "file").toLowerCase();
  if (["memory", "file", "redis", "postgres"].includes(mode)) return mode;
  return "file";
}

async function ensureFileDirectory(filePath) {
  if (!canUseNodeFs()) return;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function buildMeta({ requestedMode, resolvedMode, fallbackReason = "", filePath = "", target = "" }) {
  return {
    enabled: resolvedMode !== "memory" || requestedMode === "memory",
    mode: resolvedMode,
    requested_mode: requestedMode,
    external_mode_requested: requestedMode === "redis" || requestedMode === "postgres",
    fallback_reason: fallbackReason,
    file_path: resolvedMode === "file" ? filePath : "",
    target,
  };
}

function buildMemoryAdapter({ requestedMode, fallbackReason = "" } = {}) {
  let inMemorySnapshot = null;
  return {
    requestedMode,
    resolvedMode: "memory",
    describe() {
      return buildMeta({ requestedMode, resolvedMode: "memory", fallbackReason, target: "memory" });
    },
    async load() {
      return inMemorySnapshot;
    },
    async save(snapshot) {
      inMemorySnapshot = snapshot;
      return { ok: true, persistedAt: snapshot?.persisted_at || nowIso() };
    },
  };
}

function buildFileAdapter({ requestedMode, filePath = DEFAULT_FILE_PATH, fallbackReason = "" } = {}) {
  return {
    requestedMode,
    resolvedMode: canUseNodeFs() ? "file" : "memory",
    describe() {
      return buildMeta({
        requestedMode,
        resolvedMode: canUseNodeFs() ? "file" : "memory",
        fallbackReason,
        filePath,
        target: canUseNodeFs() ? filePath : "memory",
      });
    },
    async load() {
      if (!canUseNodeFs()) return null;
      try {
        const raw = await fs.readFile(filePath, "utf8");
        return JSON.parse(raw);
      } catch (error) {
        if (error?.code === "ENOENT") return null;
        throw error;
      }
    },
    async save(snapshot) {
      if (!canUseNodeFs()) return { ok: true, persistedAt: snapshot?.persisted_at || nowIso() };
      await ensureFileDirectory(filePath);
      await fs.writeFile(filePath, JSON.stringify(snapshot), "utf8");
      return { ok: true, persistedAt: snapshot?.persisted_at || nowIso() };
    },
  };
}

async function tryCreateRedisAdapter({ requestedMode }) {
  const redisUrl = String(process.env.REDIS_URL || process.env.KAR_NEWS_REDIS_URL || "").trim();
  if (!redisUrl) {
    return { ok: false, reason: "missing_redis_url" };
  }

  try {
    const { createClient } = await import("redis");
    const client = createClient({ url: redisUrl });
    client.on("error", () => {});
    if (!client.isOpen) await client.connect();

    return {
      ok: true,
      adapter: {
        requestedMode,
        resolvedMode: "redis",
        describe() {
          return buildMeta({ requestedMode, resolvedMode: "redis", target: DEFAULT_REDIS_KEY });
        },
        async load() {
          const raw = await client.get(DEFAULT_REDIS_KEY);
          return raw ? JSON.parse(raw) : null;
        },
        async save(snapshot) {
          await client.set(DEFAULT_REDIS_KEY, JSON.stringify(snapshot));
          return { ok: true, persistedAt: snapshot?.persisted_at || nowIso() };
        },
      },
    };
  } catch (error) {
    return { ok: false, reason: error?.message || "redis_init_failed" };
  }
}

async function tryCreatePostgresAdapter({ requestedMode }) {
  const databaseUrl = String(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.KAR_NEWS_DATABASE_URL || "").trim();
  if (!databaseUrl) {
    return { ok: false, reason: "missing_database_url" };
  }

  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: databaseUrl, max: 3 });

    const ensureTableSql = `
      CREATE TABLE IF NOT EXISTS ${DEFAULT_POSTGRES_TABLE} (
        snapshot_key TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await pool.query(ensureTableSql);

    return {
      ok: true,
      adapter: {
        requestedMode,
        resolvedMode: "postgres",
        describe() {
          return buildMeta({ requestedMode, resolvedMode: "postgres", target: `${DEFAULT_POSTGRES_TABLE}:${SNAPSHOT_RECORD_KEY}` });
        },
        async load() {
          const result = await pool.query(
            `SELECT payload FROM ${DEFAULT_POSTGRES_TABLE} WHERE snapshot_key = $1 LIMIT 1`,
            [SNAPSHOT_RECORD_KEY]
          );
          return result.rows?.[0]?.payload || null;
        },
        async save(snapshot) {
          await pool.query(
            `
              INSERT INTO ${DEFAULT_POSTGRES_TABLE} (snapshot_key, payload, updated_at)
              VALUES ($1, $2::jsonb, NOW())
              ON CONFLICT (snapshot_key)
              DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
            `,
            [SNAPSHOT_RECORD_KEY, JSON.stringify(snapshot)]
          );
          return { ok: true, persistedAt: snapshot?.persisted_at || nowIso() };
        },
      },
    };
  } catch (error) {
    return { ok: false, reason: error?.message || "postgres_init_failed" };
  }
}

async function buildAdapter() {
  const requestedMode = normalizeMode(process.env.KAR_NEWS_PERSISTENCE_MODE || "file");

  if (requestedMode === "memory") {
    return buildMemoryAdapter({ requestedMode });
  }

  if (requestedMode === "redis") {
    const redis = await tryCreateRedisAdapter({ requestedMode });
    if (redis.ok) return redis.adapter;
    return buildFileAdapter({ requestedMode, fallbackReason: redis.reason });
  }

  if (requestedMode === "postgres") {
    const postgres = await tryCreatePostgresAdapter({ requestedMode });
    if (postgres.ok) return postgres.adapter;
    return buildFileAdapter({ requestedMode, fallbackReason: postgres.reason });
  }

  return buildFileAdapter({ requestedMode });
}

export async function getPersistenceAdapter() {
  if (!globalThis[ADAPTER_CACHE_KEY]) {
    globalThis[ADAPTER_CACHE_KEY] = buildAdapter();
  }
  return globalThis[ADAPTER_CACHE_KEY];
}