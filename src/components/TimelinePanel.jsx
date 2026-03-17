import React from "react";
import { URGENCY_MAP, formatDisplayTime } from "../AppHelpers";
import { useI18n } from "../i18n/I18nProvider";

export default function TimelinePanel({ news }) {
  const { t } = useI18n();
  const events = [...(news || [])]
    .filter(n => n.time && n.title)
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 15);

  return (
    <div style={{ background: "#222", borderRadius: "12px", padding: "18px", margin: "18px 0", maxWidth: "600px", width: "100%", boxShadow: "0 2px 8px #0002" }}>
      <div style={{ fontWeight: "bold", fontSize: "1.2rem", color: "#fff", marginBottom: "14px" }}>
        {t("timeline.title")}
      </div>
      {events.length === 0 ? (
        <div style={{ color: "#aaa" }}>{t("timeline.noEvents")}</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {events.map((ev, idx) => (
            <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px", borderLeft: `3px solid ${URGENCY_MAP[ev.urgency]?.color || "#38bdf8"}`, paddingLeft: "10px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#e2e8f0", fontWeight: "700", fontSize: "14px" }}>{ev.title}</div>
                <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
                  {ev.source} • {formatDisplayTime(ev.time)}
                </div>
              </div>
              <span style={{ color: URGENCY_MAP[ev.urgency]?.color || "#38bdf8", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap" }}>
                {t(`timeline.urgency.${ev.urgency || "low"}`)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div style={{ color: "#666", fontSize: "11px", marginTop: "8px" }}>
        {t("timeline.lastUpdate")}: {formatDisplayTime(new Date().toISOString())}
      </div>
    </div>
  );
}
