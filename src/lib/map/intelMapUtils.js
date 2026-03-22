const VALID_CATEGORIES = new Set([
  "conflict",
  "political",
  "economic",
  "economy",
  "cyber",
  "logistics",
  "maritime",
  "aviation",
  "sports",
  "news",
]);

export const CATEGORY_COLOR_MAP = {
  conflict: "#ef4444",
  political: "#f97316",
  economic: "#3b82f6",
  economy: "#3b82f6",
  cyber: "#8b5cf6",
  logistics: "#22c55e",
  maritime: "#14b8a6",
  aviation: "#facc15",
  sports: "#a855f7",
  news: "#38bdf8",
};

export function normalizeCategory(value) {
  const raw = String(value || "news").trim().toLowerCase();
  if (raw === "economic") return "economic";
  if (raw === "economy") return "economic";
  if (raw === "cybersecurity") return "cyber";
  if (["air", "flight", "aero"].includes(raw)) return "aviation";
  if (["sea", "shipping", "naval"].includes(raw)) return "maritime";
  if (["trade", "finance", "energy", "market"].includes(raw)) return "economic";
  if (["military", "security", "war"].includes(raw)) return "conflict";
  return VALID_CATEGORIES.has(raw) ? raw : "news";
}

export function toTimestampMs(value) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function severityFromScore(score, urgency) {
  const u = String(urgency || "").toLowerCase();
  if (u === "critical" || score >= 85) return "critical";
  if (u === "high" || score >= 68) return "high";
  if (u === "medium" || score >= 45) return "medium";
  return "low";
}

export function getTimeWindowMs(windowKey) {
  if (windowKey === "1h") return 60 * 60 * 1000;
  if (windowKey === "6h") return 6 * 60 * 60 * 1000;
  if (windowKey === "24h") return 24 * 60 * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000;
}

export function isValidLatLng(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function dedupKey(signal) {
  const normalizedTitle = String(signal.title || "").trim().toLowerCase().replace(/\s+/g, " ");
  const normalizedRegion = String(signal.region || signal.country || "global").toLowerCase();
  const roundedLat = Math.round(Number(signal.lat || 0) * 100) / 100;
  const roundedLng = Math.round(Number(signal.lng || 0) * 100) / 100;
  const timeBucket = signal.timestampMs ? Math.floor(signal.timestampMs / (5 * 60 * 1000)) : 0;
  const entityHint = (signal.relatedEntities || []).slice(0, 2).join("|").toLowerCase();
  return `${normalizedTitle}|${normalizedRegion}|${roundedLat}|${roundedLng}|${timeBucket}|${entityHint}`;
}

function urgencyFromRecency(timestampMs) {
  if (!timestampMs) return "low";
  const ageMs = Date.now() - timestampMs;
  if (ageMs <= 60 * 60 * 1000) return "critical";
  if (ageMs <= 3 * 60 * 60 * 1000) return "high";
  if (ageMs <= 12 * 60 * 60 * 1000) return "medium";
  return "low";
}

export function normalizeSignals(sourceSignals, countryNodeById, language) {
  const mapped = (Array.isArray(sourceSignals) ? sourceSignals : [])
    .map((signal, idx) => {
      const id = String(signal?.id || signal?.uid || `sig-${idx}`);
      const title = signal?.title || signal?.headline || signal?.event || (language === "ar" ? "إشارة بدون عنوان" : "Untitled signal");
      const category = normalizeCategory(signal?.category);

      let lat = Number(signal?.lat ?? signal?.latitude);
      let lng = Number(signal?.lng ?? signal?.lon ?? signal?.longitude);

      if ((!Number.isFinite(lat) || !Number.isFinite(lng)) && Array.isArray(signal?.coordinates)) {
        lng = Number(signal.coordinates[0]);
        lat = Number(signal.coordinates[1]);
      }

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        const node = countryNodeById.get(String(signal?.country || "").toLowerCase());
        if (node?.centerCoordinates?.length >= 2) {
          lat = Number(node.centerCoordinates[0]);
          lng = Number(node.centerCoordinates[1]);
        }
      }

      if (!isValidLatLng(lat, lng)) return null;

      const impactRaw = Number(signal?.impact);
      const confidenceRaw = Number(signal?.confidence);
      const impactScore = Number.isFinite(impactRaw) ? (impactRaw <= 1 ? impactRaw * 100 : impactRaw) : 42;
      const confidenceScore = Number.isFinite(confidenceRaw) ? (confidenceRaw <= 1 ? confidenceRaw * 100 : confidenceRaw) : 54;
      const importanceScore = Math.max(0, Math.min(100, Math.round(impactScore * 0.7 + confidenceScore * 0.3)));

      const timestamp = signal?.time || signal?.timestamp || null;
      const timestampMs = toTimestampMs(timestamp);
      const urgency = String(signal?.urgency || urgencyFromRecency(timestampMs));
      const severity = severityFromScore(importanceScore, urgency);

      return {
        id,
        title,
        summary: signal?.summary || signal?.description || "",
        description: signal?.description || signal?.summary || "",
        category,
        country: signal?.country || "",
        region: signal?.region || signal?.zones?.[0] || signal?.country || "Global",
        lat,
        lng,
        timestamp,
        timestampMs,
        source: signal?.source || "system",
        importanceScore,
        severity,
        confidenceScore,
        urgency,
        relatedEntities: Array.isArray(signal?.entities)
          ? signal.entities
          : Array.isArray(signal?.relatedEntities)
          ? signal.relatedEntities
          : [],
        tags: Array.isArray(signal?.tags) ? signal.tags : [],
      };
    })
    .filter(Boolean);

  const dedup = new Map();
  mapped.forEach((signal) => {
    const key = dedupKey(signal);
    const prev = dedup.get(key);
    if (!prev || (signal.importanceScore || 0) > (prev.importanceScore || 0)) {
      dedup.set(key, signal);
    }
  });

  return Array.from(dedup.values());
}

