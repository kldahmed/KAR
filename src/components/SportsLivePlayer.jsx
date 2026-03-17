import React, { useRef, useEffect, useState } from "react";

/**
 * SportsLivePlayer — In-page video player for sports live streams.
 * Supports YouTube embeds, official stream embeds, and fallback website links.
 */
export default function SportsLivePlayer({ channel, onClose }) {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (!channel) return null;

  const { name, nameEn, flag, streamType, streamUrl, websiteUrl } = channel;

  // Extract YouTube video/channel ID for embed
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    // Direct video ID
    const videoMatch = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (videoMatch) return `https://www.youtube.com/embed/${encodeURIComponent(videoMatch[1])}?autoplay=1&rel=0`;
    // Channel live - link to streams page
    const channelMatch = url.match(/@([^/]+)\/streams/);
    if (channelMatch) return null; // Cannot embed channel streams page directly
    return null;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  const youtubeEmbed = streamType === "youtube" ? getYouTubeEmbedUrl(streamUrl) : null;
  const canEmbed = !!youtubeEmbed;

  return (
    <div
      ref={containerRef}
      style={{
        background: "linear-gradient(135deg, #0a0f18, #111827)",
        border: "1px solid rgba(56,189,248,0.2)",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }}
    >
      {/* Player header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: "rgba(0,0,0,0.3)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>{flag}</span>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#f1f5f9" }}>{name}</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>{nameEn}</div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "20px",
              padding: "3px 10px",
              fontSize: "10px",
              fontWeight: 800,
              color: "#ef4444",
              marginInlineStart: "8px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#ef4444",
                boxShadow: "0 0 6px #ef4444",
                animation: "liveDotPlayer 1.5s ease-in-out infinite",
              }}
            />
            LIVE
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#94a3b8",
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: "14px",
            }}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? "⊡" : "⛶"}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "8px",
              color: "#ef4444",
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Video area */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%", // 16:9 ratio
          background: "#000",
        }}
      >
        {canEmbed ? (
          <iframe
            src={youtubeEmbed}
            title={nameEn}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          /* Fallback: link to official stream */
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
              background: "radial-gradient(ellipse at center, #1a2332, #0a0f18)",
            }}
          >
            <div style={{ fontSize: "48px" }}>{flag}</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#f1f5f9" }}>{name}</div>
            <div style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", maxWidth: "320px", lineHeight: 1.6 }}>
              هذه القناة متاحة عبر موقعها الرسمي.
              <br />
              اضغط الزر أدناه للمشاهدة مباشرة.
            </div>

            <a
              href={streamUrl || websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
                color: "#0c1220",
                padding: "12px 28px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 800,
                textDecoration: "none",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              ▶ شاهد على الموقع الرسمي
            </a>

            {websiteUrl && websiteUrl !== streamUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  textDecoration: "underline",
                }}
              >
                زيارة الموقع الرسمي
              </a>
            )}
          </div>
        )}
      </div>

      {/* Player controls bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "rgba(0,0,0,0.4)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            {streamType === "youtube" ? "📺 YouTube" : streamType === "hls" ? "📡 HLS" : "🌐 Official"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "11px",
                color: "#38bdf8",
                textDecoration: "none",
                background: "rgba(56,189,248,0.08)",
                padding: "4px 10px",
                borderRadius: "6px",
                border: "1px solid rgba(56,189,248,0.15)",
              }}
            >
              الموقع الرسمي ↗
            </a>
          )}
        </div>
      </div>

      <style>{`
        @keyframes liveDotPlayer {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
