import { getServerAgentSnapshot } from "./_agent-store.js";
import { applyApiHeaders, handlePreflight, rejectUnsupportedMethod } from "./_api-utils.js";

export default function handler(req, res) {
  applyApiHeaders(req, res, "GET, OPTIONS");

  if (handlePreflight(req, res)) return;

  if (rejectUnsupportedMethod(req, res, "GET")) return;

  const snapshot = getServerAgentSnapshot();
  res.status(200).json({
    ...snapshot,
    message: "Agent server memory online with local fallback support"
  });
}
