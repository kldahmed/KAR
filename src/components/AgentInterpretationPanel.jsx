import React, { useEffect, useState, useRef } from "react";
import { getWorldState, subscribeWorldState } from "../lib/worldStateEngine";
import { useI18n } from "../i18n/I18nProvider";

const P = {
  bg: "#060a10",
  surface: "#0a0f1c",
  surfaceAlt: "#0e1630",
  border: "rgba(56,189,248,0.06)",
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

const TYPE_STYLES = {
  critical: { bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.15)", color: "#ef4444" },
  warning: { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  stable: { bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.15)", color: "#22c55e" },
  economic: { bg: "rgba(245,158,11,0.05)", border: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  regional: { bg: "rgba(243,211,138,0.05)", border: "rgba(243,211,138,0.12)", color: "#f3d38a" },
  pattern: { bg: "rgba(167,139,250,0.05)", border: "rgba(167,139,250,0.12)", color: "#a78bfa" },
  event: { bg: "rgba(239,68,68,0.05)", border: "rgba(239,68,68,0.12)", color: "#ef4444" },
  linkage: { bg: "rgba(56,189,248,0.05)", border: "rgba(56,189,248,0.12)", color: "#38bdf8" },
  sports: { bg: "rgba(56,189,248,0.04)", border: "rgba(56,189,248,0.10)", color: "#38bdf8" },
  forecast: { bg: "rgba(243,211,138,0.05)", border: "rgba(243,211,138,0.12)", color: "#f3d38a" },
};

function safeStr(val) {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object") return val.label || val.title || val.nameAr || String(val);
  return String(val);
}

function AgentLine({ line, isAr, index }) {
  const style = TYPE_STYLES[line.type] || TYPE_STYLES.stable;
  const text = isAr ? safeStr(line.ar) : safeStr(line.en);

  return (
    <div className="nr-card-enter" style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 12,
      padding: "10px 14px",
      display: "flex", alignItems: "flex-start", gap: 10,
      animationDelay: `${index * 0.08}s`,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{line.icon || "📌"}</span>
      <div style={{
        fontSize: 13, fontWeight: 500, color: P.text, lineHeight: 1.7,
        flex: 1,
      }}>
        {text}
      </div>
      <div style={{
        fontSize: 9, fontWeight: 800, color: style.color,
        background: `${style.color}12`,
        borderRadius: 6, padding: "2px 8px",
        textTransform: "uppercase", letterSpacing: 1,
        whiteSpace: "nowrap", flexShrink: 0,
      }}>
        {line.type === "critical" ? (isAr ? "حرج" : "CRIT")
          : line.type === "warning" ? (isAr ? "تحذير" : "WARN")
          : line.type === "economic" ? (isAr ? "اقتصاد" : "ECON")
          : line.type === "pattern" ? (isAr ? "نمط" : "PATTERN")
          : line.type === "event" ? (isAr ? "حدث" : "EVENT")
          : line.type === "linkage" ? (isAr ? "ارتباط" : "LINK")
          : line.type === "forecast" ? (isAr ? "تنبؤ" : "FCAST")
          : line.type === "sports" ? (isAr ? "رياضة" : "SPORT")
          : (isAr ? "مستقر" : "STABLE")
        }
      </div>
    </div>
  );
}

export default function AgentInterpretationPanel() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const [ws, setWs] = useState(null);

  useEffect(() => {
    setWs(getWorldState());
    const unsub = subscribeWorldState(s => setWs(s));
    return unsub;
  }, []);

  if (!ws) return null;

  const agentLines = ws.agentLines || [];
  const agentState = ws.agentState;
  if (!agentLines.length) return null;

  return (
    <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>
      <div style={{
        background: `linear-gradient(160deg, ${P.bg}, ${P.surface})`,
        border: `1px solid rgba(167,139,250,0.08)`,
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Top accent */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, transparent, ${P.blue}60, ${P.purple}60, transparent)`,
        }} />

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 24px 12px", flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: `linear-gradient(135deg, ${P.blue}30, ${P.purple}30)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
              boxShadow: `0 0 16px ${P.blue}15`,
            }}>🤖</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, color: P.gold, letterSpacing: 3, textTransform: "uppercase", marginBottom: 2 }}>
                {isAr ? "ماذا يقول الوكيل الذكي؟" : "WHAT DOES THE AGENT SAY?"}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: P.text }}>
                {isAr ? "تحليل مباشر لحالة العالم" : "Live World State Analysis"}
              </div>
            </div>
          </div>
          {agentState && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: `${agentState.color}0a`,
              border: `1px solid ${agentState.color}18`,
              borderRadius: 10, padding: "5px 14px",
            }}>
              <span style={{ fontSize: 14 }}>{agentState.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: agentState.color }}>
                {isAr ? agentState.ar : agentState.en}
              </span>
            </div>
          )}
        </div>

        {/* Agent analysis lines */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
          padding: "0 20px 20px",
        }}>
          {agentLines.map((line, i) => (
            <AgentLine key={i} line={line} isAr={isAr} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
