import React, { useEffect, useState } from "react";
import { getStore } from "../lib/intelligenceStore";
import { formatDisplayTime } from "../AppHelpers";

const SIGNAL_META = {
  conflict_escalation:  { label: "تصعيد النزاعات",    color: "#ef4444", icon: "⚔️" },
  economic_pressure:    { label: "ضغط اقتصادي",       color: "#f59e0b", icon: "📊" },
  sports_activity:      { label: "نشاط رياضي",         color: "#38bdf8", icon: "⚽" },
  transfer_market:      { label: "سوق الانتقالات",     color: "#60a5fa", icon: "🔁" },
  sanctions_pressure:   { label: "ضغط العقوبات",       color: "#f97316", icon: "🚫" },
  peace_signal:         { label: "إشارات السلام",       color: "#22c55e", icon: "🕊️" },
  political_transition: { label: "تحول سياسي",         color: "#a78bfa", icon: "🏛️" },
  energy_signal:        { label: "طاقة / نفط",         color: "#fde047", icon: "⚡" },
};

export default function SignalDensityPanel({ refreshKey = 0 }) {
  const [signalMap, setSignalMap] = useState({});
  const [total, setTotal] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    try {
      const store = getStore();
      setTotal(store.length);
      const freq = {};
      store.forEach(item =>
        (item.derivedSignals || []).forEach(s => { freq[s] = (freq[s] || 0) + 1; })
      );
      setSignalMap(freq);
      setUpdatedAt(formatDisplayTime(new Date().toISOString()));
    } catch { /* non-critical */ }
  }, [refreshKey]);

  const entries = Object.entries(signalMap).sort((a, b) => b[1] - a[1]);
  const maxCount = entries.length ? entries[0][1] : 1;

  if (!entries.length) return null;

  return (
    <div className="section-frame" style={{ padding: "22px 24px", direction: "rtl", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
        <span style={{ fontSize: "16px" }}>📡</span>
        <div>
          <div className="section-title">كثافة الإشارات المرصودة</div>
          <div className="section-subtitle">Signal Density Panel</div>
        </div>
        <div style={{ marginInlineStart: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
          <span style={{ fontSize: "10px", color: "#334155" }}>{updatedAt}</span>
          <span style={{ fontSize: "11px", color: "#475569" }}>{total} مقال معالج</span>
        </div>
      </div>

      {/* Signal bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {entries.map(([signal, count], i) => {
          const meta = SIGNAL_META[signal] || { label: signal, color: "#64748b", icon: "•" };
          const pct  = Math.round((count / maxCount) * 100);
          const freq  = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={signal} className="nr-animate-bar" style={{ animationDelay: `${i * 60}ms` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{meta.icon}</span>
                  <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{meta.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: meta.color, fontWeight: 800 }}>{count}</span>
                  <span style={{
                    fontSize: "9px", background: `${meta.color}15`,
                    border: `1px solid ${meta.color}30`, color: meta.color,
                    borderRadius: "4px", padding: "1px 5px",
                  }}>{freq}%</span>
                </div>
              </div>
              <div className="prog-track">
                <div className="prog-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${meta.color}60,${meta.color})` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
