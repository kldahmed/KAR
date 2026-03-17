/**
 * eventLinker.js — Groups ingested intelligence items into meaningful clusters
 * by shared signal co-occurrence, regions, and keyword overlap.
 *
 * A cluster = a real-world story pattern detected from multiple articles.
 * All clustering is evidence-based — no invented connections.
 */

import { getStore } from "./intelligenceStore";

// ── Cluster type definitions ─────────────────────────────────────
const CLUSTER_TYPES = [
  {
    id: "gulf_escalation",
    title: "التصعيد الخليجي",
    titleEn: "Gulf Escalation",
    icon: "🌊",
    color: "#ef4444",
    requiredSignals: ["conflict_escalation"],
    requiredRegions: ["الشرق الأوسط"],
    bonusSignals: ["energy_signal", "sanctions_pressure"],
    minArticles: 2,
    implication: "ارتفاع احتمالية التوتر الإقليمي وتأثيره على حركة الشحن وأسعار النفط.",
  },
  {
    id: "economic_stress",
    title: "ضغط اقتصادي",
    titleEn: "Economic Stress",
    icon: "📊",
    color: "#f59e0b",
    requiredSignals: ["economic_pressure"],
    requiredRegions: [],
    bonusSignals: ["sanctions_pressure", "energy_signal"],
    minArticles: 2,
    implication: "تراكم الضغوط الاقتصادية قد يؤثر على قرارات الاستثمار وأسعار الصرف.",
  },
  {
    id: "energy_market",
    title: "تقلبات الطاقة والأسواق",
    titleEn: "Energy & Market Volatility",
    icon: "⚡",
    color: "#fde047",
    requiredSignals: ["energy_signal"],
    requiredRegions: [],
    bonusSignals: ["economic_pressure", "conflict_escalation"],
    minArticles: 2,
    implication: "تزامن إشارات الطاقة والصراع يُنبئ باحتمال تذبذب في أسعار النفط.",
  },
  {
    id: "political_shift",
    title: "تحولات سياسية",
    titleEn: "Political Realignment",
    icon: "🏛️",
    color: "#a78bfa",
    requiredSignals: ["political_transition"],
    requiredRegions: [],
    bonusSignals: ["conflict_escalation", "peace_signal"],
    minArticles: 2,
    implication: "إشارات تغيير في المشهد السياسي قد تُعيد رسم التحالفات الإقليمية.",
  },
  {
    id: "peace_stabilization",
    title: "مؤشرات الاستقرار",
    titleEn: "Stabilization Signals",
    icon: "🕊️",
    color: "#22c55e",
    requiredSignals: ["peace_signal"],
    requiredRegions: [],
    bonusSignals: ["political_transition"],
    minArticles: 2,
    implication: "وجود إشارات سلام متعددة يُخفف من احتمالية التصعيد.",
  },
  {
    id: "sanctions_chain",
    title: "سلسلة العقوبات",
    titleEn: "Sanctions Chain",
    icon: "🚫",
    color: "#f97316",
    requiredSignals: ["sanctions_pressure"],
    requiredRegions: [],
    bonusSignals: ["economic_pressure", "conflict_escalation"],
    minArticles: 2,
    implication: "تكرار إشارات العقوبات يُضغط على التجارة والأسواق المالية.",
  },
  {
    id: "sports_momentum",
    title: "زخم الدوريات",
    titleEn: "League Momentum",
    icon: "⚽",
    color: "#38bdf8",
    requiredSignals: ["sports_activity"],
    requiredRegions: [],
    bonusSignals: ["transfer_market"],
    minArticles: 2,
    implication: "نشاط رياضي مكثف — تحركات في سوق الانتقالات ومتابعة للنتائج.",
  },
  {
    id: "transfer_heat",
    title: "حرارة سوق الانتقالات",
    titleEn: "Transfer Market Heat",
    icon: "🔁",
    color: "#60a5fa",
    requiredSignals: ["transfer_market"],
    requiredRegions: [],
    bonusSignals: ["sports_activity"],
    minArticles: 2,
    implication: "تكثّف نشاط سوق الانتقالات — قد يُعيد رسم موازين القوى في الدوري.",
  },
];

