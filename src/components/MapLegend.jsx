import React from "react";

const ITEMS = [
  { key: "conflict", label: "Conflict / Escalation", color: "#ef4444" },
  { key: "pressure", label: "Rising Pressure", color: "#f59e0b" },
  { key: "attention", label: "Strategic Attention", color: "#f3d38a" },
  { key: "stable", label: "Stable / Monitored", color: "#38bdf8" },
  { key: "positive", label: "Low Tension", color: "#22c55e" },
  { key: "sports", label: "Sports Volatility", color: "#a855f7" },
  { key: "flow", label: "Live Intelligence Flow", color: "#22d3ee" }
];

export default function MapLegend({ stats }) {
  return (
    <div className="glm-legend">
      <div className="glm-legend-title">Signal Semantics</div>
      <div className="glm-legend-grid">
        {ITEMS.map((item) => (
          <div key={item.key} className="glm-legend-item">
            <span className="glm-legend-dot" style={{ background: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="glm-legend-stats">
        <span>Countries: {stats.activeCountries}</span>
        <span>High pressure: {stats.highPressureCountries}</span>
        <span>Live links: {stats.activeLinks}</span>
      </div>
    </div>
  );
}
