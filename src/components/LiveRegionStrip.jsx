import React from "react";
import { useI18n } from "../i18n/I18nProvider";

const REGIONS = [
  { id: "me",   key: "me",   flag: "🌍", color: "#f3d38a" },
  { id: "eu",   key: "eu",   flag: "🇪🇺", color: "#38bdf8" },
  { id: "na",   key: "na",   flag: "🌎", color: "#60a5fa" },
  { id: "asia", key: "asia", flag: "🌏", color: "#a78bfa" },
  { id: "mkt",  key: "mkt",  flag: "📊", color: "#34d399" },
  { id: "spt",  key: "spt",  flag: "⚽", color: "#fb923c" },
  { id: "live", key: "live", flag: "📺", color: "#ef4444" },
];

export default function LiveRegionStrip() {
  const { t } = useI18n();

  return (
    <div
      style={{
        width: "100%",
        background: "rgba(11,13,16,0.85)",
        borderBottom: "1px solid rgba(56,189,248,0.08)",
        overflowX: "auto",
        scrollbarWidth: "none",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          padding: "6px 14px",
          width: "max-content",
          minWidth: "100%",
        }}
      >
        {/* GLOBAL label */}
        <span
          style={{
            fontSize: "10px",
            fontWeight: 800,
            color: "#475569",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            marginInlineEnd: "10px",
            flexShrink: 0,
          }}
        >
          {t("strip.global")}
        </span>

        {REGIONS.map((r, i) => (
          <React.Fragment key={r.id}>
            {i > 0 && (
              <span style={{ color: "#27303a", fontSize: "11px", margin: "0 2px" }}>│</span>
            )}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                borderRadius: "999px",
                background: `${r.color}10`,
                border: `1px solid ${r.color}22`,
                flexShrink: 0,
              }}
            >
              <span
                className="nr-live-dot"
                style={{ background: r.color, boxShadow: `0 0 6px ${r.color}` }}
              />
              <span style={{ fontSize: "12px" }}>{r.flag}</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: r.color,
                  fontFamily: "inherit",
                }}
              >
                {t(`strip.regions.${r.key}`)}
              </span>
            </div>
          </React.Fragment>
        ))}

        {/* Right side: live indicator */}
        <span
          style={{
            marginInlineStart: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "2px 10px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "999px",
            flexShrink: 0,
          }}
        >
          <span className="nr-live-dot" />
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#ef4444", letterSpacing: "1px" }}>
            {t("strip.live")}
          </span>
        </span>
      </div>
    </div>
  );
}
