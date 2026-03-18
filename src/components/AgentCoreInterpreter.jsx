/**
 * AgentCoreInterpreter — Enhanced AI Agent Interpretation Layer
 * Transforms analysis into concise intelligence lines with cause, region, implication.
 * The agent becomes the interpreting layer of the platform.
 */
import React, { useEffect, useState, useRef } from "react";
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

function generateConciseInsights(ws, isAr) {
  if (!ws) return [];
  const insights = [];
  const { tension, economic, sports, activeRegion, dominantPattern, strongestEvent,
    regionalPressures, forecasts, linkedDynamics, patterns } = ws;

  // 1. Tension insight
  if (tension.value >= 50) {
    insights.push({
      icon: "🔴", type: "critical",
      ar: `يرصد الوكيل تصاعد الضغط العالمي إلى ${tension.value}% نتيجة إشارات عسكرية واقتصادية متزامنة.`,
      en: `Agent detects global pressure rising to ${tension.value}% due to simultaneous military and economic signals.`,
      cause: isAr ? "إشارات عسكرية + اقتصادية" : "Military + economic signals",
      region: isAr ? "عالمي" : "Global",
      implication: isAr ? "احتمال تصعيد إقليمي" : "Regional escalation risk",
    });
  } else if (tension.value >= 30) {
    insights.push({
      icon: "🟡", type: "warning",
      ar: `يراقب الوكيل مؤشرات توتر متوسطة (${tension.value}%) — لا تصعيد حاد لكن المتابعة مستمرة.`,
      en: `Agent monitors moderate tension indicators (${tension.value}%) — no sharp escalation but tracking continues.`,
      cause: isAr ? "أحداث متعددة" : "Multiple events",
      region: isAr ? "عالمي" : "Global",
      implication: isAr ? "مراقبة مستمرة" : "Continued monitoring",
    });
  }

  // 2. Economic-energy linkage
  if (economic.value >= 35) {
    insights.push({
      icon: "📊", type: "economic",
      ar: `تظهر الأسواق حساسية متزايدة تجاه الطاقة — الضغط الاقتصادي عند ${economic.value}%.`,
      en: `Markets showing increased energy sensitivity — economic pressure at ${economic.value}%.`,
      cause: isAr ? "إشارات الطاقة والعقوبات" : "Energy and sanctions signals",
      region: isAr ? "الأسواق العالمية" : "Global Markets",
      implication: isAr ? "تقلب أسعار محتمل" : "Potential price volatility",
    });
  }

  // 3. Regional pressure
  const hotRegions = (regionalPressures || []).filter(r => r.pressure >= 35);
  if (hotRegions.length > 0) {
    const top = hotRegions[0];
    insights.push({
      icon: "📍", type: "regional",
      ar: `تتركز الأحداث في ${top.region} بضغط ${top.pressure}% و${top.eventCount} أحداث مرصودة.`,
      en: `Events concentrated in ${top.regionEn} at ${top.pressure}% pressure with ${top.eventCount} tracked events.`,
      cause: isAr ? `${top.eventCount} أحداث نشطة` : `${top.eventCount} active events`,
      region: isAr ? top.region : top.regionEn,
      implication: isAr ? "بؤرة ضغط إقليمية" : "Regional pressure hotspot",
    });
  }

  // 4. Cross-domain correlation
  if (tension.value >= 35 && economic.value >= 30) {
    insights.push({
      icon: "🔗", type: "linkage",
      ar: "يرصد الوكيل ارتباطًا بين التوتر العسكري وتقلب أسعار النفط.",
      en: "Agent detects correlation between military tension and oil price volatility.",
      cause: isAr ? "تزامن إشارات" : "Signal synchronization",
      region: isAr ? "الشرق الأوسط ← الأسواق" : "Middle East → Markets",
      implication: isAr ? "تأثير عابر للقطاعات" : "Cross-sector impact",
    });
  }

  // 5. Pattern detection
  if (dominantPattern && dominantPattern.signal !== "—" && dominantPattern.count > 0) {
    insights.push({
      icon: "📈", type: "pattern",
      ar: `تتكرر أنماط ${dominantPattern.label} بصورة ملحوظة (${dominantPattern.count} مرات) — نمط ناشئ.`,
      en: `${dominantPattern.labelEn} patterns recurring notably (${dominantPattern.count} times) — emerging pattern.`,
      cause: isAr ? "تكرار إشارات" : "Signal recurrence",
      region: isAr ? "متعدد المناطق" : "Multi-region",
      implication: isAr ? "نمط يستحق المراقبة" : "Pattern worth monitoring",
    });
  }

  // 6. Strongest event
  if (strongestEvent) {
    insights.push({
      icon: "⚡", type: "event",
      ar: `أقوى حدث مرصود: "${strongestEvent.title}" — يؤثر على الاستقرار الإقليمي.`,
      en: `Strongest event: "${strongestEvent.title}" — affecting regional stability.`,
      cause: isAr ? "حدث عالي الشدة" : "High-severity event",
      region: strongestEvent.region || (isAr ? "عالمي" : "Global"),
      implication: isAr ? "تداعيات محتملة" : "Potential cascading effects",
    });
  }

  // 7. Linked dynamics
  if (linkedDynamics && linkedDynamics.length > 0) {
    const chain = linkedDynamics[0];
    insights.push({
      icon: chain.icon || "🔗", type: "linkage",
      ar: `سلسلة تأثير نشطة: ${chain.nameAr} — قوة ${chain.strength}%.`,
      en: `Active influence chain: ${chain.nameEn} — strength ${chain.strength}%.`,
      cause: isAr ? "ربط إشارات" : "Signal linking",
      region: isAr ? "عابر للمناطق" : "Cross-regional",
      implication: isAr ? "تأثير متسلسل" : "Cascading impact",
    });
  }

  // 8. Forecast highlight
  if (forecasts && forecasts.length > 0) {
    const top = forecasts[0];
    insights.push({
      icon: "🔮", type: "forecast",
      ar: `توقع الوكيل: ${top.title} — احتمال ${top.probability}% خلال 48 ساعة.`,
      en: `Agent forecast: ${top.title} — ${top.probability}% probability within 48 hours.`,
      cause: isAr ? "تحليل أنماط" : "Pattern analysis",
      region: isAr ? "عالمي" : "Global",
      implication: isAr ? "تنبؤ مبني على أدلة" : "Evidence-based prediction",
    });
  }

  return insights;
}

