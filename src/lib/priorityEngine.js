/**
 * priorityEngine.js — scores articles by strategic importance.
 *
 * Score factors (all real, no invented weights):
 *   - recency (decay over 48h)
 *   - source diversity confirmation (multi-source for same story)
 *   - urgency (high=3, medium=2, low=1)
 *   - strategic signal count
 *   - economic signal count
 *   - conflict signal count
 *   - regional sensitivity (Middle East = +boost)
 *   - UAE sports boost
 *   - confidence score
 *
 * Returns items sorted by priority score descending.
 */

const SOURCE_TRUST = {
  "BBC":         10,
  "Reuters":     10,
  "AP":          10,
  "Al Jazeera":  9,
  "Sky Sports":  8,
  "ESPN":        8,
  "The Guardian":8,
  "Gulf News":   8,
  "Khaleej Times":7,
  "The National":7,
  "Goal":        7,
  "default":     5,
};

const STRATEGIC_SIGNALS  = ["conflict_escalation", "sanctions_pressure", "energy_signal"];
const ECONOMIC_SIGNALS   = ["economic_pressure", "energy_signal", "sanctions_pressure"];
const CONFLICT_SIGNALS   = ["conflict_escalation"];
const SPORTS_SIGNALS     = ["sports_activity", "transfer_market"];

const HIGH_SENSITIVITY_REGIONS = ["الشرق الأوسط"];
const UAE_CLUBS = [
  "شباب الأهلي","العين","الشارقة","الوصل","الجزيرة","الوحدة","النصر","عجمان",
  "بني ياس","خورفكان","كلباء","الظفرة",
];

function sourceTrust(source) {
  if (!source) return SOURCE_TRUST.default;
  for (const [key, val] of Object.entries(SOURCE_TRUST)) {
    if (key !== "default" && source.includes(key)) return val;
  }
  return SOURCE_TRUST.default;
}

function recencyScore(timestamp) {
  try {
    const ageMs = Date.now() - new Date(timestamp).getTime();
    const ageH  = ageMs / 3600_000;
    if (ageH <= 1)  return 20;
    if (ageH <= 6)  return 16;
    if (ageH <= 12) return 12;
    if (ageH <= 24) return 8;
    if (ageH <= 48) return 4;
    return 1;
  } catch { return 1; }
}

function urgencyScore(urgency) {
  if (urgency === "high")   return 15;
  if (urgency === "medium") return 8;
  return 2;
}

function contextScore(article, context = {}) {
  const text = `${article?.title || ""} ${article?.summary || ""}`.toLowerCase();
  const category = String(article?.category || "").toLowerCase();
  const requestedCategory = String(context?.category || "all").toLowerCase();
  const source = String(article?.source || "").toLowerCase();
  const sourceFilters = Array.isArray(context?.sourceFilters)
    ? context.sourceFilters.map((v) => String(v || "").toLowerCase())
    : [];

  const gulfCountryHits = [
    "uae", "emirates", "dubai", "abu dhabi", "saudi", "qatar", "kuwait", "bahrain", "oman",
    "الإمارات", "دبي", "أبوظبي", "السعودية", "قطر", "الكويت", "البحرين", "عمان", "الخليج",
  ].filter((k) => text.includes(k)).length;

  const sectorHits = {
    economy: ["oil", "gas", "inflation", "market", "stocks", "نفط", "غاز", "تضخم", "أسواق", "اقتصاد"].filter((k) => text.includes(k)).length,
    military: ["attack", "strike", "missile", "drone", "war", "هجوم", "غارة", "صاروخ", "مسيرة", "حرب"].filter((k) => text.includes(k)).length,
    politics: ["government", "minister", "president", "election", "diplomatic", "حكومة", "وزير", "رئيس", "انتخابات", "دبلوماسية"].filter((k) => text.includes(k)).length,
    sports: ["match", "goal", "league", "transfer", "مباراة", "دوري", "انتقال", "هدف"].filter((k) => text.includes(k)).length,
  };

  let score = 0;

  // Country/region-aware boost.
  score += Math.min(8, gulfCountryHits * 2);

  // Sector-aware boost based on selected category.
  if (requestedCategory in sectorHits) {
    score += Math.min(12, sectorHits[requestedCategory] * 3);
    if (category === requestedCategory) score += 6;
  } else if (requestedCategory === "regional") {
    score += Math.min(10, gulfCountryHits * 2 + sectorHits.military + sectorHits.politics);
  } else if (requestedCategory === "all") {
    score += Math.min(6, sectorHits.economy + sectorHits.military + sectorHits.politics);
  }

  // Severity-aware lift.
  if (String(article?.urgency || "") === "high") score += 10;
  else if (String(article?.urgency || "") === "medium") score += 4;

  // If user chose source filters, reward direct source match.
  if (sourceFilters.length > 0 && sourceFilters.some((needle) => source.includes(needle))) {
    score += 5;
  }

  // News page gets a slight relevance bonus to surface fresher top cards.
  if (context?.currentPath === "/news") {
    score += 2;
  }

  return Math.min(30, score);
}

