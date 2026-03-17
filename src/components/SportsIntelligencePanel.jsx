/**
 * SportsIntelligencePanel — UAE club momentum tracking and sports intelligence.
 * Derives club momentum from mention frequency in the intelligence store.
 * No invented data — all derived from real ingested articles.
 */
import React, { useEffect, useState } from "react";
import { getStore } from "../lib/intelligenceStore";
import { formatDisplayTime } from "../AppHelpers";

const UAE_CLUB_META = {
  "شباب الأهلي":   { en: "Shabab Al Ahli",  color: "#ef4444", badge: "🔴" },
  "العين":          { en: "Al Ain",           color: "#f59e0b", badge: "🟡" },
  "الشارقة":        { en: "Sharjah FC",       color: "#22c55e", badge: "🟢" },
  "الوصل":          { en: "Al Wasl",          color: "#f97316", badge: "🟠" },
  "الجزيرة":        { en: "Al Jazira",        color: "#60a5fa", badge: "🔵" },
  "الوحدة":         { en: "Al Wahda",         color: "#a78bfa", badge: "🟣" },
  "النصر":          { en: "Al Nasr",          color: "#fde047", badge: "🌕" },
  "عجمان":          { en: "Ajman",            color: "#38bdf8", badge: "🔷" },
  "بني ياس":        { en: "Bani Yas",         color: "#fb923c", badge: "🔶" },
  "خورفكان":        { en: "Khorfakkan",       color: "#94a3b8", badge: "⚫" },
  "كلباء":          { en: "Kalba",            color: "#6ee7b7", badge: "🌿" },
  "الظفرة":         { en: "Al Dhafra",        color: "#c084fc", badge: "💜" },
};

const GLOBAL_CLUB_META = {
  "real madrid":    { en: "Real Madrid",      color: "#f3d38a", badge: "⚪" },
  "barcelona":      { en: "Barcelona",        color: "#60a5fa", badge: "🔵" },
  "manchester":     { en: "Manchester",       color: "#ef4444", badge: "🔴" },
  "liverpool":      { en: "Liverpool",        color: "#ef4444", badge: "🔴" },
  "chelsea":        { en: "Chelsea",          color: "#38bdf8", badge: "🔵" },
  "arsenal":        { en: "Arsenal",          color: "#ef4444", badge: "🔴" },
  "psg":            { en: "PSG",              color: "#60a5fa", badge: "🔵" },
  "bayern":         { en: "Bayern Munich",   color: "#ef4444", badge: "🔴" },
};

function getSignalLabel(signals) {
  if (!signals || !signals.length) return null;
  if (signals.includes("transfer_market")) return { label: "انتقالات", color: "#60a5fa" };
  if (signals.includes("sports_activity"))  return { label: "نشاط", color: "#38bdf8" };
  return null;
}

function buildClubData(store) {
  const sportItems = store.filter(i =>
    i.category === "sports" || (i.derivedSignals || []).some(s => ["sports_activity","transfer_market"].includes(s))
  );

  const uaeCounts = {};
  const globalCounts = {};

  sportItems.forEach(item => {
    (item.uaeClubs || []).forEach(c => {
      if (!uaeCounts[c]) uaeCounts[c] = { count: 0, signals: new Set(), recent: 0 };
      uaeCounts[c].count++;
      (item.derivedSignals || []).forEach(s => uaeCounts[c].signals.add(s));
      try {
        if (Date.now() - new Date(item.timestamp).getTime() < 24 * 3600_000) uaeCounts[c].recent++;
      } catch {}
    });
    (item.globalClubs || []).forEach(c => {
      const key = c.toLowerCase();
      if (!globalCounts[key]) globalCounts[key] = { count: 0, signals: new Set(), recent: 0 };
      globalCounts[key].count++;
      (item.derivedSignals || []).forEach(s => globalCounts[key].signals.add(s));
    });
  });

  const maxUae = Math.max(1, ...Object.values(uaeCounts).map(v => v.count));
  const maxGlobal = Math.max(1, ...Object.values(globalCounts).map(v => v.count));

  return { uaeCounts, globalCounts, maxUae, maxGlobal, totalSports: sportItems.length };
}

