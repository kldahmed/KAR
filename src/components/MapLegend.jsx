import React from "react";
import { useI18n } from "../i18n/I18nProvider";

const ITEMS = [
  { key: "conflict", color: "#ef4444" },
  { key: "pressure", color: "#f59e0b" },
  { key: "attention", color: "#f3d38a" },
  { key: "stable", color: "#38bdf8" },
  { key: "positive", color: "#22c55e" },
  { key: "sports", color: "#a855f7" },
  { key: "flow", color: "#22d3ee" }
];

export default function MapLegend({ stats }) {
  const { t } = useI18n();

  return (
    <div className="glm-legend">
      <div className="glm-legend-title">{t("map.legendTitle")}</div>
      <div className="glm-legend-grid">
        {ITEMS.map((item) => (
          <div key={item.key} className="glm-legend-item">
            <span className="glm-legend-dot" style={{ background: item.color }} />
            <span>{t(`map.legend.${item.key}`)}</span>
          </div>
        ))}
      </div>
      <div className="glm-legend-stats">
        <span>{t("map.stats.countries")}: {stats.activeCountries}</span>
        <span>{t("map.stats.highPressure")}: {stats.highPressureCountries}</span>
        <span>{t("map.stats.links")}: {stats.activeLinks}</span>
      </div>
    </div>
  );
}
