import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  PLAYER_STATES,
  getInitialPlayerState,
  shouldAttemptEmbed,
  markChannelVerified,
} from "../lib/sports/sportsChannelsRegistry";

/**
 * EMBED_TIMEOUT_MS — How long to wait for an embed to succeed before
 * declaring it unavailable. YouTube "Video unavailable" pages load instantly
 * but never fire an error event, so we use postMessage + timeout detection.
 */
const EMBED_TIMEOUT_MS = 4000;

/**
 * SportsLivePlayer — Cinematic in-page broadcast player with full state machine.
 *
 * Player states:
 *   loading       — iframe is loading, spinner shown
 *   playing       — embed loaded successfully
 *   unavailable   — embed failed or timed out → premium fallback shown
 *   external-only — channel doesn't support embed at all
 *   no-stream     — no channel selected
 *
 * The player NEVER shows a broken black iframe.
 */
export default function SportsLivePlayer({ channel, onClose, isLive, currentProgram, onSelectAnother }) {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const embedTimerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playerState, setPlayerState] = useState(PLAYER_STATES.NO_STREAM);
  const [iframeKey, setIframeKey] = useState(0);
  const [embedAttempted, setEmbedAttempted] = useState(false);

  // ── Determine initial player state when channel changes ──
  useEffect(() => {
    if (!channel) {
      setPlayerState(PLAYER_STATES.NO_STREAM);
      setEmbedAttempted(false);
      return;
    }

    const initialState = getInitialPlayerState(channel, isLive);
    setPlayerState(initialState);
    setEmbedAttempted(initialState === PLAYER_STATES.LOADING);
    setIframeKey(k => k + 1);

    // Clear any pending timer
    if (embedTimerRef.current) {
      clearTimeout(embedTimerRef.current);
      embedTimerRef.current = null;
    }
  }, [channel?.id, isLive]);

  // ── Embed timeout detection ──
  // If we're in LOADING state, start a timer. If the embed doesn't report
  // success (via postMessage from YouTube API or iframe load), auto-switch
  // to fallback after EMBED_TIMEOUT_MS.
  useEffect(() => {
    if (playerState !== PLAYER_STATES.LOADING) return;

    embedTimerRef.current = setTimeout(() => {
      // Still loading after timeout — assume broken
      setPlayerState(prev => {
        if (prev === PLAYER_STATES.LOADING) {
          if (channel) markChannelVerified(channel.id, false);
          return PLAYER_STATES.UNAVAILABLE;
        }
        return prev;
      });
    }, EMBED_TIMEOUT_MS);

    return () => {
      if (embedTimerRef.current) {
        clearTimeout(embedTimerRef.current);
        embedTimerRef.current = null;
      }
    };
  }, [playerState, channel?.id]);

  // ── Listen for YouTube postMessage events to detect playback ──
  useEffect(() => {
    if (playerState !== PLAYER_STATES.LOADING || channel?.sourceType !== "youtube") return;

    const handleMessage = (event) => {
      // YouTube sends postMessage events from the embed
      if (!event.origin.includes("youtube.com")) return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        // YouTube Player API sends events with "event" === "onReady" or
        // info with playerState values. State 1 = playing, -1 = unstarted (error)
        if (data?.event === "onReady" || data?.event === "infoDelivery") {
          if (data?.info?.playerState === 1) {
            // Video is actually playing!
            setPlayerState(PLAYER_STATES.PLAYING);
            if (channel) markChannelVerified(channel.id, true);
            if (embedTimerRef.current) {
              clearTimeout(embedTimerRef.current);
              embedTimerRef.current = null;
            }
          }
        }
      } catch {
        // Not JSON or not YouTube — ignore
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [playerState, channel?.id, channel?.sourceType]);

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

  // Called when iframe fires its onLoad — for non-YouTube, this means success
  const handleIframeLoad = useCallback(() => {
    if (!channel) return;
    if (channel.sourceType !== "youtube") {
      // Non-YouTube iframes: onLoad means it worked
      setPlayerState(PLAYER_STATES.PLAYING);
      markChannelVerified(channel.id, true);
      if (embedTimerRef.current) {
        clearTimeout(embedTimerRef.current);
        embedTimerRef.current = null;
      }
    }
    // YouTube: onLoad fires even for "Video unavailable" pages, so we
    // rely on postMessage + timeout instead
  }, [channel?.id, channel?.sourceType]);

  const handleIframeError = useCallback(() => {
    setPlayerState(PLAYER_STATES.UNAVAILABLE);
    if (channel) markChannelVerified(channel.id, false);
    if (embedTimerRef.current) {
      clearTimeout(embedTimerRef.current);
      embedTimerRef.current = null;
    }
  }, [channel?.id]);

  // Retry embed
  const handleRetry = useCallback(() => {
    if (!channel || !shouldAttemptEmbed(channel, isLive)) return;
    setPlayerState(PLAYER_STATES.LOADING);
    setIframeKey(k => k + 1);
  }, [channel?.id, isLive]);

  if (!channel) return null;

  const { nameAr, nameEn, flag, logo, country, canEmbed, embedUrl, sourceType, streamUrl, officialUrl } = channel;

  // Build the embed URL with YouTube API enablement for postMessage detection
  let finalEmbedUrl = embedUrl;
  if (sourceType === "youtube" && embedUrl) {
    const sep = embedUrl.includes("?") ? "&" : "?";
    finalEmbedUrl = `${embedUrl}${sep}enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
  }

  const showEmbed = playerState === PLAYER_STATES.LOADING || playerState === PLAYER_STATES.PLAYING;
  const showFallback = playerState === PLAYER_STATES.UNAVAILABLE ||
                       playerState === PLAYER_STATES.EXTERNAL_ONLY ||
                       playerState === PLAYER_STATES.NO_STREAM;

  const sourceLabel =
    sourceType === "youtube" ? "YouTube Live" :
    sourceType === "iframe" ? "Official Embed" :
    sourceType === "hls" ? "HLS Stream" :
    "Official Website";

  // Status bar text
  const statusText =
    playerState === PLAYER_STATES.PLAYING ? "يعرض الآن داخل الصفحة" :
    playerState === PLAYER_STATES.LOADING ? "جاري تحميل البث..." :
    playerState === PLAYER_STATES.UNAVAILABLE ? "لا يتوفر بث مضمّن مباشر لهذه القناة حاليًا" :
    "البث الرسمي متاح عبر الموقع الخارجي";

  const statusColor =
    playerState === PLAYER_STATES.PLAYING ? "#4ade80" :
    playerState === PLAYER_STATES.LOADING ? "#38bdf8" :
    "#64748b";

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

          {/* Player state indicator */}
          {playerState === PLAYER_STATES.PLAYING && (
            <div style={{
              display: "inline-flex", gap: "2px", alignItems: "flex-end", height: "14px", marginInlineStart: "4px",
            }}>
              <span style={{ width: "3px", height: "10px", background: "#4ade80", borderRadius: "2px", animation: "eqBar1 0.8s ease-in-out infinite" }} />
              <span style={{ width: "3px", height: "14px", background: "#4ade80", borderRadius: "2px", animation: "eqBar2 0.8s ease-in-out infinite" }} />
              <span style={{ width: "3px", height: "8px", background: "#4ade80", borderRadius: "2px", animation: "eqBar3 0.8s ease-in-out infinite" }} />
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
              display: "none",
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
        {/* ── Embedded player (loading / playing) ── */}
        {showEmbed && (
          <>
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={finalEmbedUrl}
              title={nameEn}
              style={{
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none",
                opacity: playerState === PLAYER_STATES.PLAYING ? 1 : 1,
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />

            {/* Loading overlay — shown only while loading, hides once playing */}
            {playerState === PLAYER_STATES.LOADING && (
              <div style={{
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: "16px", background: "rgba(0,0,0,0.85)", zIndex: 2,
                pointerEvents: "none",
              }}>
                {/* Spinner */}
                <div style={{
                  width: "48px", height: "48px", borderRadius: "50%",
                  border: "3px solid rgba(56,189,248,0.2)",
                  borderTopColor: "#38bdf8",
                  animation: "playerSpin 1s linear infinite",
                }} />
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#94a3b8" }}>
                  جاري تحميل البث...
                </div>
                <div style={{ fontSize: "11px", color: "#475569" }}>
                  {nameAr} — {sourceLabel}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Premium fallback panel ── */}
        {showFallback && (
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

            {/* Channel icon */}
            <div style={{
              width: "80px", height: "80px", borderRadius: "20px",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "36px", position: "relative",
            }}>
              {logo ? (
                <img src={logo} alt="" style={{ width: "48px", height: "48px", objectFit: "contain" }}
                  onError={e => { e.target.style.display = "none"; e.target.nextSibling && (e.target.nextSibling.style.display = "block"); }} />
              ) : null}
              <span style={{ display: logo ? "none" : "block", fontSize: "36px" }}>{flag}</span>
              {isLive && <span style={{
                position: "absolute", top: "-4px", right: "-4px",
                width: "12px", height: "12px", borderRadius: "50%",
                background: "#ef4444", border: "2px solid #0a0f18",
                animation: "playerLiveDot 1.2s ease-in-out infinite",
              }} />}
            </div>

            {/* Channel name */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "#f1f5f9", marginBottom: "6px" }}>{nameAr}</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>{nameEn}</div>
            </div>

            {/* State-specific message */}
            {playerState === PLAYER_STATES.UNAVAILABLE ? (
              <div style={{
                fontSize: "13px", color: "#f97316",
                background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)",
                borderRadius: "12px", padding: "10px 20px", textAlign: "center",
                maxWidth: "400px", lineHeight: 1.7,
              }}>
                لا يتوفر بث مضمّن مباشر لهذه القناة حاليًا
              </div>
            ) : (
              <div style={{
                fontSize: "13px", color: "#94a3b8", textAlign: "center",
                maxWidth: "340px", lineHeight: 1.7,
              }}>
                لا يتوفر التضمين المباشر لهذه القناة
                <br />
                شاهد البث الرسمي عبر الأزرار أدناه
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
              {(streamUrl || officialUrl) && (
                <a href={streamUrl || officialUrl} target="_blank" rel="noopener noreferrer" style={{
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
                  ▶ المشاهدة من المصدر الرسمي
                </a>
              )}

              {onSelectAnother && (
                <button onClick={onSelectAnother} style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                  color: "#94a3b8", padding: "12px 20px", borderRadius: "12px",
                  fontSize: "13px", fontWeight: 700, cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(56,189,248,0.3)"; e.currentTarget.style.color = "#cbd5e1"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#94a3b8"; }}
                >
                  📺 اختيار قناة أخرى
                </button>
              )}

              {playerState === PLAYER_STATES.UNAVAILABLE && embedAttempted && canEmbed && (
                <button onClick={handleRetry} style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)",
                  color: "#f97316", padding: "10px 16px", borderRadius: "10px",
                  fontSize: "12px", fontWeight: 700, cursor: "pointer",
                }}>
                  🔄 إعادة المحاولة
                </button>
              )}
            </div>

            {officialUrl && officialUrl !== streamUrl && streamUrl && (
              <a href={officialUrl} target="_blank" rel="noopener noreferrer" style={{
                fontSize: "12px", color: "#475569", textDecoration: "none",
                display: "flex", alignItems: "center", gap: "4px",
                marginTop: "-6px",
              }}>
                🌐 الموقع الرسمي ↗
              </a>
            )}
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
          <span style={{
            fontSize: "11px", color: statusColor, fontWeight: 700,
            display: "flex", alignItems: "center", gap: "4px",
          }}>
            {playerState === PLAYER_STATES.PLAYING && (
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4ade80" }} />
            )}
            {playerState === PLAYER_STATES.LOADING && (
              <span style={{
                width: "5px", height: "5px", borderRadius: "50%", background: "#38bdf8",
                animation: "playerLiveDot 1s ease-in-out infinite",
              }} />
            )}
            {statusText}
          </span>
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
        @keyframes playerSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes eqBar1 { 0%,100%{height:10px} 50%{height:4px} }
        @keyframes eqBar2 { 0%,100%{height:14px} 50%{height:6px} }
        @keyframes eqBar3 { 0%,100%{height:8px} 50%{height:12px} }
        @media (min-width: 768px) {
          .player-program-badge { display: inline-block !important; }
          .player-off-label { display: inline !important; }
        }
      `}</style>
    </div>
  );
}
