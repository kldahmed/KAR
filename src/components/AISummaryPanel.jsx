import React from "react";

function generateSummary(news) {
  if (!news || news.length === 0) return "لا توجد بيانات كافية لتوليد ملخص اليوم.";
  const high = news.filter(n => n.urgency === "high");
  const medium = news.filter(n => n.urgency === "medium");
  const mainConflicts = high.map(n => n.title).slice(0, 3).join("، ");
  const escalation = medium.length > 5 ? "تصاعد في الأحداث الجيوسياسية في عدة مناطق." : "لا توجد تصعيدات كبيرة اليوم.";
  const diplomacy = news.some(n => n.title.includes("محادثات") || n.summary.includes("دبلوماسي")) ? "تطورات دبلوماسية جارية." : "لا توجد تطورات دبلوماسية بارزة.";
  return `ملخص اليوم: النزاعات الرئيسية: ${mainConflicts || "لا توجد نزاعات رئيسية"}. ${escalation} ${diplomacy}`;
}

export default function AISummaryPanel({ news }) {
  const summary = generateSummary(news);
  return (
    <div style={{ background: "rgba(34,34,34,0.7)", borderRadius: "16px", padding: "18px", boxShadow: "0 2px 12px #0003", margin: "18px 0", maxWidth: "600px", width: "100%" }}>
      <div style={{ fontWeight: "bold", fontSize: "1.2rem", marginBottom: "12px" }}>Global Situation Brief</div>
      <div style={{ color: "#e2e8f0", fontSize: "15px" }}>{summary}</div>
    </div>
  );
}
