import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import SportsChannelCard from "./SportsChannelCard";
import SportsLivePlayer from "./SportsLivePlayer";
import {
  getAllChannels,
  getFirstEmbeddable,
  sortChannels,
  suggestChannelsForMatch,
  getChannelsByType,
} from "../lib/sports/sportsChannelsRegistry";

const COUNTRY_FILTERS = [
  { id: "all", label: "الجميع", emoji: "🌍" },
  { id: "AE", label: "الإمارات", emoji: "🇦🇪" },
  { id: "SA", label: "السعودية", emoji: "🇸🇦" },
  { id: "QA", label: "قطر", emoji: "🇶🇦" },
  { id: "EG", label: "مصر", emoji: "🇪🇬" },
  { id: "MA", label: "المغرب", emoji: "🇲🇦" },
  { id: "DZ", label: "الجزائر", emoji: "🇩🇿" },
  { id: "regional", label: "إقليمي", emoji: "📡" },
];

const REGIONAL_CODES = new Set(["OM", "KW", "BH", "IQ", "JO", "TN"]);

/**
 * SportsLiveChannels — Full in-page Arabic sports broadcast center.
 * Features a cinematic player at the top that auto-plays the first embeddable channel,
 * with a channel selector grid below for instant switching.
 */
export default function SportsLiveChannels({ activeMatch }) {
  const [activeChannel, setActiveChannel] = useState(null);
  const [countryFilter, setCountryFilter] = useState("all");
  const [liveChannelIds, setLiveChannelIds] = useState([]);
  const [channelStatuses, setChannelStatuses] = useState({});
  const [playerVisible, setPlayerVisible] = useState(true);
  const playerRef = useRef(null);
  const didAutoSelect = useRef(false);

  const allChannels = useMemo(() => getAllChannels(), []);

  // ── Fetch live statuses ──
  useEffect(() => {
    let cancelled = false;
    const fetchStatuses = async () => {
      try {
        const res = await fetch("/api/sports-live-channels");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.liveIds) setLiveChannelIds(data.liveIds);
        if (data.statuses) setChannelStatuses(data.statuses);
      } catch { /* non-critical */ }
    };
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // ── Auto-select first verified embeddable channel ──
  // Waits for liveIds to be fetched so we can make an informed selection
  useEffect(() => {
    if (didAutoSelect.current) return;
    const first = getFirstEmbeddable(liveChannelIds);
    if (first) {
      setActiveChannel(first);
      setPlayerVisible(true);
      didAutoSelect.current = true;
    }
  }, [liveChannelIds]);

  // ── Switch channel handler — scroll player into view ──
  const switchChannel = useCallback((ch) => {
    setActiveChannel(ch);
    setPlayerVisible(true);
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const closePlayer = useCallback(() => {
    setPlayerVisible(false);
  }, []);

  // ── Match suggestions ──
  const matchSuggestions = useMemo(() => {
    if (!activeMatch?.league) return [];
    return suggestChannelsForMatch(activeMatch.league);
  }, [activeMatch]);

  // ── Filtered + sorted channels ──
  const filteredChannels = useMemo(() => {
    let channels = allChannels;
    if (countryFilter === "regional") {
      channels = channels.filter(ch => REGIONAL_CODES.has(ch.countryCode));
    } else if (countryFilter !== "all") {
      channels = channels.filter(ch => ch.countryCode === countryFilter);
    }
    return sortChannels(channels, liveChannelIds);
  }, [allChannels, countryFilter, liveChannelIds]);

  const liveCount = allChannels.filter(ch => liveChannelIds.includes(ch.id)).length;
  const playableCount = allChannels.filter(ch => ch.playMode === "EMBED" || ch.playMode === "HYBRID").length;
  const verifiedCount = allChannels.filter(ch => ch.canEmbed && ch.isVerifiedWorking).length;

  // Split filtered channels into playable (EMBED/HYBRID) and external-only
  const { playable: playableChannels, external: externalChannels } = useMemo(() => {
    return getChannelsByType(filteredChannels);
  }, [filteredChannels]);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION HEADER
          ════════════════════════════════════════════════════════════════════ */}
      <div style={{
        textAlign: "center", marginBottom: "24px", padding: "24px 20px",
        background: "linear-gradient(135deg, rgba(10,15,24,0.95), rgba(20,30,50,0.85))",
        borderRadius: "20px", border: "1px solid rgba(56,189,248,0.08)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(rgba(56,189,248,0.04) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{
            fontSize: "10px", fontWeight: 800, letterSpacing: "4px",
            color: "#38bdf8", textTransform: "uppercase", marginBottom: "6px",
          }}>
            LIVE SPORTS BROADCAST CENTER
          </div>
          <h2 style={{
            fontSize: "24px", fontWeight: 900, color: "#f1f5f9",
            margin: "0 0 6px", lineHeight: 1.3,
          }}>
            📺 البث الرياضي المباشر
          </h2>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
            شاهد القنوات الرياضية العربية مباشرة داخل المنصة — {playableCount} قناة قابلة للبث
            {verifiedCount > 0 && <span style={{ color: "#4ade80" }}> ({verifiedCount} مُتحقق)</span>}
          </p>

          <div style={{
            display: "flex", justifyContent: "center", gap: "12px",
            marginTop: "12px", flexWrap: "wrap",
          }}>
            {liveCount > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "20px", padding: "4px 14px",
                fontSize: "11px", fontWeight: 800, color: "#ef4444",
              }}>
                <span style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  background: "#ef4444", boxShadow: "0 0 6px #ef4444",
                  animation: "hubLiveDot 1.2s ease-in-out infinite",
                }} />
                {liveCount} قناة تبث الآن
              </span>
            )}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)",
              borderRadius: "20px", padding: "4px 14px",
              fontSize: "11px", fontWeight: 700, color: "#4ade80",
            }}>
              ▶ بث مباشر داخل الصفحة
            </span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CINEMATIC IN-PAGE PLAYER (always visible when a channel is active)
          ════════════════════════════════════════════════════════════════════ */}
      <div ref={playerRef}>
        {activeChannel && playerVisible ? (
          <div style={{ marginBottom: "24px" }}>
            <SportsLivePlayer
              channel={activeChannel}
              onClose={closePlayer}
              isLive={liveChannelIds.includes(activeChannel.id)}
              currentProgram={channelStatuses[activeChannel.id]?.currentProgram || activeChannel.currentProgram}
              onSelectAnother={() => {
                if (playerRef.current) {
                  const grid = playerRef.current.parentElement?.querySelector('[data-channels-grid]');
                  if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            />
          </div>
        ) : (
          /* ── Default placeholder when no player active ── */
          <div style={{
            marginBottom: "24px", borderRadius: "20px", overflow: "hidden",
            background: "linear-gradient(135deg, #0a0f18, #111827)",
            border: "1px solid rgba(255,255,255,0.06)",
            position: "relative",
          }}>
            <div style={{
              position: "relative", width: "100%", paddingTop: "40%", minHeight: "220px",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: "16px",
                background: "radial-gradient(ellipse at 50% 40%, #1a2636, #0a0f18)",
              }}>
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.03,
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)",
                }} />
                <div style={{ fontSize: "48px", opacity: 0.3 }}>📺</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#475569" }}>
                  اختر قناة للمشاهدة المباشرة
                </div>
                <div style={{ fontSize: "12px", color: "#334155", maxWidth: "360px", textAlign: "center", lineHeight: 1.6 }}>
                  اضغط على أي قناة أدناه لبدء البث مباشرة داخل هذه الصفحة
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MATCH SUGGESTIONS
          ════════════════════════════════════════════════════════════════════ */}
      {activeMatch && matchSuggestions.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #1a2a1a, #0f1f0f)",
          border: "1px solid rgba(74,222,128,0.2)",
          borderRadius: "16px", padding: "16px 20px", marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "15px" }}>⚽</span>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#4ade80" }}>
              القنوات التي قد تبث هذه المباراة
            </span>
          </div>
          {activeMatch.teams && (
            <div style={{ fontSize: "12px", color: "#cbd5e1", marginBottom: "10px" }}>
              {activeMatch.teams}
              {activeMatch.league && <span style={{ color: "#64748b", marginInlineStart: "6px" }}>— {activeMatch.league}</span>}
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {matchSuggestions.map(ch => (
              <button key={ch.id} onClick={() => switchChannel(ch)} style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                background: activeChannel?.id === ch.id ? "rgba(74,222,128,0.2)" : "rgba(74,222,128,0.08)",
                border: `1px solid ${activeChannel?.id === ch.id ? "rgba(74,222,128,0.5)" : "rgba(74,222,128,0.2)"}`,
                borderRadius: "10px", padding: "7px 12px",
                color: "#4ade80", fontSize: "12px", fontWeight: 700, cursor: "pointer",
              }}>
                {ch.flag} {ch.nameAr} ▶
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          COUNTRY FILTER
          ════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: "flex", justifyContent: "center", gap: "6px",
        marginBottom: "20px", flexWrap: "wrap", padding: "0 8px",
      }}>
        {COUNTRY_FILTERS.map(f => (
          <button key={f.id} onClick={() => setCountryFilter(f.id)} style={{
            background: countryFilter === f.id
              ? "linear-gradient(135deg, #38bdf8, #0ea5e9)"
              : "rgba(255,255,255,0.03)",
            color: countryFilter === f.id ? "#0c1220" : "#94a3b8",
            border: countryFilter === f.id ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.06)",
            borderRadius: "10px", padding: "6px 12px",
            fontSize: "12px", fontWeight: 700, cursor: "pointer",
            transition: "all 0.2s ease",
          }}>
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CHANNELS GRID — split into playable (in-site) and external sections
          ════════════════════════════════════════════════════════════════════ */}

      {/* ── TYPE A: Playable Inside Site ── */}
      {playableChannels.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            marginBottom: "12px", padding: "0 4px",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)",
              borderRadius: "12px", padding: "6px 14px",
            }}>
              <span style={{ fontSize: "14px" }}>▶</span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#4ade80" }}>
                يعمل داخل الموقع
              </span>
              <span style={{
                fontSize: "10px", fontWeight: 700, color: "#22c55e",
                background: "rgba(74,222,128,0.15)", borderRadius: "8px", padding: "2px 8px",
              }}>
                {playableChannels.length}
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "#475569" }}>
              اضغط للمشاهدة مباشرة داخل الصفحة
            </span>
          </div>
          <div data-channels-grid style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "12px",
          }}>
            {playableChannels.map(ch => (
              <SportsChannelCard
                key={ch.id}
                channel={ch}
                isLive={liveChannelIds.includes(ch.id)}
                currentProgram={channelStatuses[ch.id]?.currentProgram || ch.currentProgram}
                onWatch={switchChannel}
                active={activeChannel?.id === ch.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── TYPE B: Official External Only ── */}
      {externalChannels.length > 0 && (
        <div>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            marginBottom: "12px", padding: "0 4px",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.12)",
              borderRadius: "12px", padding: "6px 14px",
            }}>
              <span style={{ fontSize: "14px" }}>🌐</span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#94a3b8" }}>
                مشاهدة من المصدر الرسمي
              </span>
              <span style={{
                fontSize: "10px", fontWeight: 700, color: "#64748b",
                background: "rgba(148,163,184,0.1)", borderRadius: "8px", padding: "2px 8px",
              }}>
                {externalChannels.length}
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "#475569" }}>
              متاح عبر الموقع الرسمي للقناة
            </span>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "12px",
          }}>
            {externalChannels.map(ch => (
              <SportsChannelCard
                key={ch.id}
                channel={ch}
                isLive={liveChannelIds.includes(ch.id)}
                currentProgram={channelStatuses[ch.id]?.currentProgram || ch.currentProgram}
                onWatch={switchChannel}
                active={activeChannel?.id === ch.id}
              />
            ))}
          </div>
        </div>
      )}

      {playableChannels.length === 0 && externalChannels.length === 0 && (
        <div style={{ textAlign: "center", color: "#475569", padding: "40px", fontSize: "13px" }}>
          لا توجد قنوات متاحة لهذا التصنيف
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        textAlign: "center", marginTop: "28px", padding: "14px",
        fontSize: "11px", color: "#334155",
        borderTop: "1px solid rgba(255,255,255,0.03)",
      }}>
        جميع البثوث من مصادر رسمية ومعتمدة فقط — لا يتم استخدام أي بث غير مرخص
      </div>

      <style>{`
        @keyframes hubLiveDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
