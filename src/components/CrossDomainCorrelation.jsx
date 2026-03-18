/**
 * CrossDomainCorrelation — Phase 9: Cross-Domain Signal Correlation
 * Detects and displays links between:
 * - Military events ↔ Energy markets
 * - Financial markets ↔ Geopolitical shifts
 * Shows the agent's cross-domain linking intelligence.
 */
import React, { useEffect, useState, useMemo } from "react";
import { getWorldState, subscribeWorldState } from "../lib/worldStateEngine";
import { getStore } from "../lib/intelligenceStore";
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

const DOMAINS = {
  military: { icon: "⚔️", color: "#ef4444", ar: "عسكري", en: "Military" },
  energy: { icon: "⚡", color: "#fbbf24", ar: "الطاقة", en: "Energy" },
  economy: { icon: "📊", color: "#f59e0b", ar: "الاقتصاد", en: "Economy" },
  geopolitics: { icon: "🌐", color: "#a78bfa", ar: "جيوسياسي", en: "Geopolitics" },
  diplomacy: { icon: "🕊️", color: "#22c55e", ar: "دبلوماسي", en: "Diplomacy" },
  sanctions: { icon: "🚫", color: "#ef4444", ar: "عقوبات", en: "Sanctions" },
};

const CORRELATION_PAIRS = [
  {
    domainA: "military", domainB: "energy",
    signalsA: ["conflict_escalation"], signalsB: ["energy_signal"],
    insightAr: "يرصد الوكيل ارتباطًا بين التوتر العسكري وتقلب أسعار النفط.",
    insightEn: "Agent detects correlation between military tension and oil price volatility.",
  },
  {
    domainA: "military", domainB: "economy",
    signalsA: ["conflict_escalation"], signalsB: ["economic_pressure"],
    insightAr: "يؤدي تصاعد النزاع إلى ضغط مباشر على الأسواق المالية.",
    insightEn: "Conflict escalation creates direct pressure on financial markets.",
  },
  {
    domainA: "sanctions", domainB: "energy",
    signalsA: ["sanctions_pressure"], signalsB: ["energy_signal"],
    insightAr: "العقوبات تولّد اضطراباً في أسواق الطاقة العالمية.",
    insightEn: "Sanctions generate disruption in global energy markets.",
  },
  {
    domainA: "geopolitics", domainB: "economy",
    signalsA: ["political_transition"], signalsB: ["economic_pressure"],
    insightAr: "التحولات السياسية تزيد من حساسية الأسواق للمخاطر.",
    insightEn: "Political transitions increase market risk sensitivity.",
  },
  {
    domainA: "diplomacy", domainB: "military",
    signalsA: ["peace_signal"], signalsB: ["conflict_escalation"],
    insightAr: "إشارات سلام تتعارض مع مؤشرات التصعيد — حالة مختلطة.",
    insightEn: "Peace signals contradict escalation indicators — mixed state.",
  },
];

function detectCorrelations(store) {
  if (!store?.length) return [];

  const activeSignals = new Set();
  store.forEach(item => {
    (item.derivedSignals || []).forEach(s => activeSignals.add(s));
  });

  const signalCounts = {};
  store.forEach(item => {
    (item.derivedSignals || []).forEach(s => {
      signalCounts[s] = (signalCounts[s] || 0) + 1;
    });
  });

  return CORRELATION_PAIRS.map(pair => {
    const aActive = pair.signalsA.some(s => activeSignals.has(s));
    const bActive = pair.signalsB.some(s => activeSignals.has(s));
    if (!aActive || !bActive) return null;

    const aCount = pair.signalsA.reduce((sum, s) => sum + (signalCounts[s] || 0), 0);
    const bCount = pair.signalsB.reduce((sum, s) => sum + (signalCounts[s] || 0), 0);
    const strength = Math.min(100, Math.round((aCount + bCount) * 5));
    const confidence = Math.min(90, Math.round(Math.sqrt(aCount * bCount) * 15));

    return {
      ...pair,
      active: true,
      strength,
      confidence,
      aCount,
      bCount,
    };
  }).filter(Boolean).sort((a, b) => b.strength - a.strength);
}

