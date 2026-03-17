import React from "react";

const C = {
  bg:     "#080c12",
  surface:"#0c1220",
  border: "rgba(56,189,248,0.12)",
  gold:   "#f3d38a",
  blue:   "#38bdf8",
  green:  "#22c55e",
  red:    "#ef4444",
  amber:  "#f59e0b",
  purple: "#a78bfa",
  muted:  "#475569",
  text:   "#e2e8f0",
  dim:    "#1e293b",
};

const CATEGORY_META = {
  uae:        { label: "إمارات",   color: C.gold,   bg: "rgba(243,211,138,.12)" },
  economy:    { label: "اقتصاد",   color: "#34d399", bg: "rgba(52,211,153,.1)" },
  geopolitics:{ label: "جيوسياسي", color: C.purple,  bg: "rgba(167,139,250,.1)" },
  conflict:   { label: "نزاع",     color: C.red,     bg: "rgba(239,68,68,.1)" },
  politics:   { label: "سياسة",    color: C.blue,    bg: "rgba(56,189,248,.1)" },
  sports:     { label: "رياضة",    color: "#fb923c",  bg: "rgba(251,146,60,.1)" },
  regional:   { label: "إقليمي",   color: C.amber,   bg: "rgba(245,158,11,.1)" },
  analysis:   { label: "تحليل",    color: C.muted,   bg: "rgba(71,85,105,.15)" },
  world:      { label: "دولي",     color: C.muted,   bg: "rgba(71,85,105,.15)" },
};

const TIER_BADGE = {
  official: { label: "رسمي",   color: C.gold,   dot: "#f3d38a" },
  breaking: { label: "عاجل",   color: C.red,    dot: "#ef4444" },
  media:    { label: "إعلام",  color: C.blue,   dot: "#38bdf8" },
  analysis: { label: "تحليل",  color: C.muted,  dot: "#64748b" },
};

const URGENCY_BADGE = {
  high:   { label: "🔴 عاجل",   color: C.red },
  medium: { label: "🟡 مهم",    color: C.amber },
  low:    { label: "⚪ عادي",   color: C.muted },
};

function ImpactBar({ score }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 75 ? C.red : pct >= 55 ? C.amber : pct >= 35 ? C.blue : C.muted;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
      <span style={{ color: C.muted, fontSize: "11px", whiteSpace: "nowrap" }}>تأثير</span>
      <div style={{ flex: 1, height: "4px", background: C.dim, borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "2px",
          transition: "width 0.4s ease" }} />
      </div>
      <span style={{ color, fontSize: "11px", fontWeight: 700, minWidth: "28px" }}>{pct}</span>
    </div>
  );
}

export default function XPostCard({ post, compact = false }) {
  if (!post) return null;

  const cat = CATEGORY_META[post.category] || CATEGORY_META.world;
  const tier = TIER_BADGE[post.tier] || TIER_BADGE.media;
  const urg = URGENCY_BADGE[post.urgency] || URGENCY_BADGE.low;

  return (
    <article
      style={{
        background: `linear-gradient(160deg, ${C.surface}, #0a1428)`,
        border: `1px solid ${post.urgency === "high" ? "rgba(239,68,68,.25)" : C.border}`,
        borderRadius: "16px",
        padding: compact ? "14px" : "18px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        position: "relative",
        overflow: "hidden",
        boxShadow: post.urgency === "high"
          ? "0 0 0 1px rgba(239,68,68,.15), 0 8px 24px rgba(0,0,0,.3)"
          : "0 4px 16px rgba(0,0,0,.2)",
        transition: "border-color .2s, box-shadow .2s"
      }}
    >
      {/* Urgency bar on left edge */}
      {post.urgency === "high" && (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
          background: "linear-gradient(180deg, #ef4444, transparent)" }} />
      )}

      {/* Header: avatar + account + badges */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <img
          src={post.avatar || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"}
          alt={post.account}
          style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover",
            border: `2px solid ${tier.dot}`, flexShrink: 0 }}
          onError={e => { e.target.src = "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"; }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ color: C.text, fontWeight: 800, fontSize: "14px" }}>{post.account}</span>
            {post.verified && <span style={{ color: C.blue, fontSize: "13px" }}>✔</span>}
            {/* Tier badge */}
            <span style={{ background: "rgba(255,255,255,.05)", border: `1px solid ${tier.dot}33`,
              color: tier.color, fontSize: "10px", fontWeight: 700, padding: "2px 7px",
              borderRadius: "999px" }}>
              {tier.label}
            </span>
            {/* Urgency badge */}
            {post.urgency !== "low" && (
              <span style={{ color: urg.color, fontSize: "11px", fontWeight: 700 }}>{urg.label}</span>
            )}
          </div>
          <div style={{ color: C.muted, fontSize: "12px", marginTop: "2px" }}>
            {post.handle} · {post.localTimeUAE || ""}
          </div>
        </div>
        {/* Category pill */}
        <span style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.color}33`,
          fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "999px",
          whiteSpace: "nowrap", flexShrink: 0 }}>
          {cat.label}
        </span>
      </div>

      {/* Post text */}
      <p style={{ color: C.text, fontSize: "14px", lineHeight: 1.8, margin: 0,
        borderRight: `3px solid ${C.border}`, paddingRight: "12px" }}>
        {post.translated || post.text}
      </p>

      {/* Impact bar */}
      <ImpactBar score={post.impactScore || 0} />

      {/* Entities row */}
      {post.entities && post.entities.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {post.entities.slice(0, 4).map((e, i) => (
            <span key={i} style={{ background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)", color: "#94a3b8",
              fontSize: "11px", padding: "2px 8px", borderRadius: "999px" }}>
              {e.name}
            </span>
          ))}
          {post.region && (
            <span style={{ background: "rgba(56,189,248,.06)", border: "1px solid rgba(56,189,248,.12)",
              color: C.blue, fontSize: "11px", padding: "2px 8px", borderRadius: "999px" }}>
              📍 {post.region}
            </span>
          )}
        </div>
      )}

      {/* Explanation */}
      {post.explanation && (
        <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)",
          borderRadius: "8px", padding: "8px 12px" }}>
          <div style={{ color: C.muted, fontSize: "10px", fontWeight: 700, marginBottom: "3px", letterSpacing: ".05em" }}>
            لماذا هذا مهم؟
          </div>
          <div style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.6 }}>{post.explanation}</div>
        </div>
      )}

      {/* Footer: confidence + link */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <span style={{ color: C.muted, fontSize: "11px" }}>
            ثقة: <span style={{ color: post.confidenceScore >= 70 ? C.green : C.amber, fontWeight: 700 }}>
              {post.confidenceScore || 0}%
            </span>
          </span>
          <span style={{ color: C.muted, fontSize: "11px" }}>𝕏</span>
        </div>
        <a href={post.url} target="_blank" rel="noopener noreferrer"
          style={{ color: C.blue, fontSize: "12px", fontWeight: 700, textDecoration: "none",
            padding: "4px 10px", background: "rgba(56,189,248,.07)", borderRadius: "6px",
            border: "1px solid rgba(56,189,248,.15)" }}>
          فتح ↗
        </a>
      </div>
    </article>
  );
}
