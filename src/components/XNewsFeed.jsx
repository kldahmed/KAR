import React, { useEffect, useRef, useState, useMemo } from "react";
import XPostCard from "./XPostCard";

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

const INTEL_TABS = [
  { id: "priority", label: "الأعلى أولوية",  icon: "🎯" },
  { id: "urgent",   label: "عاجل",           icon: "🔴" },
  { id: "verified", label: "رسمي وموثق",     icon: "✔" },
  { id: "uae",      label: "إماراتي",        icon: "🇦🇪" },
  { id: "economy",  label: "اقتصاد",         icon: "📊" },
  { id: "sports",   label: "رياضة",          icon: "⚽" },
  { id: "geopolitics", label: "جيوسياسي",   icon: "🌍" },
  { id: "all",      label: "جميع الإشارات", icon: "📡" },
];

// ── Signal Priority Bar ───────────────────────────────────────────────────────
function SignalPriorityStrip({ signals }) {
  if (!signals || signals.length === 0) return null;
  return (
    <div style={{
      background: "linear-gradient(135deg, #0a0f1a, #0d1628)",
      border: "1px solid rgba(239,68,68,.2)",
      borderRadius: "16px",
      padding: "20px 24px",
      marginBottom: "4px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.red,
          boxShadow: `0 0 8px ${C.red}`, animation: "pulse 1.5s infinite" }} />
        <span style={{ color: C.gold, fontWeight: 800, fontSize: "15px", letterSpacing: ".04em" }}>
          X Signal Priority
        </span>
        <span style={{ color: C.muted, fontSize: "12px" }}>— أقوى الإشارات الحالية</span>
      </div>
      <div style={{ display: "grid", gap: "10px" }}>
        {signals.slice(0, 5).map((sig, i) => (
          <div key={sig.id || i} style={{
            display: "flex", alignItems: "flex-start", gap: "12px",
            background: "rgba(255,255,255,.03)", borderRadius: "10px",
            padding: "10px 14px", border: "1px solid rgba(255,255,255,.05)"
          }}>
            {/* Rank number */}
            <div style={{ color: i === 0 ? C.gold : C.muted, fontWeight: 900,
              fontSize: "18px", lineHeight: 1, minWidth: "20px" }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.text, fontSize: "13px", lineHeight: 1.7,
                display: "-webkit-box", WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {sig.text}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                <span style={{ color: C.muted, fontSize: "11px" }}>{sig.account}</span>
                {sig.region && (
                  <span style={{ color: C.blue, fontSize: "11px" }}>📍 {sig.region}</span>
                )}
                <span style={{ color: C.muted, fontSize: "11px" }}>
                  تأثير: <span style={{ color: sig.impactScore >= 70 ? C.red : C.amber,
                    fontWeight: 700 }}>{sig.impactScore}</span>
                </span>
              </div>
              {sig.explanation && (
                <div style={{ color: "#64748b", fontSize: "11px", marginTop: "3px" }}>
                  {sig.explanation}
                </div>
              )}
            </div>
            {/* Impact indicator */}
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
              border: `2px solid ${sig.impactScore >= 75 ? C.red : sig.impactScore >= 55 ? C.amber : C.blue}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: sig.impactScore >= 75 ? C.red : sig.impactScore >= 55 ? C.amber : C.blue,
              fontSize: "11px", fontWeight: 800
            }}>
              {sig.impactScore}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Intel Stats Bar ───────────────────────────────────────────────────────────
function IntelStatsBar({ posts, live, updated }) {
  const high = posts.filter(p => p.urgency === "high").length;
  const verified = posts.filter(p => p.verified).length;
  const sources = new Set(posts.map(p => p.handle)).size;

  return (
    <div style={{
      display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center",
      padding: "12px 20px",
      background: "rgba(255,255,255,.025)",
      border: "1px solid rgba(255,255,255,.06)",
      borderRadius: "12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%",
          background: live ? C.green : C.muted }} />
        <span style={{ color: live ? C.green : C.muted, fontSize: "12px", fontWeight: 700 }}>
          {live ? "بث مباشر" : "بيانات محلية"}
        </span>
      </div>
      <Stat label="إشارات" value={posts.length} color={C.blue} />
      <Stat label="عاجل" value={high} color={C.red} />
      <Stat label="موثق" value={verified} color={C.green} />
      <Stat label="مصادر" value={sources} color={C.purple} />
      {updated && (
        <span style={{ color: C.muted, fontSize: "11px", marginRight: "auto" }}>
          {updated}
        </span>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: "flex", gap: "5px", alignItems: "baseline" }}>
      <span style={{ color, fontWeight: 800, fontSize: "15px" }}>{value}</span>
      <span style={{ color: C.muted, fontSize: "11px" }}>{label}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function XNewsFeed() {
  const [posts, setPosts] = useState([]);
  const [intelligenceLayer, setIntelligenceLayer] = useState(null);
  const [updated, setUpdated] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("priority");
  const intervalRef = useRef(null);

  const fetchPosts = () => {
    setLoading(true);
    fetch("/api/x-feed")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setPosts(Array.isArray(data.posts) ? data.posts : []);
        setIntelligenceLayer(data.intelligenceLayer || null);
        setIsLive(!!data.live);
        if (data.updated) {
          try {
            setUpdated(new Intl.DateTimeFormat("ar-AE", {
              timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit", hour12: false
            }).format(new Date(data.updated)) + " (توقيت الإمارات)");
          } catch { setUpdated(data.updated); }
        }
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
    intervalRef.current = setInterval(fetchPosts, 45000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const displayedPosts = useMemo(() => {
    if (!posts.length) return [];
    const layer = intelligenceLayer;

    switch (activeTab) {
      case "priority":
        return [...posts].sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0)).slice(0, 30);
      case "urgent":
        return (layer?.urgent || posts.filter(p => p.urgency === "high"))
          .sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0));
      case "verified":
        return (layer?.verified || posts.filter(p => p.verified))
          .sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0));
      case "uae":
        return (layer?.uae || posts.filter(p => p.category === "uae"))
          .sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0));
      case "economy":
        return (layer?.economy || posts.filter(p => p.category === "economy"))
          .sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0));
      case "sports":
        return (layer?.sports || posts.filter(p => p.category === "sports"))
          .sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0));
      case "geopolitics":
        return (layer?.geopolitics || posts.filter(p =>
          ["geopolitics", "conflict", "regional"].includes(p.category)))
          .sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0));
      case "all":
      default:
        return [...posts];
    }
  }, [posts, intelligenceLayer, activeTab]);

  const topSignals = intelligenceLayer?.topSignals || [];

  return (
    <section style={{ maxWidth: "1400px", margin: "0 auto", display: "grid", gap: "20px" }}>

      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
          <span style={{ color: "#f8fafc", fontSize: "28px", fontWeight: 900 }}>نبض 𝕏</span>
          <span style={{
            background: "rgba(239,68,68,.12)", color: C.red,
            border: "1px solid rgba(239,68,68,.2)",
            fontSize: "11px", fontWeight: 800, padding: "3px 10px", borderRadius: "999px",
            letterSpacing: ".05em"
          }}>
            INTELLIGENCE ENGINE
          </span>
          {loading && (
            <span style={{ color: C.muted, fontSize: "12px" }}>جاري التحديث…</span>
          )}
        </div>
        <p style={{ color: C.muted, fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
          محرك استخباراتي حي يصنف كل إشارة حسب المصدر والتأثير والكيانات والمنطقة
        </p>
      </div>

      {/* Stats bar */}
      <IntelStatsBar posts={posts} live={isLive} updated={updated} />

      {/* X Signal Priority strip */}
      {topSignals.length > 0 && <SignalPriorityStrip signals={topSignals} />}

      {/* Category intelligence tabs */}
      <div style={{
        display: "flex", gap: "8px", flexWrap: "wrap",
        background: "rgba(255,255,255,.02)",
        border: "1px solid rgba(255,255,255,.05)",
        borderRadius: "12px",
        padding: "10px 14px"
      }}>
        {INTEL_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id
                ? "linear-gradient(135deg, rgba(56,189,248,.2), rgba(56,189,248,.08))"
                : "transparent",
              color: activeTab === tab.id ? C.blue : C.muted,
              border: activeTab === tab.id
                ? "1px solid rgba(56,189,248,.3)"
                : "1px solid transparent",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: activeTab === tab.id ? 800 : 600,
              cursor: "pointer",
              transition: "all .2s",
              display: "flex", gap: "5px", alignItems: "center"
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {/* Show count badge for non-"all" tabs */}
            {tab.id !== "all" && intelligenceLayer && (() => {
              const counts = {
                priority: posts.length,
                urgent: (intelligenceLayer.urgent || []).length,
                verified: (intelligenceLayer.verified || []).length,
                uae: (intelligenceLayer.uae || []).length,
                economy: (intelligenceLayer.economy || []).length,
                sports: (intelligenceLayer.sports || []).length,
                geopolitics: (intelligenceLayer.geopolitics || []).length,
              };
              const n = counts[tab.id];
              if (!n) return null;
              return (
                <span style={{
                  background: activeTab === tab.id ? C.blue : C.dim,
                  color: activeTab === tab.id ? "#fff" : C.muted,
                  fontSize: "10px", fontWeight: 700,
                  padding: "1px 6px", borderRadius: "999px", minWidth: "18px",
                  textAlign: "center"
                }}>{n}</span>
              );
            })()}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      {displayedPosts.length === 0 && !loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: C.muted, fontSize: "14px" }}>
          لا توجد إشارات في هذه الفئة حالياً
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "16px"
        }}>
          {displayedPosts.map(post => (
            <XPostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Refresh button */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={fetchPosts}
          disabled={loading}
          style={{
            background: "rgba(56,189,248,.08)", color: C.blue,
            border: "1px solid rgba(56,189,248,.2)",
            borderRadius: "10px", padding: "10px 24px",
            fontSize: "13px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "جاري التحديث…" : "🔄 تحديث الإشارات"}
        </button>
      </div>
    </section>
  );
}
