import React, { useRef, useEffect, useState, useCallback } from "react";

/**
 * SportsLivePlayer — Cinematic in-page broadcast player.
 * Embeds YouTube live streams, official iframes, or shows a premium fallback.
 * Always stays on the same page — no redirects.
 */
export default function SportsLivePlayer({ channel, onClose, isLive, currentProgram }) {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0); // force remount on channel switch

  // Reset error + remount iframe when channel changes
  useEffect(() => {
    setPlayerError(false);
    setIframeKey(k => k + 1);
  }, [channel?.id]);

  useEffect(() => {
    const onFS = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFS);
    return () => document.removeEventListener("fullscreenchange", onFS);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  if (!channel) return null;

  const { nameAr, nameEn, flag, logo, country, canEmbed, embedUrl, sourceType, streamUrl, officialUrl } = channel;

  const showEmbed = canEmbed && embedUrl && !playerError;

  const sourceLabel =
    sourceType === "youtube" ? "YouTube Live" :
    sourceType === "iframe" ? "Official Embed" :
    sourceType === "hls" ? "HLS Stream" :
    "Official Website";

  return (
    <div
      ref={containerRef}
      style={{
        background: "#000",
        borderRadius: isFullscreen ? 0 : "20px",
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(56,189,248,0.15)",
        position: "relative",
      }}
    >
      {/* ── Top accent line ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "3px", zIndex: 10,
        background: isLive
          ? "linear-gradient(90deg, #ef4444, #f97316, #ef4444)"
          : "linear-gradient(90deg, #38bdf8, #6366f1, #38bdf8)",
        animation: isLive ? "playerAccent 3s linear infinite" : "none",
        backgroundSize: "200% 100%",
      }} />

      {/* ── Header bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px",
        background: "linear-gradient(180deg, rgba(15,23,42,0.95), rgba(15,23,42,0.85))",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative", zIndex: 5,
      }}>
        {/* Left: channel info */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          {/* Logo */}
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: "rgba(255,255,255,0.08)", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {logo ? (
              <img src={logo} alt="" style={{ width: "32px", height: "32px", objectFit: "contain" }}
                onError={e => { e.target.style.display = "none"; }} />
            ) : (
              <span style={{ fontSize: "20px" }}>{flag}</span>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {nameAr}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
              {flag} {country}
              <span style={{ color: "#475569" }}>•</span>
              <span style={{ color: sourceType === "youtube" ? "#ef4444" : "#38bdf8" }}>{sourceLabel}</span>
            </div>
          </div>

          {/* LIVE badge */}
          {isLive && (
            <div style={{
              display: "flex", alignItems: "center", gap: "5px",
              background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: "20px", padding: "4px 12px", marginInlineStart: "4px",
            }}>
              <span style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#ef4444", boxShadow: "0 0 8px #ef4444",
                animation: "playerLiveDot 1.2s ease-in-out infinite",
              }} />
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#ef4444", letterSpacing: "0.5px" }}>LIVE</span>
            </div>
          )}
        </div>

        {/* Right: controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {currentProgram && (
            <span style={{
              fontSize: "11px", color: "#94a3b8",
              background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "6px",
              maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              display: "none", // hide on mobile
            }} className="player-program-badge">
              📺 {currentProgram}
            </span>
          )}

          {officialUrl && (
            <a href={officialUrl} target="_blank" rel="noopener noreferrer" style={{
              fontSize: "11px", color: "#64748b", textDecoration: "none",
              background: "rgba(255,255,255,0.05)", padding: "6px 10px", borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "4px",
            }}>
              🌐 <span style={{ display: "none" }} className="player-off-label">الموقع</span>↗
            </a>
          )}

          <button onClick={toggleFullscreen} style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px", color: "#cbd5e1", padding: "6px 10px", cursor: "pointer", fontSize: "15px",
          }} title="ملء الشاشة">
            {isFullscreen ? "⊡" : "⛶"}
          </button>

          <button onClick={onClose} style={{
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "8px", color: "#ef4444", padding: "6px 12px", cursor: "pointer",
            fontSize: "15px", fontWeight: 800, lineHeight: 1,
          }} title="إغلاق">
            ✕
          </button>
        </div>
      </div>

      {/* ── Video area — 16:9 ── */}
      <div style={{
        position: "relative", width: "100%", paddingTop: "56.25%", background: "#000",
      }}>
        {showEmbed ? (
          <iframe
            key={iframeKey}
            src={embedUrl}
            title={nameEn}
            style={{
              position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setPlayerError(true)}
          />
        ) : (
          /* ── Premium fallback — non-embeddable channel ── */
          <div style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "18px",
            background: "radial-gradient(ellipse at 50% 40%, #1a2636 0%, #0a0f18 100%)",
          }}>
            {/* Scan lines effect */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.03,
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)",
            }} />

            <div style={{
              width: "80px", height: "80px", borderRadius: "20px",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "36px", position: "relative",
            }}>
              {flag}
              {isLive && <span style={{
                position: "absolute", top: "-4px", right: "-4px",
                width: "12px", height: "12px", borderRadius: "50%",
                background: "#ef4444", border: "2px solid #0a0f18",
                animation: "playerLiveDot 1.2s ease-in-out infinite",
              }} />}
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "#f1f5f9", marginBottom: "6px" }}>{nameAr}</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>{nameEn}</div>
            </div>

            {playerError ? (
              <div style={{
                fontSize: "13px", color: "#f97316",
                background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)",
                borderRadius: "10px", padding: "8px 18px",
              }}>
                ⚠ تعذر تحميل البث — يمكنك المشاهدة عبر الموقع الرسمي
              </div>
            ) : (
              <div style={{
                fontSize: "13px", color: "#94a3b8", textAlign: "center",
                maxWidth: "340px", lineHeight: 1.7,
              }}>
                لا يتوفر تضمين مباشر لهذه القناة
                <br />
                شاهد البث الرسمي عبر الأزرار أدناه
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
              {streamUrl && (
                <a href={streamUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  background: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
                  color: "#0c1220", padding: "12px 24px", borderRadius: "12px",
                  fontSize: "14px", fontWeight: 800, textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(56,189,248,0.25)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  ▶ شاهد البث الرسمي
                </a>
              )}
              {officialUrl && officialUrl !== streamUrl && (
                <a href={officialUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                  color: "#94a3b8", padding: "12px 20px", borderRadius: "12px",
                  fontSize: "13px", fontWeight: 700, textDecoration: "none",
                }}>
                  🌐 الموقع الرسمي
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 20px",
        background: "linear-gradient(180deg, rgba(15,23,42,0.85), rgba(15,23,42,0.95))",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {showEmbed && (
            <span style={{
              fontSize: "11px", color: "#4ade80", fontWeight: 700,
              display: "flex", alignItems: "center", gap: "4px",
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4ade80" }} />
              يعرض الآن داخل الصفحة
            </span>
          )}
          {!showEmbed && (
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              البث الرسمي متاح عبر الموقع الخارجي
            </span>
          )}
        </div>

        {currentProgram && (
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
            📺 {currentProgram}
          </span>
        )}
      </div>

      <style>{`
        @keyframes playerLiveDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.4; }
        }
        @keyframes playerAccent {
          0% { background-position: 0% 0%; }
          100% { background-position: -200% 0%; }
        }
        @media (min-width: 768px) {
          .player-program-badge { display: inline-block !important; }
          .player-off-label { display: inline !important; }
        }
      `}</style>
    </div>
  );
}
