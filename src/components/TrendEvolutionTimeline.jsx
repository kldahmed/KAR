import React, { useEffect, useState } from "react";
import { getStore } from "../lib/intelligenceStore";

const BUCKETS = [
  { label: "< 1 ساعة",   maxMs: 1 * 3600_000 },
  { label: "1 – 6 ساعات", maxMs: 6 * 3600_000 },
  { label: "6 – 12 ساعة", maxMs: 12 * 3600_000 },
  { label: "12 – 24 ساعة",maxMs: 24 * 3600_000 },
  { label: "24 – 48 ساعة",maxMs: 48 * 3600_000 },
];

function bucketItems(store) {
  const now = Date.now();
  return BUCKETS.map(b => {
    const items = store.filter(i => {
      try {
        const age = now - new Date(i.timestamp).getTime();
        return age >= 0 && age < b.maxMs;
      } catch { return false; }
    });
    const signals = new Set(items.flatMap(i => i.derivedSignals || [])).size;
    const high = items.filter(i => i.urgency === "high").length;
    return { ...b, count: items.length, signals, high };
  });
}

export default function TrendEvolutionTimeline({ refreshKey = 0 }) {
  const [buckets, setBuckets] = useState([]);

  useEffect(() => {
    try {
      const store = getStore();
      setBuckets(bucketItems(store));
    } catch { /* non-critical */ }
  }, [refreshKey]);

  if (!buckets.length || buckets.every(b => b.count === 0)) return null;

  const maxCount = Math.max(1, ...buckets.map(b => b.count));

  return (
    <div className="section-frame" style={{ padding: "22px 24px", direction: "rtl", fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
        <span style={{ fontSize: "16px" }}>📈</span>
        <div>
          <div className="section-title">تطور الإشارات عبر الزمن</div>
          <div className="section-subtitle">Trend Evolution Timeline</div>
        </div>
      </div>

      {/* Timeline bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {[...buckets].reverse().map((b, i) => {
          const pct = Math.round((b.count / maxCount) * 100);
          const barColor = pct >= 75 ? "#ef4444" : pct >= 40 ? "#f59e0b" : "#38bdf8";
          return (
            <div key={b.label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Label */}
              <div style={{ width: "90px", fontSize: "10px", color: "#64748b", textAlign: "left", flexShrink: 0 }}>
                {b.label}
              </div>

              {/* Bar */}
              <div className="prog-track" style={{ flex: 1 }}>
                <div
                  className="prog-fill nr-animate-bar"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg,${barColor}50,${barColor})`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              </div>

              {/* Metrics */}
              <div style={{ display: "flex", gap: "6px", flexShrink: 0, alignItems: "center" }}>
                <span className="nr-animate-number" style={{ fontSize: "12px", fontWeight: 800, color: barColor, minWidth: "20px", textAlign: "center" }}>
                  {b.count}
                </span>
                {b.signals > 0 && (
                  <span className="intel-badge" style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa" }}>
                    {b.signals} إشارة
                  </span>
                )}
                {b.high > 0 && (
                  <span className="intel-badge" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                    {b.high} عاجل
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "14px", fontSize: "10px", color: "#1e293b", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "10px" }}>
        يعرض هذا اللوح تحليل توزيع المقالات المخزنة عبر فترات زمنية مختلفة بناءً على وقت النشر.
      </div>
    </div>
  );
}
