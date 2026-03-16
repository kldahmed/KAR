import React from "react";

function calculateRisk(news) {
  const high = news.filter(n => n.urgency === "high").length;
  const escalation = news.filter(n => n.summary.includes("تصعيد") || n.title.includes("تصعيد")).length;
  let level = "LOW";
  let percent = 0;
  if (high > 15 || escalation > 10) { level = "CRITICAL"; percent = 90; }
  else if (high > 8 || escalation > 5) { level = "HIGH"; percent = 70; }
  else if (high > 3 || escalation > 2) { level = "ELEVATED"; percent = 40; }
  else { level = "LOW"; percent = 15; }
  return { level, percent };
}

export default function GlobalRiskMeter({ news }) {
  const { level, percent } = calculateRisk(news);
  const color = level === "CRITICAL" ? "#e74c3c" : level === "HIGH" ? "#f39c12" : level === "ELEVATED" ? "#38bdf8" : "#22c55e";
  return (
    <div style={{ background: "rgba(34,34,34,0.7)", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px #0003", margin: "18px 0", maxWidth: "600px", width: "100%" }}>
      <div style={{ fontWeight: "bold", fontSize: "1.4rem", marginBottom: "18px" }}>GLOBAL WAR RISK</div>
      <div style={{ fontSize: "1.2rem", color, fontWeight: "700", marginBottom: "12px" }}>{level}</div>
      <div style={{ height: "18px", background: "#333", borderRadius: "9px", marginBottom: "12px", overflow: "hidden" }}>
        <div style={{ width: `${percent}%`, height: "100%", background: color, borderRadius: "9px", transition: "width .3s" }} />
      </div>
      <div style={{ fontSize: "13px", color: "#aaa" }}>النسبة التقديرية: {percent}%</div>
    </div>
  );
}
