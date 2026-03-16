import React, { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import NewsCard from "./components/NewsCard";
import HeroSection from "./components/HeroSection";
import VideoCard from "./components/VideoCard";
import ChannelCard from "./components/ChannelCard";
import WarRiskCard from "./components/WarRiskCard";
import ConflictMiniMap from "./components/ConflictMiniMap";
import StatsPanel from "./components/StatsPanel";
import TensionHeatmap from "./components/TensionHeatmap";
import TimelinePanel from "./components/TimelinePanel";
import AISummaryPanel from "./components/AISummaryPanel";
import * as Helpers from "./AppHelpers";

// ...existing code...

/* =========================
   Helpers
========================= */
function isValidYouTubeId(id) {
  return /^[a-zA-Z0-9_-]{11}$/.test(String(id || "").trim());
}

function safeText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}


/* =========================
   Main App
========================= */
export default function App() {
  const [alerts, setAlerts] = useState([]);
  const [tab, setTab] = useState("news");
  const [cat, setCat] = useState("all");
  const [xNews, setXNews] = useState([]);

  const [news, setNews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [updated, setUpdated] = useState("");

  const [loadN, setLoadN] = useState(false);
  const [loadV, setLoadV] = useState(false);
  const [loadL, setLoadL] = useState(false);

  const [errN, setErrN] = useState("");
  const [errV, setErrV] = useState("");
  const [errL, setErrL] = useState("");

  const [liveChannels, setLiveChannels] = useState([]);
  const [clockTime, setClockTime] = useState(formatDubaiTime());
  const [nextRefresh, setNextRefresh] = useState(60 * 1000);
  const [liveCh, setLiveCh] = useState(FALLBACK_LIVE_CHANNEL);
  const [radarPoints, setRadarPoints] = useState([]);

  const showCats = tab === "news" || tab === "videos";

  useEffect(() => {
    fetch("/api/xintel")
      .then((r) => r.json())
      .then((d) => setXNews(d.news || []))
      .catch(() => setXNews([]));
  }, []);

  const tensionData = useMemo(() => {
    const source = news.length ? news : DEMO_NEWS;

    const value = Math.min(
      100,
      source.reduce((acc, item) => {
        if (item.urgency === "high") return acc + 28;
        if (item.urgency === "medium") return acc + 14;
        return acc + 6;
      }, 0)
    );

    return [{ label: "now", value }];
  }, [news]);

  const ticker = useMemo(() => {
    const source = news.length ? news : DEMO_NEWS;
    return source.map((n) => n.title).slice(0, 20).join("   •   ");
  }, [news]);

  async function fetchNews(category = "all", force = false) {
    try {
      setLoadN(true);
      setErrN("");

      // منع التصنيفات غير المدعومة
      let apiCategory = category;
      if (["sports", "tourism", "markets"].includes(category)) {
        apiCategory = "all";
      }

      const url = `/api/news?category=${encodeURIComponent(apiCategory)}${force ? "&force=1" : ""}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      let data = { news: [], updated: "" };
      try {
        data = await res.json();
      } catch {
        data = { news: [], updated: "" };
      }

      // Always fallback to DEMO_NEWS if empty or failed
      const safeNewsData = Array.isArray(data.news) && data.news.length > 0 ? data.news.slice(0, 200) : DEMO_NEWS;

      setNews(safeNewsData);
      setUpdated(
        safeText(
          data?.updated,
          formatDisplayTime(new Date())
        )
      );

    } catch (err) {
      console.error("NEWS ERROR", err);
      setErrN(getUserErrorMessage());
      setNews(DEMO_NEWS);
      setAlerts((prev) =>
        prev.includes("تعذر تحميل الأخبار من الخادم")
          ? prev
          : [...prev, "تعذر تحميل الأخبار من الخادم"]
      );
    } finally {
      setLoadN(false);
    }
  }

  async function fetchRadar() {
    try {
      const res = await fetch("/api/radar", {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      const data = await res.json();
      setRadarPoints(Array.isArray(data?.aircraft) ? data.aircraft : []);
    } catch {
      setRadarPoints([]);
    }
  }

  async function fetchVideos(category = "all", force = false) {
    try {
      setLoadV(true);
      setErrV("");

      const url = `/api/videos?category=${encodeURIComponent(category)}${force ? "&force=1" : ""}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      if (!res.ok) {
        throw new Error("VIDEOS_API_FAILED");
      }

      const data = await res.json();
      const safeVideosData = safeArray(data?.videos).map(normalizeVideoItem);

      setVideos(safeVideosData.filter((v) => v.youtubeId));
    } catch {
      setErrV(getUserErrorMessage());
      setVideos([]);
      setAlerts((prev) =>
        prev.includes("تعذر تحميل الفيديوهات من الخادم") ? prev : [...prev, "تعذر تحميل الفيديوهات من الخادم"]
      );
    } finally {
      setLoadV(false);
    }
  }

  async function fetchLiveChannels() {
    try {
      setLoadL(true);
      setErrL("");

      let data = null;

      const primaryRes = await fetch("/api/live", {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      if (primaryRes.ok) {
        data = await primaryRes.json();
      } else {
        const backupRes = await fetch("/api/livebackup", {
          method: "GET",
          headers: { Accept: "application/json" }
        });

        if (!backupRes.ok) {
          throw new Error("LIVE_AND_BACKUP_FAILED");
        }

        data = await backupRes.json();
      }

      const channels = safeArray(data?.channels)
        .map(normalizeLiveChannel)
        .filter((ch) => ch.youtubeId || ch.externalUrl);

      setLiveChannels(channels);

      if (channels.length > 0) {
        setLiveCh((prev) => {
          const existing = channels.find((ch) => ch.id === prev?.id);
          return existing || channels[0];
        });
      } else {
        setLiveCh(FALLBACK_LIVE_CHANNEL);
        setErrL("لا توجد قنوات مباشرة متاحة الآن");
      }
    } catch {
      setErrL("تعذر تحميل البث المباشر");
      setLiveChannels([]);
      setLiveCh(FALLBACK_LIVE_CHANNEL);
    } finally {
      setLoadL(false);
    }
  }

  function changeCat(categoryId) {
    setCat(categoryId);
  }

  function refresh() {
    void fetchNews(cat, true);
    void fetchVideos(cat, true);
    void fetchLiveChannels();
    void fetchRadar();
    setNextRefresh(60 * 1000);
  }

  useEffect(() => {
    void fetchNews(cat);
    void fetchVideos(cat);
  }, [cat]);

  useEffect(() => {
    void fetchLiveChannels();
    void fetchRadar();
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setClockTime(formatDubaiTime());
      setNextRefresh((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (nextRefresh === 0) {
      refresh();
    }
  }, [nextRefresh]);

  const safeNewsList = news.length ? news : [];
  const safeVideosList = videos.length ? videos : [];
  const safeLiveChannels = liveChannels.length ? liveChannels : [];

  const currentLiveId =
    liveCh?.mode === "embed" && isValidYouTubeId(liveCh?.youtubeId) ? liveCh.youtubeId : "";

  const isExternalLive = liveCh?.mode === "external" && !!liveCh?.externalUrl;

  const currentWatchUrl = isExternalLive
    ? liveCh.externalUrl
    : currentLiveId
    ? `https://www.youtube.com/watch?v=${currentLiveId}`
    : "#";

  const currentEmbedUrl = currentLiveId
    ? `https://www.youtube-nocookie.com/embed/${currentLiveId}?autoplay=1&rel=0&modestbranding=1`
    : "";

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at top, ${bg2} 0%, ${bg1} 35%, ${bg0} 100%)`,
        color: text,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}
    >
      <style>{`
  * { box-sizing: border-box; }

  html, body, #root {
    margin: 0;
    min-height: 100%;
    background: ${bg0};
    color: ${text};
  }

  a { color: inherit; }

  .news-grid, .vid-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 14px;
  }

  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: .75; }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes glow {
    0% { text-shadow: 0 0 0 rgba(243,211,138,0); }
    50% { text-shadow: 0 0 10px rgba(243,211,138,.22); }
    100% { text-shadow: 0 0 0 rgba(243,211,138,0); }
  }

  @keyframes float {
    0% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
    100% { transform: translateY(0); }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes ticker {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @keyframes radarSpin {
    0% { transform: translate(-50%,-50%) rotate(0deg); }
    100% { transform: translate(-50%,-50%) rotate(360deg); }
  }

  @media (max-width: 900px) {
    .live-grid,
    .hero-grid,
    .top-stories-grid {
      grid-template-columns: 1fr !important;
    }
  }
`}</style>
      <AlertBanner alerts={alerts} onClose={() => setAlerts([])} />

      <div style={{ height: "4px", display: "flex" }}>
        <div style={{ width: "22%", background: "#c0392b" }} />
        <div style={{ flex: 1, background: "#00732f" }} />
        <div style={{ flex: 1, background: "#ffffff15" }} />
        <div style={{ flex: 1, background: "#000" }} />
      </div>

      <div
        style={{
          background: "linear-gradient(180deg,#0c0900,#060606)",
          borderBottom: `1px solid ${gold}2a`,
          padding: "14px 20px 0"
        }}
      >
        <div
          className="hdr"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
            gap: "12px",
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ animation: "float 3.5s ease-in-out infinite" }}>
              <FalconSVG size={44} color={gold} />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: "19px",
                    fontWeight: "900",
                    color: goldL,
                    animation: "glow 3s infinite",
                    letterSpacing: "2px"
                  }}
                >
                GLOBAL NEWS
                </span>
                <span style={{ color: "#444", fontSize: "12px" }}>by</span>
                <span style={{ color: gold, fontSize: "17px", fontWeight: "900", letterSpacing: "4px" }}>
                  
                </span>
                <span style={{ fontSize: "13px" }}>🇦🇪</span>
              </div>

              <div style={{ marginTop: "5px", marginBottom: "4px" }}>
                <UAEBar />
              </div>

              <div style={{ color: "#252525", fontSize: "9px", letterSpacing: "2px" }}>
                GLOBAL NEWS INTELLIGENCE DASHBOARD
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div
              style={{
                background: "#0d0a01",
                border: `1px solid ${gold}25`,
                borderRadius: "8px",
                padding: "5px 11px",
                textAlign: "center",
                minWidth: "80px"
              }}
            >
              <div style={{ color: "#2a2a2a", fontSize: "9px", letterSpacing: "1px", marginBottom: "2px" }}>
                UAE TIME
              </div>
              <div style={{ color: gold, fontSize: "12px", fontFamily: "monospace", fontWeight: "700" }}>
                {clockTime}
              </div>
            </div>

            <div
              style={{
                background: "#0d0a01",
                border: `1px solid ${green}33`,
                borderRadius: "8px",
                padding: "5px 11px",
                textAlign: "center",
                minWidth: "80px"
              }}
            >
              <div style={{ color: "#2a2a2a", fontSize: "9px", letterSpacing: "1px", marginBottom: "2px" }}>
                REFRESH IN
              </div>
              <div style={{ color: green, fontSize: "12px", fontFamily: "monospace", fontWeight: "700" }}>
                {fmtCountdown(nextRefresh)}
              </div>
            </div>

            <button onClick={refresh} disabled={loadN || loadV || loadL} style={buttonStyle()}>
              <span
                style={{
                  display: "inline-block",
                  animation: loadN || loadV || loadL ? "spin 1s linear infinite" : "none"
                }}
              >
                ⟳
              </span>
              {loadN || loadV || loadL ? "..." : "تحديث"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: active ? "rgba(200,150,12,.16)" : "transparent",
                  border: `1px solid ${active ? `${gold}77` : "rgba(255,255,255,.05)"}`,
                  color: active ? goldL : "#666",
                  borderRadius: "8px 8px 0 0",
                  padding: "7px 14px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: active ? "700" : "400",
                  fontFamily: "inherit",
                  transition: "all .2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>

        {showCats && (
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", padding: "8px 0 0" }}>
            {CATEGORIES.map((c) => {
              const active = cat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => changeCat(c.id)}
                  style={{
                    background: active ? `${CAT_COLORS[c.id].accent}25` : "rgba(255,255,255,.025)",
                    border: `1px solid ${active ? `${CAT_COLORS[c.id].accent}77` : "rgba(255,255,255,.06)"}`,
                    color: active ? CAT_COLORS[c.id].light : "#666",
                    borderRadius: "6px",
                    padding: "5px 12px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: active ? "700" : "400",
                    fontFamily: "inherit",
                    transition: "all .2s"
                  }}
                >
                  {c.emoji} {c.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          background: "#070500",
          borderBottom: `1px solid ${gold}15`,
          padding: "6px 0",
          overflow: "hidden"
        }}
      >
        <div style={{ whiteSpace: "nowrap", animation: "ticker 70s linear infinite", display: "inline-block" }}>
          <span style={{ color: gold, fontSize: "11.5px", padding: "0 40px", letterSpacing: ".3px" }}>
            {ticker || "لا توجد تحديثات حالية"}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {ticker || "لا توجد تحديثات حالية"}
          </span>
        </div>
      </div>

      <div style={{ padding: "18px 20px 50px" }}>
        {tab === "news" && (
          <div>
            {loadN && <Skeleton />}

            {errN && !loadN && (
              <div
                style={{
                  background: "linear-gradient(135deg,#100500,#0a0a0a)",
                  border: "1px solid #e74c3c33",
                  borderRadius: "14px",
                  padding: "20px",
                  marginBottom: "16px",
                  textAlign: "center"
                }}
              >
                <div style={{ color: "#e74c3c", fontSize: "14px", marginBottom: "8px" }}>⚠️ {errN}</div>
                <button onClick={() => fetchNews(cat, true)} style={buttonStyle()}>
                  إعادة المحاولة
                </button>
              </div>
            )}

            {!loadN && safeNewsList.length > 0 && (
              <div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "15px", flexWrap: "wrap", alignItems: "center" }}>
                  {["high", "medium", "low"].map((u) => {
                    const n = safeNewsList.filter((x) => x.urgency === u).length;
                    if (!n) return null;

                    return (
                      <div
                        key={u}
                        style={{
                          background: `${URGENCY_MAP[u].color}16`,
                          border: `1px solid ${URGENCY_MAP[u].color}30`,
                          borderRadius: "8px",
                          padding: "4px 11px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: URGENCY_MAP[u].color,
                            animation: u === "high" ? "pulse 1s infinite" : "none"
                          }}
                        />
                        <span style={{ color: URGENCY_MAP[u].color, fontSize: "12px", fontWeight: "700" }}>
                          {n} {URGENCY_MAP[u].label}
                        </span>
                      </div>
                    );
                  })}

                  <span style={{ color: "#444", fontSize: "11px", marginRight: "auto" }}>
                    {safeNewsList.length} خبر {updated ? `— ${updated}` : ""}
                  </span>

                  <span style={{ color: "#1f7a4d", fontSize: "11px", fontWeight: "700" }}>LIVE FEED</span>
                </div>

                <div className="news-grid">
                  {safeNewsList.map((item, i) => (
                    <NewsCard key={`${item.id}-${i}`} item={item} index={i} />
                  ))}
                </div>
              </div>
            )}

            {!loadN && !errN && safeNewsList.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#666",
                  padding: "40px",
                  border: "1px solid rgba(255,255,255,.05)",
                  borderRadius: "14px"
                }}
              >
                لا توجد أخبار متاحة حاليًا
              </div>
            )}
          </div>
        )}

        {tab === "videos" && (
          <div>
            {loadV && <Skeleton />}

            {errV && !loadV && (
              <div style={{ textAlign: "center", color: "#e74c3c", padding: "40px" }}>
                ⚠️ {errV}
                <br />
                <button onClick={() => fetchVideos(cat, true)} style={{ ...buttonStyle(), marginTop: "14px" }}>
                  إعادة المحاولة
                </button>
              </div>
            )}

            {!loadV && safeVideosList.length > 0 && (
              <div className="vid-grid">
                {safeVideosList.map((v, i) => (
                  <VideoCard key={`${v.id}-${i}`} item={v} />
                ))}
              </div>
            )}

            {!loadV && !errV && safeVideosList.length === 0 && (
              <div style={{ textAlign: "center", color: "#666", padding: "60px" }}>
                اضغط تحديث لتحميل الفيديوهات
              </div>
            )}
          </div>
        )}

        {tab === "stats" && (
          <div style={{ display: "grid", gap: "16px" }}>
            <WarRiskCard news={safeNewsList.length > 0 ? safeNewsList : DEMO_NEWS} tensionData={tensionData} />

            <ConflictMiniMap
              news={safeNewsList.length > 0 ? safeNewsList : DEMO_NEWS}
              radarPoints={radarPoints}
            />

            <TensionHeatmap news={safeNewsList.length > 0 ? safeNewsList : DEMO_NEWS} />

            <StatsPanel news={safeNewsList.length > 0 ? safeNewsList : DEMO_NEWS} tensionData={tensionData} />

            <TimelinePanel news={safeNewsList.length > 0 ? safeNewsList : DEMO_NEWS} />

            <AISummaryPanel news={safeNewsList.length > 0 ? safeNewsList : DEMO_NEWS} />
          </div>
        )}

        {tab === "live" && (
          <div
            className="live-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 285px",
              gap: "15px",
              alignItems: "start"
            }}
          >
            <div
              style={{
                background: "#0a0800",
                borderRadius: "16px",
                overflow: "hidden",
                border: `1px solid ${gold}2a`
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  background: "#0d0b00",
                  borderBottom: `1px solid ${gold}1a`,
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  flexWrap: "wrap"
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#e74c3c",
                    display: "inline-block",
                    animation: "pulse 1s infinite"
                  }}
                />
                <span
                  style={{
                    color: "#e74c3c",
                    fontWeight: "900",
                    fontSize: "11px",
                    letterSpacing: "2px"
                  }}
                >
                  LIVE
                </span>

                <span style={{ color: "#555", fontSize: "12px" }}>
                  {liveCh?.flag} {liveCh?.name}
                </span>

                {(currentLiveId || isExternalLive) && (
                  <a
                    href={currentWatchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginRight: "auto",
                      background: "#cc0000dd",
                      color: "#fff",
                      borderRadius: "6px",
                      padding: "5px 11px",
                      fontSize: "11px",
                      fontWeight: "700",
                      textDecoration: "none"
                    }}
                  >
                    ▶ مشاهدة
                  </a>
                )}
              </div>

              <div style={{ position: "relative", paddingBottom: "56.25%", background: "#000" }}>
                {currentLiveId ? (
                  <iframe
                    key={liveCh?.id}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      border: "none"
                    }}
                    src={currentEmbedUrl}
                    title={liveCh?.name || "Live stream"}
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : isExternalLive ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "14px",
                      color: "#bbb",
                      textAlign: "center",
                      padding: "20px"
                    }}
                  >
                    <div style={{ fontSize: "16px", fontWeight: "700", color: goldL }}>{liveCh?.name}</div>

                    <div style={{ fontSize: "13px", color: "#888", lineHeight: 1.8 }}>
                      هذه القناة تفتح خارج الموقع لضمان عمل البث بشكل صحيح
                    </div>

                    <a
                      href={currentWatchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: "#cc0000dd",
                        color: "#fff",
                        borderRadius: "8px",
                        padding: "10px 18px",
                        fontSize: "13px",
                        fontWeight: "700",
                        textDecoration: "none"
                      }}
                    >
                      فتح البث المباشر
                    </a>
                  </div>
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#777",
                      fontSize: "14px"
                    }}
                  >
                    رابط البث غير صالح
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: "9px 14px",
                  background: "#080600",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px"
                }}
              >
                <span style={{ color: "#333", fontSize: "11px" }}>لا يعمل البث؟</span>

                {(currentLiveId || isExternalLive) && (
                  <a
                    href={currentWatchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "rgba(204,0,0,.12)",
                      border: "1px solid rgba(204,0,0,.35)",
                      color: "#ff4444",
                      borderRadius: "6px",
                      padding: "5px 13px",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      textDecoration: "none"
                    }}
                  >
                    فتح البث
                  </a>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              <div
                style={{
                  color: `${gold}55`,
                  fontSize: "9px",
                  marginBottom: "4px",
                  fontWeight: "700",
                  letterSpacing: "2.5px"
                }}
              >
                LIVE CHANNELS
              </div>

              {loadL && <Skeleton />}

              {errL && !loadL && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#e74c3c",
                    padding: "18px",
                    border: "1px solid rgba(231,76,60,.2)",
                    borderRadius: "12px",
                    background: "rgba(231,76,60,.05)"
                  }}
                >
                  {errL}
                </div>
              )}

              {!loadL &&
                safeLiveChannels.map((ch) => (
                  <ChannelCard key={ch.id} ch={ch} active={liveCh?.id === ch.id} onSelect={setLiveCh} />
                ))}

              {!loadL && !errL && safeLiveChannels.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#666",
                    padding: "18px",
                    border: "1px solid rgba(255,255,255,.05)",
                    borderRadius: "12px"
                  }}
                >
                  لا توجد قنوات مباشرة متاحة الآن
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          borderTop: `1px solid ${gold}15`,
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <FalconSVG size={16} color={`${gold}55`} />
          <span style={{ color: "#333", fontSize: "10px", letterSpacing: "1.5px" }}>WAR UPDATE BY K.A.R 🇦🇪</span>
        </div>

        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ color: "#2c2c2c", fontSize: "10px" }}>للأغراض الإخبارية فقط</span>
          <div style={{ display: "flex", height: "10px", width: "32px", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ width: "22%", background: "#c0392b" }} />
            <div style={{ flex: 1, background: "#00732f" }} />
            <div style={{ flex: 1, background: "#fff2" }} />
            <div style={{ flex: 1, background: "#111" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
