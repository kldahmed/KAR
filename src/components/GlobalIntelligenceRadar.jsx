import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useI18n } from "../i18n/I18nProvider";
import {
  startRadarEngine,
  stopRadarEngine,
  getRadarSignals,
  getTopRadarSignals,
  getCriticalSignals,
  getEmergingSignals,
  getRegionSummary,
  getRadarStats,
  subscribeRadar,
  getRadarSignalsByCategory,
  getActivityLog,
  getSignalClusters,
  getSignalArcs,
  getCategoryDistribution,
} from "../lib/radar/globalRadarEngine";
import { severityColor, pressureColor, alertBadgeConfig } from "../lib/radar/radarClassifier";
import RadarSignalCard from "./RadarSignalCard";
import RadarRegionStrip from "./RadarRegionStrip";
import RadarCriticalAlerts from "./RadarCriticalAlerts";

const RADAR_CATEGORIES = [
  { id: "all", ar: "الكل", en: "All", icon: "📡" },
  { id: "صراع / تصعيد", ar: "صراع / تصعيد", en: "Conflict", icon: "⚔️" },
  { id: "دبلوماسية", ar: "دبلوماسية", en: "Diplomacy", icon: "🤝" },
  { id: "اقتصاد / أسواق", ar: "اقتصاد / أسواق", en: "Economy", icon: "📊" },
  { id: "طاقة / نفط / شحن", ar: "طاقة / نفط / شحن", en: "Energy", icon: "⛽" },
  { id: "رياضة", ar: "رياضة", en: "Sports", icon: "⚽" },
  { id: "انتقالات", ar: "انتقالات", en: "Transfers", icon: "🔁" },
  { id: "أحداث عالمية", ar: "أحداث عالمية", en: "World Events", icon: "🌐" },
  { id: "إشارات ناشئة", ar: "إشارات ناشئة", en: "Emerging", icon: "🔎" },
];

