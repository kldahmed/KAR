import { applyApiHeaders, handlePreflight, rejectUnsupportedMethod } from "../_api-utils";
import { buildMetricsSnapshot, runForcedTicks } from "../_high-capacity-news-core.js";

/**
 * GET /api/news/trigger
 * Forces extra scheduler ticks so the ingest pipeline populates quickly.
 * Safe to call from cron jobs, the dashboard, or manually.
 * Returns a snapshot of current metrics after the forced run.
 */
export default async function handler(req, res) {
  applyApiHeaders(req, res);
  if (handlePreflight(req, res)) return;
  if (rejectUnsupportedMethod(req, res, "GET")) return;

  try {
    const ticks = Math.min(8, Math.max(1, Number(req.query?.ticks || 4)));
    const store = await runForcedTicks(ticks);
    const snapshot = buildMetricsSnapshot(store);

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      ticks_fired: ticks,
      sources_total: store.sources.size,
      generated_at: snapshot.generated_at,
      daily_goal: snapshot.daily_goal || {},
      counters: snapshot.counters || {},
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "trigger_failed",
      details: error?.message || "unknown_error",
    });
  }
}
