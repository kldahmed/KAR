import React from "react";

const RANGES = [
  { id: "30m", label: "Last 30m" },
  { id: "6h", label: "Last 6h" },
  { id: "24h", label: "Last 24h" },
  { id: "3d", label: "Last 3d" }
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
  return (
    <div className="glm-playback">
      <div className="glm-playback-ranges">
        {RANGES.map((item) => (
          <button
            key={item.id}
            className={range === item.id ? "glm-chip active" : "glm-chip"}
            onClick={() => setRange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="glm-playback-controls">
        <button className="glm-control" onClick={() => setPlaying(!playing)}>
          {playing ? "Pause" : "Play"}
        </button>
        <div className="glm-progress-wrap">
          <div className="glm-progress-track">
            <div
              className="glm-progress-fill"
              style={{ width: `${Math.round(((frameIndex + 1) / frameCount) * 100)}%` }}
            />
          </div>
          <span className="glm-progress-meta">
            Frame {frameIndex + 1}/{frameCount} • Signals {signalCount}
          </span>
        </div>
      </div>
    </div>
  );
}
