import { ingestServerItems } from "./_agent-store.js";
import { applyApiHeaders, handlePreflight, rejectUnsupportedMethod } from "./_api-utils.js";

function validateIngestBody(body) {
  const items = Array.isArray(body?.items) ? body.items : null;
  if (!items || items.length === 0) {
    return { valid: false, error: "items array required" };
  }

  if (items.length > 250) {
    return { valid: false, error: "items payload too large" };
  }

  const invalidItem = items.find((item) => !item || typeof item !== "object");
  if (invalidItem) {
    return { valid: false, error: "invalid items payload" };
  }

  return { valid: true };
}

export default function handler(req, res) {
  applyApiHeaders(req, res, "POST, OPTIONS");

  if (handlePreflight(req, res)) return;

  if (rejectUnsupportedMethod(req, res, "POST")) return;

  const { items, sourceType = "news" } = req.body || {};
  const validation = validateIngestBody(req.body || {});
  if (!validation.valid) return res.status(400).json({ error: validation.error });

  const result = ingestServerItems(items, sourceType);

  res.status(200).json({
    accepted:  result.accepted,
    items:     result.items,
    timestamp: result.timestamp,
    timezone:  "Asia/Dubai",
    mode: "server_primary_local_fallback",
  });
}