export default function GlobalIntelligenceRadar() {
  const { t, language } = useI18n();
  const [signals, setSignals] = useState([]);
  const [stats, setStats] = useState({});
  const [regions, setRegions] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [catDist, setCatDist] = useState({});
  const [selectedCat, setSelectedCat] = useState("all");
  const [scanAngle, setScanAngle] = useState(0);
  const [viewMode, setViewMode] = useState("signals"); // signals | clusters
  const scanRef = useRef(null);

  // Start the radar engine
  useEffect(() => {
    startRadarEngine();

    const unsubscribe = subscribeRadar(() => {
      setSignals(getRadarSignals());
      setStats(getRadarStats());
      setRegions(getRegionSummary());
      setActivityLog(getActivityLog());
      setClusters(getSignalClusters());
      setCatDist(getCategoryDistribution());
    });

    // Also fetch from API as backup / initial load
    fetch("/api/global-radar")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.signals?.length) {
          setSignals(prev => prev.length ? prev : data.signals);
          if (data.stats) setStats(prev => prev.totalActive ? prev : data.stats);
          if (data.regions) setRegions(prev => prev.length ? prev : data.regions);
        }
      })
      .catch(() => {});

    return () => {
      unsubscribe();
      stopRadarEngine();
    };
  }, []);

  // Radar scan animation
  useEffect(() => {
    scanRef.current = setInterval(() => {
      setScanAngle(prev => (prev + 1.2) % 360);
    }, 50);
    return () => clearInterval(scanRef.current);
  }, []);

  // Filtered signals
  const displayedSignals = useMemo(() => {
    if (selectedCat === "all") return signals;
    return signals.filter(s => s.category === selectedCat);
  }, [signals, selectedCat]);

  const topSignals = useMemo(() => displayedSignals.slice(0, 20), [displayedSignals]);
  const criticalSignals = useMemo(() => getCriticalSignals(), [signals]);
  const emergingSignals = useMemo(() => getEmergingSignals().slice(0, 10), [signals]);

  const activityColor = (() => {
    switch (stats.globalActivityLevel) {
      case "حرج": return "#ef4444";
      case "مرتفع": return "#f59e0b";
      case "متوسط": return "#38bdf8";
      default: return "#22c55e";
    }
  })();

  const formatTime = useCallback((iso) => {
    try {
      return new Intl.DateTimeFormat(language === "ar" ? "ar-AE" : "en-AE", {
        timeStyle: "medium",
        timeZone: "Asia/Dubai",
      }).format(new Date(iso));
    } catch { return "—"; }
  }, [language]);

  // Total category counts for distribution bar
  const catDistEntries = useMemo(() => {
    const total = Object.values(catDist).reduce((s, v) => s + v, 0) || 1;
    return RADAR_CATEGORIES.filter(c => c.id !== "all").map(cat => ({
      ...cat,
      count: catDist[cat.id] || 0,
      pct: Math.round(((catDist[cat.id] || 0) / total) * 100),
    })).filter(c => c.count > 0);
  }, [catDist]);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 12px" }}>
      {/* ═══ Radar Scan CSS ═══ */}
      <style>{`
        @keyframes radarPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes radarGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(56,189,248,0.15); }
          50% { box-shadow: 0 0 40px rgba(56,189,248,0.3); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gridScan {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
        @keyframes activitySlideIn {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .radar-card-enter {
          animation: fadeInUp 0.3s ease both;
        }
        .radar-cat-btn {
          border: 1px solid rgba(56,189,248,0.2);
          border-radius: 10px;
          padding: 7px 14px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .radar-cat-btn:hover {
          border-color: rgba(56,189,248,0.5);
        }
        .radar-scroll::-webkit-scrollbar {
          height: 4px;
        }
        .radar-scroll::-webkit-scrollbar-thumb {
          background: #27303a;
          border-radius: 4px;
        }
        .radar-activity-item {
          animation: activitySlideIn 0.4s ease both;
        }
        @media (max-width: 768px) {
          .radar-hero-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .radar-main-grid {
            grid-template-columns: 1fr !important;
          }
          .radar-command-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════
          A. RADAR COMMAND CENTER HERO
          ═══════════════════════════════════════════════════════ */}
      <div style={{
        background: "linear-gradient(135deg, #060a0f, #0a1018, #0c1220, #0a0e14)",
        border: "1px solid rgba(56,189,248,0.1)",
        borderRadius: "20px",
        padding: "0",
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
        animation: "radarGlow 5s infinite",
      }}>
        {/* Grid overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }} />
        {/* Scanning overlay line */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.2), transparent)",
          top: `${(scanAngle / 360) * 100}%`,
          transition: "top 0.05s linear",
          pointerEvents: "none",
        }} />

        {/* Command center top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid rgba(56,189,248,0.06)",
          flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: 42, height: 42, borderRadius: "12px",
              background: "rgba(56,189,248,0.08)",
              border: "1px solid rgba(56,189,248,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "22px",
            }}>📡</div>
            <div>
              <h2 style={{
                margin: 0, fontSize: "1.35rem", fontWeight: 900,
                color: "#e8edf2",
                fontFamily: "Inter, Poppins, system-ui, sans-serif",
                letterSpacing: "-0.3px",
              }}>
                {language === "ar" ? "الرادار الاستخباراتي العالمي" : "Global Intelligence Radar"}
              </h2>
              <div style={{ fontSize: "0.72rem", color: "#4b5563", marginTop: 2, letterSpacing: "0.5px" }}>
                {language === "ar" ? "نظام رصد وإنذار مبكر • بيانات حية متعددة المصادر" : "Early warning system • Multi-source live data"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Signals count badge */}
            <div style={{
              padding: "5px 14px", borderRadius: "10px",
              background: "rgba(56,189,248,0.08)",
              border: "1px solid rgba(56,189,248,0.15)",
              fontSize: "0.75rem", fontWeight: 700, color: "#38bdf8",
            }}>
              {stats.totalActive || 0} {language === "ar" ? "إشارة" : "signals"}
            </div>
            {/* LIVE indicator */}
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "6px 14px", borderRadius: "10px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#ef4444",
                animation: "radarPulse 1.2s infinite",
                boxShadow: "0 0 8px rgba(239,68,68,0.5)",
              }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#ef4444", letterSpacing: "1.5px" }}>
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Command center main area: Radar Visual + Stats */}
        <div className="radar-command-grid" style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 0,
        }}>
          {/* Radar visualization */}
          <div style={{
            padding: "20px",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRight: "1px solid rgba(56,189,248,0.05)",
          }}>
            <RadarVisualization signals={signals} scanAngle={scanAngle} />
          </div>

          {/* Stats + Activity */}
          <div style={{ padding: "20px 24px" }}>
            {/* Hero stat cards */}
            <div className="radar-hero-grid" style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px", marginBottom: 16,
            }}>
              <HeroStat
                label={language === "ar" ? "مستوى النشاط العالمي" : "Global Activity Level"}
                value={stats.globalActivityLevel || "—"}
                color={activityColor}
                icon="🌍"
              />
              <HeroStat
                label={language === "ar" ? "أخطر منطقة حاليًا" : "Hottest Region"}
                value={stats.topRegion || "—"}
                color="#ef4444"
                icon="🔥"
                sub={stats.topRegionPressure}
              />
              <HeroStat
                label={language === "ar" ? "أعلى إشارة" : "Top Signal"}
                value={stats.topSignal ? String(stats.topSignal).slice(0, 50) : "—"}
                color="#f3d38a"
                icon="📶"
                sub={stats.topSignalScore ? `${stats.topSignalScore}/100` : ""}
                small
              />
              <HeroStat
                label={language === "ar" ? "آخر تحديث" : "Last Update"}
                value={stats.lastUpdate ? formatTime(stats.lastUpdate) : "—"}
                color="#38bdf8"
                icon="🕐"
                sub={`${stats.critical || 0} ${language === "ar" ? "حرجة" : "critical"} · ${stats.high || 0} ${language === "ar" ? "مرتفعة" : "high"}`}
              />
            </div>

            {/* Category distribution bar */}
            {catDistEntries.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: "0.68rem", color: "#4b5563", marginBottom: 5, fontWeight: 600 }}>
                  {language === "ar" ? "توزيع الإشارات حسب الفئة" : "Signal Distribution by Category"}
                </div>
                <div style={{
                  display: "flex", height: 6, borderRadius: 3, overflow: "hidden",
                  background: "rgba(255,255,255,0.04)",
                }}>
                  {catDistEntries.map(c => {
                    const catColors = {
                      "صراع / تصعيد": "#ef4444", "دبلوماسية": "#38bdf8",
                      "اقتصاد / أسواق": "#eab308", "طاقة / نفط / شحن": "#f97316",
                      "رياضة": "#22c55e", "انتقالات": "#a78bfa",
                      "أحداث عالمية": "#818cf8", "إشارات ناشئة": "#64748b",
                    };
                    return (
                      <div key={c.id} style={{
                        width: `${c.pct}%`, minWidth: c.pct > 0 ? "2px" : 0,
                        background: catColors[c.id] || "#64748b",
                        transition: "width 0.5s ease",
                      }} title={`${c.icon} ${language === "ar" ? c.ar : c.en}: ${c.count}`} />
                    );
                  })}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: 5 }}>
                  {catDistEntries.slice(0, 5).map(c => {
                    const catColors = {
                      "صراع / تصعيد": "#ef4444", "دبلوماسية": "#38bdf8",
                      "اقتصاد / أسواق": "#eab308", "طاقة / نفط / شحن": "#f97316",
                      "رياضة": "#22c55e", "انتقالات": "#a78bfa",
                      "أحداث عالمية": "#818cf8", "إشارات ناشئة": "#64748b",
                    };
                    return (
                      <span key={c.id} style={{ fontSize: "0.62rem", color: catColors[c.id] || "#6b7280" }}>
                        {c.icon} {c.count}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Real-time activity stream */}
            <div>
              <div style={{ fontSize: "0.7rem", color: "#4b5563", marginBottom: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#38bdf8", animation: "radarPulse 2s infinite" }} />
                {language === "ar" ? "بث النشاط المباشر" : "Live Activity Stream"}
              </div>
              <div style={{
                maxHeight: 100, overflowY: "auto", overflowX: "hidden",
                scrollbarWidth: "thin", scrollbarColor: "#1e293b transparent",
              }}>
                {activityLog.length === 0 ? (
                  <div style={{ fontSize: "0.72rem", color: "#374151", textAlign: "center", padding: 12 }}>
                    {language === "ar" ? "جاري المسح..." : "Scanning..."}
                  </div>
                ) : activityLog.slice(0, 8).map((item, i) => (
                  <div key={item.id + i} className="radar-activity-item" style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.02)",
                    animationDelay: `${i * 0.06}s`,
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                      background: severityColor(item.severity),
                    }} />
                    <span style={{
                      fontSize: "0.7rem", color: "#9ca3af", flex: 1, minWidth: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: "0.62rem", color: "#374151", flexShrink: 0 }}>
                      {item.radarScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          B. REGIONAL RADAR STRIP
          ═══════════════════════════════════════════════════════ */}
      <RadarRegionStrip regions={regions} />

      {/* ═══════════════════════════════════════════════════════
          CATEGORY FILTER + VIEW MODE TOGGLE
          ═══════════════════════════════════════════════════════ */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 16, flexWrap: "wrap", gap: 8,
      }}>
        <div className="radar-scroll" style={{
          display: "flex", gap: "6px", overflowX: "auto", paddingBottom: 4, flex: 1,
        }}>
          {RADAR_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className="radar-cat-btn"
              onClick={() => setSelectedCat(cat.id)}
              style={{
                background: selectedCat === cat.id
                  ? "linear-gradient(135deg, #38bdf8, #2563eb)"
                  : "#0c1017",
                color: selectedCat === cat.id ? "#fff" : "#38bdf8",
                borderColor: selectedCat === cat.id ? "#38bdf8" : "rgba(56,189,248,0.15)",
              }}
            >
              {cat.icon} {language === "ar" ? cat.ar : cat.en}
            </button>
          ))}
        </div>
        {/* View mode toggle */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {[
            { key: "signals", ar: "إشارات", en: "Signals", icon: "📶" },
            { key: "clusters", ar: "تجمعات", en: "Clusters", icon: "🔗" },
          ].map(vm => (
            <button key={vm.key} onClick={() => setViewMode(vm.key)} style={{
              background: viewMode === vm.key ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${viewMode === vm.key ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.05)"}`,
              borderRadius: 8, padding: "6px 12px", cursor: "pointer",
              fontSize: "0.75rem", fontWeight: 700,
              color: viewMode === vm.key ? "#38bdf8" : "#6b7280",
              transition: "all 0.2s",
            }}>
              {vm.icon} {language === "ar" ? vm.ar : vm.en}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT 2-COLUMN LAYOUT
          ═══════════════════════════════════════════════════════ */}
      <div className="radar-main-grid" style={{
        display: "grid",
        gridTemplateColumns: "1fr 380px",
        gap: "20px",
        alignItems: "start",
      }}>
        {/* ─── LEFT: Top Radar Feed OR Clusters ─── */}
        <div>
          {viewMode === "signals" ? (
            <>
              <SectionHeader
                icon="📶"
                title={language === "ar" ? "أقوى الإشارات الحية" : "Strongest Live Signals"}
                count={displayedSignals.length}
                language={language}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {topSignals.length === 0 && (
                  <div style={{
                    textAlign: "center", padding: "40px 20px",
                    color: "#4b5563", fontSize: "0.85rem",
                  }}>
                    {language === "ar" ? "جاري مسح الإشارات..." : "Scanning for signals..."}
                  </div>
                )}
                {topSignals.map((sig, i) => (
                  <div key={sig.id} className="radar-card-enter" style={{ animationDelay: `${i * 0.04}s` }}>
                    <RadarSignalCard signal={sig} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <SectionHeader
                icon="🔗"
                title={language === "ar" ? "تجمعات الإشارات المترابطة" : "Linked Signal Clusters"}
                count={clusters.length}
                language={language}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {clusters.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#4b5563", fontSize: "0.85rem" }}>
                    {language === "ar" ? "لا توجد تجمعات كافية حاليًا" : "Not enough clusters yet"}
                  </div>
                ) : clusters.map((cluster, i) => (
                  <ClusterCard key={cluster.id} cluster={cluster} language={language} index={i} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ─── RIGHT: Radar Visual + Alerts + Emerging ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* D. Critical Alerts */}
          <div style={{
            background: "linear-gradient(135deg, #0c0e14, #10141a)",
            border: "1px solid rgba(239,68,68,0.12)",
            borderRadius: "16px",
            padding: "16px",
          }}>
            <SectionHeader
              icon="🚨"
              title={language === "ar" ? "تنبيهات حرجة" : "Critical Alerts"}
              count={criticalSignals.length}
              language={language}
              color="#ef4444"
            />
            <RadarCriticalAlerts signals={signals} />
          </div>

          {/* E. Emerging Radar */}
          <div style={{
            background: "linear-gradient(135deg, #0c0e14, #10141a)",
            border: "1px solid rgba(129,140,248,0.12)",
            borderRadius: "16px",
            padding: "16px",
          }}>
            <SectionHeader
              icon="🔎"
              title={language === "ar" ? "إشارات ناشئة تستحق المراقبة" : "Emerging Signals Worth Watching"}
              count={emergingSignals.length}
              language={language}
              color="#818cf8"
            />
            {emergingSignals.length === 0 ? (
              <div style={{ color: "#4b5563", fontSize: "0.8rem", textAlign: "center", padding: "16px" }}>
                {language === "ar" ? "لا توجد إشارات ناشئة حاليًا" : "No emerging signals at this time"}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {emergingSignals.map(sig => (
                  <RadarSignalCard key={sig.id} signal={sig} compact />
                ))}
              </div>
            )}
          </div>

          {/* Stats footer */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            borderRadius: "12px", padding: "12px 14px",
            border: "1px solid rgba(255,255,255,0.04)",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.72rem" }}>
              <StatRow
                label={language === "ar" ? "إشارات نشطة" : "Active Signals"}
                value={stats.totalActive || 0}
              />
              <StatRow
                label={language === "ar" ? "حرجة" : "Critical"}
                value={stats.critical || 0}
                color="#ef4444"
              />
              <StatRow
                label={language === "ar" ? "مرتفعة" : "High"}
                value={stats.high || 0}
                color="#f59e0b"
              />
              <StatRow
                label={language === "ar" ? "تجمعات" : "Clusters"}
                value={clusters.length}
                color="#818cf8"
              />
              <StatRow
                label={language === "ar" ? "ذاكرة مؤكدة" : "Memory Confirmed"}
                value={signals.filter(s => s.memoryCorroborated).length}
                color="#22c55e"
              />
              <StatRow
                label={language === "ar" ? "وقت المسح" : "Scan Time"}
                value={`${stats.lastPollDuration || 0}ms`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function HeroStat({ label, value, color, icon, sub, small }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${color}22`,
      borderRadius: "12px",
      padding: "14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: 6 }}>
        <span style={{ fontSize: "14px" }}>{icon}</span>
        <span style={{ fontSize: "0.68rem", color: "#6b7280", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{
        fontSize: small ? "0.82rem" : "1.05rem",
        fontWeight: 800,
        color,
        lineHeight: 1.3,
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: "0.65rem", color: "#4b5563", marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}

function SectionHeader({ icon, title, count, language, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "16px" }}>{icon}</span>
        <span style={{ fontSize: "0.9rem", fontWeight: 800, color: color || "#e8edf2" }}>{title}</span>
      </div>
      {count !== undefined && (
        <span style={{
          fontSize: "0.68rem", fontWeight: 700,
          padding: "2px 10px", borderRadius: "8px",
          background: "rgba(56,189,248,0.1)", color: "#38bdf8",
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || "#e8edf2" }}>{value}</span>
    </div>
  );
}

/**
 * Mini radar visualization — animated concentric circles
 * with signal dots placed by severity.
 */
function RadarMiniVisual({ signals, scanAngle }) {
  const size = 200;
  const center = size / 2;
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Place top 12 signals as dots
  const dots = (signals || []).slice(0, 12).map((sig, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const dist = (1 - sig.radarScore / 100) * (center - 15) + 15;
    const x = center + Math.cos(angle) * dist;
    const y = center + Math.sin(angle) * dist;
    const col = severityColor(sig.severity);
    const r = sig.radarScore >= 70 ? 5 : sig.radarScore >= 40 ? 4 : 3;
    return { x, y, col, r, score: sig.radarScore, id: sig.id };
  });

  return (
    <div style={{
      background: "linear-gradient(135deg, #0a0e14, #0f1520)",
      border: "1px solid rgba(56,189,248,0.1)",
      borderRadius: "14px",
      padding: "16px",
      display: "flex", justifyContent: "center",
    }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Rings */}
        {rings.map((r, i) => (
          <circle
            key={i}
            cx={center} cy={center}
            r={r * (center - 5)}
            fill="none"
            stroke="rgba(56,189,248,0.08)"
            strokeWidth="1"
          />
        ))}

        {/* Cross lines */}
        <line x1={center} y1={5} x2={center} y2={size - 5} stroke="rgba(56,189,248,0.05)" />
        <line x1={5} y1={center} x2={size - 5} y2={center} stroke="rgba(56,189,248,0.05)" />

        {/* Sweep */}
        <line
          x1={center}
          y1={center}
          x2={center + Math.cos(scanAngle * Math.PI / 180) * (center - 5)}
          y2={center + Math.sin(scanAngle * Math.PI / 180) * (center - 5)}
          stroke="rgba(56,189,248,0.3)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Sweep fade trail */}
        <path
          d={`M ${center} ${center} L ${center + Math.cos((scanAngle - 30) * Math.PI / 180) * (center - 5)} ${center + Math.sin((scanAngle - 30) * Math.PI / 180) * (center - 5)} A ${center - 5} ${center - 5} 0 0 1 ${center + Math.cos(scanAngle * Math.PI / 180) * (center - 5)} ${center + Math.sin(scanAngle * Math.PI / 180) * (center - 5)} Z`}
          fill="rgba(56,189,248,0.04)"
        />

        {/* Signal dots */}
        {dots.map(d => (
          <g key={d.id}>
            <circle cx={d.x} cy={d.y} r={d.r + 3} fill={`${d.col}22`} />
            <circle cx={d.x} cy={d.y} r={d.r} fill={d.col} opacity={0.9} />
          </g>
        ))}

        {/* Center dot */}
        <circle cx={center} cy={center} r={3} fill="#38bdf8" />
      </svg>
    </div>
  );
}
