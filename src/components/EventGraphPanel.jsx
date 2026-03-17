/**
 * EventGraphPanel — shows event chains derived from signal co-occurrence.
 * Links articles that share signals/keywords, visualizing them as chains:
 *   Event → Signal → Entity → Forecast implication
 *
 * All chains are derived from real ingested data — nothing fabricated.
 */
import React, { useEffect, useState } from "react";
import { getStore } from "../lib/intelligenceStore";

const SIGNAL_IMPLICATIONS = {
  conflict_escalation:  { next: "ضغط إقليمي",       icon: "⚔️ → 🌍", color: "#ef4444", forecast: "زيادة حدة التوترات المحتملة" },
  economic_pressure:    { next: "تراجع الأسواق",    icon: "📊 → 📉", color: "#f59e0b", forecast: "زيادة ضغط العملات والأسهم" },
  sanctions_pressure:   { next: "تأثير على التجارة", icon: "🚫 → 🛢️", color: "#f97316", forecast: "احتمال تقلبات في إمدادات النفط" },
  energy_signal:        { next: "تذبذب أسعار النفط", icon: "⚡ → 💰", color: "#fde047", forecast: "احتمال تأثير على موازنات المنطقة" },
  transfer_market:      { next: "نشاط الفريق",        icon: "🔁 → ⚽", color: "#60a5fa", forecast: "تأثير على ميزان القوى في الدوري" },
  political_transition: { next: "إعادة رسم التحالفات",icon: "🏛️ → 🤝", color: "#a78bfa", forecast: "تحولات محتملة في الخطاب الدبلوماسي" },
  peace_signal:         { next: "تراجع حدة التوتر",  icon: "🕊️ → 🤝", color: "#22c55e", forecast: "احتمال انخفاض مؤشرات المواجهة" },
  sports_activity:      { next: "متابعة المنافسات",  icon: "⚽ → 🏆", color: "#38bdf8", forecast: "تأثير على ترتيب الدوري" },
};

function buildChains(store) {
  if (!store.length) return [];

  // Group by signal, pick most recent 2 articles per signal
  const signalGroups = {};
  store.forEach(item => {
    (item.derivedSignals || []).forEach(sig => {
      if (!signalGroups[sig]) signalGroups[sig] = [];
      signalGroups[sig].push(item);
    });
  });

  const chains = [];
  Object.entries(signalGroups)
    .filter(([, items]) => items.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
    .forEach(([signal, items]) => {
      const impl = SIGNAL_IMPLICATIONS[signal];
      if (!impl) return;

      // Pick most recent 2 distinct-source articles
      const sorted = [...items].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const sources = new Set();
      const picked = [];
      for (const item of sorted) {
        if (!sources.has(item.source)) {
          sources.add(item.source);
          picked.push(item);
        }
        if (picked.length >= 2) break;
      }

      chains.push({
        signal,
        impl,
        articles: picked,
        count: items.length,
        sourceDiversity: sources.size,
      });
    });

  return chains;
}

function ChainCard({ chain }) {
  const [expanded, setExpanded] = useState(false);
  const { impl, articles, count } = chain;

  return (
    <div
      className="nr-card-hover"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${impl.color}22`,
        borderRadius: "14px",
        padding: "14px 16px",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
      }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* Chain header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <span style={{ fontSize: "18px" }}>{impl.icon.split(" → ")[0]}</span>
        <span style={{ color: impl.color, fontWeight: 800, fontSize: "12px" }}>→</span>
        <span style={{ fontSize: "18px" }}>{impl.icon.split(" → ")[1]}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#e2e8f0" }}>{impl.next}</div>
          <div style={{ fontSize: "10px", color: "#475569", marginTop: "1px" }}>{count} حدث مرتبط</div>
        </div>
        <span className="intel-badge" style={{
          background: `${impl.color}12`,
          border: `1px solid ${impl.color}30`,
          color: impl.color,
        }}>
          {count}×
        </span>
      </div>

      {/* Implication arrow */}
      <div style={{
        background: `${impl.color}08`,
        border: `1px solid ${impl.color}18`,
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "11px",
        color: "#94a3b8",
        marginBottom: expanded ? "10px" : 0,
        lineHeight: 1.5,
      }}>
        <span style={{ color: impl.color, marginInlineEnd: "6px" }}>⟹</span>
        {impl.forecast}
        <span style={{ fontSize: "9px", color: "#334155", marginInlineStart: "8px" }}>
          (تحليل احتمالي — ليس تنبؤاً قاطعاً)
        </span>
      </div>

      {/* Expanded: source articles */}
      {expanded && articles.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "10px" }}>
          <div style={{ fontSize: "9px", color: "#334155", letterSpacing: "1px", marginBottom: "6px", textTransform: "uppercase" }}>
            أحدث الأحداث الداعمة
          </div>
          {articles.map(a => (
            <div key={a.id} style={{ marginBottom: "6px" }}>
              <div style={{ fontSize: "11px", color: "#cbd5e1", lineHeight: 1.4 }}>{a.title}</div>
              <div style={{ fontSize: "9px", color: "#475569" }}>{a.source} · {a.regions?.join("، ") || "—"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EventGraphPanel({ refreshKey = 0 }) {
  const [chains, setChains] = useState([]);

  useEffect(() => {
    try {
      const store = getStore();
      setChains(buildChains(store));
    } catch { /* non-critical */ }
  }, [refreshKey]);

  if (!chains.length) return null;

  return (
    <div className="section-frame" style={{ padding: "22px 24px", direction: "rtl", fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
        <span style={{ fontSize: "16px" }}>🔗</span>
        <div>
          <div className="section-title">سلاسل الأحداث والتداعيات</div>
          <div className="section-subtitle">Event Linkage Graph</div>
        </div>
        <div style={{ marginInlineStart: "auto" }}>
          <span style={{ fontSize: "10px", color: "#334155" }}>
            {chains.length} سلسلة مرصودة
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {chains.map(c => <ChainCard key={c.signal} chain={c} />)}
      </div>

      <div style={{ marginTop: "14px", fontSize: "10px", color: "#1e293b", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "10px" }}>
        سلاسل الأحداث مبنية على تكرار الإشارات المشتركة بين مقالات متعددة. التداعيات تحليلية لا قطعية.
      </div>
    </div>
  );
}
