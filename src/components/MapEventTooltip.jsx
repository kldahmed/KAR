import React from "react";

function confidenceLabel(confidenceBand) {
  if (confidenceBand === "strong") return "Strong";
  if (confidenceBand === "medium") return "Medium";
  return "Weak";
}

export default function MapEventTooltip({ node, dubaiTimeFormatter }) {
  if (!node) return null;

  const dominantDriver = node.explainability?.topDrivers?.[0]?.driver || node.dominantCategory;
  const confidenceBand = confidenceLabel(node.explainability?.confidenceBand);
  const updated = dubaiTimeFormatter(node.lastUpdated);

  return (
    <div className="glm-tooltip">
      <div className="glm-tooltip-head">
        <h4>{node.name}</h4>
        <span className={`glm-pressure ${node.pressureLevel}`}>{node.pressureLevel}</span>
      </div>
      <div className="glm-tooltip-grid">
        <div>
          <span className="glm-k">Region</span>
          <span className="glm-v">{node.region}</span>
        </div>
        <div>
          <span className="glm-k">Dominant</span>
          <span className="glm-v">{dominantDriver}</span>
        </div>
        <div>
          <span className="glm-k">Signals</span>
          <span className="glm-v">{node.signalCount}</span>
        </div>
        <div>
          <span className="glm-k">Confidence</span>
          <span className="glm-v">{confidenceBand}</span>
        </div>
      </div>
      <p className="glm-why">{node.explainability?.whyGlowing}</p>
      <div className="glm-tooltip-footer">Updated Dubai: {updated}</div>
    </div>
  );
}