function CorrelationCard({ corr, isAr, index }) {
  const dA = DOMAINS[corr.domainA];
  const dB = DOMAINS[corr.domainB];

  return (
    <div className="nr-card-enter" style={{
      background: `linear-gradient(135deg, ${P.bg}, ${P.surface})`,
      border: "1px solid rgba(56,189,248,0.06)",
      borderRadius: 16,
      padding: "16px 18px",
      position: "relative",
      overflow: "hidden",
      animationDelay: `${index * 0.06}s`,
    }}>
      {/* Accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${dA.color}60, ${dB.color}60)`,
      }} />

      {/* Correlation visual: Domain A ↔ Domain B */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 14, marginBottom: 12, padding: "8px 0",
      }}>
        {/* Domain A */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: `${dA.color}12`, border: `1px solid ${dA.color}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>{dA.icon}</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: dA.color }}>
            {isAr ? dA.ar : dA.en}
          </span>
          <span style={{ fontSize: 9, color: P.muted, fontWeight: 600 }}>
            {corr.aCount} {isAr ? "إشارة" : "signals"}
          </span>
        </div>

        {/* Connection indicator */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}>
          <div style={{
            width: 60, height: 2,
            background: `linear-gradient(90deg, ${dA.color}60, ${dB.color}60)`,
            borderRadius: 1,
          }} />
          <span style={{
            fontSize: 16, fontWeight: 900, color: P.gold,
            fontFamily: "Inter, system-ui",
          }}>
            {corr.strength}%
          </span>
          <span style={{ fontSize: 8, color: P.muted, fontWeight: 700, letterSpacing: 1 }}>
            {isAr ? "قوة الارتباط" : "CORRELATION"}
          </span>
        </div>

        {/* Domain B */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: `${dB.color}12`, border: `1px solid ${dB.color}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>{dB.icon}</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: dB.color }}>
            {isAr ? dB.ar : dB.en}
          </span>
          <span style={{ fontSize: 9, color: P.muted, fontWeight: 600 }}>
            {corr.bCount} {isAr ? "إشارة" : "signals"}
          </span>
        </div>
      </div>

      {/* Insight line */}
      <div style={{
        background: "rgba(56,189,248,0.04)",
        border: "1px solid rgba(56,189,248,0.08)",
        borderRadius: 10,
        padding: "8px 12px",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>🤖</span>
        <span style={{ fontSize: 12, color: P.text, fontWeight: 500, lineHeight: 1.6 }}>
          {isAr ? corr.insightAr : corr.insightEn}
        </span>
      </div>
    </div>
  );
}

export default function CrossDomainCorrelation() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const [ws, setWs] = useState(null);

  useEffect(() => {
    setWs(getWorldState());
    const unsub = subscribeWorldState(s => setWs(s));
    return unsub;
  }, []);

  const correlations = useMemo(() => detectCorrelations(getStore()), [ws?.timestamp]);

  if (!correlations.length) return null;

  return (
    <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 10, fontWeight: 900, letterSpacing: 4,
          color: P.gold, textTransform: "uppercase", marginBottom: 2,
        }}>
          {isAr ? "ارتباط عابر للمجالات" : "CROSS-DOMAIN CORRELATION"}
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: P.text }}>
          {isAr ? "كيف تتأثر القطاعات ببعضها؟" : "How do sectors affect each other?"}
        </div>
      </div>

      {/* Correlation cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 12,
      }}>
        {correlations.slice(0, 4).map((corr, i) => (
          <CorrelationCard key={i} corr={corr} isAr={isAr} index={i} />
        ))}
      </div>
    </section>
  );
}
