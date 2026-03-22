import { applyApiHeaders, getInternalApiBase, handlePreflight, rejectUnsupportedMethod, withTimeout } from "./_api-utils";

const CACHE_TTL_MS = 4 * 1000;

const FEED_ENDPOINTS = [
  { id: "news", path: "/api/news", priority: 10 },
  { id: "fastnews", path: "/api/fastnews", priority: 8 },
  { id: "intelnews", path: "/api/intelnews", priority: 7 },
  { id: "x-feed", path: "/api/x-feed", priority: 6 },
];

let memoryCache = new Map();

function buildCacheKey(category, sourceKey = "all") {
  return `live-intake:${category || "all"}:${sourceKey}`;
}

function parseSourceFilters(rawSource = "") {
  return String(rawSource || "")
    .split(",")
    .map((item) => decodeURIComponent(String(item || "").trim()))
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function matchesSourceFilters(source = "", sourceFilters = []) {
  if (!Array.isArray(sourceFilters) || sourceFilters.length === 0) return true;
  const haystack = String(source || "").toLowerCase();
  return sourceFilters.some((item) => haystack.includes(String(item).toLowerCase()));
}

function makeDedupeKey(item) {
  return String(item?.url && item.url !== "#" ? item.url : item?.title || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeItemsFromPayload(feedId, payload) {
  const items = Array.isArray(payload?.news)
    ? payload.news
    : Array.isArray(payload?.posts)
      ? payload.posts
      : Array.isArray(payload?.items)
        ? payload.items
        : [];

  return items.map((item, index) => ({
    ...item,
    id: item.id || `${feedId}-${index}`,
    sourceFeed: feedId,
  }));
}

function dedupeItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item.url && item.url !== "#" ? item.url : item.title || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function weightUrgency(urgency) {
  if (urgency === "high") return 34;
  if (urgency === "medium") return 16;
  return 4;
}

function weightFreshness(time) {
  const ts = new Date(time || 0).getTime();
  if (Number.isNaN(ts)) return 0;
  const ageMinutes = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (ageMinutes <= 15) return 24;
  if (ageMinutes <= 60) return 16;
  if (ageMinutes <= 180) return 10;
  if (ageMinutes <= 720) return 5;
  return 1;
}

function prioritize(items) {
  return [...items]
    .map((item) => {
      const feedPriority = FEED_ENDPOINTS.find((feed) => feed.id === item.sourceFeed)?.priority || 5;
      const sourceWeight = item.reliability === "high" ? 14 : 8;
      const breakingWeight = item.isBreaking ? 20 : 0;
      return {
        ...item,
        _priority: feedPriority + sourceWeight + weightUrgency(item.urgency) + weightFreshness(item.time) + breakingWeight,
      };
    })
    .sort((a, b) => b._priority - a._priority)
    .map((item) => ({ ...item, intakePriority: item._priority }));
}

function selectFeaturedAlert(items) {
  const candidate = items.find((item) => {
    const freshness = weightFreshness(item.time);
    const priority = Number(item.intakePriority || 0);
    return (item.isBreaking || item.urgency === "high") && freshness >= 10 && priority >= 72;
  });

  if (!candidate) return null;

  return {
    id: candidate.id,
    title: candidate.title,
    summary: candidate.summary,
    source: candidate.source,
    time: candidate.time,
    urgency: candidate.urgency,
    reliability: candidate.reliability || "medium",
    intakePriority: candidate.intakePriority,
    url: candidate.url || "#",
    category: candidate.category || "news",
  };
}

async function fetchInternalJson(url) {
  const timeout = withTimeout(9000);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: timeout.signal,
    });
    if (!response.ok) {
      throw new Error(`http_${response.status}`);
    }
    return await response.json();
  } finally {
    timeout.clear();
  }
}

