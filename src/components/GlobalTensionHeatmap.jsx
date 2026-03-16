import React from "react";

const REGIONS = [
  { name: "Middle East", keywords: ["إقليمي", "سوريا", "إيران", "إسرائيل", "العراق"], color: "#e74c3c" },
  { name: "Europe", keywords: ["أوكرانيا", "روسيا", "بولندا", "أوروبا"], color: "#f39c12" },
  { name: "Red Sea", keywords: ["اليمن", "البحر الأحمر", "الحوثي"], color: "#f3d38a" },
  { name: "Asia-Pacific", keywords: ["تايوان", "الصين", "آسيا"], color: "#38bdf8" }
];

function calculateScores(news) {
  return REGIONS.map(region => {
    const score = news.filter(n => region.keywords.some(k => n.title.includes(k) || n.summary.includes(k))).length;
    return { ...region, score };
  });
}

export default function GlobalTensionHeatmap({ news }) {
  const scores = calculateScores(news);
  return (
    <div style={{ background: "rgba(34,34,34,0.7)", borderRadius: "16px", padding: "18px", boxShadow: "0 2px 12px #0003", margin: "18px 0", maxWidth: "600px", width: "100%" }}>
      <div style={{ fontWeight: "bold", fontSize: "1.2rem", marginBottom: "12px" }}>خريطة التوتر العالمي</div>
      {scores.map((region, idx) => (
        <div key={idx} style={{ marginBottom: "14px" }}>
          <div style={{ color: region.color, fontWeight: "700", fontSize: "15px", marginBottom: "4px" }}>{region.name}</div>
          <div style={{ height: "12px", background: "#333", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ width: `${Math.min(region.score * 10, 100)}%`, height: "100%", background: region.color, borderRadius: "6px" }} />
          </div>
          <div style={{ fontSize: "12px", color: "#aaa" }}>النسبة التقديرية: {Math.min(region.score * 10, 100)}%</div>
        </div>
      ))}
    </div>
  );
}
