/**
 * ScenarioPanel — derives 3 plausible scenarios (best/base/worst) from signal mix.
 * All scenario probabilities are derived from real signal counts — never invented.
 * Max probability: 70% to avoid overclaiming.
 */
import React, { useEffect, useState } from "react";
import { getStore } from "../lib/intelligenceStore";

const RISK_SIGNALS = ["conflict_escalation", "sanctions_pressure", "economic_pressure"];
const CALM_SIGNALS = ["peace_signal"];
const TRANSITION_SIGNALS = ["political_transition", "energy_signal", "transfer_market"];

function buildScenarios(store) {
  if (!store.length) return [];

  const now = Date.now();
  const recent = store.filter(i => {
    try { return now - new Date(i.timestamp).getTime() < 48 * 3600_000; } catch { return false; }
  });

  const total = Math.max(1, recent.length);
  const riskCount     = recent.filter(i => (i.derivedSignals || []).some(s => RISK_SIGNALS.includes(s))).length;
  const calmCount     = recent.filter(i => (i.derivedSignals || []).some(s => CALM_SIGNALS.includes(s))).length;
  const transCount    = recent.filter(i => (i.derivedSignals || []).some(s => TRANSITION_SIGNALS.includes(s))).length;
  const negSentiment  = recent.filter(i => i.sentiment === "negative").length;
  const posSentiment  = recent.filter(i => i.sentiment === "positive").length;
  const sources       = new Set(recent.map(i => i.source)).size;

  const riskRatio  = riskCount / total;
  const calmRatio  = calmCount / total;

  // Evidence strength
  const evidenceCount = recent.length;
  const strength = evidenceCount >= 10 ? "قوية" : evidenceCount >= 4 ? "متوسطة" : "محدودة";
  const strengthColor = evidenceCount >= 10 ? "#22c55e" : evidenceCount >= 4 ? "#f59e0b" : "#ef4444";

  // Probability derivation (capped at 70%)
  const worstProb = Math.min(70, Math.round(25 + riskRatio * 40 + (negSentiment / total) * 15));
  const bestProb  = Math.min(70, Math.round(15 + calmRatio * 40 + (posSentiment / total) * 15));
  const baseProb  = Math.min(70, Math.max(30, 100 - worstProb - bestProb));

  return [
    {
      id: "worst",
      label: "السيناريو المتشائم",
      icon: "📉",
      color: "#ef4444",
      probability: worstProb,
      summary: riskCount >= 3
        ? `رُصدت ${riskCount} إشارة تصعيد في 48 ساعة من ${sources} مصدر. المؤشرات تدعم سيناريو التصعيد جزئياً.`
        : "إشارات التصعيد محدودة. احتمالية منخفضة للسيناريو المتشائم بالبيانات الحالية.",
      drivers: [
        riskCount > 0 && `${riskCount} إشارة توتر/صراع`,
        negSentiment > 0 && `${negSentiment} مقال ذو لهجة سلبية`,
        transCount > 0 && `${transCount} حدث في مرحلة تحول`,
      ].filter(Boolean),
      evidenceCount,
      sources,
      strength,
      strengthColor,
    },
    {
      id: "base",
      label: "السيناريو الأساسي",
      icon: "⚖️",
      color: "#f59e0b",
      probability: baseProb,
      summary: `السيناريو الأكثر احتمالاً بالبيانات الحالية (${total} مقال، ${sources} مصدر). استمرار الوضع الراهن مع تقلبات محدودة.`,
      drivers: [
        `${total} مقال معالج`,
        `${sources} مصدر متنوع`,
        transCount > 0 && `${transCount} إشارة تحول`,
      ].filter(Boolean),
      evidenceCount,
      sources,
      strength,
      strengthColor,
    },
    {
      id: "best",
      label: "السيناريو المتفائل",
      icon: "📈",
      color: "#22c55e",
      probability: bestProb,
      summary: calmCount >= 2
        ? `رُصدت ${calmCount} إشارة استقرار/سلام في 48 ساعة. بيانات تدعم سيناريو التهدئة جزئياً.`
        : "إشارات الاستقرار محدودة حالياً في قاعدة البيانات.",
      drivers: [
        calmCount > 0 && `${calmCount} إشارة سلام/هدنة`,
        posSentiment > 0 && `${posSentiment} مقال ذو لهجة إيجابية`,
        sources > 3 && `تنوع مصادر: ${sources}`,
      ].filter(Boolean),
      evidenceCount,
      sources,
      strength,
      strengthColor,
    },
  ];
}

function ScenarioCard({ scenario }) {
  const [expanded, setExpanded] = useState(false);
  const { label, icon, color, probability, summary, drivers, evidenceCount, sources, strength, strengthColor } = scenario;

  const r = 22, circ = 2 * Math.PI * r;
  const dash = circ - (probability / 100) * circ;

  return (
    <div
      className="nr-card-hover"
      style={{
        background: `${color}06`,
        border: `1px solid ${color}22`,
        borderRadius: "14px",
        padding: "16px",
        cursor: "pointer",
        flex: "1 1 200px",
        minWidth: "200px",
      }}
      onClick={() => setExpanded(e => !e)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "12px", color: "#e2e8f0" }}>{label}</div>
        </div>

        {/* Prob arc */}
        <div style={{ position: "relative", width: 52, height: 52 }}>
          <svg width="52" height="52" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="5"
              strokeDasharray={`${circ}`} strokeDashoffset={`${dash}`} strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: 900, color }}>{probability}%</span>
          </div>
        </div>
      </div>

      <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 10px", lineHeight: 1.6 }}>
        {summary}
      </p>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: expanded ? "10px" : 0 }}>
        <span className="intel-badge" style={{
          background: `${strengthColor}15`,
          border: `1px solid ${strengthColor}30`,
          color: strengthColor,
        }}>
          أدلة: {strength}
        </span>
        <span className="intel-badge" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}>
          {evidenceCount} إشارة · {sources} مصدر
        </span>
      </div>

      {expanded && drivers.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "8px" }}>
          <div style={{ fontSize: "9px", color: "#334155", letterSpacing: "1px", marginBottom: "5px", textTransform: "uppercase" }}>
            المحركات
          </div>
          {drivers.map((d, i) => (
            <div key={i} style={{ fontSize: "10px", color: "#64748b", marginBottom: "2px" }}>
              • {d}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScenarioPanel({ refreshKey = 0 }) {
  const [scenarios, setScenarios] = useState([]);

  useEffect(() => {
    try {
      setScenarios(buildScenarios(getStore()));
    } catch { /* non-critical */ }
  }, [refreshKey]);

  if (!scenarios.length) return null;

  return (
    <div className="section-frame" style={{ padding: "22px 24px", direction: "rtl", fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <span style={{ fontSize: "16px" }}>🎯</span>
        <div>
          <div className="section-title">تحليل السيناريوهات</div>
          <div className="section-subtitle">Scenario Analysis Panel</div>
        </div>
      </div>

      <div style={{
        background: "rgba(245,158,11,0.06)",
        border: "1px solid rgba(245,158,11,0.15)",
        borderRadius: "8px",
        padding: "8px 14px",
        fontSize: "10px",
        color: "#78350f",
        marginBottom: "16px",
        lineHeight: 1.6,
      }}>
        ⚠ السيناريوهات احتمالية مستنبطة من إشارات فعلية. لا تمثل تنبؤات قاطعة. الاحتمالية القصوى 70%.
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {scenarios.map(s => <ScenarioCard key={s.id} scenario={s} />)}
      </div>
    </div>
  );
}
