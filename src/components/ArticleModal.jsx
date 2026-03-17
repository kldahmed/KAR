import React from "react";
import { formatDisplayTime } from "../AppHelpers";
import { useI18n } from "../i18n/I18nProvider";

const RELIABILITY = {
  "BBC": { score: "high", color: "#22c55e" },
  "Reuters": { score: "high", color: "#22c55e" },
  "Google News": { score: "medium", color: "#38bdf8" },
  "default": { score: "medium", color: "#f39c12" }
};

function getReliability(source) {
  if (!source) return RELIABILITY["default"];
  if (source.includes("BBC")) return RELIABILITY["BBC"];
  if (source.includes("Reuters")) return RELIABILITY["Reuters"];
  if (source.includes("Google")) return RELIABILITY["Google News"];
  return RELIABILITY["default"];
}

export default function ArticleModal({ open, onClose, article }) {
  const { t } = useI18n();
  if (!open || !article) return null;
  const { title, summary, source, time, url } = article;
  const reliability = getReliability(source);
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.7)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "#1e293b",
        color: "#e2e8f0",
        borderRadius: "16px",
        padding: "32px 24px",
        maxWidth: "480px",
        width: "90vw",
        boxShadow: "0 4px 24px #0006",
        position: "relative"
      }}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "#e74c3c", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 12px", fontWeight: "700", cursor: "pointer", fontSize: "16px" }}>×</button>
        <h2 style={{ fontSize: "1.3rem", marginBottom: "18px" }}>{title}</h2>
        <div style={{ marginBottom: "12px", color: "#cbd5e1" }}>{summary}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "18px" }}>
          <span style={{ color: "#38bdf8", fontWeight: "700" }}>{source}</span>
          <span style={{ color: "#f3d38a" }}>{formatDisplayTime(time) || time}</span>
        </div>
        <span style={{ background: reliability.color, color: "#fff", borderRadius: "6px", padding: "2px 8px", fontSize: "12px", fontWeight: "700", marginLeft: "8px" }}>
          {reliability.score === "high" ? t("news.reliabilityHigh") : t("news.reliabilityMedium")}
        </span>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ background: "#38bdf8", color: "#fff", borderRadius: "8px", padding: "10px 18px", fontWeight: "700", textDecoration: "none", display: "inline-block", marginTop: "8px" }}>
          {t("articleModal.readOriginal")}
        </a>
      </div>
    </div>
  );
}
