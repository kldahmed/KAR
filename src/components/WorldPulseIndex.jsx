/**
 * WorldPulseIndex — "نبض العالم"
 * The central heartbeat of the Global Awareness System.
 * Aggregates geopolitical tension, economic stress, event intensity, and signal density
 * into a single dominant visual indicator.
 */
import React, { useEffect, useState, useMemo } from "react";
import { getWorldState, subscribeWorldState } from "../lib/worldStateEngine";
import { useI18n } from "../i18n/I18nProvider";

const P = {
  bg: "#060a10",
  surface: "#0a0f1c",
  gold: "#f3d38a",
  blue: "#38bdf8",
  green: "#22c55e",
  red: "#ef4444",
  amber: "#f59e0b",
  purple: "#a78bfa",
  text: "#e2e8f0",
  textDim: "#64748b",
  muted: "#475569",
};

function computeWorldPulse(ws) {
  if (!ws) return { value: 0, label: "—", color: P.muted };
  const t = ws.tension?.value || 0;
  const e = ws.economic?.value || 0;
  const ev = ws.eventIntensity?.value || 0;
  const intel = ws.intelligence?.value || 0;
  // Weighted composite: tension 35%, economic 25%, events 25%, intel 15%
  const raw = t * 0.35 + e * 0.25 + ev * 0.25 + intel * 0.15;
  const value = Math.round(Math.min(100, raw));
  if (value >= 70) return { value, label: "مرتفع جداً", labelEn: "Very High", color: P.red };
  if (value >= 50) return { value, label: "مرتفع", labelEn: "High", color: P.amber };
  if (value >= 30) return { value, label: "متوسط", labelEn: "Moderate", color: P.blue };
  if (value >= 15) return { value, label: "منخفض", labelEn: "Low", color: P.green };
  return { value, label: "هادئ", labelEn: "Calm", color: P.green };
}

function PulseBar({ value, color }) {
  const totalBlocks = 20;
  const filled = Math.round((value / 100) * totalBlocks);
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: totalBlocks }).map((_, i) => (
        <div key={i} style={{
          width: 14, height: 28,
          borderRadius: 3,
          background: i < filled ? color : "rgba(255,255,255,0.04)",
          boxShadow: i < filled ? `0 0 8px ${color}40` : "none",
          transition: "all 0.6s ease",
          transitionDelay: `${i * 30}ms`,
        }} />
      ))}
    </div>
  );
}

function MiniGauge({ value, label, color, size = 52 }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize={13} fontWeight={900} fontFamily="Inter, system-ui">
          {value}
        </text>
      </svg>
      <span style={{ fontSize: 9, fontWeight: 700, color: P.muted, letterSpacing: 1, textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}

export default function WorldPulseIndex() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const [ws, setWs] = useState(null);

  useEffect(() => {
    setWs(getWorldState());
    const unsub = subscribeWorldState(s => setWs(s));
    return unsub;
  }, []);

  const pulse = useMemo(() => computeWorldPulse(ws), [ws]);
  const timeStr = ws ? new Date(ws.timestamp).toLocaleTimeString(isAr ? "ar-AE" : "en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai"
  }) : "";

  if (!ws) return null;

  const agentState = ws.agentState;

  return (
    <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>
      <div style={{
        background: `linear-gradient(160deg, ${P.bg}, ${P.surface} 40%, #0a1628)`,
        border: `1px solid ${pulse.color}15`,
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Top accent */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, ${pulse.color}80, ${P.gold}60, transparent)`,
        }} />

        {/* Atmospheric radial glow */}
        <div style={{
          position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
          width: 500, height: 500,
          background: `radial-gradient(circle, ${pulse.color}08, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div style={{ padding: "28px 32px 24px", position: "relative" }}>
          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            marginBottom: 24, flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <div style={{
                fontSize: 10, fontWeight: 900, letterSpacing: 4,
                color: P.gold, textTransform: "uppercase", marginBottom: 6, opacity: 0.9,
              }}>
                {isAr ? "منصة الوعي العالمي" : "GLOBAL AWARENESS PLATFORM"}
              </div>
              <div style={{
                fontSize: 28, fontWeight: 900, color: P.text, lineHeight: 1.2,
                fontFamily: "Inter, system-ui, sans-serif",
              }}>
                {isAr ? "نبض العالم" : "World Pulse"}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {agentState && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: `${agentState.color}0a`,
                  border: `1px solid ${agentState.color}20`,
                  borderRadius: 10, padding: "5px 14px",
                }}>
                  <span style={{ fontSize: 14 }}>{agentState.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: agentState.color }}>
                    {isAr ? agentState.ar : agentState.en}
                  </span>
                </div>
              )}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(34,197,94,0.06)",
                border: "1px solid rgba(34,197,94,0.15)",
                borderRadius: 10, padding: "5px 14px",
              }}>
                <span className="nr-live-dot" style={{ width: 7, height: 7 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: P.green }}>
                  {isAr ? "مباشر" : "LIVE"}
                </span>
                <span style={{ fontSize: 11, color: P.textDim, fontWeight: 600 }}>{timeStr}</span>
              </div>
            </div>
          </div>

          {/* Central Pulse Display */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            marginBottom: 28,
          }}>
            <div style={{
              fontSize: 56, fontWeight: 900, color: pulse.color,
              fontFamily: "Inter, system-ui",
              lineHeight: 1,
              textShadow: `0 0 40px ${pulse.color}30`,
              marginBottom: 8,
            }}>
              {pulse.value}<span style={{ fontSize: 24, color: P.textDim }}>%</span>
            </div>
            <div style={{
              fontSize: 14, fontWeight: 700, color: pulse.color,
              marginBottom: 12, letterSpacing: 1,
            }}>
              {isAr ? pulse.label : pulse.labelEn}
            </div>
            <PulseBar value={pulse.value} color={pulse.color} />
          </div>

          {/* Sub-gauges row */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 32,
            flexWrap: "wrap", marginBottom: 20,
          }}>
            <MiniGauge
              value={ws.tension?.value || 0}
              label={isAr ? "التوتر" : "TENSION"}
              color={ws.tension?.color || P.blue} />
            <MiniGauge
              value={ws.economic?.value || 0}
              label={isAr ? "الاقتصاد" : "ECONOMY"}
              color={ws.economic?.color || P.blue} />
            <MiniGauge
              value={ws.eventIntensity?.value || 0}
              label={isAr ? "الأحداث" : "EVENTS"}
              color={ws.eventIntensity?.color || P.blue} />
            <MiniGauge
              value={ws.intelligence?.value || 0}
              label={isAr ? "الاستخبارات" : "INTEL"}
              color={ws.intelligence?.color || P.blue} />
          </div>

          {/* AI Agent Interpretation Line */}
          {ws.interpretation && (
            <div style={{
              background: "rgba(56,189,248,0.04)",
              border: "1px solid rgba(56,189,248,0.08)",
              borderRadius: 14,
              padding: "12px 18px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(56,189,248,0.2), rgba(167,139,250,0.2))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
              }}>🤖</div>
              <div style={{
                fontSize: 13, color: P.text, fontWeight: 500, lineHeight: 1.7, flex: 1,
              }}>
                {isAr ? ws.interpretation.ar : ws.interpretation.en}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
