/**
 * GlobalEventTimeline.jsx
 *
 * Global Event Intelligence Terminal
 * Shows live-detected global events with timelines, correlations, map hints
 */
import React, { useEffect, useRef, useState, useMemo } from "react";

const C = {
  bg:"#080c12", surface:"#0c1220", border:"rgba(56,189,248,0.1)",
  gold:"#f3d38a", blue:"#38bdf8", green:"#22c55e",
  red:"#ef4444", amber:"#f59e0b", purple:"#a78bfa",
  muted:"#475569", text:"#e2e8f0", dim:"#1e293b",
};

const TYPE_COLORS = {
  conflict:        "#ef4444",
  market_move:     "#f59e0b",
  diplomacy:       "#38bdf8",
  sports_event:    "#fb923c",
  transfer:        "#a78bfa",
  economic_policy: "#34d399",
  breaking_news:   "#ef4444",
  emerging:        "#64748b",
};

const TYPE_LABELS = {
  conflict:        { icon:"⚔️",  label:"نزاع عسكري" },
  market_move:     { icon:"📊",  label:"حركة أسواق" },
  diplomacy:       { icon:"🤝",  label:"دبلوماسية" },
  sports_event:    { icon:"⚽",  label:"رياضة" },
  transfer:        { icon:"🔁",  label:"انتقالات" },
  economic_policy: { icon:"🏦",  label:"سياسة اقتصادية" },
  breaking_news:   { icon:"🔴",  label:"عاجل" },
  emerging:        { icon:"🔎",  label:"إشارة ناشئة" },
};

const FILTER_TABS = [
  { id:"all",       label:"كل الأحداث",  icon:"🌍" },
  { id:"conflict",  label:"نزاعات",      icon:"⚔️" },
  { id:"market_move",label:"أسواق",      icon:"📊" },
  { id:"diplomacy", label:"دبلوماسية",   icon:"🤝" },
  { id:"emerging",  label:"إشارات ناشئة",icon:"🔎" },
  { id:"sports_event",label:"رياضة",     icon:"⚽" },
];

// ── Impact Ring ───────────────────────────────────────────────────────────────
function ImpactRing({ score, color, size = 54 }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const filled = circ * (score / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${filled} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round" />
      <text x={size/2} y={size/2 + 5} textAnchor="middle"
        fill={color} fontSize="12" fontWeight="800">{score}</text>
    </svg>
  );
}

