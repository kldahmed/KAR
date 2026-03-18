import React, { useEffect, useState, useMemo } from "react";
import { getWorldState, subscribeWorldState } from "../lib/worldStateEngine";
import { useI18n } from "../i18n/I18nProvider";

const P = {
  bg: "#060a10",
  surface: "#0a0f1c",
  surfaceAlt: "#0e1630",
  border: "rgba(56,189,248,0.06)",
  borderGold: "rgba(243,211,138,0.12)",
  gold: "#f3d38a",
  blue: "#38bdf8",
  green: "#22c55e",
  red: "#ef4444",
  amber: "#f59e0b",
  purple: "#a78bfa",
  muted: "#475569",
  text: "#e2e8f0",
  textDim: "#64748b"
};

function GaugeRing({ value, max = 100, color, size = 72, label, sublabel }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  const offset = c * (1 - pct);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} style={{ filter: `drop-shadow(0 0 6px ${color}30)` }}>
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
        <text x={size / 2} y={size / 2 - 2} textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize={18} fontWeight={900} fontFamily="Inter, system-ui">{value}</text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle"
          fill={P.textDim} fontSize={8} fontWeight={700}>{sublabel}</text>
      </svg>
      <span style={{ fontSize: 10, fontWeight: 700, color: P.muted, letterSpacing: 1, textTransform: "uppercase", textAlign: "center" }}>{label}</span>
    </div>
  );
}

function MetricPill({ icon, label, value, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: `${color}08`, border: `1px solid ${color}18`,
      borderRadius: 10, padding: "5px 12px 5px 8px",
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: P.textDim }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color }}>{value}</span>
    </div>
  );
}

function safeStr(val) {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object") return val.label || val.title || val.nameAr || val.name || JSON.stringify(val).substring(0, 60);
  return String(val);
}

