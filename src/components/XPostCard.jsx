import React from "react";

const C = {
  surface:"#0c1220", border:"rgba(56,189,248,0.12)",
  gold:"#f3d38a", blue:"#38bdf8", green:"#22c55e",
  red:"#ef4444", amber:"#f59e0b", purple:"#a78bfa",
  muted:"#475569", text:"#e2e8f0", dim:"#1e293b",
};

const CAT_META = {
  uae:        { label:"إمارات",    color:C.gold,    bg:"rgba(243,211,138,.1)" },
  economy:    { label:"اقتصاد",    color:"#34d399",  bg:"rgba(52,211,153,.08)" },
  conflict:   { label:"نزاع",      color:C.red,      bg:"rgba(239,68,68,.08)" },
  geopolitics:{ label:"جيوسياسي", color:C.purple,   bg:"rgba(167,139,250,.08)" },
  politics:   { label:"سياسة",    color:C.blue,     bg:"rgba(56,189,248,.08)" },
  sports:     { label:"رياضة",    color:"#fb923c",   bg:"rgba(251,146,60,.08)" },
  regional:   { label:"إقليمي",   color:C.amber,    bg:"rgba(245,158,11,.08)" },
  global:     { label:"دولي",     color:C.muted,    bg:"rgba(71,85,105,.1)" },
};

function ImpactBar({ score }) {
  const pct = Math.min(100, score || 0);
  const color = pct >= 70 ? C.red : pct >= 50 ? C.amber : pct >= 30 ? C.blue : C.muted;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
      <span style={{ color:C.muted, fontSize:"11px", whiteSpace:"nowrap" }}>تأثير</span>
      <div style={{ flex:1, height:"3px", background:C.dim, borderRadius:"2px" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:"2px", transition:"width .4s" }} />
      </div>
      <span style={{ color, fontSize:"11px", fontWeight:700, minWidth:"26px" }}>{pct}</span>
    </div>
  );
}

export default function XPostCard({ post }) {
  if (!post) return null;
  const cat = CAT_META[post.category] || CAT_META.global;
  const isUrgent = post.urgency === "high";

  return (
    <article style={{
      background:`linear-gradient(160deg,${C.surface},#0a1428)`,
      border:`1px solid ${isUrgent ? "rgba(239,68,68,.25)" : C.border}`,
      borderRadius:"14px", padding:"16px",
      display:"flex", flexDirection:"column", gap:"10px",
      position:"relative", overflow:"hidden",
      boxShadow: isUrgent ? "0 0 0 1px rgba(239,68,68,.1),0 6px 20px rgba(0,0,0,.25)" : "0 3px 12px rgba(0,0,0,.18)",
    }}>
      {isUrgent && (
        <div style={{ position:"absolute", left:0, top:0, bottom:0, width:"3px",
          background:"linear-gradient(180deg,#ef4444,transparent)" }} />
      )}

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:"10px" }}>
        <div style={{
          width:"36px", height:"36px", borderRadius:"50%", flexShrink:0,
          background:C.dim, display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"15px", border:`1px solid ${isUrgent ? C.red+"44" : C.border}`
        }}>𝕏</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", flexWrap:"wrap" }}>
            <span style={{ color:C.text, fontWeight:800, fontSize:"13px" }}>{post.authorName}</span>
            {post.authorVerified && <span style={{ color:C.blue, fontSize:"12px" }}>✔</span>}
            {isUrgent && <span style={{ color:C.red, fontSize:"11px", fontWeight:700 }}>🔴 عاجل</span>}
          </div>
          <div style={{ color:C.muted, fontSize:"11px" }}>
            {post.authorHandle} · {post.localTimeUAE}
          </div>
        </div>
        <span style={{ background:cat.bg, color:cat.color, border:`1px solid ${cat.color}33`,
          fontSize:"10px", fontWeight:700, padding:"3px 8px", borderRadius:"999px",
          whiteSpace:"nowrap", flexShrink:0 }}>
          {cat.label}
        </span>
      </div>

      {/* Text */}
      <p style={{ color:C.text, fontSize:"13px", lineHeight:1.75, margin:0,
        borderRight:`3px solid ${C.border}`, paddingRight:"10px" }}>
        {post.translated || post.text}
      </p>

      {/* Impact bar */}
      <ImpactBar score={post.impactScore} />

      {/* Entities + region */}
      {(post.entities?.length > 0 || post.region) && (
        <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
          {(post.entities || []).slice(0, 3).map((e, i) => (
            <span key={i} style={{ background:"rgba(255,255,255,.03)",
              border:"1px solid rgba(255,255,255,.07)", color:"#94a3b8",
              fontSize:"10px", padding:"2px 7px", borderRadius:"999px" }}>
              {e.name}
            </span>
          ))}
          {post.region && (
            <span style={{ background:"rgba(56,189,248,.06)", border:"1px solid rgba(56,189,248,.12)",
              color:C.blue, fontSize:"10px", padding:"2px 7px", borderRadius:"999px" }}>
              📍 {post.region}
            </span>
          )}
          {post.clusterId && (
            <span style={{ background:"rgba(167,139,250,.06)", border:"1px solid rgba(167,139,250,.12)",
              color:C.purple, fontSize:"10px", padding:"2px 7px", borderRadius:"999px" }}>
              🔗 مجموعة
            </span>
          )}
        </div>
      )}

      {/* Explanation */}
      {post.explanation && (
        <div style={{ background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)",
          borderRadius:"7px", padding:"7px 10px" }}>
          <div style={{ color:C.muted, fontSize:"10px", fontWeight:700, marginBottom:"2px", letterSpacing:".04em" }}>
            لماذا مهم؟
          </div>
          <div style={{ color:"#64748b", fontSize:"11px", lineHeight:1.6 }}>{post.explanation}</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ color:C.muted, fontSize:"11px" }}>
          ثقة: <span style={{ color: post.confidence >= 65 ? C.green : C.amber, fontWeight:700 }}>
            {post.confidence}%
          </span>
        </span>
        <a href={post.url} target="_blank" rel="noopener noreferrer"
          style={{ color:C.blue, fontSize:"11px", fontWeight:700, textDecoration:"none",
            padding:"3px 10px", background:"rgba(56,189,248,.06)",
            borderRadius:"6px", border:"1px solid rgba(56,189,248,.15)" }}>
          فتح ↗
        </a>
      </div>
    </article>
  );
}
