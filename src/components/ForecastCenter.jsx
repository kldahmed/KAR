import React, { useEffect, useState, useCallback } from "react";
import { generateForecasts } from "../lib/forecastEngine";
import { formatDisplayTime } from "../AppHelpers";

const EVIDENCE_LABELS = {
  strong:   { label: "أدلة قوية",    color: "#22c55e" },
  moderate: { label: "أدلة متوسطة",  color: "#f59e0b" },
  weak:     { label: "أدلة محدودة",  color: "#ef4444" },
};

function ProbabilityBar({ value, color }) {
  return (
    <div style={{ marginBottom: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "3px" }}>
        <span>احتمالية الاستمرار</span>
        <span style={{ fontWeight: 800, color }}>{value}%</span>
      </div>
      <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{
          width: `${value}%`, height: "100%",
          background: `linear-gradient(90deg,${color}66,${color})`,
          borderRadius: "99px",
          transition: "width 1s cubic-bezier(0.22,0.61,0.36,1)",
        }} />
      </div>
    </div>
  );
}

function ConfidenceArc({ confidence }) {
  const r = 22, circ = 2 * Math.PI * r;
  const color = confidence >= 60 ? "#22c55e" : confidence >= 40 ? "#f59e0b" : "#ef4444";
  const dash = circ - (confidence / 100) * circ;
  return (
    <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
      <svg width="56" height="56" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${circ}`} strokeDashoffset={`${dash}`} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 900, color }}>{confidence}%</span>
      </div>
    </div>
  );
}

function ForecastCard({ fc }) {
  const [expanded, setExpanded] = useState(false);
  const evLabel = EVIDENCE_LABELS[fc.evidenceStrength] || EVIDENCE_LABELS.weak;
  const trendColor = fc.trendColor || "#94a3b8";

  return (
    <div
      className="nr-card-enter"
      style={{
        background: "linear-gradient(135deg,#0b0f1a,#0f172a)",
        border: "1px solid rgba(56,189,248,0.14)",
        borderRadius: "16px",
        padding: "18px",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
      }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <span style={{ fontSize: "20px" }}>{fc.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "13px", color: "#e2e8f0" }}>{fc.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
            <span style={{ fontSize: "16px", fontWeight: 900, color: trendColor }}>{fc.trendArrow}</span>
            <span style={{ fontSize: "11px", color: trendColor, fontWeight: 700 }}>{fc.trend}</span>
          </div>
        </div>
        <ConfidenceArc confidence={fc.confidence} />
      </div>

      <ProbabilityBar value={fc.probability} color={trendColor} />

      {/* Badges */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px", marginBottom: "10px" }}>
        <span style={{ fontSize: "10px", background: `${evLabel.color}15`, border: `1px solid ${evLabel.color}30`, color: evLabel.color, borderRadius: "6px", padding: "2px 8px", fontWeight: 700 }}>
          {evLabel.label}
        </span>
        <span style={{ fontSize: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: "6px", padding: "2px 8px" }}>
          {fc.evidenceCount} إشارة
        </span>
        <span style={{ fontSize: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: "6px", padding: "2px 8px" }}>
          {fc.sourceCount} مصدر
        </span>
      </div>

      {/* Summary */}
      <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 8px", lineHeight: 1.6 }}>
        {fc.summary}
      </p>

      {/* Expanded: signal list */}
      {expanded && fc.signals?.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px", marginTop: "6px" }}>
          <div style={{ fontSize: "10px", color: "#475569", marginBottom: "6px", letterSpacing: "0.5px" }}>
            SUPPORTING SIGNALS
          </div>
          {fc.signals.map(s => (
            <div key={s.signal} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "3px" }}>
              <span>{s.label}</span>
              <span style={{ color: "#38bdf8" }}>×{s.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ fontSize: "9px", color: "#1e293b", marginTop: "8px" }}>
        ⚠ هذا توقع احتمالي — ليس تنبؤاً قاطعاً. جميع القيم مستنبطة من بيانات فعلية.
      </div>
    </div>
  );
}

export default function ForecastCenter({ refreshKey = 0 }) {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const refresh = useCallback(() => {
    try {
      const fc = generateForecasts();
      setForecasts(fc);
      setLastUpdate(formatDisplayTime(new Date().toISOString()));
    } catch {
      setForecasts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#334155" }}>
        جارٍ تحليل الإشارات...
      </div>
    );
  }

  if (!forecasts.length) {
    return (
      <div style={{
        background: "linear-gradient(135deg,#0b0f1a,#0f172a)",
        border: "1px solid rgba(56,189,248,0.14)",
        borderRadius: "16px",
        padding: "32px",
        textAlign: "center",
        color: "#475569",
        direction: "rtl",
      }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>🧠</div>
        <div style={{ fontWeight: 700, marginBottom: "8px", color: "#64748b" }}>
          لا توقعات متاحة حالياً
        </div>
        <div style={{ fontSize: "12px" }}>
          يحتاج النظام إلى معالجة مزيد من المقالات لبناء توقعات. تصفح تبويب الأخبار أولاً.
        </div>
      </div>
    );
  }

  return (
    <div style={{ direction: "rtl", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: "18px", color: "#f3d38a" }}>
            🔭 مركز الاستشراف
          </h2>
          <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
            AI Forecast Center — توقعات مستنبطة من الإشارات المرصودة
          </div>
        </div>
        {lastUpdate && (
          <div style={{ marginInlineStart: "auto", fontSize: "11px", color: "#334155" }}>
            آخر تحديث: {lastUpdate}
          </div>
        )}
      </div>

      {/* Warning banner */}
      <div style={{
        background: "rgba(245,158,11,0.06)",
        border: "1px solid rgba(245,158,11,0.2)",
        borderRadius: "10px",
        padding: "10px 16px",
        fontSize: "11px",
        color: "#92400e",
        marginBottom: "20px",
        lineHeight: 1.6,
      }}>
        ⚠️ <strong>ملاحظة:</strong> جميع التوقعات أدناه هي <strong>تحليلات احتمالية</strong> مستنبطة من عدد الإشارات والمقالات المرصودة.
        لا تمثل حقائق قاطعة أو تنبؤات مضمونة. الثقة تتوقف على حجم وجودة البيانات المتاحة.
      </div>

      {/* Forecast grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "16px",
      }}>
        {forecasts.map(fc => (
          <ForecastCard key={fc.id} fc={fc} />
        ))}
      </div>
    </div>
  );
}
