import React from "react";
import { useI18n } from "../i18n/I18nProvider";

export default function MemoryDepthPanel({ metrics }) {
  if (!metrics) return null;
  const { t } = useI18n();

  const SIGNALS_LABELS = {
    conflict_escalation:  t("memoryDepth.signals.conflict_escalation"),
    economic_pressure:    t("memoryDepth.signals.economic_pressure"),
    sports_activity:      t("memoryDepth.signals.sports_activity"),
    transfer_market:      t("memoryDepth.signals.transfer_market"),
    sanctions_pressure:   t("memoryDepth.signals.sanctions_pressure"),
    peace_signal:         t("memoryDepth.signals.peace_signal"),
    political_transition: t("memoryDepth.signals.political_transition"),
    energy_signal:        t("memoryDepth.signals.energy_signal"),
  };

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
        📦 {t("memoryDepth.title")}
      </div>

      {/* Key numbers grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
        {[
          { label: t("memoryDepth.totalRecords"),   value: total,    color: "#38bdf8" },
          { label: t("memoryDepth.highConfidence"),   value: highConf, color: "#22c55e" },
          { label: t("memoryDepth.recentActive"),  value: recent,   color: "#f3d38a" },
          { label: t("memoryDepth.derivedSignals"),  value: signals,  color: "#a78bfa" },
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
            {t("memoryDepth.categoryBreakdown")}
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
            {t("memoryDepth.monitoredRegions")}
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
            {t("memoryDepth.activeSignals")}
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
