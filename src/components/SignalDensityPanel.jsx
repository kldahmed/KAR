import React, { useEffect, useState } from "react";
import { getStore } from "../lib/intelligenceStore";
import { formatDisplayTime } from "../AppHelpers";
import { useI18n } from "../i18n/I18nProvider";

const SIGNAL_ICONS = {
  conflict_escalation:  { icon: "⚔️", color: "#ef4444" },
  economic_pressure:    { icon: "📊", color: "#f59e0b" },
  sports_activity:      { icon: "⚽", color: "#38bdf8" },
  transfer_market:      { icon: "🔁", color: "#60a5fa" },
  sanctions_pressure:   { icon: "🚫", color: "#f97316" },
  peace_signal:         { icon: "🕊️", color: "#22c55e" },
  political_transition: { icon: "🏛️", color: "#a78bfa" },
  energy_signal:        { icon: "⚡", color: "#fde047" },
};

export default function SignalDensityPanel({ refreshKey = 0 }) {
  const [signalMap, setSignalMap] = useState({});
  const [total, setTotal] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");
  const { t } = useI18n();

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
          <div className="section-title">{t("signalDensity.title")}</div>
          <div className="section-subtitle">Signal Density Panel</div>
        </div>
        <div style={{ marginInlineStart: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
          <span style={{ fontSize: "10px", color: "#334155" }}>{updatedAt}</span>
          <span style={{ fontSize: "11px", color: "#475569" }}>{t("signalDensity.articlesProcessed", { count: total })}</span>
        </div>
      </div>

      {/* Signal bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {entries.map(([signal, count], i) => {
          const iconMeta = SIGNAL_ICONS[signal] || { icon: "•", color: "#64748b" };
          const label = t(`signalDensity.signals.${signal}`) || signal;
          const pct  = Math.round((count / maxCount) * 100);
          const freq  = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={signal} className="nr-animate-bar" style={{ animationDelay: `${i * 60}ms` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{iconMeta.icon}</span>
                  <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: iconMeta.color, fontWeight: 800 }}>{count}</span>
                  <span style={{
                    fontSize: "9px", background: `${iconMeta.color}15`,
                    border: `1px solid ${iconMeta.color}30`, color: iconMeta.color,
                    borderRadius: "4px", padding: "1px 5px",
                  }}>{freq}%</span>
                </div>
              </div>
              <div className="prog-track">
                <div className="prog-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${iconMeta.color}60,${iconMeta.color})` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
