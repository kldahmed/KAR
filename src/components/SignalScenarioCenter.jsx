/**
 * SignalScenarioCenter.jsx
 *
 * THE CORE DIFFERENTIATOR — "مركز الربط والاستشراف"
 *
 * Shows:
 *  1. Active Event Clusters  — real linked story groups
 *  2. Signal Pulse           — live signal strength bar
 *  3. Scenario Cards         — probabilistic outlook (best/base/worst)
 *  4. Entity Network         — key entities driving each cluster
 *  5. Intelligence confidence meter
 *
 * All data derived from real ingested articles. Nothing fabricated.
 */
import React, { useEffect, useState, useCallback, memo } from "react";
import { buildClusters } from "../lib/eventLinker";
import { getStore, getStoreStats } from "../lib/intelligenceStore";
import { formatDisplayTime } from "../AppHelpers";

// ── Palette ──────────────────────────────────────────────────────
const C = {
  bg:      "#080c12",
  surface: "#0c1220",
  border:  "rgba(56,189,248,0.12)",
  gold:    "#f3d38a",
  blue:    "#38bdf8",
  green:   "#22c55e",
  red:     "#ef4444",
  amber:   "#f59e0b",
  purple:  "#a78bfa",
  muted:   "#475569",
  dim:     "#1e293b",
};

const SIGNAL_LABELS = {
  conflict_escalation:  { ar: "تصعيد نزاعات",    color: C.red,    icon: "⚔️" },
  economic_pressure:    { ar: "ضغط اقتصادي",      color: C.amber,  icon: "📊" },
  energy_signal:        { ar: "طاقة / نفط",       color: "#fde047",icon: "⚡" },
  sanctions_pressure:   { ar: "ضغط عقوبات",       color: "#f97316",icon: "🚫" },
  peace_signal:         { ar: "إشارات سلام",       color: C.green,  icon: "🕊️" },
  political_transition: { ar: "تحول سياسي",        color: C.purple, icon: "🏛️" },
  transfer_market:      { ar: "سوق انتقالات",      color: "#60a5fa",icon: "🔁" },
  sports_activity:      { ar: "نشاط رياضي",        color: C.blue,   icon: "⚽" },
};

// ── Sub-components ────────────────────────────────────────────────

const ProgressBar = memo(({ value, color, max = 100, animated = true }) => (
  <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(100, (value / max) * 100)}%`,
      height: "100%",
      background: `linear-gradient(90deg,${color}60,${color})`,
      borderRadius: "99px",
      transition: animated ? "width 0.9s cubic-bezier(0.22,0.61,0.36,1)" : "none",
    }} />
  </div>
));

const ConfidenceArc = memo(({ value, size = 52 }) => {
  const r = size / 2 - 6, circ = 2 * Math.PI * r;
  const color = value >= 60 ? C.green : value >= 40 ? C.amber : C.red;
  const dash  = circ - (value / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${circ}`} strokeDashoffset={`${dash}`} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "10px", fontWeight: 900, color }}>{value}%</span>
      </div>
    </div>
  );
});

const Badge = memo(({ label, color, small }) => (
  <span style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    padding: small ? "1px 7px" : "2px 9px",
    borderRadius: "999px",
    fontSize: small ? "9px" : "10px",
    fontWeight: 700,
    background: `${color}12`,
    border: `1px solid ${color}28`,
    color,
    whiteSpace: "nowrap",
  }}>{label}</span>
));

// ── Cluster Card ─────────────────────────────────────────────────

