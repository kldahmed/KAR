import React, { useEffect, useState } from "react";
import { getIntelligenceMetrics } from "../lib/intelligenceEngine";
import { formatDisplayTime } from "../AppHelpers";

const BAR_BG = "rgba(56,189,248,0.08)";
const BAR_FG = "linear-gradient(90deg,#1e3a5f,#38bdf8,#60a5fa)";

function MetricRow({ label, value, max, unit = "", color = "#38bdf8" }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "3px" }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}{unit}</span>
      </div>
      <div style={{ height: "4px", background: BAR_BG, borderRadius: "99px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: BAR_FG, borderRadius: "99px", transition: "width 0.8s cubic-bezier(0.22,0.61,0.36,1)" }} />
      </div>
    </div>
  );
}

export default function IntelligenceMeter({ refreshKey = 0 }) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    try {
      setMetrics(getIntelligenceMetrics());
    } catch {
      setMetrics(null);
    }
  }, [refreshKey]);

  const now = formatDisplayTime(new Date().toISOString());

  const score  = metrics?.score || 0;
  const ring   = Math.min(100, score);
  const radius = 40;
  const circ   = 2 * Math.PI * radius;
  const dash   = circ - (ring / 100) * circ;

  const scoreColor = score >= 65 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#38bdf8";

  return (
    <div
      style={{
        background: "linear-gradient(135deg,#0b0f1a,#0f172a)",
        border: "1px solid rgba(56,189,248,0.18)",
        borderRadius: "18px",
        padding: "22px 24px",
        color: "#e2e8f0",
        fontFamily: "inherit",
        direction: "rtl",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <span style={{ fontSize: "18px" }}>🧠</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: "14px", color: "#f3d38a", letterSpacing: "0.5px" }}>
            مؤشر تراكم الذكاء
          </div>
          <div style={{ fontSize: "10px", color: "#475569", letterSpacing: "1px", textTransform: "uppercase" }}>
            Intelligence Accumulation Index
          </div>
        </div>
        <div style={{ marginInlineStart: "auto", fontSize: "10px", color: "#475569" }}>
          {now}
        </div>
      </div>

      {/* Score ring + stats */}
      <div style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
        {/* Ring */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(56,189,248,0.1)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeDasharray={`${circ}`}
              strokeDashoffset={`${dash}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,0.61,0.36,1), stroke 0.5s" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "24px", fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: "9px", color: "#475569", letterSpacing: "1px" }}>/100</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1, minWidth: "160px" }}>
          <MetricRow label="المقالات المعالجة"     value={metrics?.total || 0}    max={500}  color="#38bdf8" />
          <MetricRow label="المصادر"                value={metrics?.sources || 0}  max={30}   color="#60a5fa" />
          <MetricRow label="المناطق المغطاة"        value={metrics?.regions || 0}  max={6}    color="#f3d38a" />
          <MetricRow label="الكيانات المرصودة"      value={metrics?.entities || 0} max={60}   color="#a78bfa" />
        </div>
      </div>

      {/* Confidence + evidence strength */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        <Badge label="ثقة التحليل" value={metrics?.confidenceLabel || "منخفضة"} color={metrics?.confidenceColor || "#ef4444"} />
        <Badge label="الإشارات"    value={`${metrics?.signals || 0} إشارة`}      color="#38bdf8" />
        <Badge label="عناصر الذاكرة" value={`${metrics?.total || 0} سجل`}        color="#60a5fa" />
        <Badge
          label="جودة الأدلة"
          value={metrics?.evidenceStrength === "strong" ? "قوية" : metrics?.evidenceStrength === "moderate" ? "متوسطة" : "ضعيفة"}
          color={metrics?.evidenceStrength === "strong" ? "#22c55e" : metrics?.evidenceStrength === "moderate" ? "#f59e0b" : "#ef4444"}
        />
      </div>

      {/* Disclaimer */}
      <div style={{ fontSize: "10px", color: "#334155", lineHeight: 1.5, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px" }}>
        ⚠ المؤشر مبني على عدد المقالات المعالجة وتنوع المصادر والمناطق. لا يعبر عن قدرة ذكاء اصطناعي خارجي.
      </div>
    </div>
  );
}

function Badge({ label, value, color }) {
  return (
    <div style={{
      display: "inline-flex", flexDirection: "column", alignItems: "center",
      background: `${color}10`, border: `1px solid ${color}30`,
      borderRadius: "10px", padding: "6px 12px", gap: "2px",
    }}>
      <span style={{ fontSize: "13px", fontWeight: 800, color }}>{value}</span>
      <span style={{ fontSize: "9px", color: "#475569", letterSpacing: "0.5px" }}>{label}</span>
    </div>
  );
}
