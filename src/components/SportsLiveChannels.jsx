import React, { useState, useMemo, useEffect } from "react";
import SportsChannelCard from "./SportsChannelCard";
import SportsLivePlayer from "./SportsLivePlayer";
import {
  getAllChannels,
  sortChannels,
  suggestChannelsForMatch,
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
 * SportsLiveChannels — Premium Arabic sports live TV channels hub.
 * Central place for watching Arabic sports coverage.
 */
export default function SportsLiveChannels({ activeMatch }) {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [countryFilter, setCountryFilter] = useState("all");
  const [liveChannelIds, setLiveChannelIds] = useState([]);
  const [channelStatuses, setChannelStatuses] = useState({});

  const allChannels = useMemo(() => getAllChannels(), []);

  // Fetch live channel statuses from API
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
      } catch {
        // non-critical
      }
    };

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Suggested channels for active match
  const matchSuggestions = useMemo(() => {
    if (!activeMatch?.league) return [];
    return suggestChannelsForMatch(activeMatch.league);
  }, [activeMatch]);

  // Filter channels
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

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Section header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "32px",
          padding: "28px 20px",
          background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))",
          borderRadius: "20px",
          border: "1px solid rgba(56,189,248,0.1)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(56,189,248,0.06) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "3px",
              color: "#38bdf8",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            LIVE SPORTS BROADCAST
          </div>
          <h2
            style={{
              fontSize: "26px",
              fontWeight: 900,
              color: "#f1f5f9",
              margin: "0 0 8px",
              lineHeight: 1.3,
            }}
          >
            📺 البث الرياضي المباشر
          </h2>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, maxWidth: "500px", marginInline: "auto" }}>
            القنوات الرياضية العربية الرسمية — بث مباشر وتغطية حية
          </p>

          {liveCount > 0 && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "14px",
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "20px",
                padding: "6px 16px",
                fontSize: "12px",
                fontWeight: 800,
                color: "#ef4444",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#ef4444",
                  boxShadow: "0 0 8px #ef4444",
                  animation: "channelHubLiveDot 1.5s ease-in-out infinite",
                }}
              />
              {liveCount} قناة تبث الآن
            </div>
          )}
        </div>
      </div>

      {/* Match suggestions */}
      {activeMatch && matchSuggestions.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #1a2a1a, #0f1f0f)",
            border: "1px solid rgba(74,222,128,0.2)",
            borderRadius: "16px",
            padding: "18px 22px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "16px" }}>⚽</span>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#4ade80" }}>
              القنوات التي قد تبث هذه المباراة
            </span>
          </div>
          {activeMatch.teams && (
            <div style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "12px" }}>
              {activeMatch.teams}
              {activeMatch.league && (
                <span style={{ color: "#64748b", marginInlineStart: "8px" }}>— {activeMatch.league}</span>
              )}
            </div>
          )}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {matchSuggestions.map(ch => (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(74,222,128,0.1)",
                  border: "1px solid rgba(74,222,128,0.25)",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  color: "#4ade80",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {ch.flag} {ch.name} ▶
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Country filter */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "24px",
          flexWrap: "wrap",
          padding: "0 8px",
        }}
      >
        {COUNTRY_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setCountryFilter(f.id)}
            style={{
              background: countryFilter === f.id
                ? "linear-gradient(135deg, #38bdf8, #0ea5e9)"
                : "rgba(255,255,255,0.04)",
              color: countryFilter === f.id ? "#0c1220" : "#94a3b8",
              border: countryFilter === f.id
                ? "1px solid #38bdf8"
                : "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      {/* Player */}
      {selectedChannel && (
        <div style={{ marginBottom: "28px" }}>
          <SportsLivePlayer
            channel={selectedChannel}
            onClose={() => setSelectedChannel(null)}
          />
        </div>
      )}

      {/* Channels grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "16px",
        }}
      >
        {filteredChannels.map(ch => (
          <SportsChannelCard
            key={ch.id}
            channel={ch}
            isLive={liveChannelIds.includes(ch.id)}
            currentProgram={channelStatuses[ch.id]?.currentProgram}
            onWatch={setSelectedChannel}
            active={selectedChannel?.id === ch.id}
          />
        ))}
      </div>

      {filteredChannels.length === 0 && (
        <div style={{ textAlign: "center", color: "#64748b", padding: "40px", fontSize: "14px" }}>
          لا توجد قنوات متاحة لهذا التصنيف
        </div>
      )}

      {/* Footer info */}
      <div
        style={{
          textAlign: "center",
          marginTop: "32px",
          padding: "16px",
          fontSize: "11px",
          color: "#475569",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        جميع البثوث من مصادر رسمية ومعتمدة فقط — لا يتم استخدام أي بث غير مرخص
      </div>

      <style>{`
        @keyframes channelHubLiveDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