function ClusterCard({ cluster, rank }) {
  const [open, setOpen] = useState(rank === 0); // auto-expand top cluster
  const { color, icon, title, titleEn, trend, confidence, articleCount, sources, signals, entities, implication, articles, lastUpdated } = cluster;

  const updatedStr = lastUpdated
    ? formatDisplayTime(new Date(lastUpdated).toISOString())
    : "";

  const evidenceStrength = confidence >= 60 ? { label: "أدلة قوية", color: C.green }
    : confidence >= 40 ? { label: "أدلة متوسطة", color: C.amber }
    : { label: "أدلة محدودة", color: C.red };

  return (
    <div
      className="nr-card-hover"
      style={{
        background: `linear-gradient(160deg,${color}08,${color}04)`,
        border: `1px solid ${color}25`,
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
      }}
      onClick={() => setOpen(o => !o)}
    >
      {/* Top bar accent */}
      <div style={{ height: "3px", background: `linear-gradient(90deg,${color}80,${color}30,transparent)` }} />

      <div style={{ padding: "16px 18px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
          <div style={{
            fontSize: "22px",
            width: "40px", height: "40px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${color}15`,
            borderRadius: "10px",
            flexShrink: 0,
          }}>{icon}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "2px" }}>
              <span style={{ fontWeight: 800, fontSize: "14px", color: "#e2e8f0" }}>{title}</span>
              <span style={{ fontSize: "11px", color: trend.color, fontWeight: 700 }}>
                {trend.arrow} {trend.dir}
              </span>
            </div>
            <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.5px" }}>{titleEn}</div>
          </div>

          <ConfidenceArc value={confidence} />
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
          <Badge label={`${articleCount} حدث`} color={color} />
          <Badge label={`${sources} مصدر`} color={C.blue} />
          <Badge label={`${signals.length} إشارة`} color={C.purple} />
          <Badge label={evidenceStrength.label} color={evidenceStrength.color} />
        </div>

        {/* Implication */}
        <div style={{
          background: `${color}08`,
          border: `1px solid ${color}15`,
          borderRadius: "8px",
          padding: "8px 12px",
          fontSize: "11px",
          color: "#94a3b8",
          lineHeight: 1.6,
          marginBottom: "8px",
        }}>
          <span style={{ color, marginInlineEnd: "6px", fontWeight: 700 }}>⟹</span>
          {implication}
        </div>

        {/* Last update */}
        {updatedStr && (
          <div style={{ fontSize: "10px", color: C.dim }}>
            آخر تحديث: {updatedStr}
          </div>
        )}

        {/* Expanded: signals + entities + articles */}
        {open && (
          <div style={{ borderTop: `1px solid ${color}15`, marginTop: "12px", paddingTop: "12px" }}>
            {/* Active signals */}
            {signals.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "9px", color: C.dim, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>
                  الإشارات النشطة
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {signals.slice(0, 6).map(s => {
                    const meta = SIGNAL_LABELS[s] || { ar: s, color: C.muted, icon: "•" };
                    return (
                      <span key={s} style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        fontSize: "10px", fontWeight: 600,
                        background: `${meta.color}10`, border: `1px solid ${meta.color}25`,
                        color: meta.color, borderRadius: "6px", padding: "2px 8px",
                      }}>
                        {meta.icon} {meta.ar}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Entities */}
            {entities.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "9px", color: C.dim, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>
                  الكيانات المرتبطة
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {entities.slice(0, 6).map(e => (
                    <Badge key={e} label={e} color={C.gold} small />
                  ))}
                </div>
              </div>
            )}

            {/* Source articles */}
            {articles.length > 0 && (
              <div>
                <div style={{ fontSize: "9px", color: C.dim, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>
                  الأحداث الداعمة
                </div>
                {articles.slice(0, 4).map(a => (
                  <div key={a.id} style={{
                    padding: "6px 0",
                    borderBottom: `1px solid rgba(255,255,255,0.03)`,
                  }}>
                    <div style={{ fontSize: "11px", color: "#cbd5e1", lineHeight: 1.4, marginBottom: "2px" }}>
                      {a.title}
                    </div>
                    <div style={{ display: "flex", gap: "8px", fontSize: "9px", color: C.muted }}>
                      <span>{a.source}</span>
                      {a.regions?.length > 0 && <span>📍 {a.regions.slice(0, 2).join("، ")}</span>}
                      {a.sentiment && (
                        <span style={{ color: a.sentiment === "negative" ? C.red : a.sentiment === "positive" ? C.green : C.muted }}>
                          {a.sentiment === "negative" ? "سلبي" : a.sentiment === "positive" ? "إيجابي" : "محايد"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {articles.length > 4 && (
                  <div style={{ fontSize: "10px", color: C.muted, marginTop: "6px" }}>
                    + {articles.length - 4} أحداث أخرى
                  </div>
                )}
              </div>
            )}

            <div style={{ fontSize: "9px", color: "#0f172a", marginTop: "10px" }}>
              ⚠ هذا تحليل احتمالي مستنبط من تكرار الإشارات. ليس حكماً قاطعاً.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Signal Pulse Panel ────────────────────────────────────────────

function SignalPulsePanel({ store }) {
  const signalFreq = {};
  store.forEach(i => (i.derivedSignals || []).forEach(s => {
    signalFreq[s] = (signalFreq[s] || 0) + 1;
  }));

  const entries = Object.entries(signalFreq).sort((a, b) => b[1] - a[1]);
  const maxVal  = entries.length ? entries[0][1] : 1;

  if (!entries.length) return null;

  return (
    <div style={{
      background: "linear-gradient(160deg,#0c1220,#0a0e18)",
      border: `1px solid ${C.border}`,
      borderRadius: "16px",
      padding: "18px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
        <span style={{ fontSize: "14px" }}>📡</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: "12px", color: C.gold }}>نبض الإشارات الحية</div>
          <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.8px", textTransform: "uppercase" }}>
            Live Signal Pulse
          </div>
        </div>
        <div style={{ marginInlineStart: "auto" }}>
          <span className="nr-live-dot" />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {entries.slice(0, 8).map(([signal, count], i) => {
          const meta = SIGNAL_LABELS[signal] || { ar: signal, color: C.muted, icon: "•" };
          const pct  = Math.round((count / maxVal) * 100);
          return (
            <div key={signal} style={{ animationDelay: `${i * 50}ms` }} className="nr-animate-bar">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "3px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#cbd5e1" }}>
                  <span>{meta.icon}</span>
                  <span style={{ fontWeight: 600 }}>{meta.ar}</span>
                </span>
                <span style={{ color: meta.color, fontWeight: 800 }}>{count}</span>
              </div>
              <ProgressBar value={pct} color={meta.color} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Scenario Strip ────────────────────────────────────────────────

function buildScenariosFromStore(store) {
  const recent = store.filter(i => {
    try { return Date.now() - new Date(i.timestamp).getTime() < 48 * 3600_000; } catch { return false; }
  });
  const total = Math.max(1, recent.length);
  const riskCount  = recent.filter(i => (i.derivedSignals || []).some(s => ["conflict_escalation","sanctions_pressure"].includes(s))).length;
  const calmCount  = recent.filter(i => (i.derivedSignals || []).includes("peace_signal")).length;
  const negCount   = recent.filter(i => i.sentiment === "negative").length;
  const posCount   = recent.filter(i => i.sentiment === "positive").length;
  const sources    = new Set(recent.map(i => i.source)).size;

  const evidenceCount = recent.length;
  const strength = evidenceCount >= 10 ? { label: "قوية", color: C.green }
    : evidenceCount >= 4  ? { label: "متوسطة", color: C.amber }
    :                        { label: "محدودة", color: C.red };

  const worstProb = Math.min(70, 22 + Math.round((riskCount / total) * 42) + Math.round((negCount / total) * 12));
  const bestProb  = Math.min(65, 12 + Math.round((calmCount / total) * 42) + Math.round((posCount / total) * 10));
  const baseProb  = Math.min(70, Math.max(30, Math.round((1 - riskCount / total - calmCount / total) * 65)));

  return [
    {
      id: "worst",
      label: "السيناريو المتشائم",
      labelEn: "Downside Case",
      icon: "📉",
      color: C.red,
      probability: worstProb,
      confidence: Math.min(72, 20 + evidenceCount * 3 + sources * 3),
      summary: riskCount >= 3
        ? `رُصدت ${riskCount} إشارة توتر في 48 ساعة. ${negCount} مقال ذو لهجة سلبية من ${sources} مصدر.`
        : "إشارات التصعيد محدودة. الاحتمالية منخفضة بالبيانات الحالية.",
      why: `الاستنتاج مبني على: ${riskCount} إشارة صراع/عقوبات، ${negCount} مقال سلبي.`,
      strength,
      evidenceCount,
      sources,
    },
    {
      id: "base",
      label: "السيناريو الأساسي",
      labelEn: "Base Case",
      icon: "⚖️",
      color: C.amber,
      probability: baseProb,
      confidence: Math.min(72, 25 + evidenceCount * 3 + sources * 2),
      summary: `استمرار الوضع الراهن مع تقلبات محدودة. ${total} حدث معالج من ${sources} مصدر في 48 ساعة.`,
      why: `الاستنتاج مبني على: ${total} مقال متنوع، تعادل نسبي بين الإشارات الإيجابية والسلبية.`,
      strength,
      evidenceCount,
      sources,
    },
    {
      id: "best",
      label: "السيناريو المتفائل",
      labelEn: "Upside Case",
      icon: "📈",
      color: C.green,
      probability: bestProb,
      confidence: Math.min(68, 15 + evidenceCount * 3 + sources * 2),
      summary: calmCount >= 2
        ? `رُصدت ${calmCount} إشارة استقرار/سلام. ${posCount} مقال ذو لهجة إيجابية.`
        : "إشارات الهدوء محدودة حالياً في قاعدة البيانات.",
      why: `الاستنتاج مبني على: ${calmCount} إشارة سلام، ${posCount} مقال إيجابي من ${sources} مصدر.`,
      strength,
      evidenceCount,
      sources,
    },
  ];
}

function ScenarioCard({ sc }) {
  const [open, setOpen] = useState(false);
  const { label, labelEn, icon, color, probability, confidence, summary, why, strength, evidenceCount, sources } = sc;

  return (
    <div
      className="nr-card-hover"
      style={{
        flex: "1 1 220px",
        minWidth: "200px",
        background: `${color}06`,
        border: `1px solid ${color}20`,
        borderRadius: "14px",
        padding: "14px 16px",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
      }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{ fontSize: "20px" }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "12px", color: "#e2e8f0" }}>{label}</div>
          <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.5px" }}>{labelEn}</div>
        </div>
        <ConfidenceArc value={confidence} size={46} />
      </div>

      {/* Probability bar */}
      <div style={{ marginBottom: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: C.muted, marginBottom: "3px" }}>
          <span>الاحتمالية</span>
          <span style={{ color, fontWeight: 800 }}>{probability}%</span>
        </div>
        <ProgressBar value={probability} color={color} max={70} />
      </div>

      <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 8px", lineHeight: 1.6 }}>
        {summary}
      </p>

      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        <Badge label={`أدلة: ${strength.label}`} color={strength.color} small />
        <Badge label={`${evidenceCount} إشارة`} color={C.blue} small />
        <Badge label={`${sources} مصدر`} color={C.purple} small />
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${color}15`, marginTop: "10px", paddingTop: "10px" }}>
          <div style={{ fontSize: "9px", color: C.dim, letterSpacing: "0.8px", marginBottom: "5px", textTransform: "uppercase" }}>
            لماذا هذا التقدير؟
          </div>
          <p style={{ fontSize: "10px", color: "#64748b", margin: 0, lineHeight: 1.6 }}>{why}</p>
          <div style={{ fontSize: "9px", color: "#0f172a", marginTop: "8px" }}>
            ⚠ احتمالية قصوى 70%. تحليل مستنبط — ليس تنبؤاً قاطعاً.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Memory Stats Strip ────────────────────────────────────────────

function MemoryStrip({ stats }) {
  const items = [
    { label: "سجلات",    value: stats.total,    color: C.blue },
    { label: "مصادر",   value: stats.sources,   color: "#60a5fa" },
    { label: "مناطق",   value: stats.regions,   color: C.gold },
    { label: "كيانات",  value: stats.entities,  color: C.purple },
    { label: "إشارات",  value: stats.signals,   color: "#fb923c" },
    { label: "نشطة/6h", value: stats.recent,    color: C.green },
  ];

  return (
    <div style={{
      display: "flex",
      gap: "2px",
      flexWrap: "wrap",
      justifyContent: "center",
      background: "rgba(56,189,248,0.03)",
      border: `1px solid ${C.border}`,
      borderRadius: "10px",
      padding: "10px 16px",
    }}>
      {items.map(({ label, value, color }, i) => (
        <React.Fragment key={label}>
          {i > 0 && <span style={{ color: C.dim, fontSize: "11px", alignSelf: "center", margin: "0 4px" }}>│</span>}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px", padding: "0 8px" }}>
            <span style={{ fontSize: "15px", fontWeight: 900, color }} className="nr-animate-number">{value}</span>
            <span style={{ fontSize: "9px", color: C.dim, letterSpacing: "0.5px" }}>{label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

export default function SignalScenarioCenter({ refreshKey = 0 }) {
  const [clusters, setClusters]   = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [store, setStore]         = useState([]);
  const [stats, setStats]         = useState(null);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading]     = useState(true);

  const refresh = useCallback(() => {
    try {
      const s = getStore();
      setStore(s);
      setClusters(buildClusters());
      setScenarios(buildScenariosFromStore(s));
      try { setStats(getStoreStats()); } catch {}
      setUpdatedAt(formatDisplayTime(new Date().toISOString()));
    } catch (e) {
      console.error("SignalScenarioCenter refresh error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh, refreshKey]);

  // ── Empty / loading states ─────────────────────────────────────
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted, direction: "rtl" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>🧠</div>
        <div style={{ fontWeight: 700, color: "#334155" }}>جارٍ تحليل الإشارات...</div>
      </div>
    );
  }

  const hasData = store.length > 0;

  if (!hasData) {
    return (
      <div style={{
        background: "linear-gradient(160deg,#0c1220,#0a0e18)",
        border: `1px solid ${C.border}`,
        borderRadius: "18px",
        padding: "40px",
        textAlign: "center",
        color: C.muted,
        direction: "rtl",
        fontFamily: "inherit",
      }}>
        <div style={{ fontSize: "36px", marginBottom: "14px" }}>📡</div>
        <div style={{ fontWeight: 800, fontSize: "16px", color: "#475569", marginBottom: "8px" }}>
          لا توجد بيانات محللة بعد
        </div>
        <div style={{ fontSize: "12px", color: "#334155", lineHeight: 1.7 }}>
          يحتاج مركز الربط والاستشراف إلى قراءة مقالات أولاً.<br />
          انتقل إلى تبويب <strong style={{ color: C.gold }}>الأخبار</strong> واترك النظام يعالج المقالات،
          ثم عد إلى هذا القسم.
        </div>
      </div>
    );
  }

  return (
    <div style={{ direction: "rtl", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: "0 0 4px", fontWeight: 900, fontSize: "20px", color: C.gold, letterSpacing: "0.3px" }}>
              🔭 مركز الربط والاستشراف
            </h2>
            <div style={{ fontSize: "11px", color: C.muted, letterSpacing: "1px" }}>
              LIVE SIGNAL & SCENARIO CENTER — نظام الربط الذكي بين الأحداث
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="nr-live-dot" />
              <span style={{ fontSize: "10px", color: C.red, fontWeight: 700, letterSpacing: "1px" }}>LIVE</span>
            </div>
            <span style={{ fontSize: "10px", color: "#334155" }}>آخر تحديث: {updatedAt}</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{
          marginTop: "12px",
          background: "rgba(245,158,11,0.05)",
          border: "1px solid rgba(245,158,11,0.15)",
          borderRadius: "8px",
          padding: "8px 14px",
          fontSize: "10px",
          color: "#78350f",
          lineHeight: 1.6,
        }}>
          ℹ كل ما تراه هنا مستنبط آلياً من المقالات المُعالجة. الاحتماليات تعبّر عن الأنماط المرصودة، لا عن معرفة مسبقة بالمستقبل.
        </div>
      </div>

      {/* ── Memory strip ──────────────────────────────────────── */}
      {stats && <div style={{ marginBottom: "20px" }}><MemoryStrip stats={stats} /></div>}

      {/* ── Two-column layout ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "18px", alignItems: "start" }}>

        {/* Left: Clusters */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontSize: "14px" }}>🔗</span>
            <div style={{ fontWeight: 800, fontSize: "13px", color: C.gold }}>المجموعات الحدثية النشطة</div>
            <Badge label={`${clusters.length} مجموعة`} color={C.blue} />
          </div>

          {clusters.length === 0 ? (
            <div style={{
              background: "linear-gradient(160deg,#0c1220,#0a0e18)",
              border: `1px solid ${C.border}`,
              borderRadius: "14px",
              padding: "28px",
              textAlign: "center",
              color: C.muted,
              fontSize: "12px",
            }}>
              لم تُكتشف مجموعات حدثية بعد — يحتاج النظام إلى {">"}= مقالَين متشابهَين لبناء مجموعة.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {clusters.map((cluster, i) => (
                <ClusterCard key={cluster.id} cluster={cluster} rank={i} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Signal pulse + scenarios */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Signal pulse */}
          <SignalPulsePanel store={store} />

          {/* Scenario section header */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px" }}>🎯</span>
            <div style={{ fontWeight: 800, fontSize: "13px", color: C.gold }}>تحليل السيناريوهات</div>
          </div>
          <div style={{
            background: "rgba(245,158,11,0.04)",
            border: "1px solid rgba(245,158,11,0.12)",
            borderRadius: "8px",
            padding: "7px 12px",
            fontSize: "9px",
            color: "#78350f",
            lineHeight: 1.5,
          }}>
            ⚠ احتمالية قصوى 70% — تحليل مستنبط من إشارات فعلية.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {scenarios.map(sc => <ScenarioCard key={sc.id} sc={sc} />)}
          </div>
        </div>
      </div>

      {/* ── Mobile: stack columns ─────────────────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          /* force single column on mobile — targeting the grid above */
          .ssc-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
