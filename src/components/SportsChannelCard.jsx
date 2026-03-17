import React from "react";

/**
 * SportsChannelCard — Compact channel selector card.
 * Clicking loads the stream in the in-page player (no redirect).
 */
export default function SportsChannelCard({ channel, isLive, currentProgram, onWatch, active }) {
  const { nameAr, nameEn, country, flag, logo, canEmbed, isVerifiedWorking, sourceType, playMode, streamUrl, officialUrl } = channel;
  const isPlayable = playMode === "EMBED" || playMode === "HYBRID";
  const isExternal = playMode === "EXTERNAL";

  const sourceLabel =
    sourceType === "youtube" ? "YouTube" :
    sourceType === "iframe" ? "Embed" :
    sourceType === "hls" ? "HLS" :
    "Website";

  const handleClick = () => {
    if (isExternal) {
      // External channels open in new tab directly
      const url = streamUrl || officialUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } else {
      onWatch(channel);
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter") handleClick(); }}
      style={{
        background: active
          ? "linear-gradient(135deg, #0f2237, #132a44)"
          : "linear-gradient(135deg, #111820, #0d1117)",
        border: active
          ? "1.5px solid rgba(56,189,248,0.6)"
          : "1px solid rgba(255,255,255,0.06)",
        borderRadius: "14px",
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.25s ease",
        position: "relative",
        overflow: "hidden",
        outline: "none",
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.borderColor = "rgba(56,189,248,0.35)";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(56,189,248,0.1)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {/* Active indicator bar */}
      {active && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, #38bdf8, #6366f1, #38bdf8)",
        }} />
      )}

      {/* Live top glow */}
      {isLive && !active && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "#ef4444", opacity: 0.7,
          animation: "cardLivePulse 2s ease-in-out infinite",
        }} />
      )}

      {/* Row layout: logo | info | badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Logo */}
        <div style={{
          width: "44px", height: "44px", borderRadius: "10px",
          background: "rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", flexShrink: 0,
          border: active ? "1px solid rgba(56,189,248,0.2)" : "1px solid transparent",
        }}>
          {logo ? (
            <img src={logo} alt={nameEn}
              style={{ width: "34px", height: "34px", objectFit: "contain" }}
              onError={e => { e.target.style.display = "none"; if (e.target.nextSibling) e.target.nextSibling.style.display = "flex"; }}
            />
          ) : null}
          <div style={{
            display: logo ? "none" : "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: "22px", width: "100%", height: "100%",
          }}>
            {flag || "📺"}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "13px", fontWeight: 800, color: active ? "#38bdf8" : "#e2e8f0",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {nameAr}
          </div>
          <div style={{
            fontSize: "10px", color: "#64748b", marginTop: "2px",
            display: "flex", alignItems: "center", gap: "5px",
          }}>
            <span>{flag} {country}</span>
            <span style={{ color: "#334155" }}>·</span>
            <span style={{
              color: isPlayable
                ? (isVerifiedWorking ? "#4ade80" : "#38bdf8")
                : "#64748b",
              fontWeight: isPlayable ? 700 : 400,
            }}>
              {isPlayable
                ? (isVerifiedWorking ? "✓ يعمل داخل الموقع" : "▶ بث داخل الموقع")
                : "↗ مصدر خارجي"
              }
            </span>
          </div>

          {/* Current program */}
          {currentProgram && (
            <div style={{
              fontSize: "10px", color: "#94a3b8", marginTop: "3px",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              📺 {currentProgram}
            </div>
          )}
        </div>

        {/* Right side: badges */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
          {isLive && (
            <div style={{
              display: "flex", alignItems: "center", gap: "4px",
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "12px", padding: "2px 8px",
            }}>
              <span style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: "#ef4444", boxShadow: "0 0 5px #ef4444",
                animation: "cardDotPulse 1.2s ease-in-out infinite",
              }} />
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#ef4444" }}>LIVE</span>
            </div>
          )}
          <span style={{
            fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
            color: sourceType === "youtube" ? "#ef4444" : "#38bdf8",
            background: sourceType === "youtube" ? "rgba(239,68,68,0.1)" : "rgba(56,189,248,0.08)",
          }}>
            {sourceLabel}
          </span>
        </div>
      </div>

      {/* Active = playing indicator (only for playable channels) */}
      {active && isPlayable && (
        <div style={{
          marginTop: "10px", textAlign: "center",
          fontSize: "11px", fontWeight: 700, color: "#38bdf8",
          background: "rgba(56,189,248,0.06)", borderRadius: "8px", padding: "5px 0",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
        }}>
          <span style={{
            display: "inline-flex", gap: "2px",
          }}>
            <span style={{ width: "3px", height: "10px", background: "#38bdf8", borderRadius: "2px", animation: "eqBar1 0.8s ease-in-out infinite" }} />
            <span style={{ width: "3px", height: "14px", background: "#38bdf8", borderRadius: "2px", animation: "eqBar2 0.8s ease-in-out infinite" }} />
            <span style={{ width: "3px", height: "8px", background: "#38bdf8", borderRadius: "2px", animation: "eqBar3 0.8s ease-in-out infinite" }} />
          </span>
          يعرض الآن
        </div>
      )}

      {/* External channel action hint */}
      {isExternal && (
        <div style={{
          marginTop: "10px", textAlign: "center",
          fontSize: "11px", fontWeight: 700, color: "#64748b",
          background: "rgba(148,163,184,0.06)", borderRadius: "8px", padding: "5px 0",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
        }}>
          🌐 مشاهدة من المصدر الرسمي ↗
        </div>
      )}

      <style>{`
        @keyframes cardLivePulse { 0%,100%{opacity:.7} 50%{opacity:.3} }
        @keyframes cardDotPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:.5} }
        @keyframes eqBar1 { 0%,100%{height:10px} 50%{height:4px} }
        @keyframes eqBar2 { 0%,100%{height:14px} 50%{height:6px} }
        @keyframes eqBar3 { 0%,100%{height:8px} 50%{height:12px} }
      `}</style>
    </div>
  );
}