export default async function handler(req, res) {
  applyApiHeaders(req, res);
  if (handlePreflight(req, res)) return;
  if (rejectUnsupportedMethod(req, res, "GET")) return;

  const requestedCategory = String(req.query?.category || "all");
  const sourceFilters = parseSourceFilters(req.query?.source || "");
  const sourceKey = sourceFilters.length > 0 ? sourceFilters.map((item) => item.toLowerCase()).join("|") : "all";
  const cacheKey = buildCacheKey(requestedCategory, sourceKey);
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.updated < CACHE_TTL_MS) {
    res.setHeader("Cache-Control", "s-maxage=12, stale-while-revalidate=24");
    return res.status(200).json(cached.payload);
  }

  const baseUrl = getInternalApiBase(req);
  const feedUrls = FEED_ENDPOINTS.map((feed) => ({
    ...feed,
    url: `${baseUrl}${feed.path}${feed.id === "news" ? `?category=${encodeURIComponent(requestedCategory)}${sourceFilters.length > 0 ? `&source=${encodeURIComponent(sourceFilters.join(","))}` : ""}` : ""}`,
  }));

  const results = await Promise.allSettled(
    feedUrls.map(async (feed) => {
      const startedAt = Date.now();
      const payload = await fetchInternalJson(feed.url);
      return {
        id: feed.id,
        items: normalizeItemsFromPayload(feed.id, payload),
        source: payload?.source || payload?.sourceMode || feed.id,
        updated: payload?.updated || new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
        ok: true,
      };
    })
  );

  const healthDraft = [];
  let mergedItems = [];

  results.forEach((result, index) => {
    const feed = feedUrls[index];
    if (result.status === "fulfilled") {
      mergedItems.push(...result.value.items);
      healthDraft.push({
        id: feed.id,
        ok: true,
        count: result.value.items.length,
        source: result.value.source,
        updated: result.value.updated,
        latencyMs: result.value.latencyMs,
        _items: result.value.items,
      });
      return;
    }

    healthDraft.push({
      id: feed.id,
      ok: false,
      count: 0,
      source: feed.id,
      error: result.reason?.message || "fetch_failed",
      updated: null,
      latencyMs: null,
      qualityScore: 0,
    });
  });

  const keyFrequency = new Map();
  mergedItems.forEach((item) => {
    const key = makeDedupeKey(item);
    if (!key) return;
    keyFrequency.set(key, Number(keyFrequency.get(key) || 0) + 1);
  });

  const health = healthDraft.map((entry) => {
    if (!entry.ok) {
      return {
        id: entry.id,
        ok: false,
        count: 0,
        source: entry.source,
        error: entry.error,
        updated: entry.updated,
        latencyMs: entry.latencyMs,
        qualityScore: 0,
        metrics: {
          duplicateRate: 1,
          mediaRichness: 0,
          freshness: 0,
          uniqueRate: 0,
        },
      };
    }

    const items = Array.isArray(entry._items) ? entry._items : [];
    const count = items.length || 0;
    const duplicateHits = items.reduce((sum, item) => {
      const key = makeDedupeKey(item);
      if (!key) return sum;
      return sum + (Number(keyFrequency.get(key) || 0) > 1 ? 1 : 0);
    }, 0);
    const mediaHits = items.filter((item) => item?.image || item?.videoUrl || item?.hasVideo).length;
    const freshnessRaw = items.reduce((sum, item) => sum + weightFreshness(item?.time), 0);

    const duplicateRate = count > 0 ? duplicateHits / count : 1;
    const uniqueRate = count > 0 ? 1 - duplicateRate : 0;
    const mediaRichness = count > 0 ? mediaHits / count : 0;
    const freshness = count > 0 ? freshnessRaw / (count * 24) : 0;

    const latencyScore =
      typeof entry.latencyMs !== "number"
        ? 0
        : entry.latencyMs <= 1200
          ? 20
          : entry.latencyMs <= 2500
            ? 14
            : entry.latencyMs <= 5000
              ? 8
              : 3;

    const qualityScore = Math.round(
      30 + // availability bonus (ok=true)
      latencyScore +
      uniqueRate * 25 +
      mediaRichness * 15 +
      freshness * 10
    );

    return {
      id: entry.id,
      ok: true,
      count,
      source: entry.source,
      updated: entry.updated,
      latencyMs: entry.latencyMs,
      qualityScore: Math.min(100, Math.max(0, qualityScore)),
      metrics: {
        duplicateRate,
        mediaRichness,
        freshness,
        uniqueRate,
      },
    };
  });

  mergedItems = mergedItems.filter((item) => matchesSourceFilters(item.source, sourceFilters));
  mergedItems = prioritize(dedupeItems(mergedItems)).slice(0, 120);
  const breakingItems = mergedItems.filter((item) => item.urgency === "high" || item.isBreaking).slice(0, 12);
  const featuredAlert = selectFeaturedAlert(mergedItems);
  const healthySources = health.filter((entry) => entry.ok).length;
  const averageQuality = health.length > 0
    ? Math.round(health.reduce((sum, entry) => sum + Number(entry.qualityScore || 0), 0) / health.length)
    : 0;
  const topQualitySource = [...health]
    .sort((a, b) => Number(b.qualityScore || 0) - Number(a.qualityScore || 0))[0]?.id || "";

  const payload = {
    news: mergedItems,
    updated: new Date().toLocaleString("ar-AE", { timeZone: "Asia/Dubai" }),
    source: healthySources > 0 ? (healthySources === health.length ? "ok" : "partial-fallback") : "fallback",
    sourceMode: "live-intake-open-source",
    sourceFilters,
    health,
    stats: {
      totalItems: mergedItems.length,
      breakingCount: breakingItems.length,
      healthySources,
      totalSources: health.length,
      averageQuality,
      topQualitySource,
    },
    breaking: breakingItems,
    featuredAlert,
  };

  memoryCache.set(cacheKey, { updated: Date.now(), payload });
  res.setHeader("Cache-Control", "s-maxage=12, stale-while-revalidate=24");
  return res.status(200).json(payload);
}