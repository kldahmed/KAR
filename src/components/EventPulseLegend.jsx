import React, { useEffect, useState } from "react";
import { getWorldState, subscribeWorldState } from "../lib/worldStateEngine";
import { useI18n } from "../i18n/I18nProvider";

const P = {
  bg: "#060a10",
  surface: "#0a0f1c",
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

function safeStr(val) {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object") return val.label || val.title || val.nameAr || "—";
  return String(val);
}

function DynamicCard({ chain, isAr }) {
  const name = isAr ? safeStr(chain.nameAr) : safeStr(chain.nameEn);
  const conf = isAr ? safeStr(chain.confidenceLabel) : safeStr(chain.confidenceLabelEn);

  return (
    <div style={{
      flex: "1 1 260px", minWidth: 240,
      background: `linear-gradient(160deg, ${P.surface}, ${P.bg})`,
      border: `1px solid ${chain.color}15`,
      borderRadius: 14, padding: "12px 14px",
      display: "flex", flexDirection: "column", gap: 6,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: chain.color, opacity: 0.4,
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>{chain.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{name}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
            {(chain.matchedTriggers || []).map((t, i) => (
              <span key={i} style={{
                fontSize: 9, fontWeight: 700, color: chain.color,
                background: `${chain.color}10`, borderRadius: 5, padding: "2px 7px",
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: P.textDim }}>
          {isAr ? "أدلة" : "Evidence"}: {chain.evidenceCount}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: chain.color,
          background: `${chain.color}10`, borderRadius: 5, padding: "2px 8px",
        }}>
          {conf} · {chain.strength}%
        </span>
      </div>
    </div>
  );
}

export default function EventPulseLegend() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const [ws, setWs] = useState(null);

  useEffect(() => {
    setWs(getWorldState());
    const unsub = subscribeWorldState(s => setWs(s));
    return unsub;
  }, []);

  if (!ws) return null;
  const dynamics = ws.linkedDynamics || [];
  if (!dynamics.length) return null;

  return (
    <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>
      <div style={{
        marginBottom: 14, padding: "0 4px",
      }}>
        <div style={{
          fontSize: 10, fontWeight: 900, letterSpacing: 4,
          color: P.blue, textTransform: "uppercase", marginBottom: 2,
        }}>
          {isAr ? "ديناميكيات مترابطة" : "LINKED DYNAMICS"}
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: P.text }}>
          {isAr ? "كيف ترتبط الأحداث ببعضها؟" : "How are events connected?"}
        </div>
      </div>

      <div style={{
        display: "flex", gap: 10, flexWrap: "wrap",
      }}>
        {dynamics.map((chain, i) => (
          <DynamicCard key={chain.id || i} chain={chain} isAr={isAr} />
        ))}
      </div>
    </section>
  );
}
