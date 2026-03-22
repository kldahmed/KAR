import React from "react";
import GlobeVisualization from "./GlobeVisualization";

/**
 * EyeViewer — Large eye frame containing the interactive globe
 * Metaphor: "World Eye" — the iris contains the living globe
 */
export default function EyeViewer({ worldState, language = "ar" }) {
  const isAr = language === "ar";

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {/* Eye Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "560px",
          aspectRatio: "1",
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, rgba(30,41,59,0.8), rgba(15,23,42,0.95))",
          border: "12px solid #f1f5f9",
          boxShadow: `
            0 0 60px rgba(103,232,249,0.2),
            inset 0 0 40px rgba(15,23,42,0.8),
            0 20px 60px rgba(0,0,0,0.6)
          `,
          overflow: "hidden",
        }}
      >
        {/* Iris/Pupil Glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "radial-gradient(circle at 40% 40%, rgba(103,232,249,0.15), transparent)",
            pointerEvents: "none",
          }}
        />

        {/* Globe */}
        <GlobeVisualization worldState={worldState} language={language} />

        {/* Eye Shine */}
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "20%",
            width: "30%",
            aspectRatio: "1",
            borderRadius: "50%",
            background: "radial-gradient(circle at center, rgba(255,255,255,0.3), transparent)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Info Panel Below Eye */}
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          padding: "16px 20px",
          background: "rgba(15, 23, 42, 0.5)",
          border: "1px solid rgba(103, 232, 249, 0.2)",
          borderRadius: 12,
          textAlign: "center",
        }}
      >
        <div style={{ color: "#67e8f9", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
          {isAr ? "عين العالم" : "WORLD EYE"}
        </div>
        <p style={{ color: "#cbd5e1", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
          {isAr
            ? "قم بتدوير الكرة الأرضية لاستكشاف البيانات • النقاط الحمراء = أحداث عاجلة • النقاط البرتقالية = مناطق توتر"
            : "Drag to explore • Red = breaking events • Orange = tension zones"}
        </p>
      </div>

      {/* Legend */}
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            background: "rgba(248, 113, 113, 0.1)",
            border: "1px solid rgba(248, 113, 113, 0.3)",
            borderRadius: 8,
          }}
        >
          <div style={{ color: "#f87171", fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
            {isAr ? "حدث عاجل" : "Breaking Event"}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>
            {worldState?.strategicSummary?.topGlobalEvents?.length || 0} {isAr ? "أحداث" : "events"}
          </div>
        </div>
        <div
          style={{
            padding: "12px 14px",
            background: "rgba(251, 146, 60, 0.1)",
            border: "1px solid rgba(251, 146, 60, 0.3)",
            borderRadius: 8,
          }}
        >
          <div style={{ color: "#fb923c", fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
            {isAr ? "منطقة توتر" : "Tension Zone"}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>
            {worldState?.strategicSummary?.regionsWithHighestTension?.length || 0} {isAr ? "مناطق" : "regions"}
          </div>
        </div>
      </div>
    </div>
  );
}
