import React from "react";
import { Circle, Tooltip } from "react-leaflet";
import { useI18n } from "../i18n/I18nProvider";

function pressureColor(level) {
  if (level === "high") return "#ef4444";
  if (level === "medium") return "#f59e0b";
  return "#38bdf8";
}

export default function MapRegionOverlay({ regions, countryNodes }) {
  const { t } = useI18n();

  return (
    <>
      {regions.map((region) => {
        const anchors = countryNodes.filter((node) => region.countries.includes(node.id));
        if (!anchors.length) return null;
        const avgLat = anchors.reduce((sum, node) => sum + node.centerCoordinates[0], 0) / anchors.length;
        const avgLng = anchors.reduce((sum, node) => sum + node.centerCoordinates[1], 0) / anchors.length;
        const color = pressureColor(region.pressureLevel);

        return (
          <Circle
            key={region.id}
            center={[avgLat, avgLng]}
            radius={Math.max(220000, region.signalCount * 55000)}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.08,
              opacity: 0.42,
              weight: 1
            }}
          >
            <Tooltip sticky>
              {region.name} • {region.signalCount} {t("map.signals")} • {t(`map.pressureLevel.${region.pressureLevel}`)}
            </Tooltip>
          </Circle>
        );
      })}
    </>
  );
}
