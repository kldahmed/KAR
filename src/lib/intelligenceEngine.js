/**
 * Intelligence Engine — computes the accumulation score and metrics
 * from the intelligence store. All values derived from real ingested data.
 */

import { getStoreStats } from "./intelligenceStore";

/**
 * Compute the Intelligence Accumulation Index (0-100).
 * Score is entirely based on real store contents — never fabricated.
 *
 * Factors:
 *   - Article volume       (up to 30pts)
 *   - Source diversity     (up to 20pts)
 *   - Regional coverage    (up to 15pts)
 *   - Entity tracking      (up to 15pts)
 *   - Signal density       (up to 10pts)
 *   - High-conf items      (up to 10pts)
 */
export function computeIntelligenceScore(stats) {
  if (!stats || stats.total === 0) return 0;

  const articleScore  = Math.min(30, Math.round(stats.total / 5));
  const sourceScore   = Math.min(20, stats.sources * 2);
  const regionScore   = Math.min(15, stats.regions * 3);
  const entityScore   = Math.min(15, stats.entities * 2);
  const signalScore   = Math.min(10, stats.signals * 2);
  const confScore     = Math.min(10, Math.round((stats.highConf / Math.max(1, stats.total)) * 10));

  return articleScore + sourceScore + regionScore + entityScore + signalScore + confScore;
}

/**
 * Compute a forecast confidence level descriptor based on evidence strength.
 */
export function confidenceLabel(score) {
  if (score >= 70) return { label: "عالية",   color: "#22c55e", en: "High" };
  if (score >= 45) return { label: "متوسطة",  color: "#f59e0b", en: "Medium" };
  return                  { label: "منخفضة",  color: "#ef4444", en: "Low" };
}

/**
 * Full metrics object for the UI.
 */
export function getIntelligenceMetrics() {
  const stats = getStoreStats();
  const score = computeIntelligenceScore(stats);
  const conf  = confidenceLabel(score);
  return {
    score,
    ...stats,
    confidenceLabel: conf.label,
    confidenceColor: conf.color,
    evidenceStrength: score >= 60 ? "strong" : score >= 35 ? "moderate" : "weak",
  };
}