// ── Timeline Row ──────────────────────────────────────────────────────────────
function TimelineEntry({ entry, isLast }) {
  const isX = entry.sourceType === "x" || entry.sourceType === "signal" || entry.sourceType === "emerging";
  const isNews = entry.sourceType === "news";
  const isOfficial = entry.sourceType === "official";
  const dotColor = isOfficial ? C.gold : isNews ? C.green : C.blue;

  return (
    <div style={{ display:"flex", gap:"10px", position:"relative" }}>
      {/* Dot + line */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"16px", flexShrink:0 }}>
        <div style={{ width:"8px", height:"8px", borderRadius:"50%",
          background:dotColor, boxShadow:`0 0 6px ${dotColor}60`, flexShrink:0,
          marginTop:"4px" }} />
        {!isLast && (
          <div style={{ width:"1px", flex:1, background:"rgba(255,255,255,.06)", marginTop:"3px" }} />
        )}
      </div>
      <div style={{ flex:1, paddingBottom: isLast ? 0 : "12px" }}>
        <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"3px", flexWrap:"wrap" }}>
          <span style={{ color:dotColor, fontSize:"11px", fontWeight:700 }}>
            {entry.localTimeUAE || ""}
          </span>
          <span style={{ background:"rgba(255,255,255,.04)", color:C.muted,
            border:"1px solid rgba(255,255,255,.06)", fontSize:"10px",
            padding:"1px 7px", borderRadius:"999px" }}>
            {isOfficial ? "🏛️ رسمي" : isNews ? "📰 إعلام" : "📡 إشارة 𝕏"}
          </span>
          <span style={{ color:C.muted, fontSize:"10px" }}>{entry.source}</span>
        </div>
        <p style={{ color:"#94a3b8", fontSize:"12px", lineHeight:1.65, margin:0 }}>
          {entry.summary}
        </p>
      </div>
    </div>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({ event, correlations, expanded, onToggle }) {
  const typeColor = TYPE_COLORS[event.eventType] || C.muted;
  const typeMeta = TYPE_LABELS[event.eventType] || { icon:"🌍", label:"حدث" };
  const relCorrs = correlations.filter(c =>
    c.parentEvent === event.id || c.childEvent === event.id
  );

  return (
    <div style={{
      background:`linear-gradient(160deg,${C.surface},#0a1428)`,
      border:`1px solid ${typeColor}30`,
      borderRadius:"16px",
      overflow:"hidden",
      boxShadow: event.isEarlyWarning
        ? "none"
        : `0 0 0 1px ${typeColor}18, 0 6px 20px rgba(0,0,0,.25)`,
    }}>
      {/* Top bar */}
      <div style={{
        height:"3px",
        background:`linear-gradient(90deg,${typeColor},transparent)`,
      }} />

      <div style={{ padding:"16px 18px" }}>
        {/* Header row */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:"12px", marginBottom:"12px" }}>
          <ImpactRing score={event.impactScore} color={typeColor} />
          <div style={{ flex:1, minWidth:0 }}>
            {/* Type + early-warning badge */}
            <div style={{ display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap", marginBottom:"5px" }}>
              <span style={{ background:`${typeColor}18`, color:typeColor,
                border:`1px solid ${typeColor}33`,
                fontSize:"10px", fontWeight:800, padding:"2px 9px", borderRadius:"999px", letterSpacing:".04em" }}>
                {typeMeta.icon} {typeMeta.label}
              </span>
              {event.isEarlyWarning && (
                <span style={{ background:"rgba(100,116,139,.12)", color:"#94a3b8",
                  border:"1px solid rgba(100,116,139,.2)",
                  fontSize:"10px", fontWeight:700, padding:"2px 9px", borderRadius:"999px" }}>
                  🔎 إشارة ناشئة — لم تُؤكد بعد
                </span>
              )}
            </div>
            <h3 style={{ color:C.text, fontSize:"15px", fontWeight:800, margin:0, lineHeight:1.4 }}>
              {event.title}
            </h3>
            <div style={{ color:C.muted, fontSize:"11px", marginTop:"4px" }}>
              {event.region} · {event.signalVolume} إشارة · ثقة {event.confidence}%
            </div>
          </div>
        </div>

        {/* Entities */}
        {event.entities?.length > 0 && (
          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"10px" }}>
            {event.entities.slice(0, 5).map((e, i) => (
              <span key={i} style={{
                background: e.sensitivity >= 8 ? `${typeColor}15` : "rgba(255,255,255,.03)",
                border: e.sensitivity >= 8 ? `1px solid ${typeColor}33` : "1px solid rgba(255,255,255,.07)",
                color: e.sensitivity >= 8 ? typeColor : "#94a3b8",
                fontSize:"10px", padding:"2px 8px", borderRadius:"999px", fontWeight: e.sensitivity >= 8 ? 700 : 400,
              }}>
                {e.name}
              </span>
            ))}
          </div>
        )}

        {/* Timeline preview (last 2 entries when collapsed) */}
        <div style={{ borderTop:"1px solid rgba(255,255,255,.05)", paddingTop:"12px", marginBottom:"8px" }}>
          {event.timeline
            .slice(expanded ? 0 : -2)
            .map((entry, i, arr) => (
              <TimelineEntry key={i} entry={entry} isLast={i === arr.length - 1} />
            ))
          }
        </div>

        {/* Expand / collapse timeline */}
        {event.timeline.length > 2 && (
          <button onClick={onToggle} style={{
            background:"transparent", border:"none", color:C.blue,
            fontSize:"12px", fontWeight:700, cursor:"pointer", padding:"4px 0",
            marginBottom:"8px"
          }}>
            {expanded ? "▲ إخفاء التسلسل الزمني" : `▼ عرض كامل التسلسل (${event.timeline.length} حدث)`}
          </button>
        )}

        {/* Correlations */}
        {relCorrs.length > 0 && (
          <div style={{ borderTop:"1px solid rgba(255,255,255,.04)", paddingTop:"10px" }}>
            <div style={{ color:C.muted, fontSize:"10px", fontWeight:700, marginBottom:"6px",
              letterSpacing:".04em" }}>ارتباط بأحداث أخرى</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
              {relCorrs.slice(0, 2).map((c, i) => (
                <div key={i} style={{
                  display:"flex", alignItems:"center", gap:"8px",
                  background:"rgba(167,139,250,.05)",
                  border:"1px solid rgba(167,139,250,.1)",
                  borderRadius:"7px", padding:"6px 10px"
                }}>
                  <div style={{ flex:1, color:"#94a3b8", fontSize:"11px" }}>{c.description}</div>
                  <span style={{ color:C.purple, fontSize:"11px", fontWeight:700,
                    whiteSpace:"nowrap" }}>
                    {c.correlationStrength}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Map Dot Layer (SVG world map hint) ────────────────────────────────────────
function GlobalMapLayer({ events }) {
  if (!events.length) return null;
  const withCoords = events.filter(e => e.coords);
  if (!withCoords.length) return null;

  // Simple equirectangular projection: lon → x, lat → y
  const W = 800, H = 400;
  const toX = lon => ((lon + 180) / 360) * W;
  const toY = lat => ((90 - lat) / 180) * H;

  return (
    <div style={{
      background:C.surface, border:`1px solid ${C.border}`,
      borderRadius:"16px", padding:"16px 20px", overflow:"hidden"
    }}>
      <div style={{ color:C.gold, fontWeight:800, fontSize:"13px",
        marginBottom:"12px", letterSpacing:".04em" }}>
        🗺️ الخريطة الاستخباراتية الحية
      </div>
      <div style={{ position:"relative", width:"100%", paddingBottom:"50%", overflow:"hidden", borderRadius:"8px" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%"
          style={{ position:"absolute", top:0, left:0,
            background:"linear-gradient(180deg,#0a1428,#070d1c)" }}>
          {/* Grid */}
          {[-60,-30,0,30,60].map(lat => (
            <line key={`lat${lat}`} x1={0} x2={W} y1={toY(lat)} y2={toY(lat)}
              stroke="rgba(255,255,255,.05)" strokeWidth="0.5" />
          ))}
          {[-120,-60,0,60,120].map(lon => (
            <line key={`lon${lon}`} x1={toX(lon)} x2={toX(lon)} y1={0} y2={H}
              stroke="rgba(255,255,255,.05)" strokeWidth="0.5" />
          ))}
          {/* Event dots */}
          {withCoords.map(ev => {
            const [lon, lat] = ev.coords;
            const x = toX(lon), y = toY(lat);
            const color = TYPE_COLORS[ev.eventType] || C.muted;
            const r = 4 + Math.round((ev.impactScore / 100) * 10);
            return (
              <g key={ev.id}>
                {/* Glow */}
                <circle cx={x} cy={y} r={r * 2} fill={color} opacity="0.08" />
                <circle cx={x} cy={y} r={r} fill={color} opacity="0.25" />
                <circle cx={x} cy={y} r={Math.max(3, r * 0.55)} fill={color} opacity="0.85" />
              </g>
            );
          })}
        </svg>
      </div>
      {/* Legend */}
      <div style={{ display:"flex", gap:"14px", flexWrap:"wrap", marginTop:"10px" }}>
        {Object.entries(TYPE_LABELS).filter(([k]) => withCoords.some(e => e.eventType === k)).map(([k, v]) => (
          <div key={k} style={{ display:"flex", gap:"5px", alignItems:"center" }}>
            <div style={{ width:"8px", height:"8px", borderRadius:"50%",
              background:TYPE_COLORS[k] || C.muted }} />
            <span style={{ color:C.muted, fontSize:"10px" }}>{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar({ events, updated }) {
  const urgent = events.filter(e => e.eventType === "conflict" || e.eventType === "breaking_news").length;
  const emerging = events.filter(e => e.isEarlyWarning).length;
  const avgImpact = events.length ? Math.round(events.reduce((s, e) => s + e.impactScore, 0) / events.length) : 0;

  return (
    <div style={{
      display:"flex", gap:"16px", flexWrap:"wrap", alignItems:"center",
      padding:"10px 16px", background:"rgba(255,255,255,.02)",
      border:"1px solid rgba(255,255,255,.04)", borderRadius:"10px"
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
        <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:C.green }} />
        <span style={{ color:C.green, fontSize:"11px", fontWeight:700 }}>رصد حي</span>
      </div>
      <Pill label="حدث نشط" value={events.length} color={C.blue} />
      <Pill label="نزاع/عاجل" value={urgent} color={C.red} />
      <Pill label="إشارات ناشئة" value={emerging} color={C.muted} />
      <Pill label="متوسط التأثير" value={avgImpact} color={C.amber} />
      {updated && <span style={{ color:C.muted, fontSize:"11px", marginRight:"auto" }}>{updated}</span>}
    </div>
  );
}

function Pill({ label, value, color }) {
  return (
    <div style={{ display:"flex", gap:"4px", alignItems:"baseline" }}>
      <span style={{ color, fontWeight:800, fontSize:"14px" }}>{value}</span>
      <span style={{ color:C.muted, fontSize:"11px" }}>{label}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GlobalEventTimeline() {
  const [events, setEvents]           = useState([]);
  const [correlations, setCorrelations] = useState([]);
  const [updated, setUpdated]         = useState("");
  const [loading, setLoading]         = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [expanded, setExpanded]       = useState(new Set());
  const intervalRef = useRef(null);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/global-events")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setEvents(Array.isArray(data.events) ? data.events : []);
        setCorrelations(Array.isArray(data.correlations) ? data.correlations : []);
        if (data.updated) {
          try {
            const t = new Intl.DateTimeFormat("ar-AE", {
              timeZone:"Asia/Dubai", hour:"2-digit", minute:"2-digit", hour12:false
            }).format(new Date(data.updated));
            setUpdated(t + " (توقيت الإمارات)");
          } catch { setUpdated(""); }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const displayed = useMemo(() => {
    if (activeFilter === "all") return events;
    return events.filter(e =>
      e.eventType === activeFilter ||
      (activeFilter === "emerging" && e.isEarlyWarning)
    );
  }, [events, activeFilter]);

  const toggleExpand = id => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <section style={{ maxWidth:"1400px", margin:"0 auto", display:"grid", gap:"20px" }}>

      {/* Header */}
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"5px" }}>
          <span style={{ color:"#f8fafc", fontSize:"26px", fontWeight:900 }}>
            الخط الزمني العالمي
          </span>
          <span style={{ background:"rgba(56,189,248,.1)", color:C.blue,
            border:"1px solid rgba(56,189,248,.2)",
            fontSize:"10px", fontWeight:800, padding:"3px 9px",
            borderRadius:"999px", letterSpacing:".06em" }}>
            GLOBAL EVENT TIMELINE
          </span>
          {loading && <span style={{ color:C.muted, fontSize:"12px" }}>يحدّث…</span>}
        </div>
        <p style={{ color:C.muted, fontSize:"12px", margin:0, lineHeight:1.6 }}>
          كل إشارة، خبر، وحدث في سياق واحد — يُبنى تلقائياً من الإشارات المرصودة وتتطور بدون إعادة تحميل
        </p>
      </div>

      <StatsBar events={events} updated={updated} />

      {/* Map */}
      <GlobalMapLayer events={events} />

      {/* Filter tabs */}
      <div style={{
        display:"flex", gap:"6px", flexWrap:"wrap",
        padding:"8px 12px", background:"rgba(255,255,255,.02)",
        border:"1px solid rgba(255,255,255,.04)", borderRadius:"10px"
      }}>
        {FILTER_TABS.map(tab => {
          const active = activeFilter === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveFilter(tab.id)} style={{
              background: active ? "rgba(56,189,248,.15)" : "transparent",
              color: active ? C.blue : C.muted,
              border: active ? "1px solid rgba(56,189,248,.25)" : "1px solid transparent",
              borderRadius:"7px", padding:"6px 12px",
              fontSize:"12px", fontWeight: active ? 800 : 600,
              cursor:"pointer", transition:"all .15s",
              display:"flex", gap:"4px", alignItems:"center"
            }}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id !== "all" && (() => {
                const n = events.filter(e =>
                  tab.id === "emerging" ? e.isEarlyWarning : e.eventType === tab.id
                ).length;
                if (!n) return null;
                return (
                  <span style={{
                    background: active ? C.blue : C.dim,
                    color: active ? "#fff" : C.muted,
                    fontSize:"10px", fontWeight:700,
                    padding:"1px 6px", borderRadius:"999px"
                  }}>{n}</span>
                );
              })()}
            </button>
          );
        })}
      </div>

      {/* Event grid */}
      {displayed.length === 0 && !loading ? (
        <div style={{ textAlign:"center", padding:"50px", color:C.muted, fontSize:"13px" }}>
          لا توجد أحداث في هذه الفئة — سيتم رصدها تلقائياً عند تجمع الإشارات
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))", gap:"16px" }}>
          {displayed.map(event => (
            <EventCard
              key={event.id}
              event={event}
              correlations={correlations}
              expanded={expanded.has(event.id)}
              onToggle={() => toggleExpand(event.id)}
            />
          ))}
        </div>
      )}

      {/* Refresh */}
      <div style={{ textAlign:"center" }}>
        <button onClick={fetchData} disabled={loading} style={{
          background:"rgba(56,189,248,.07)", color:C.blue,
          border:"1px solid rgba(56,189,248,.18)",
          borderRadius:"8px", padding:"9px 22px",
          fontSize:"12px", fontWeight:700,
          cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1
        }}>
          {loading ? "يحدّث الأحداث…" : "🔄 تحديث الخط الزمني"}
        </button>
      </div>
    </section>
  );
}
