export function getMotionSettings(prefersReducedMotion) {
  if (prefersReducedMotion) {
    return {
      pulseScale: 1,
      pulseDurationMs: 0,
      arcDashDurationMs: 0,
      glowStrength: 0.35
    };
  }

  return {
    pulseScale: 1.22,
    pulseDurationMs: 1400,
    arcDashDurationMs: 2400,
    glowStrength: 0.72
  };
}

export function pressureToVisualIntensity(pressureLevel, confidence = 0.5) {
  const base = pressureLevel === "high" ? 0.85 : pressureLevel === "medium" ? 0.62 : 0.38;
  return Math.min(1, base * (0.7 + confidence * 0.6));
}

export function calcSignalRadius(signalCount, mode = "live") {
  const base = Math.min(16, 4 + signalCount * 1.15);
  if (mode === "sports") return base * 1.15;
  if (mode === "economic") return base * 1.08;
  if (mode === "forecast") return base * 1.2;
  return base;
}

export function shouldAnimateNode(signalCount, pressureLevel, prefersReducedMotion) {
  if (prefersReducedMotion) return false;
  if (pressureLevel === "high") return true;
  return signalCount >= 4;
}
