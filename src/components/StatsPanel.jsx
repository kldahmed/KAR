import React from "react";
import { formatDisplayTime } from "../AppHelpers";
import { useI18n } from "../i18n/I18nProvider";

export default function StatsPanel({ news, updated }) {
  const { t } = useI18n();
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
        {t("statsPanel.title")}
      </div>
      <div style={{ fontSize: "1rem", marginBottom: "8px" }}>{t("statsPanel.total")}: {total}</div>
      <div
        style={{ color: "#e74c3c", fontWeight: "700", marginBottom: "4px" }}
      >
        {t("statsPanel.urgent")}: {high}
      </div>
      <div
        style={{ color: "#f39c12", fontWeight: "700", marginBottom: "4px" }}
      >
        {t("statsPanel.medium")}: {medium}
      </div>
      <div
        style={{ color: "#38bdf8", fontWeight: "700", marginBottom: "4px" }}
      >
        {t("statsPanel.low")}: {low}
      </div>
      <div
        style={{ fontSize: "12px", color: "#aaa", marginTop: "8px" }}
      >
        {t("statsPanel.lastUpdate")}: {formatDisplayTime(updated)}
      </div>
    </div>
  );
}
