import React from "react";
import { useI18n } from "../i18n/I18nProvider";

export default function MapEventTooltip({ node }) {
  const { t, formatDateTime } = useI18n();

  if (!node) return null;

  const dominantDriver = node.explainability?.topDrivers?.[0]?.driver || node.dominantCategory;
  const confidenceBand = t(`map.confidenceBand.${node.explainability?.confidenceBand || "weak"}`);
  const pressureLabel = t(`map.pressureLevel.${node.pressureLevel || "low"}`);
  const updated = formatDateTime(node.lastUpdated);

  return (
    <div className="glm-tooltip">
      <div className="glm-tooltip-head">
        <h4>{node.name}</h4>
        <span className={`glm-pressure ${node.pressureLevel}`}>{pressureLabel}</span>
      </div>
      <div className="glm-tooltip-grid">
        <div>
          <span className="glm-k">{t("map.region")}</span>
          <span className="glm-v">{node.region}</span>
        </div>
        <div>
          <span className="glm-k">{t("map.dominant")}</span>
          <span className="glm-v">{dominantDriver}</span>
        </div>
        <div>
          <span className="glm-k">{t("map.signals")}</span>
          <span className="glm-v">{node.signalCount}</span>
        </div>
        <div>
          <span className="glm-k">{t("map.confidence")}</span>
          <span className="glm-v">{confidenceBand}</span>
        </div>
      </div>
      <p className="glm-why">{node.explainability?.whyGlowing}</p>
      <div className="glm-tooltip-footer">{t("map.updatedDubai")}: {updated}</div>
    </div>
  );
}
