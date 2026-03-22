import { recordServerFeedback } from "./_agent-store.js";
import { applyApiHeaders, handlePreflight, rejectUnsupportedMethod } from "./_api-utils.js";

function validateFeedbackBody(body) {
  const forecastId = String(body?.forecastId || "").trim();
  const outcome = String(body?.outcome || "").trim();
  const category = String(body?.category || "").trim();
  const signals = Array.isArray(body?.signals) ? body.signals : [];

  if (!forecastId || forecastId.length > 128) {
    return { valid: false, error: "invalid forecastId" };
  }

  if (!outcome || !["success", "failure"].includes(outcome)) {
    return { valid: false, error: "outcome must be 'success' or 'failure'" };
  }

  if (signals.length > 100) {
    return { valid: false, error: "signals payload too large" };
  }

  return {
    valid: true,
    payload: {
      forecastId,
      outcome,
      category: category || "unknown",
      signals: signals.slice(0, 100).map((s) => String(s || "").trim()).filter(Boolean),
    },
  };
}

export default function handler(req, res) {
  applyApiHeaders(req, res, "POST, OPTIONS");

  if (handlePreflight(req, res)) return;

  if (rejectUnsupportedMethod(req, res, "POST")) return;

  const validation = validateFeedbackBody(req.body || {});
  if (!validation.valid) return res.status(400).json({ error: validation.error });
  const { forecastId, outcome, category, signals } = validation.payload;

  const result = recordServerFeedback({
    forecastId,
    outcome,
    category,
    signals,
  });

  res.status(200).json({
    accepted:   result.accepted,
    forecastId,
    outcome,
    category:   category || "unknown",
    timestamp:  result.timestamp,
    timezone:   "Asia/Dubai",
    message:    "Feedback accepted and persisted in server memory.",
  });
}
