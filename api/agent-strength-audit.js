import { AGENT_BENCHMARK_DATASET } from "../src/lib/agent/benchmarkDataset.js";
import { computeAgentAuditFromSnapshot, getServerAgentSnapshot } from "./_agent-store.js";
import { applyApiHeaders, handlePreflight, rejectUnsupportedMethod } from "./_api-utils.js";

export default function handler(req, res) {
  applyApiHeaders(req, res, "GET, OPTIONS");

  if (handlePreflight(req, res)) return;

  if (rejectUnsupportedMethod(req, res, "GET")) return;

  const snapshot = getServerAgentSnapshot();
  const scores = computeAgentAuditFromSnapshot(snapshot, AGENT_BENCHMARK_DATASET);

  return res.status(200).json({
    ok: true,
    audit_version: "1.0",
    generatedAt: new Date().toISOString(),
    benchmark_size: AGENT_BENCHMARK_DATASET.length,
    scores
  });
}
