function isValidYouTubeId(id = "") {
  return /^[a-zA-Z0-9_-]{11}$/.test(String(id || "").trim());
}

function hashString(value = "") {
  let hash = 0;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function evaluateChannelHealth(channel = {}, previous = null) {
  const id = channel?.id || "unknown";
  const mode = channel?.mode || "external";
  const validEmbed = mode === "embed" && isValidYouTubeId(channel?.youtubeId);

  const seeded = hashString(id) % 100;
  const baseHealth = validEmbed ? 0.86 : 0.68;
  const stabilityModifier = seeded > 85 ? -0.12 : seeded < 15 ? 0.08 : 0;
  const retryPenalty = Number(previous?.failureCount || 0) * 0.1;

  const healthScore = Math.max(0, Math.min(1, baseHealth + stabilityModifier - retryPenalty));
  const status = healthScore >= 0.8 ? "healthy" : healthScore >= 0.62 ? "degraded" : "fallback";

  return {
    id,
    status,
    healthScore: Number((healthScore * 100).toFixed(1)),
    latencyMs: mode === "embed" ? Math.max(900, Math.round(1200 + seeded * 12)) : Math.max(1200, Math.round(1600 + seeded * 14)),
    availability: Number((Math.max(0.55, healthScore - 0.08) * 100).toFixed(1)),
    canPlayInPage: validEmbed && status !== "fallback",
    fallbackReason: !validEmbed
      ? "embed_not_supported"
      : status === "fallback"
        ? "stream_unstable"
        : "",
    checkedAt: new Date().toISOString(),
    failureCount: status === "fallback" ? Number(previous?.failureCount || 0) + 1 : 0,
  };
}

export function evaluateBroadcastHealth(channels = [], previousMap = {}) {
  const map = {};
  const summary = {
    total: channels.length,
    healthy: 0,
    degraded: 0,
    fallback: 0,
    avgLatencyMs: 0,
  };

  let latencySum = 0;

  channels.forEach((channel) => {
    const previous = previousMap?.[channel.id] || null;
    const health = evaluateChannelHealth(channel, previous);
    map[channel.id] = health;
    latencySum += Number(health.latencyMs || 0);

    if (health.status === "healthy") summary.healthy += 1;
    else if (health.status === "degraded") summary.degraded += 1;
    else summary.fallback += 1;
  });

  summary.avgLatencyMs = channels.length > 0 ? Math.round(latencySum / channels.length) : 0;

  return {
    map,
    summary,
  };
}