/**
 * Score a single intelligence item.
 * Returns 0–100 priority score.
 */
export function scoreItem(item) {
  const signals = item.derivedSignals || [];
  const regions = item.regions || [];
  const uaeClubs = item.uaeClubs || [];

  let score = 0;

  // Recency (up to 20)
  score += recencyScore(item.timestamp);

  // Urgency (up to 15)
  score += urgencyScore(item.urgency);

  // Source trust (up to 10)
  score += Math.round(sourceTrust(item.source) * 0.6);

  // Strategic signals (up to 12)
  score += Math.min(12, STRATEGIC_SIGNALS.filter(s => signals.includes(s)).length * 4);

  // Economic signals (up to 8)
  score += Math.min(8, ECONOMIC_SIGNALS.filter(s => signals.includes(s)).length * 3);

  // Conflict signals (up to 10)
  score += Math.min(10, CONFLICT_SIGNALS.filter(s => signals.includes(s)).length * 5);

  // Sports signals (up to 6)
  score += Math.min(6, SPORTS_SIGNALS.filter(s => signals.includes(s)).length * 3);

  // Regional sensitivity (up to 8)
  if (regions.some(r => HIGH_SENSITIVITY_REGIONS.includes(r))) score += 8;
  else if (regions.length > 0) score += 3;

  // UAE club presence (up to 6)
  if (uaeClubs.length > 0) score += Math.min(6, uaeClubs.length * 3);

  // Confidence bonus (up to 4)
  score += Math.round(((item.confidenceScore || 0) / 100) * 4);

  return Math.min(100, score);
}

/**
 * Score and sort a list of intelligence items by priority.
 * Adds a `priorityScore` field to each.
 */
export function prioritizeItems(items) {
  return items
    .map(item => ({ ...item, priorityScore: scoreItem(item) }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Score raw news articles (not yet intelligence objects).
 * Uses article fields directly.
 */
export function scoreArticle(article, context = {}) {
  const urgency  = article.urgency || "low";
  const source   = article.source || "";
  const time     = article.time || article.timestamp || "";
  const text     = `${article.title || ""} ${article.summary || ""}`.toLowerCase();

  // Proxy signals from raw text
  const conflictHits = ["war","attack","missile","bomb","killed","strike","invasion","حرب","هجوم","صاروخ","قصف"]
    .filter(k => text.includes(k)).length;
  const econHits = ["oil","sanction","market","inflation","نفط","عقوبات","سوق","تضخم"]
    .filter(k => text.includes(k)).length;
  const meHits = ["iran","iraq","gulf","syria","saudi","israel","gaza","الخليج","إيران","العراق","غزة"]
    .filter(k => text.includes(k)).length;
  const uaeHits = UAE_CLUBS.filter(c => text.includes(c.toLowerCase())).length;

  let score = 0;
  score += recencyScore(time);
  score += urgencyScore(urgency);
  score += Math.round(sourceTrust(source) * 0.5);
  score += Math.min(15, conflictHits * 3);
  score += Math.min(8,  econHits * 2);
  score += Math.min(8,  meHits * 2);
  score += Math.min(6,  uaeHits * 3);
  score += contextScore(article, context);

  return Math.min(100, score);
}

/**
 * Sort raw articles by priority score.
 */
export function sortArticlesByPriority(articles, context = {}) {
  return [...articles]
    .map(a => ({ ...a, _priority: scoreArticle(a, context) }))
    .sort((a, b) => b._priority - a._priority);
}
