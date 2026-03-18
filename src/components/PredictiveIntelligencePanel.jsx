/**
 * PredictiveIntelligencePanel — Phase 7: Probabilistic Forecasts
 * Displays agent forecast predictions with probability, timeline, and evidence.
 * Example: "احتمال تصاعد التوتر في الشرق الأوسط 62% خلال 48 ساعة"
 */
import React, { useEffect, useState } from "react";
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

function ProbabilityArc({ value, color, size = 64 }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / 100);
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1s ease" }} />
      <text x={size / 2} y={size / 2 - 2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={16} fontWeight={900} fontFamily="Inter, system-ui">
        {value}
      </text>
      <text x={size / 2} y={size / 2 + 12} textAnchor="middle"
        fill={P.textDim} fontSize={8} fontWeight={700}>%</text>
    </svg>
  );
}

function EvidenceBadge({ strength, isAr }) {
  const config = {
    strong: { label: isAr ? "قوية" : "Strong", color: P.green },
    moderate: { label: isAr ? "متوسطة" : "Moderate", color: P.amber },
    weak: { label: isAr ? "ضعيفة" : "Weak", color: P.muted },
  };
  const c = config[strength] || config.weak;
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, color: c.color,
      background: `${c.color}12`, borderRadius: 6, padding: "2px 8px",
      letterSpacing: 1,
    }}>
      {c.label}
    </span>
  );
}

function ForecastCard({ forecast, isAr, index }) {
  const probColor = forecast.probability >= 60 ? P.red
    : forecast.probability >= 45 ? P.amber
    : forecast.probability >= 30 ? P.blue
    : P.green;

  const trendLabel = forecast.trend === "تصاعد" || forecast.trend === "escalation"
    ? (isAr ? "↑ تصاعد" : "↑ Escalating")
    : forecast.trend === "تراجع" || forecast.trend === "de-escalation"
    ? (isAr ? "↓ تراجع" : "↓ De-escalating")
    : (isAr ? "→ استقرار" : "→ Stable");

  return (
    <div className="nr-card-enter" style={{
      background: `linear-gradient(135deg, ${P.bg}, ${P.surface})`,
      border: `1px solid ${probColor}12`,
      borderRadius: 16,
      padding: "16px 18px",
      display: "flex", alignItems: "flex-start", gap: 14,
      position: "relative",
      overflow: "hidden",
      animationDelay: `${index * 0.08}s`,
    }}>
      {/* Top accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${probColor}40, transparent)`,
      }} />

      <ProbabilityArc value={forecast.probability} color={probColor} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title */}
        <div style={{
          fontSize: 14, fontWeight: 800, color: P.text, marginBottom: 4,
          lineHeight: 1.4,
        }}>
          {forecast.icon || "🔮"} {forecast.title}
        </div>

        {/* Prediction statement */}
        <div style={{
          fontSize: 12, color: P.textDim, fontWeight: 600, marginBottom: 8,
          lineHeight: 1.6,
        }}>
          {isAr
            ? `احتمال ${forecast.probability}% خلال 48 ساعة`
            : `${forecast.probability}% probability within 48 hours`}
        </div>

        {/* Metadata row */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: forecast.trendColor || probColor,
          }}>
            {trendLabel}
          </span>
          <EvidenceBadge strength={forecast.evidenceStrength} isAr={isAr} />
          <span style={{
            fontSize: 9, color: P.muted, fontWeight: 600,
          }}>
            {isAr ? `ثقة ${forecast.confidence}%` : `Confidence ${forecast.confidence}%`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PredictiveIntelligencePanel() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const [ws, setWs] = useState(null);

  useEffect(() => {
    setWs(getWorldState());
    const unsub = subscribeWorldState(s => setWs(s));
    return unsub;
  }, []);

  if (!ws || !ws.forecasts?.length) return null;

  return (
    <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 10, fontWeight: 900, letterSpacing: 4,
          color: P.gold, textTransform: "uppercase", marginBottom: 2,
        }}>
          {isAr ? "الاستخبارات التنبؤية" : "PREDICTIVE INTELLIGENCE"}
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: P.text }}>
          {isAr ? "ماذا يتوقع الوكيل خلال 48 ساعة؟" : "What does the agent predict within 48 hours?"}
        </div>
      </div>

      {/* Forecast cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        gap: 12,
      }}>
        {ws.forecasts.slice(0, 5).map((f, i) => (
          <ForecastCard key={f.id || i} forecast={f} isAr={isAr} index={i} />
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{
        marginTop: 10, textAlign: "center",
        fontSize: 10, color: P.muted, fontWeight: 600,
      }}>
        {isAr
          ? "التنبؤات مبنية على تحليل الأنماط والإشارات — ليست حقائق مؤكدة"
          : "Predictions based on pattern and signal analysis — not confirmed facts"}
      </div>
    </section>
  );
}
