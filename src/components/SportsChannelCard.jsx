import React from "react";

/**
 * SportsChannelCard — Premium card for a sports TV channel.
 * Displays logo, name, country, live status, and watch button.
 */
export default function SportsChannelCard({ channel, isLive, currentProgram, onWatch, active }) {
  const {
    name,
    nameEn,
    country,
    flag,
    logo,
    type,
    streamType,
  } = channel;

  const sourceLabel =
    streamType === "youtube" ? "YouTube" :
    streamType === "hls" ? "HLS Stream" :
    "Official Stream";

  return (
    <div
      onClick={() => onWatch(channel)}
      style={{
        background: active
          ? "linear-gradient(135deg, #1a2636, #0f1c2c)"
          : "linear-gradient(135deg, #141a22, #0d1117)",
        border: active
          ? "1.5px solid rgba(56,189,248,0.5)"
          : "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        padding: "20px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
        minWidth: "220px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(56,189,248,0.4)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(56,189,248,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = active ? "rgba(56,189,248,0.5)" : "rgba(255,255,255,0.06)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Live indicator glow */}
      {isLive && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, #ef4444, #f97316, #ef4444)",
            borderRadius: "16px 16px 0 0",
            animation: "livePulse 2s ease-in-out infinite",
          }}
        />
      )}

      {/* Header: Logo + Live badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {logo ? (
            <img
              src={logo}
              alt={nameEn}
              style={{ width: "44px", height: "44px", objectFit: "contain" }}
              onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
            />
          ) : null}
          <div
            style={{
              display: logo ? "none" : "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              width: "100%",
              height: "100%",
            }}
          >
            {flag || "📺"}
          </div>
        </div>

        {isLive && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "20px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: 800,
              color: "#ef4444",
              animation: "liveGlow 2s ease-in-out infinite",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#ef4444",
                boxShadow: "0 0 6px #ef4444",
                animation: "liveDot 1.5s ease-in-out infinite",
              }}
            />
            بث مباشر
          </div>
        )}
      </div>

      {/* Channel name */}
      <div style={{ marginBottom: "6px" }}>
        <div style={{ fontSize: "15px", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.3 }}>
          {name}
        </div>
        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
          {nameEn}
        </div>
      </div>

      {/* Country + Source */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            color: "#94a3b8",
            background: "rgba(255,255,255,0.04)",
            padding: "3px 8px",
            borderRadius: "6px",
          }}
        >
          {flag} {country}
        </span>
        <span
          style={{
            fontSize: "10px",
            color: streamType === "youtube" ? "#ef4444" : "#38bdf8",
            background: streamType === "youtube" ? "rgba(239,68,68,0.1)" : "rgba(56,189,248,0.08)",
            border: `1px solid ${streamType === "youtube" ? "rgba(239,68,68,0.2)" : "rgba(56,189,248,0.15)"}`,
            padding: "2px 7px",
            borderRadius: "6px",
            fontWeight: 700,
          }}
        >
          {sourceLabel}
        </span>
      </div>

      {/* Current program */}
      {currentProgram && (
        <div
          style={{
            fontSize: "11px",
            color: "#cbd5e1",
            background: "rgba(56,189,248,0.06)",
            border: "1px solid rgba(56,189,248,0.1)",
            borderRadius: "8px",
            padding: "6px 10px",
            marginBottom: "10px",
          }}
        >
          📺 {currentProgram}
        </div>
      )}

      {/* Watch button */}
      <button
        onClick={(e) => { e.stopPropagation(); onWatch(channel); }}
        style={{
          width: "100%",
          padding: "9px 0",
          borderRadius: "10px",
          border: "none",
          background: active
            ? "linear-gradient(135deg, #38bdf8, #0ea5e9)"
            : "linear-gradient(135deg, rgba(56,189,248,0.15), rgba(56,189,248,0.08))",
          color: active ? "#0c1220" : "#38bdf8",
          fontSize: "13px",
          fontWeight: 800,
          cursor: "pointer",
          transition: "all 0.2s ease",
          letterSpacing: "0.3px",
        }}
      >
        {active ? "● يعرض الآن" : "▶ شاهد مباشرة"}
      </button>

      {/* CSS Animations */}
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes liveGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(239,68,68,0.3); }
          50% { box-shadow: 0 0 16px rgba(239,68,68,0.5); }
        }
        @keyframes liveDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
