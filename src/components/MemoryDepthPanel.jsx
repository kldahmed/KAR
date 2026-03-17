import React from "react";

const SIGNALS_LABELS = {
  conflict_escalation:  "تصعيد نزاعات",
  economic_pressure:    "ضغط اقتصادي",
  sports_activity:      "نشاط رياضي",
  transfer_market:      "سوق انتقالات",
  sanctions_pressure:   "ضغط عقوبات",
  peace_signal:         "إشارات سلام",
  political_transition: "تحول سياسي",
  energy_signal:        "طاقة / نفط",
};

export default function MemoryDepthPanel({ metrics }) {
  if (!metrics) return null;

  const { total, sources, regions, entities, signals, catCounts = {}, regionList = [], signalList = [], highConf, recent } = metrics;

  return (
    <div style={{
      background: "linear-gradient(135deg,#0b0f1a,#0f172a)",
      border: "1px solid rgba(56,189,248,0.14)",
      borderRadius: "18px",
      padding: "20px",
      color: "#e2e8f0",
      fontFamily: "inherit",
      direction: "rtl",
    }}>
      <div style={{ fontWeight: 800, fontSize: "14px", color: "#f3d38a", marginBottom: "16px" }}>
        📦 عمق الذاكرة التحليلية
      </div>

      {/* Key numbers grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
        {[
          { label: "سجلات الذاكرة",   value: total,    color: "#38bdf8" },
          { label: "ذات ثقة عالية",   value: highConf, color: "#22c55e" },
          { label: "نشطة (6 ساعات)",  value: recent,   color: "#f3d38a" },
          { label: "إشارات مستنبطة",  value: signals,  color: "#a78bfa" },
        ].map(stat => (
          <div key={stat.label} style={{
            background: `${stat.color}0a`,
            border: `1px solid ${stat.color}20`,
            borderRadius: "10px",
            padding: "10px 14px",
          }}>
            <div style={{ fontSize: "20px", fontWeight: 900, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "10px", color: "#475569" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {Object.keys(catCounts).length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", color: "#334155", letterSpacing: "1px", marginBottom: "8px", textTransform: "uppercase" }}>
            توزيع الفئات
          </div>
          {Object.entries(catCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([cat, count]) => {
              const pct = Math.min(100, Math.round((count / total) * 100));
              return (
                <div key={cat} style={{ marginBottom: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "2px" }}>
                    <span>{cat}</span>
                    <span style={{ color: "#38bdf8" }}>{count}</span>
                  </div>
                  <div style={{ height: "3px", background: "rgba(56,189,248,0.08)", borderRadius: "99px" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#1e3a5f,#38bdf8)", borderRadius: "99px" }} />
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Regions covered */}
      {regionList.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontSize: "10px", color: "#334155", letterSpacing: "1px", marginBottom: "6px", textTransform: "uppercase" }}>
            المناطق المرصودة
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {regionList.map(r => (
              <span key={r} style={{
                fontSize: "10px", background: "rgba(243,211,138,0.08)",
                border: "1px solid rgba(243,211,138,0.2)", color: "#f3d38a",
                borderRadius: "6px", padding: "2px 8px",
              }}>{r}</span>
            ))}
          </div>
        </div>
      )}

      {/* Active signals */}
      {signalList.length > 0 && (
        <div>
          <div style={{ fontSize: "10px", color: "#334155", letterSpacing: "1px", marginBottom: "6px", textTransform: "uppercase" }}>
            الإشارات النشطة
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {signalList.map(s => (
              <span key={s} style={{
                fontSize: "10px", background: "rgba(167,139,250,0.08)",
                border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa",
                borderRadius: "6px", padding: "2px 8px",
              }}>{SIGNALS_LABELS[s] || s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