export default function WorldStateHero() {
  const { t, language } = useI18n();
  const isAr = language === "ar";
  const [worldState, setWorldState] = useState(null);

  useEffect(() => {
    setWorldState(getWorldState());
    const unsub = subscribeWorldState(s => setWorldState(s));
    return unsub;
  }, []);

  if (!worldState) {
    return (
      <div style={{
        textAlign: "center", color: P.blue, padding: "60px 20px",
        fontSize: 15, fontWeight: 700
      }}>
        {isAr ? "جارٍ تحميل حالة العالم..." : "Loading world state..."}
      </div>
    );
  }

  const { tension, economic, sports, eventIntensity, activeRegion, dominantPattern, strongestEvent, interpretation, intelligence, totalEvents, agentState } = worldState;
  const interp = isAr ? interpretation.ar : interpretation.en;
  const timeStr = new Date(worldState.timestamp).toLocaleTimeString(isAr ? "ar-AE" : "en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });
  const agentStateLabel = agentState ? (isAr ? agentState.ar : agentState.en) : "";
  const agentStateIcon = agentState?.icon || "🤖";

  return (
    <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>
      <div className="world-hero-container" style={{
        background: `linear-gradient(160deg, ${P.bg}, ${P.surface} 40%, #0a1628 100%)`,
        border: `1px solid ${P.borderGold}`,
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Cinematic top accent */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, ${P.gold}80, ${P.blue}60, ${P.purple}60, transparent)`,
        }} />

        {/* Atmospheric glow */}
        <div style={{
          position: "absolute", top: -80, right: "20%", width: 300, height: 300,
          background: `radial-gradient(circle, ${tension.color}06, transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* ─── Header Bar ─── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 28px 10px", flexWrap: "wrap", gap: 12
        }}>
          <div>
            <div style={{
              fontSize: 10, fontWeight: 900, letterSpacing: 4,
              color: P.gold, textTransform: "uppercase", marginBottom: 4,
              opacity: 0.9,
            }}>
              {isAr ? "حالة العالم الآن" : "WORLD STATE NOW"}
            </div>
            <div style={{
              fontSize: 24, fontWeight: 900, color: P.text, lineHeight: 1.2,
              fontFamily: "Inter, system-ui, sans-serif",
            }}>
              {isAr ? "مركز الوعي العالمي" : "Global Awareness Center"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Agent State */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: `${agentState?.color || P.blue}0a`,
              border: `1px solid ${agentState?.color || P.blue}20`,
              borderRadius: 10, padding: "5px 14px",
            }}>
              <span style={{ fontSize: 14 }}>{agentStateIcon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: agentState?.color || P.blue }}>
                {agentStateLabel}
              </span>
            </div>
            {/* LIVE status */}
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

        {/* ─── Central Gauges ─── */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 28,
          padding: "20px 28px 16px",
          flexWrap: "wrap",
        }}>
          <GaugeRing value={tension.value} color={tension.color}
            label={isAr ? "التوتر العالمي" : "TENSION"}
            sublabel={isAr ? tension.label : tension.labelEn} />
          <GaugeRing value={economic.value} color={economic.color}
            label={isAr ? "الضغط الاقتصادي" : "ECONOMY"}
            sublabel={isAr ? economic.label : economic.labelEn} />
          <GaugeRing value={sports.value} color={sports.color}
            label={isAr ? "النشاط الرياضي" : "SPORTS"}
            sublabel={isAr ? sports.label : sports.labelEn} />
          <GaugeRing value={eventIntensity?.value || 0} color={eventIntensity?.color || P.blue}
            label={isAr ? "شدة الأحداث" : "EVENTS"}
            sublabel={isAr ? eventIntensity?.label || "—" : eventIntensity?.labelEn || "—"} />
          <GaugeRing value={intelligence?.value || 0} color={intelligence?.color || P.blue}
            label={isAr ? "الاستخبارات" : "INTEL"}
            sublabel={isAr ? safeStr(intelligence?.label) : safeStr(intelligence?.labelEn)} />
        </div>

        {/* ─── Key Context Pills ─── */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 8,
          padding: "0 28px 16px",
          flexWrap: "wrap",
        }}>
          {activeRegion && activeRegion.region !== "—" && (
            <MetricPill icon="📍"
              label={isAr ? "الأكثر نشاطاً" : "Most Active"}
              value={safeStr(activeRegion.region)} color={P.amber} />
          )}
          {dominantPattern && dominantPattern.signal !== "—" && (
            <MetricPill icon="📈"
              label={isAr ? "النمط السائد" : "Pattern"}
              value={isAr ? safeStr(dominantPattern.label) : safeStr(dominantPattern.labelEn)} color={P.purple} />
          )}
          <MetricPill icon="🌍"
            label={isAr ? "أحداث" : "Events"}
            value={totalEvents} color={P.blue} />
        </div>

        {/* ─── Strongest Event Spotlight ─── */}
        {strongestEvent && (
          <div style={{
            margin: "0 24px 14px", padding: "10px 16px",
            background: `${P.red}06`, border: `1px solid ${P.red}12`,
            borderRadius: 12,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚡</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: P.red, letterSpacing: 2, marginBottom: 2, textTransform: "uppercase" }}>
                {isAr ? "أقوى حدث الآن" : "STRONGEST EVENT NOW"}
              </div>
              <div style={{
                fontSize: 13, fontWeight: 700, color: P.text, lineHeight: 1.5,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {safeStr(strongestEvent.title)}
              </div>
            </div>
            {strongestEvent.severity && (
              <div style={{
                fontSize: 18, fontWeight: 900,
                color: (strongestEvent.severity || 0) >= 60 ? P.red : P.amber,
                fontFamily: "Inter, system-ui",
              }}>
                {strongestEvent.severity}
              </div>
            )}
          </div>
        )}

        {/* ─── AI Interpretation Bar ─── */}
        <div style={{
          margin: "0 24px 20px",
          background: `linear-gradient(135deg, rgba(56,189,248,0.03), rgba(167,139,250,0.03))`,
          border: `1px solid ${P.border}`,
          borderRadius: 14, padding: "14px 18px",
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: `linear-gradient(135deg, ${P.blue}30, ${P.purple}30)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}>🤖</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: P.blue, letterSpacing: 2,
              marginBottom: 4, textTransform: "uppercase",
            }}>
              {isAr ? "تفسير الوكيل الذكي" : "AI AGENT INTERPRETATION"}
            </div>
            <div style={{
              fontSize: 13, color: P.text, fontWeight: 500, lineHeight: 1.7,
            }}>
              {interp}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        .world-hero-container {
          box-shadow: 0 0 60px rgba(243,211,138,0.03), 0 12px 48px rgba(0,0,0,0.5);
        }
      `}</style>
    </section>
  );
}
