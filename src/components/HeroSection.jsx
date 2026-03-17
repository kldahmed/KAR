import React from "react";
import { URGENCY_MAP, getWarRiskLevel, formatDisplayTime } from "../AppHelpers";
import { useI18n } from "../i18n/I18nProvider";

export default function HeroSection({ news = [], tensionData = [] }) {
  const { t } = useI18n();
  const urgentCount = news.filter(n => n.urgency === "high").length;
  const riskLevel = getWarRiskLevel ? getWarRiskLevel(news) : null;
  const riskColor = riskLevel === "CRITICAL" ? "#e74c3c" : riskLevel === "HIGH" ? "#f39c12" : "#38bdf8";

  return (
    <div style={{ background: "linear-gradient(135deg, #0f172a 60%, #1e293b 100%)", borderRadius: "18px", padding: "32px 24px", margin: "18px 0", boxShadow: "0 4px 24px #0004", textAlign: "center" }}>
      <h1 style={{ color: "#fff", fontSize: "2rem", marginBottom: "8px", fontWeight: "800" }}>
        {t("hero.title")}
      </h1>
      <p style={{ color: "#94a3b8", fontSize: "1rem", marginBottom: "20px" }}>
        {t("hero.subtitle")}
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#e74c3c", fontSize: "2rem", fontWeight: "800" }}>{urgentCount}</div>
          <div style={{ color: "#cbd5e1", fontSize: "13px" }}>{t("hero.urgentCount")}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#38bdf8", fontSize: "2rem", fontWeight: "800" }}>{news.length}</div>
          <div style={{ color: "#cbd5e1", fontSize: "13px" }}>{t("hero.totalCount")}</div>
        </div>
        {riskLevel && (
          <div style={{ textAlign: "center" }}>
            <div style={{ color: riskColor, fontSize: "2rem", fontWeight: "800" }}>{riskLevel}</div>
            <div style={{ color: "#cbd5e1", fontSize: "13px" }}>{t("hero.riskLevel")}</div>
          </div>
        )}
      </div>
    </div>
  );
}
