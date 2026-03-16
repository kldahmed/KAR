import React from "react";
import { formatDisplayTime } from "../AppHelpers";

export default function StatsPanel({ news, updated }) {
  const total = news.length;
  const high = news.filter((n) => n.urgency === "high").length;
  const medium = news.filter((n) => n.urgency === "medium").length;
  const low = news.filter((n) => n.urgency === "low").length;
  return (
    <div
      style={{
        background: "#222",
        color: "#fff",
        borderRadius: "12px",
        padding: "18px",
        margin: "18px 0",
        boxShadow: "0 2px 8px #0002",
        maxWidth: "340px",
        width: "100%",
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: "1.2rem", marginBottom: "12px" }}>
        الإحصاءات
      </div>
      <div style={{ fontSize: "1rem", marginBottom: "8px" }}>المجموع: {total}</div>
      <div
        style={{ color: "#e74c3c", fontWeight: "700", marginBottom: "4px" }}
      >
        عاجل: {high}
      </div>
      <div
        style={{ color: "#f39c12", fontWeight: "700", marginBottom: "4px" }}
      >
        متوسط: {medium}
      </div>
      <div
        style={{ color: "#38bdf8", fontWeight: "700", marginBottom: "4px" }}
      >
        منخفض: {low}
      </div>
      <div
        style={{ fontSize: "12px", color: "#aaa", marginTop: "8px" }}
      >
        آخر تحديث: {formatDisplayTime(updated)}
      </div>
    </div>
  );
}
