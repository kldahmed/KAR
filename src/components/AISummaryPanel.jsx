import React from "react";
import { useI18n } from "../i18n/I18nProvider";

function generateSummary(news, t) {
  if (!news || news.length === 0) return t("aiSummary.noData");
  const high = news.filter(n => n.urgency === "high");
  const medium = news.filter(n => n.urgency === "medium");
  const mainConflicts = high.map(n => n.title).slice(0, 3).join("، ");
  const escalation = medium.length > 5 ? t("aiSummary.escalationHigh") : t("aiSummary.escalationLow");
  const diplomacy = news.some(n => n.title.includes("محادثات") || n.summary.includes("دبلوماسي")) ? t("aiSummary.diplomacyActive") : t("aiSummary.diplomacyNone");
  return `${t("aiSummary.summaryPrefix")}: ${mainConflicts || t("aiSummary.noMainConflicts")}. ${escalation} ${diplomacy}`;
}

export default function AISummaryPanel({ news }) {
  const { t } = useI18n();
  const summary = generateSummary(news, t);
  return (
    <div style={{ background: "rgba(34,34,34,0.7)", borderRadius: "16px", padding: "18px", boxShadow: "0 2px 12px #0003", margin: "18px 0", maxWidth: "600px", width: "100%" }}>
      <div style={{ fontWeight: "bold", fontSize: "1.2rem", marginBottom: "12px" }}>{t("aiSummary.title")}</div>
      <div style={{ color: "#e2e8f0", fontSize: "15px" }}>{summary}</div>
    </div>
  );
}