const RECENT_48H = 48 * 3600_000;

function isRecent(item) {
  try { return Date.now() - new Date(item.timestamp).getTime() < RECENT_48H; } catch { return false; }
}

function scoreItemForCluster(item, clusterDef) {
  const signals = item.derivedSignals || [];
  const regions = item.regions || [];
  let score = 0;

  // Required signals: must have at least one
  const hasRequired = clusterDef.requiredSignals.every(s => signals.includes(s));
  if (!hasRequired) return 0;
  score += clusterDef.requiredSignals.length * 4;

  // Required regions (if any)
  if (clusterDef.requiredRegions.length > 0) {
    const hasRegion = clusterDef.requiredRegions.some(r => regions.includes(r));
    if (!hasRegion) return 0;
    score += 2;
  }

  // Bonus signals
  score += clusterDef.bonusSignals.filter(s => signals.includes(s)).length * 2;

  // Recency bonus
  if (isRecent(item)) score += 3;

  // High urgency
  if (item.urgency === "high") score += 2;
  else if (item.urgency === "medium") score += 1;

  // High confidence
  if ((item.confidenceScore || 0) >= 60) score += 1;

  return score;
}

function trendDirection(cluster) {
  // Compare item counts in last 12h vs 12-48h window
  const now = Date.now();
  const recent12 = cluster.articles.filter(i => {
    try { return now - new Date(i.timestamp).getTime() < 12 * 3600_000; } catch { return false; }
  }).length;
  const older = cluster.articles.filter(i => {
    try {
      const age = now - new Date(i.timestamp).getTime();
      return age >= 12 * 3600_000 && age < 48 * 3600_000;
    } catch { return false; }
  }).length;

  if (recent12 > older * 1.4 || (older === 0 && recent12 > 0)) return { dir: "تصاعد", arrow: "↑", color: "#ef4444", weight: 1 };
  if (recent12 < older * 0.6 && older > 0) return { dir: "تراجع", arrow: "↓", color: "#22c55e", weight: -1 };
  return { dir: "مستقر", arrow: "→", color: "#94a3b8", weight: 0 };
}

/**
 * Build live clusters from the intelligence store.
 * Returns sorted array of active clusters.
 */
export function buildClusters() {
  const store = getStore();
  if (!store.length) return [];

  const clusters = [];

  for (const def of CLUSTER_TYPES) {
    const scored = store
      .map(item => ({ item, score: scoreItemForCluster(item, def) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length < def.minArticles) continue;

    const articles = scored.map(({ item }) => item);
    const trend = trendDirection({ articles });

    // Confidence: based on source diversity and article count
    const sources = new Set(articles.map(i => i.source)).size;
    const confidence = Math.min(78, 25 + articles.length * 4 + sources * 3);

    // All unique signals across cluster articles
    const allSignals = [...new Set(articles.flatMap(i => i.derivedSignals || []))];

    // All unique entities
    const entities = [
      ...new Set([
        ...articles.flatMap(i => i.regions || []),
        ...articles.flatMap(i => i.organizations || []),
        ...articles.flatMap(i => i.uaeClubs || []),
      ])
    ].slice(0, 8);

    // Last updated = most recent article timestamp
    const lastUpdated = articles.reduce((latest, i) => {
      try {
        const t = new Date(i.timestamp).getTime();
        return t > latest ? t : latest;
      } catch { return latest; }
    }, 0);

    clusters.push({
      id: def.id,
      title: def.title,
      titleEn: def.titleEn,
      icon: def.icon,
      color: def.color,
      type: def.id,
      articles: articles.slice(0, 6), // keep top 6
      articleCount: articles.length,
      signals: allSignals,
      signalCount: allSignals.length,
      entities,
      trend,
      confidence,
      sources,
      implication: def.implication,
      lastUpdated,
    });
  }

  // Sort: by (trend ascending weight DESC, then article count)
  return clusters
    .sort((a, b) => b.trend.weight - a.trend.weight || b.articleCount - a.articleCount)
    .slice(0, 6); // return top 6 clusters
}

/**
 * Get cluster for a specific type.
 */
export function getCluster(clusterId) {
  return buildClusters().find(c => c.id === clusterId) || null;
}