const TYPE_STYLES = {
  critical: { bg: "rgba(239,68,68,0.05)", border: "rgba(239,68,68,0.12)", accent: "#ef4444" },
  warning: { bg: "rgba(245,158,11,0.05)", border: "rgba(245,158,11,0.12)", accent: "#f59e0b" },
  economic: { bg: "rgba(245,158,11,0.04)", border: "rgba(245,158,11,0.10)", accent: "#f59e0b" },
  regional: { bg: "rgba(243,211,138,0.04)", border: "rgba(243,211,138,0.10)", accent: "#f3d38a" },
  pattern: { bg: "rgba(167,139,250,0.04)", border: "rgba(167,139,250,0.10)", accent: "#a78bfa" },
  event: { bg: "rgba(239,68,68,0.04)", border: "rgba(239,68,68,0.10)", accent: "#ef4444" },
  linkage: { bg: "rgba(56,189,248,0.04)", border: "rgba(56,189,248,0.10)", accent: "#38bdf8" },
  forecast: { bg: "rgba(243,211,138,0.04)", border: "rgba(243,211,138,0.10)", accent: "#f3d38a" },
};

function InsightCard({ insight, isAr, index }) {
  const style = TYPE_STYLES[insight.type] || TYPE_STYLES.warning;
  return (
    <div className="nr-card-enter" style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 14,
      padding: "12px 16px",
      display: "flex", flexDirection: "column", gap: 8,
      animationDelay: `${index * 0.06}s`,
    }}>
      {/* Main insight line */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{insight.icon}</span>
        <div style={{
          fontSize: 13, fontWeight: 600, color: P.text, lineHeight: 1.7, flex: 1,
        }}>
          {isAr ? insight.ar : insight.en}
        </div>
      </div>

      {/* Structured metadata: cause → region → implication */}
      <div style={{
        display: "flex", gap: 8, flexWrap: "wrap",
        paddingTop: 4, borderTop: `1px solid ${style.border}`,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: style.accent,
          background: `${style.accent}10`, borderRadius: 6, padding: "2px 8px",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span style={{ opacity: 0.7 }}>{isAr ? "السبب:" : "Cause:"}</span> {insight.cause}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, color: P.blue,
          background: "rgba(56,189,248,0.08)", borderRadius: 6, padding: "2px 8px",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span style={{ opacity: 0.7 }}>{isAr ? "المنطقة:" : "Region:"}</span> {insight.region}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, color: P.purple,
          background: "rgba(167,139,250,0.08)", borderRadius: 6, padding: "2px 8px",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span style={{ opacity: 0.7 }}>{isAr ? "الأثر:" : "Impact:"}</span> {insight.implication}
        </div>
      </div>
    </div>
  );
}

export default function AgentCoreInterpreter() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const [ws, setWs] = useState(null);

  useEffect(() => {
    setWs(getWorldState());
    const unsub = subscribeWorldState(s => setWs(s));
    return unsub;
  }, []);

  const insights = generateConciseInsights(ws, isAr);

  if (!ws || !insights.length) return null;

  const agentState = ws.agentState;

  return (
    <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>
      <div style={{
        background: `linear-gradient(160deg, ${P.bg}, ${P.surface})`,
        border: "1px solid rgba(167,139,250,0.08)",
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
          padding: "18px 24px 14px", flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(56,189,248,0.25), rgba(167,139,250,0.25))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "0 0 20px rgba(56,189,248,0.15)",
            }}>🤖</div>
            <div>
              <div style={{
                fontSize: 10, fontWeight: 900, color: P.gold, letterSpacing: 3,
                textTransform: "uppercase", marginBottom: 2,
              }}>
                {isAr ? "طبقة التفسير الذكي" : "AI INTERPRETATION LAYER"}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: P.text }}>
                {isAr ? "ماذا يرصد الوكيل الآن؟" : "What is the agent detecting?"}
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

        {/* Concise intelligence insights */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
          padding: "0 20px 20px",
        }}>
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} isAr={isAr} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
