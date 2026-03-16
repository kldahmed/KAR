import React from "react";
import { URGENCY_MAP } from "../AppHelpers";

export default function EscalationTimelinePanel({ news }) {
  const events = [...news]
    .filter(n => n.time && n.title)
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 20);

  return (
    <div style={{ background: "rgba(34,34,34,0.7)", borderRadius: "16px", padding: "18px", boxShadow: "0 2px 12px #0003", margin: "18px 0", maxWidth: "600px", width: "100%" }}>
      <div style={{ fontWeight: "bold", fontSize: "1.2rem", marginBottom: "12px" }}>تصاعد الأحداث الجيوسياسية</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {events.map((ev, idx) => (
          <li key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: URGENCY_MAP[ev.urgency]?.color || "#38bdf8", display: "inline-block" }} />
            <span style={{ fontWeight: "700", color: "#e2e8f0", fontSize: "15px" }}>{ev.title}</span>
            <span style={{ color: "#f3d38a", fontSize: "12px", marginLeft: "auto" }}>{ev.source}</span>
            <span style={{ color: "#94a3b8", fontSize: "12px" }}>{ev.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
