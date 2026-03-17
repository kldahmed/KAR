import React from "react";
import { URGENCY_MAP } from "../AppHelpers";
import { useI18n } from "../i18n/I18nProvider";

function calculateRisk(news) {
  const counts = { high: 0, medium: 0, low: 0 };
  news.forEach(n => {
    if (n.urgency === "high") counts.high++;
    else if (n.urgency === "medium") counts.medium++;
    else counts.low++;
  });
  const total = counts.high + counts.medium + counts.low;
  let level = "LOW";
  let percent = 0;
  if (counts.high > 10) { level = "CRITICAL"; percent = 90; }
  else if (counts.high > 5) { level = "HIGH"; percent = 70; }
  else if (counts.medium > 10) { level = "MEDIUM"; percent = 50; }
  else { level = "LOW"; percent = 20; }
  return { level, percent, counts, total };
}

export default function WarRiskPanel({ news }) {
  const { t } = useI18n();
  const { level, percent } = calculateRisk(news);
  const color = level === "CRITICAL" ? "#e74c3c" : level === "HIGH" ? "#f39c12" : level === "MEDIUM" ? "#38bdf8" : "#22c55e";
  return (
    <div style={{ background: "#222", color: "#fff", borderRadius: "12px", padding: "18px", margin: "18px 0", boxShadow: "0 2px 8px #0002", maxWidth: "340px", width: "100%" }}>
      <div style={{ fontWeight: "bold", fontSize: "1.2rem", marginBottom: "12px" }}>{t("warRisk.title")}</div>
      <div style={{ fontSize: "1.1rem", color, fontWeight: "700", marginBottom: "8px" }}>{level}</div>
      <div style={{ height: "12px", background: "#333", borderRadius: "6px", marginBottom: "8px", overflow: "hidden" }}>
        <div style={{ width: `${percent}%`, height: "100%", background: color, borderRadius: "6px" }} />
      </div>
      <div style={{ fontSize: "12px", color: "#aaa" }}>{t("warRisk.estimatedPercent")}: {percent}%</div>
    </div>
  );
}
