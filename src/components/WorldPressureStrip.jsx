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

const REGION_ICONS = {
  "الشرق الأوسط": "🕌", "أوروبا": "🏰", "آسيا": "🏯",
  "أفريقيا": "🌍", "أمريكا الشمالية": "🗽", "أمريكا الجنوبية": "🌎",
};

function safeStr(val) {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object") return val.label || val.title || val.nameAr || "—";
  return String(val);
}

function PressureCard({ region, isAr }) {
  const name = isAr ? safeStr(region.region) : safeStr(region.regionEn);
  const icon = REGION_ICONS[region.region] || "🌐";
  const p = region.pressure || 0;
  const trendLabel = p >= 55 ? (isAr ? "تصاعد" : "Rising")
    : p >= 30 ? (isAr ? "متوسط" : "Moderate")
    : (isAr ? "مستقر" : "Stable");
  const trendColor = p >= 55 ? P.red : p >= 30 ? P.amber : P.green;

  return (
    <div style={{
      flex: "1 1 155px", minWidth: 150, maxWidth: 220,
      background: `linear-gradient(160deg, ${P.surface}, ${P.bg})`,
      border: `1px solid ${P.border}`,
      borderRadius: 16, padding: "14px",
      position: "relative", overflow: "hidden",
      transition: "border-color 0.3s, box-shadow 0.3s",
    }} className="nr-card-hover">
      {/* Top glow */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: region.color, opacity: 0.4,
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 24, filter: "drop-shadow(0 0 4px rgba(0,0,0,0.4))" }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 800, color: P.text,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{name}</div>
          <div style={{ fontSize: 10, color: P.textDim, fontWeight: 600 }}>
            {region.eventCount || 0} {isAr ? "حدث" : "events"}
          </div>
        </div>
      </div>

      {/* Pressure bar */}
      <div style={{
        width: "100%", height: 5, borderRadius: 3,
        background: "rgba(255,255,255,0.04)", overflow: "hidden", marginBottom: 6,
      }}>
        <div style={{
          width: `${Math.min(100, p)}%`, height: "100%", borderRadius: 3,
          background: `linear-gradient(90deg, ${region.color}aa, ${region.color})`,
          boxShadow: `0 0 6px ${region.color}30`,
          transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: P.muted, fontWeight: 700, textTransform: "uppercase" }}>
          {isAr ? "الضغط" : "PRESSURE"}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: region.color }}>{p}%</span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: trendColor,
            background: `${trendColor}10`, borderRadius: 4, padding: "1px 6px",
          }}>{trendLabel}</span>
        </div>
      </div>
    </div>
  );
}

export default function WorldPressureStrip() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const [ws, setWs] = useState(null);

  useEffect(() => {
    setWs(getWorldState());
    const unsub = subscribeWorldState(s => setWs(s));
    return unsub;
  }, []);

  if (!ws) return null;
  const regions = ws.regionalPressures || [];
  if (!regions.length) return null;

  return (
    <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 14, padding: "0 4px",
      }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 900, letterSpacing: 4,
            color: P.amber, textTransform: "uppercase", marginBottom: 2,
          }}>
            {isAr ? "ضغط المناطق" : "REGIONAL PRESSURE"}
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: P.text }}>
            {isAr ? "أين يتصاعد الضغط؟" : "Where is pressure rising?"}
          </div>
        </div>
      </div>

      <div style={{
        display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, flexWrap: "wrap",
      }}>
        {regions.map((r, i) => (
          <PressureCard key={r.region || i} region={r} isAr={isAr} />
        ))}
      </div>
    </section>
  );
}