export function applySignalFilters(signals, filters, mode) {
  const now = Date.now();
  const windowMs = getTimeWindowMs(filters.timeWindow);
  const query = String(filters.query || "").trim().toLowerCase();

  return (Array.isArray(signals) ? signals : []).filter((signal) => {
    if (filters.category !== "all" && signal.category !== filters.category) return false;
    if (filters.severity !== "all" && signal.severity !== filters.severity) return false;
    if (filters.region !== "all" && String(signal.region) !== filters.region) return false;

    if (windowMs) {
      if (!signal.timestampMs) return false;
      if (now - signal.timestampMs > windowMs) return false;
    }

    if (query) {
      const haystack = [
        signal.title,
        signal.summary,
        signal.category,
        signal.source,
        signal.region,
        signal.country,
        ...(signal.relatedEntities || []),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (mode === "economic" && signal.category !== "economic") return false;
    if (mode === "sports" && signal.category !== "sports") return false;
    if (mode === "radar" && !["aviation", "maritime", "logistics"].includes(signal.category)) return false;

    return true;
  });
}

export function buildHotspots(filteredSignals) {
  const buckets = new Map();
  (Array.isArray(filteredSignals) ? filteredSignals : []).forEach((signal) => {
    const latKey = Math.round(signal.lat / 4) * 4;
    const lngKey = Math.round(signal.lng / 4) * 4;
    const key = `${latKey}:${lngKey}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        id: key,
        lat: latKey,
        lng: lngKey,
        count: 0,
        score: 0,
        categories: new Map(),
        regions: new Map(),
      });
    }
    const bucket = buckets.get(key);
    bucket.count += 1;
    bucket.score += signal.importanceScore || 0;
    bucket.categories.set(signal.category, (bucket.categories.get(signal.category) || 0) + 1);
    bucket.regions.set(signal.region, (bucket.regions.get(signal.region) || 0) + 1);
  });

  return Array.from(buckets.values())
    .filter((bucket) => bucket.count >= 2)
    .map((bucket) => {
      const topCategory = Array.from(bucket.categories.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "news";
      const region = Array.from(bucket.regions.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "Global";
      const avgScore = bucket.score / Math.max(1, bucket.count);
      return {
        id: bucket.id,
        lat: bucket.lat,
        lng: bucket.lng,
        count: bucket.count,
        region,
        topCategory,
        avgScore,
        radius: Math.min(20, 7 + bucket.count * 1.6),
        color: avgScore >= 75 ? "#ef4444" : avgScore >= 58 ? "#f59e0b" : "#38bdf8",
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 24);
}

export function buildRelationshipLines(filteredSignals, language, maxLines) {
  const lines = [];
  const pairGuard = new Set();
  const points = (Array.isArray(filteredSignals) ? filteredSignals : []).slice(0, 220);

  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    for (let j = i + 1; j < points.length; j += 1) {
      const b = points[j];
      const sameRegion = a.region && b.region && String(a.region) === String(b.region);
      const entitiesA = new Set((a.relatedEntities || []).map((v) => String(v).toLowerCase()));
      const sharedEntities = (b.relatedEntities || []).filter((entity) => entitiesA.has(String(entity).toLowerCase()));
      if (!sameRegion && sharedEntities.length === 0) continue;

      const pairKey = `${a.id}:${b.id}`;
      if (pairGuard.has(pairKey)) continue;
      pairGuard.add(pairKey);

      const strength = Math.min(1, (sharedEntities.length * 0.55) + (sameRegion ? 0.35 : 0.15));
      lines.push({
        id: `rel-${pairKey}`,
        from: [a.lat, a.lng],
        to: [b.lat, b.lng],
        count: sharedEntities.length,
        strength,
        color: sameRegion ? "#60a5fa" : "#a78bfa",
        label: sameRegion
          ? (language === "ar" ? "صلة إقليمية" : "Shared region")
          : (language === "ar" ? "كيانات مشتركة" : "Shared entities"),
      });
    }
  }

  return lines.sort((a, b) => b.strength - a.strength).slice(0, maxLines);
}

export function buildIntelligenceSummary(filteredSignals) {
  const points = Array.isArray(filteredSignals) ? filteredSignals : [];
  if (!points.length) {
    return {
      total: 0,
      topRegion: "-",
      topCategory: "-",
      highest: null,
      avgConfidence: 0,
    };
  }

  const regionCount = new Map();
  const categoryCount = new Map();
  let confidenceSum = 0;
  let highest = points[0];

  points.forEach((point) => {
    const region = String(point.region || point.country || "Global");
    regionCount.set(region, (regionCount.get(region) || 0) + 1);
    categoryCount.set(point.category, (categoryCount.get(point.category) || 0) + 1);
    confidenceSum += Number(point.confidenceScore || 0);
    if ((point.importanceScore || 0) > (highest.importanceScore || 0)) highest = point;
  });

  const topRegion = Array.from(regionCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  const topCategory = Array.from(categoryCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  return {
    total: points.length,
    topRegion,
    topCategory,
    highest,
    avgConfidence: Math.round(confidenceSum / Math.max(1, points.length)),
  };
}

export function buildRelatedSignals(selectedSignal, filteredSignals) {
  if (!selectedSignal) return [];
  const entities = new Set((selectedSignal.relatedEntities || []).map((v) => String(v).toLowerCase()));
  return (Array.isArray(filteredSignals) ? filteredSignals : [])
    .filter((point) => point.id !== selectedSignal.id)
    .map((point) => {
      const sharedEntities = (point.relatedEntities || []).filter((entity) => entities.has(String(entity).toLowerCase()));
      const sameRegion = point.region && selectedSignal.region && point.region === selectedSignal.region;
      return {
        ...point,
        relatedScore: (sameRegion ? 1.5 : 0) + sharedEntities.length,
      };
    })
    .filter((point) => point.relatedScore > 0)
    .sort((a, b) => b.relatedScore - a.relatedScore || (b.importanceScore || 0) - (a.importanceScore || 0))
    .slice(0, 6);
}
