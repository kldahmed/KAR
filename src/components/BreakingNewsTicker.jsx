import React, { useMemo } from "react";
import { useI18n } from "../i18n/I18nProvider";

export default function BreakingNewsTicker({
  headlines = [],
  liveCount = 0,
  statusLabel = "",
  speed = 28,
  background = "#0f172a",
  accent = "#f3d38a",
  textColor = "#f8fafc"
}) {
  const { t, direction } = useI18n();

  const sanitizeHeadline = (value = "") => {
    const clean = String(value || "")
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return "";
    if (clean.length <= 90) return clean;
    return `${clean.slice(0, 89).trim()}…`;
  };

  const safeHeadlines = useMemo(() => {
    if (!Array.isArray(headlines) || headlines.length === 0) {
      return [t("ticker.fallback")];
    }

    return headlines
      .map((item) => sanitizeHeadline(item))
      .filter(Boolean);
  }, [headlines, t]);

  const tickerItems = useMemo(() => {
    // نكرر المحتوى 3 مرات لضمان الاستمرارية
    return [...safeHeadlines, ...safeHeadlines, ...safeHeadlines];
  }, [safeHeadlines]);

  return (
    <div
      style={{
        width: "100%",
        overflow: "hidden",
        background,
        borderBottom: `1px solid ${accent}66`,
        boxShadow: "0 4px 18px rgba(0,0,0,.18)",
        position: "relative",
        zIndex: 20
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          minHeight: "52px",
          padding: "0 14px"
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(239,68,68,0.12)",
            border: `1px solid rgba(239,68,68,0.4)`,
            color: "#ef4444",
            borderRadius: "999px",
            padding: "7px 12px",
            fontWeight: 800,
            fontSize: "12px",
            letterSpacing: "1.5px",
            textTransform: "uppercase"
          }}
        >
          <span className="nr-live-dot" />
          {t("ticker.live")}
        </div>

        {liveCount > 0 ? (
          <div
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(103,232,249,0.12)",
              border: "1px solid rgba(103,232,249,0.22)",
              color: "#9be7f0",
              borderRadius: "999px",
              padding: "7px 12px",
              fontWeight: 800,
              fontSize: "12px",
            }}
          >
            {direction === "rtl" ? `${liveCount} عاجل` : `${liveCount} Breaking`}
          </div>
        ) : null}

        {statusLabel ? (
          <div
            style={{
              flexShrink: 0,
              color: "#94a3b8",
              fontSize: "11px",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {statusLabel}
          </div>
        ) : null}

        <div
          style={{
            position: "relative",
            overflow: "hidden",
            flex: 1,
            whiteSpace: "nowrap"
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              width: "max-content",
              willChange: "transform",
              animation: `ticker-marquee ${speed}s linear infinite`
            }}
          >
            {tickerItems.map((title, idx) => (
              <span
                key={`${title}-${idx}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  color: textColor,
                  fontWeight: 700,
                  fontSize: "15px",
                  letterSpacing: ".2px",
                  marginInlineEnd: "34px"
                }}
              >
                <span style={{ color: accent, marginInlineEnd: "10px" }}>•</span>
                {title}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.3333%);
          }
        }

        @keyframes ticker-pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.18);
            opacity: .75;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
