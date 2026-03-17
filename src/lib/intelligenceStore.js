/**
 * Intelligence Store — localStorage-backed structured memory.
 * Stores processed intelligence items with deduplication and circular buffer.
 */

const STORE_KEY = "kar_intel_store_v2";
const MAX_ITEMS = 800;

function readStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeStore(items) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(items));
  } catch {
    // Storage full — trim and retry
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(items.slice(-200)));
    } catch { /* ignore */ }
  }
}

/** Ingest a batch of extracted intelligence items (from entityExtractor). */
export function ingestItems(newItems) {
  const store = readStore();
  const existingIds = new Set(store.map(i => i.id));

  const fresh = newItems.filter(item => item && item.id && !existingIds.has(item.id));
  if (!fresh.length) return store;

  const merged = [...store, ...fresh];
  const trimmed = merged.slice(-MAX_ITEMS);
  writeStore(trimmed);
  return trimmed;
}

/** Read current store contents. */
export function getStore() {
  return readStore();
}

/** Clear all stored intelligence. */
export function clearStore() {
  localStorage.removeItem(STORE_KEY);
}

/** Get store statistics. */
export function getStoreStats() {
  const store = readStore();
  if (!store.length) return emptyStats();

  const sources = new Set(store.map(i => i.source).filter(Boolean));
  const allRegions = store.flatMap(i => i.regions || []);
  const regions = new Set(allRegions);
  const allEntities = [
    ...store.flatMap(i => i.organizations || []),
    ...store.flatMap(i => i.uaeClubs || []),
    ...store.flatMap(i => i.globalClubs || []),
  ];
  const entities = new Set(allEntities);
  const allSignals = store.flatMap(i => i.derivedSignals || []);
  const signals = new Set(allSignals);

  // Category breakdown
  const catCounts = {};
  store.forEach(i => {
    const c = i.category || "general";
    catCounts[c] = (catCounts[c] || 0) + 1;
  });

  // High-confidence items
  const highConf = store.filter(i => (i.confidenceScore || 0) >= 60).length;

  // Recent items (last 6h)
  const cutoff = Date.now() - 6 * 3600 * 1000;
  const recent = store.filter(i => {
    try { return new Date(i.timestamp).getTime() > cutoff; } catch { return false; }
  }).length;

  return {
    total: store.length,
    sources: sources.size,
    regions: regions.size,
    entities: entities.size,
    signals: signals.size,
    highConf,
    recent,
    catCounts,
    sourceList: [...sources].slice(0, 12),
    regionList: [...regions],
    signalList: [...signals],
  };
}

function emptyStats() {
  return {
    total: 0, sources: 0, regions: 0, entities: 0, signals: 0,
    highConf: 0, recent: 0, catCounts: {},
    sourceList: [], regionList: [], signalList: [],
  };
}

/** Get items by category (sorted by recency). */
export function getByCategory(category) {
  const store = readStore();
  return store
    .filter(i => i.category === category)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/** Get items containing a specific derived signal. */
export function getBySignal(signal) {
  const store = readStore();
  return store.filter(i => (i.derivedSignals || []).includes(signal));
}

/** Get items for a region. */
export function getByRegion(region) {
  const store = readStore();
  return store.filter(i => (i.regions || []).includes(region));
}
