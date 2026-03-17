import React from "react";
import { URGENCY_MAP } from "../AppHelpers";
import { useI18n } from "../i18n/I18nProvider";

const REGION_KEYWORDS = {
  middleEast: ["إيران", "إسرائيل", "غزة", "لبنان", "سوريا", "العراق", "اليمن", "السعودية"],
  europe: ["أوكرانيا", "روسيا", "أوروبا", "الناتو", "بريطانيا", "فرنسا", "ألمانيا"],
  asia: ["الصين", "تايوان", "كوريا", "اليابان", "الهند", "باكستان"],
  americas: ["أمريكا", "واشنطن", "البنتاغون", "الكونغرس", "كندا", "المكسيك"],
  africa: ["السودان", "ليبيا", "إثيوبيا", "الصومال", "نيجيريا", "مصر"],
};

function computeRegionTension(news) {
  const results = {};
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    const matched = news.filter(n =>
      keywords.some(k => (n.title || "").includes(k) || (n.summary || "").includes(k))
    );
    const high = matched.filter(n => n.urgency === "high").length;
    const medium = matched.filter(n => n.urgency === "medium").length;
    const score = high * 3 + medium * 1;
    results[region] = { count: matched.length, score, level: score > 8 ? "high" : score > 3 ? "medium" : "low" };
  }
  return results;
}

export default function TensionHeatmap({ news }) {
  const { t } = useI18n();
  const tensions = computeRegionTension(news || []);
  const levelColor = { high: "#e74c3c", medium: "#f39c12", low: "#22c55e" };

  return (
    <div style={{ background: "#222", borderRadius: "12px", padding: "18px", margin: "18px 0", maxWidth: "600px", width: "100%", boxShadow: "0 2px 8px #0002" }}>
      <div style={{ fontWeight: "bold", fontSize: "1.2rem", color: "#fff", marginBottom: "14px" }}>
        {t("tensionHeatmap.title")}
      </div>
      {Object.keys(tensions).length === 0 ? (
        <div style={{ color: "#aaa" }}>{t("tensionHeatmap.noData")}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Object.entries(tensions).map(([region, data]) => (
            <div key={region} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ color: "#e2e8f0", minWidth: "110px", fontSize: "14px" }}>
                {t(`tensionHeatmap.regions.${region}`)}
              </span>
              <div style={{ flex: 1, height: "10px", background: "#333", borderRadius: "5px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(data.score * 10, 100)}%`, height: "100%", background: levelColor[data.level], borderRadius: "5px" }} />
              </div>
              <span style={{ color: levelColor[data.level], fontWeight: "700", fontSize: "12px", minWidth: "50px", textAlign: "right" }}>
                {t(`tensionHeatmap.levels.${data.level}`)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
