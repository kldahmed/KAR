import React from "react";

const stats = [
  { key: "conflicts", labelAr: "النزاعات النشطة", value: "34", color: "#ff3a3a", delta: "▲ +2 خلال 24 ساعة" },
  { key: "regions", labelAr: "المناطق المراقَبة", value: "187", color: "#00c8ff", delta: "تغطية عالمية" },
  { key: "streams", labelAr: "تدفقات البيانات الحية", value: "2,841", color: "#00ff9d", delta: "▼ زمن استجابة 12ms" },
  { key: "ai", labelAr: "توقعات الذكاء الاصطناعي", value: "1,204", color: "#00c8ff", delta: "دقة 94.2%" },
];

export default function ThreatStatsBar({ language = "ar" }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: "1px",
        background: "rgba(0,200,255,0.08)",
        fontFamily: "'Cairo', sans-serif",
        direction: language === "ar" ? "rtl" : "ltr",
      }}
    >
      {stats.map((s) => (
        <div
          key={s.key}
          style={{
            background: "#060d14",
            padding: "16px 22px",
            cursor: "pointer",
            transition: "background 0.3s",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,200,255,0.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#060d14")}
        >
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#4a6b7a", marginBottom: "6px" }}>
            {language === "ar" ? s.labelAr : s.key}
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 900,
              color: s.color,
              lineHeight: 1,
              direction: "ltr",
              textAlign: language === "ar" ? "right" : "left",
            }}
          >
            {s.value}
          </div>
          <div
            style={{
              fontSize: "11px",
              marginTop: "4px",
              color: s.color === "#ff3a3a" ? "#ff3a3a" : s.color === "#00ff9d" ? "#00ff9d" : "#4a6b7a",
            }}
          >
            {s.delta}
          </div>
        </div>
      ))}
    </div>
  );
}
