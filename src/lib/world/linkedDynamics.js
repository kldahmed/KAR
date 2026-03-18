/**
 * linkedDynamics.js — Discovers and visualizes linked dynamics between events,
 * regions, and signals. Creates influence pathways.
 */

const INFLUENCE_CHAINS = [
  {
    id: "gulf_energy_markets",
    nameAr: "الخليج ← الطاقة ← الأسواق",
    nameEn: "Gulf → Energy → Markets",
    triggers: ["conflict_escalation", "energy_signal"],
    regions: ["الشرق الأوسط", "الأسواق العالمية"],
    icon: "⛽",
    color: "#fbbf24",
  },
  {
    id: "europe_energy_crisis",
    nameAr: "أوروبا ← الطاقة ← الضغط الاقتصادي",
    nameEn: "Europe → Energy → Economic Pressure",
    triggers: ["energy_signal", "economic_pressure"],
    regions: ["أوروبا", "الأسواق العالمية"],
    icon: "⚡",
    color: "#f59e0b",
  },
  {
    id: "sanctions_chain",
    nameAr: "عقوبات ← اقتصاد ← أسواق",
    nameEn: "Sanctions → Economy → Markets",
    triggers: ["sanctions_pressure", "economic_pressure"],
    regions: ["أمريكا الشمالية", "الأسواق العالمية"],
    icon: "🚫",
    color: "#ef4444",
  },
  {
    id: "conflict_displacement",
    nameAr: "نزاع ← نزوح ← ضغط إقليمي",
    nameEn: "Conflict → Displacement → Regional Pressure",
    triggers: ["conflict_escalation", "political_transition"],
    regions: ["الشرق الأوسط", "أوروبا", "أفريقيا"],
    icon: "🔴",
    color: "#ef4444",
  },
  {
    id: "sports_market_dynamics",
    nameAr: "رياضة ← انتقالات ← حراك سوقي",
    nameEn: "Sports → Transfers → Market Activity",
    triggers: ["sports_activity", "transfer_market"],
    regions: ["أوروبا", "الشرق الأوسط"],
    icon: "⚽",
    color: "#38bdf8",
  },
  {
    id: "peace_stabilization",
    nameAr: "دبلوماسية ← سلام ← استقرار",
    nameEn: "Diplomacy → Peace → Stabilization",
    triggers: ["peace_signal", "political_transition"],
    regions: ["الشرق الأوسط", "آسيا"],
    icon: "🕊️",
    color: "#22c55e",
  },
];

/**
 * Detect active linked dynamics from store items and events.
 * Only activates chains backed by real signal presence.
 */
export function detectLinkedDynamics(storeItems, events) {
  if (!storeItems?.length && !events?.length) return [];

  // Collect all active signals across the dataset
  const activeSignals = new Set();
  (storeItems || []).forEach(item => {
    (item.derivedSignals || []).forEach(s => activeSignals.add(s));
  });
  (events || []).forEach(e => {
    (e.relatedSignals || []).forEach(s => activeSignals.add(s));
  });

  // Activate chains only when triggers are present in data
  return INFLUENCE_CHAINS
    .map(chain => {
      const matchedTriggers = chain.triggers.filter(t => activeSignals.has(t));
      if (matchedTriggers.length === 0) return null;

      const strength = matchedTriggers.length / chain.triggers.length;
      const evidenceCount = (storeItems || []).filter(item =>
        (item.derivedSignals || []).some(s => matchedTriggers.includes(s))
      ).length;

      return {
        ...chain,
        active: true,
        strength: Math.round(strength * 100),
        evidenceCount,
        matchedTriggers,
        confidenceLabel: strength >= 0.8 ? "عالية" : strength >= 0.5 ? "متوسطة" : "ناشئة",
        confidenceLabelEn: strength >= 0.8 ? "High" : strength >= 0.5 ? "Moderate" : "Emerging",
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.strength - a.strength);
}

export { INFLUENCE_CHAINS };
