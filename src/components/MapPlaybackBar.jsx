import React from "react";
import { useI18n } from "../i18n/I18nProvider";

const RANGE_KEYS = [
  { id: "30m", key: "m30" },
  { id: "6h", key: "h6" },
  { id: "24h", key: "h24" },
  { id: "3d", key: "d3" }
];

export default function MapPlaybackBar({
  range,
  setRange,
  playing,
  setPlaying,
  frameIndex,
  frameCount,
  signalCount
}) {
  const { t } = useI18n();

  return (
    <div className="glm-playback">
      <div className="glm-playback-ranges">
        {RANGE_KEYS.map((item) => (
          <button
            key={item.id}
            className={range === item.id ? "glm-chip active" : "glm-chip"}
            onClick={() => setRange(item.id)}
          >
            {t(`map.ranges.${item.key}`)}
          </button>
        ))}
      </div>
      <div className="glm-playback-controls">
        <button className="glm-control" onClick={() => setPlaying(!playing)}>
          {playing ? t("map.controls.pause") : t("map.controls.play")}
        </button>
        <div className="glm-progress-wrap">
          <div className="glm-progress-track">
            <div
              className="glm-progress-fill"
              style={{ width: `${Math.round(((frameIndex + 1) / frameCount) * 100)}%` }}
            />
          </div>
          <span className="glm-progress-meta">
            {t("map.controls.frame")} {frameIndex + 1}/{frameCount} • {t("map.controls.signalCount")} {signalCount}
          </span>
        </div>
      </div>
    </div>
  );
}
