/**
 * SignalTimeline — Phase 8: Event Timeline
 * Shows how signals evolve over time: today, 6h, yesterday windows.
 * Helps users see trends rather than isolated events.
 */
import React, { useEffect, useState, useMemo } from "react";
import { getGlobalEvents } from "../lib/globalEventsEngine";
import { getWorldState, subscribeWorldState } from "../lib/worldStateEngine";
import { useI18n } from "../i18n/I18nProvider";

const P = {
  bg: "#060a10",
  surface: "#0a0f1c",
  gold: "#f3d38a",
  blue: "#38bdf8",
  green: "#22c55e",
  red: "#ef4444",
  amber: "#f59e0b",
  purple: "#a78bfa",
  text: "#e2e8f0",
  textDim: "#64748b",
  muted: "#475569",
};

const CAT_COLORS = {
  conflict: "#ef4444",
  military: "#ef4444",
  diplomacy: "#22c55e",
  economy: "#f59e0b",
  energy: "#fbbf24",
  politics: "#a78bfa",
  sports: "#38bdf8",
  default: "#64748b",
};

function categorizeTimeWindow(timestamp) {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours <= 6) return "6h";
  if (hours <= 24) return "today";
  return "yesterday";
}

export default function SignalTimeline() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const [ws, setWs] = useState(null);
  const [activeWindow, setActiveWindow] = useState("6h");

  useEffect(() => {
    setWs(getWorldState());
    const unsub = subscribeWorldState(s => setWs(s));
    return unsub;
  }, []);

  const events = useMemo(() => {
    const all = getGlobalEvents() || [];
    return all.map(e => ({
      ...e,
      timeWindow: categorizeTimeWindow(e.timestamp),
    }));
  }, [ws?.timestamp]);

  const windows = [
    { id: "6h", label: isAr ? "آخر 6 ساعات" : "Last 6 Hours", icon: "⏱️" },
    { id: "today", label: isAr ? "اليوم" : "Today", icon: "📅" },
    { id: "yesterday", label: isAr ? "أمس" : "Yesterday", icon: "📆" },
  ];

  const filteredEvents = events.filter(e => e.timeWindow === activeWindow);
  const windowCounts = {
    "6h": events.filter(e => e.timeWindow === "6h").length,
    "today": events.filter(e => e.timeWindow === "today").length,
    "yesterday": events.filter(e => e.timeWindow === "yesterday").length,
  };

  // Category breakdown for current window
  const catBreakdown = {};
  filteredEvents.forEach(e => {
    const cat = e.category || "other";
    if (!catBreakdown[cat]) catBreakdown[cat] = { count: 0, totalSeverity: 0 };
    catBreakdown[cat].count++;
    catBreakdown[cat].totalSeverity += e.severity || 0;
  });

  return (
    <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 10, fontWeight: 900, letterSpacing: 4,
          color: P.gold, textTransform: "uppercase", marginBottom: 2,
        }}>
          {isAr ? "الخط الزمني للإشارات" : "SIGNAL TIMELINE"}
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: P.text }}>
          {isAr ? "كيف تتطور الأحداث عبر الزمن؟" : "How are events evolving over time?"}
        </div>
      </div>

      <div style={{
        background: `linear-gradient(160deg, ${P.bg}, ${P.surface})`,
        border: "1px solid rgba(56,189,248,0.06)",
        borderRadius: 20,
        overflow: "hidden",
      }}>
        {/* Time window tabs */}
        <div style={{
          display: "flex", gap: 0,
          borderBottom: "1px solid rgba(56,189,248,0.06)",
        }}>
          {windows.map(w => (
            <button key={w.id} onClick={() => setActiveWindow(w.id)} style={{
              flex: 1, padding: "12px 16px",
              background: activeWindow === w.id ? "rgba(56,189,248,0.06)" : "transparent",
              border: "none",
              borderBottom: activeWindow === w.id ? `2px solid ${P.blue}` : "2px solid transparent",
              color: activeWindow === w.id ? P.blue : P.textDim,
              fontSize: 12, fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <span>{w.icon}</span>
              <span>{w.label}</span>
              <span style={{
                fontSize: 10, fontWeight: 800,
                background: activeWindow === w.id ? `${P.blue}20` : "rgba(255,255,255,0.04)",
                borderRadius: 6, padding: "1px 6px",
                color: activeWindow === w.id ? P.blue : P.muted,
              }}>
                {windowCounts[w.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Category summary strip */}
        {Object.keys(catBreakdown).length > 0 && (
          <div style={{
            display: "flex", gap: 8, padding: "10px 16px",
            borderBottom: "1px solid rgba(56,189,248,0.04)",
            flexWrap: "wrap",
          }}>
            {Object.entries(catBreakdown)
              .sort(([, a], [, b]) => b.count - a.count)
              .slice(0, 6)
              .map(([cat, data]) => (
                <div key={cat} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 10, fontWeight: 600,
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: CAT_COLORS[cat] || CAT_COLORS.default,
                  }} />
                  <span style={{ color: P.textDim }}>{cat}</span>
                  <span style={{ color: CAT_COLORS[cat] || P.muted, fontWeight: 800 }}>{data.count}</span>
                </div>
              ))}
          </div>
        )}

        {/* Timeline events */}
        <div style={{ padding: "12px 16px", maxHeight: 360, overflowY: "auto" }}>
          {filteredEvents.length === 0 && (
            <div style={{ textAlign: "center", color: P.muted, padding: 30, fontSize: 12 }}>
              {isAr ? "لا توجد أحداث في هذه الفترة" : "No events in this time window"}
            </div>
          )}

          {filteredEvents.map((event, i) => {
            const color = CAT_COLORS[event.category] || CAT_COLORS.default;
            const time = new Date(event.timestamp).toLocaleTimeString(isAr ? "ar-AE" : "en-GB", {
              hour: "2-digit", minute: "2-digit",
            });
            return (
              <div key={event.id || i} style={{
                display: "flex", gap: 12, padding: "10px 0",
                borderBottom: i < filteredEvents.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
              }}>
                {/* Timeline indicator */}
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  width: 36, flexShrink: 0,
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: color,
                    boxShadow: `0 0 6px ${color}40`,
                  }} />
                  {i < filteredEvents.length - 1 && (
                    <div style={{
                      width: 1, flex: 1, marginTop: 4,
                      background: "rgba(255,255,255,0.06)",
                    }} />
                  )}
                </div>

                {/* Event content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, marginBottom: 3,
                  }}>
                    <span style={{ fontSize: 10, color: P.muted, fontWeight: 600 }}>{time}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 800, color, letterSpacing: 1,
                      background: `${color}10`, borderRadius: 4, padding: "1px 6px",
                      textTransform: "uppercase",
                    }}>
                      {event.category || "event"}
                    </span>
                    {event.severity >= 50 && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, color: P.red,
                        background: "rgba(239,68,68,0.08)", borderRadius: 4, padding: "1px 6px",
                      }}>
                        {isAr ? "عالي" : "HIGH"}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: P.text, lineHeight: 1.5,
                    overflow: "hidden", textOverflow: "ellipsis",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {event.title}
                  </div>
                  {event.region && (
                    <div style={{ fontSize: 10, color: P.textDim, marginTop: 2, fontWeight: 500 }}>
                      📍 {event.region}
                    </div>
                  )}
                </div>

                {/* Severity indicator */}
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>
                  <div style={{
                    fontSize: 16, fontWeight: 900, color,
                    fontFamily: "Inter, system-ui",
                  }}>
                    {event.severity || 0}
                  </div>
                  <div style={{ fontSize: 8, color: P.muted, fontWeight: 600 }}>
                    {isAr ? "الشدة" : "SEV"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