function ClubRow({ name, meta, data, max, isUae }) {
  const pct = Math.round((data.count / max) * 100);
  const sigLabel = getSignalLabel([...data.signals]);
  const color = meta?.color || "#64748b";
  const momentum = pct >= 70 ? "مرتفع" : pct >= 35 ? "متوسط" : "منخفض";
  const momentumColor = pct >= 70 ? "#22c55e" : pct >= 35 ? "#f59e0b" : "#64748b";

  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        {meta?.badge && <span>{meta.badge}</span>}
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#cbd5e1" }}>{isUae ? name : (meta?.en || name)}</span>
          {isUae && meta?.en && (
            <span style={{ fontSize: "10px", color: "#475569", marginInlineStart: "6px" }}>{meta.en}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {sigLabel && (
            <span className="intel-badge" style={{
              background: `${sigLabel.color}15`,
              border: `1px solid ${sigLabel.color}25`,
              color: sigLabel.color,
            }}>{sigLabel.label}</span>
          )}
          {data.recent > 0 && (
            <span className="intel-badge" style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)", color: "#38bdf8" }}>
              {data.recent} اليوم
            </span>
          )}
          <span style={{ fontSize: "11px", fontWeight: 800, color: momentumColor }}>{momentum}</span>
          <span style={{ fontSize: "11px", color: "#475569" }}>({data.count})</span>
        </div>
      </div>
      <div className="prog-track">
        <div className="prog-fill nr-animate-bar" style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg,${color}50,${color})`,
        }} />
      </div>
    </div>
  );
}

export default function SportsIntelligencePanel({ refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [updatedAt, setUpdatedAt] = useState("");
  const [section, setSection] = useState("uae"); // "uae" | "global"

  useEffect(() => {
    try {
      const store = getStore();
      setData(buildClubData(store));
      setUpdatedAt(formatDisplayTime(new Date().toISOString()));
    } catch { /* non-critical */ }
  }, [refreshKey]);

  if (!data) return null;

  const { uaeCounts, globalCounts, maxUae, maxGlobal, totalSports } = data;
  const uaeEntries = Object.entries(uaeCounts).sort((a, b) => b[1].count - a[1].count);
  const globalEntries = Object.entries(globalCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 8);
  const hasData = uaeEntries.length > 0 || globalEntries.length > 0;

  if (!hasData) return null;

  return (
    <div className="section-frame" style={{ padding: "22px 24px", direction: "rtl", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <span style={{ fontSize: "16px" }}>⚽</span>
        <div>
          <div className="section-title">الاستخبارات الرياضية</div>
          <div className="section-subtitle">Sports Intelligence Panel</div>
        </div>
        <div style={{ marginInlineStart: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
          <span style={{ fontSize: "10px", color: "#334155" }}>{updatedAt}</span>
          <span style={{ fontSize: "11px", color: "#475569" }}>{totalSports} خبر رياضي</span>
        </div>
      </div>

      {/* Section toggle */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {[
          { id: "uae",    label: "🇦🇪 الدوري الإماراتي" },
          { id: "global", label: "🌍 عالمي" },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              border: section === s.id ? "1px solid rgba(243,211,138,0.4)" : "1px solid rgba(255,255,255,0.07)",
              background: section === s.id ? "rgba(243,211,138,0.1)" : "rgba(255,255,255,0.02)",
              color: section === s.id ? "#f3d38a" : "#64748b",
              fontWeight: 700,
              fontSize: "11px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* UAE clubs */}
      {section === "uae" && (
        uaeEntries.length > 0 ? (
          <div>
            <div style={{ fontSize: "10px", color: "#334155", letterSpacing: "1px", marginBottom: "12px", textTransform: "uppercase" }}>
              زخم الأندية — بناءً على تكرار الذكر في التحليلات
            </div>
            {uaeEntries.slice(0, 10).map(([name, d]) => (
              <ClubRow
                key={name}
                name={name}
                meta={UAE_CLUB_META[name]}
                data={d}
                max={maxUae}
                isUae
              />
            ))}
          </div>
        ) : (
          <div style={{ fontSize: "12px", color: "#334155", textAlign: "center", padding: "20px 0" }}>
            لم تُرصد بيانات أندية إماراتية بعد. تصفح تبويب الرياضة أولاً.
          </div>
        )
      )}

      {/* Global clubs */}
      {section === "global" && (
        globalEntries.length > 0 ? (
          <div>
            <div style={{ fontSize: "10px", color: "#334155", letterSpacing: "1px", marginBottom: "12px", textTransform: "uppercase" }}>
              الأندية العالمية الأكثر ذكراً
            </div>
            {globalEntries.map(([name, d]) => (
              <ClubRow
                key={name}
                name={name}
                meta={GLOBAL_CLUB_META[name.toLowerCase()]}
                data={d}
                max={maxGlobal}
                isUae={false}
              />
            ))}
          </div>
        ) : (
          <div style={{ fontSize: "12px", color: "#334155", textAlign: "center", padding: "20px 0" }}>
            لم تُرصد بيانات أندية عالمية بعد.
          </div>
        )
      )}

      <div style={{ marginTop: "14px", fontSize: "10px", color: "#1e293b", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "10px" }}>
        الزخم محسوب من تكرار ذكر النادي في المقالات المعالجة. لا يعكس الأداء الميداني المباشر.
      </div>
    </div>
  );
}
