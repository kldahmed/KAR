import React, { useEffect, useState, useRef } from "react";
import NewsCard from "./components/NewsCard";
import BreakingNewsTicker from "./components/BreakingNewsTicker";
import ArticleModal from "./components/ArticleModal";
import WarRiskPanel from "./components/WarRiskPanel";
import StatsPanel from "./components/StatsPanel";
import LiveConflictMap from "./components/LiveConflictMap";
import EscalationTimelinePanel from "./components/EscalationTimelinePanel";
import AISummaryPanel from "./components/AISummaryPanel";
import GlobalRiskMeter from "./components/GlobalRiskMeter";
import LiveChannelsPanel from "./components/LiveChannelsPanel";
import GlobalIntelligenceCenter from "./components/GlobalIntelligenceCenter";
import ThreatRadar from "./components/ThreatRadar";
import StrategicForecast from "./components/StrategicForecast";
import EnergyShockIndex from "./components/EnergyShockIndex";
import XNewsFeed from "./components/XNewsFeed";

const DEMO_NEWS = [
  {
    id: "demo-1",
    title: "تحديثات إقليمية مستمرة في عدد من المناطق",
    summary: "هذه بيانات احتياطية تظهر عند تعذر الوصول إلى الخادم.",
    urgency: "medium",
    source: "Fallback Feed",
    time: new Date().toISOString(),
    category: "regional",
    url: "#",
    image: ""
  }
];
const CATEGORIES = [
  { id: "all", label: "الكل", emoji: "🌍" },
  { id: "regional", label: "إقليمي", emoji: "🗺️" },
  { id: "politics", label: "سياسة", emoji: "🏛️" },
  { id: "military", label: "عسكري", emoji: "⚔️" },
  { id: "economy", label: "اقتصاد", emoji: "💰" },
  { id: "sports", label: "رياضة", emoji: "⚽" }
];
const SPORTS_COMPETITIONS = [
  { id: "all", label: "الكل", emoji: "🌍" },
  { id: "uae", label: "الإماراتي", emoji: "🇦🇪" },
  { id: "premier-league", label: "الإنجليزي", emoji: "🏴" },
  { id: "laliga", label: "الإسباني", emoji: "🇪🇸" },
  { id: "champions-league", label: "الأبطال", emoji: "🏆" },
  { id: "transfers", label: "الانتقالات", emoji: "🔁" },
  { id: "world", label: "عالمي", emoji: "🌐" }
];
const TABS = [
  { id: "news", label: "الأخبار", icon: "📰" },
  { id: "intel", label: "مركز التحليل", icon: "🌐" },
  { id: "live", label: "البث المباشر", icon: "📺" },
  { id: "xfeed", label: "نبض X", icon: "𝕏" }
];
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Section error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            color: "#e74c3c",
            padding: "16px",
            textAlign: "center",
            background: "#222",
            borderRadius: "12px",
            margin: "18px auto",
            maxWidth: "1400px",
            border: "1px solid rgba(231,76,60,.25)"
          }}
        >
          ⚠️ تعذر تحميل هذا القسم حاليًا
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [tab, setTab] = useState("news");
  const [cat, setCat] = useState("all");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalArticle, setModalArticle] = useState(null);
  const intervalRef = useRef(null);
  const [sportsCompetition, setSportsCompetition] = useState("all");
  const [uaeStandings, setUaeStandings] = useState([]);
  const [isStandingsLoading, setIsStandingsLoading] = useState(false);
  const standingsFallbackRef = useRef(null);

  useEffect(() => {
    document.title = "Global Pulse 🌍";
  }, []);

const fetchNews = async () => {
  setLoading(true);
  setError("");

  try {
    let endpoint = `/api/news?category=${cat}`;

    if (cat === "sports") {
      endpoint = `/api/sports?competition=${sportsCompetition}`;
    }

    const res = await fetch(endpoint);
    if (!res.ok) throw new Error("fetch_failed");

    const data = await res.json();

    const incomingNews = Array.isArray(data.news) ? data.news.slice(0, 100) : [];

    // مهم جدًا: إذا كانت الفئة رياضة، لا نسمح إلا بأخبار sports فقط
    const filteredNews =
      cat === "sports"
        ? incomingNews.filter((item) => item.category === "sports")
        : incomingNews.filter((item) => item.category !== "sports" || cat === "all");

    setNews(filteredNews);
    setError("");
  } catch {
    setNews([]);
    setError("تعذر تحميل الأخبار من الخادم");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  if (tab !== "news") return;

  fetchNews();

  if (intervalRef.current) clearInterval(intervalRef.current);
  intervalRef.current = setInterval(fetchNews, 15000);

  return () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
}, [cat, tab, sportsCompetition]);

  const UAE_STANDINGS_FALLBACK = [
    { pos: 1,  team: "العين",         mp: 22, w: 17, d: 3, l: 2,  gf: 55, ga: 18, gd: 37,  pts: 54 },
    { pos: 2,  team: "شباب الأهلي",   mp: 22, w: 15, d: 4, l: 3,  gf: 48, ga: 22, gd: 26,  pts: 49 },
    { pos: 3,  team: "الوصل",         mp: 22, w: 13, d: 5, l: 4,  gf: 42, ga: 25, gd: 17,  pts: 44 },
    { pos: 4,  team: "الشارقة",       mp: 22, w: 12, d: 4, l: 6,  gf: 38, ga: 28, gd: 10,  pts: 40 },
    { pos: 5,  team: "النصر",         mp: 22, w: 11, d: 5, l: 6,  gf: 36, ga: 30, gd:  6,  pts: 38 },
    { pos: 6,  team: "الجزيرة",       mp: 22, w: 10, d: 4, l: 8,  gf: 33, ga: 32, gd:  1,  pts: 34 },
    { pos: 7,  team: "بني ياس",       mp: 22, w:  8, d: 5, l: 9,  gf: 28, ga: 35, gd: -7,  pts: 29 },
    { pos: 8,  team: "الفجيرة",       mp: 22, w:  7, d: 4, l: 11, gf: 25, ga: 38, gd: -13, pts: 25 },
    { pos: 9,  team: "الظفرة",        mp: 22, w:  6, d: 4, l: 12, gf: 22, ga: 40, gd: -18, pts: 22 },
    { pos: 10, team: "خورفكان",       mp: 22, w:  5, d: 4, l: 13, gf: 19, ga: 43, gd: -24, pts: 19 },
    { pos: 11, team: "إتحاد كلباء",   mp: 22, w:  4, d: 3, l: 15, gf: 17, ga: 48, gd: -31, pts: 15 },
    { pos: 12, team: "الحرة",         mp: 22, w:  2, d: 3, l: 17, gf: 13, ga: 56, gd: -43, pts:  9 }
  ];

  useEffect(() => {
    if (cat !== "sports" || sportsCompetition !== "uae") return;

    setIsStandingsLoading(true);

    if (standingsFallbackRef.current) clearTimeout(standingsFallbackRef.current);
    standingsFallbackRef.current = setTimeout(() => {
      setUaeStandings((prev) => {
        if (!prev.length) return UAE_STANDINGS_FALLBACK;
        return prev;
      });
      setIsStandingsLoading(false);
    }, 3000);

    fetch("/api/sports?competition=uae")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.standings) && data.standings.length) {
          setUaeStandings(data.standings);
          setIsStandingsLoading(false);
          if (standingsFallbackRef.current) clearTimeout(standingsFallbackRef.current);
        }
      })
      .catch(() => {
        setUaeStandings(UAE_STANDINGS_FALLBACK);
        setIsStandingsLoading(false);
        if (standingsFallbackRef.current) clearTimeout(standingsFallbackRef.current);
      });

    return () => {
      if (standingsFallbackRef.current) clearTimeout(standingsFallbackRef.current);
    };
  }, [cat, sportsCompetition]);

  const displayedNews =
    news.length > 0
      ? news
      : cat === "sports"
      ? []
      : DEMO_NEWS;
  const tickerHeadlines = displayedNews.slice(0, 10).map((n) => n.title);

  const handleCardClick = (article) => {
    setModalArticle(article);
    setModalOpen(true);
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#11151a",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif"
      }}
    >
      <BreakingNewsTicker headlines={tickerHeadlines} />

      <header
        style={{
          padding: "40px 0 26px",
          textAlign: "center",
          display: "flex",
          justifyContent: "center"
        }}
      >
        <div
          style={{
            padding: "26px 40px",
            borderRadius: "24px",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)"
          }}
        >
          <div
            style={{
              fontSize: "48px",
              fontWeight: 900,
              letterSpacing: "1px",
              color: "#f8fafc",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              justifyContent: "center",
              fontFamily:
                "Inter, Poppins, Satoshi, system-ui, -apple-system, sans-serif",
              textShadow: "0 4px 30px rgba(56,189,248,0.25)"
            }}
          >
            🌍 Global Pulse
          </div>

          <div
            style={{
              width: "160px",
              height: "4px",
              margin: "14px auto",
              borderRadius: "999px",
              background:
                "linear-gradient(90deg,#38bdf8,#60a5fa,#f3d38a,#38bdf8)",
              boxShadow: "0 0 14px rgba(56,189,248,.35)"
            }}
          />

          <div
            style={{
              color: "#94a3b8",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "4px",
              textTransform: "uppercase",
              fontFamily:
                "Inter, Poppins, Satoshi, system-ui, -apple-system, sans-serif"
            }}
          >
            Global News & Conflict Monitor
          </div>
        </div>
      </header>

      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "18px",
          marginBottom: "18px",
          flexWrap: "wrap"
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? "#f3d38a" : "#222",
              color: tab === t.id ? "#222" : "#f3d38a",
              border: "none",
              borderRadius: "10px",
              padding: "10px 22px",
              fontWeight: "700",
              fontSize: "1rem",
              cursor: "pointer"
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {tab === "news" && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "24px",
            flexWrap: "wrap",
            padding: "0 12px"
          }}
        >
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              style={{
                background: cat === c.id ? "#38bdf8" : "#222",
                color: cat === c.id ? "#fff" : "#38bdf8",
                border: "none",
                borderRadius: "10px",
                padding: "8px 16px",
                fontWeight: "700",
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      )}

      {tab === "news" && cat === "sports" && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "20px",
            flexWrap: "wrap",
            padding: "0 12px"
          }}
        >
          {SPORTS_COMPETITIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSportsCompetition(c.id)}
              style={{
                background: sportsCompetition === c.id ? "#f3d38a" : "#1a1f27",
                color: sportsCompetition === c.id ? "#222" : "#f3d38a",
                border: "1px solid rgba(243,211,138,0.3)",
                borderRadius: "10px",
                padding: "7px 14px",
                fontWeight: "700",
                fontSize: "0.9rem",
                cursor: "pointer"
              }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      )}


      <main style={{ padding: "0 20px 50px" }}>
        {tab === "news" && (
          <>
            {loading && (
              <div
                style={{
                  textAlign: "center",
                  color: "#38bdf8",
                  padding: "30px"
                }}
              >
                جاري التحميل...
              </div>
            )}

            {error && (
              <div
                style={{
                  textAlign: "center",
                  color: "#e74c3c",
                  padding: "30px"
                }}
              >
                {error}
              </div>
            )}

            {cat === "sports" && sportsCompetition === "uae" && (
              <div style={{ maxWidth: "900px", margin: "0 auto 28px" }}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #1a2a1a, #0f1f0f)",
                    border: "1px solid rgba(74,222,128,0.2)",
                    borderRadius: "16px",
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      padding: "16px 20px",
                      background: "rgba(74,222,128,0.08)",
                      borderBottom: "1px solid rgba(74,222,128,0.15)",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>🇦🇪</span>
                    <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#4ade80" }}>
                      ترتيب دوري أدنوك للمحترفين
                    </span>
                  </div>
                  {isStandingsLoading && !uaeStandings.length ? (
                    <div style={{ textAlign: "center", color: "#4ade80", padding: "24px" }}>
                      ⏳ جاري تحميل الترتيب...
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "0.88rem",
                          color: "#e2e8f0"
                        }}
                      >
                        <thead>
                          <tr style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", fontSize: "0.78rem" }}>
                            {["#", "النادي", "لع", "ف", "ت", "خ", "له", "عليه", "فرق", "نقاط"].map((h) => (
                              <th key={h} style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {uaeStandings.map((row, i) => (
                            <tr
                              key={row.pos}
                              style={{
                                borderTop: "1px solid rgba(255,255,255,0.05)",
                                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                                ...(row.pos <= 3 ? { borderRight: "3px solid #4ade80" } : {}),
                                ...(row.pos >= uaeStandings.length - 1 ? { borderRight: "3px solid #f87171" } : {})
                              }}
                            >
                              <td style={{ padding: "10px 12px", textAlign: "center", color: "#94a3b8" }}>{row.pos}</td>
                              <td style={{ padding: "10px 12px", fontWeight: 700, whiteSpace: "nowrap" }}>{row.team}</td>
                              <td style={{ padding: "10px 12px", textAlign: "center" }}>{row.mp}</td>
                              <td style={{ padding: "10px 12px", textAlign: "center", color: "#4ade80" }}>{row.w}</td>
                              <td style={{ padding: "10px 12px", textAlign: "center", color: "#fbbf24" }}>{row.d}</td>
                              <td style={{ padding: "10px 12px", textAlign: "center", color: "#f87171" }}>{row.l}</td>
                              <td style={{ padding: "10px 12px", textAlign: "center" }}>{row.gf}</td>
                              <td style={{ padding: "10px 12px", textAlign: "center" }}>{row.ga}</td>
                              <td style={{ padding: "10px 12px", textAlign: "center", color: row.gd >= 0 ? "#4ade80" : "#f87171" }}>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                              <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 900, fontSize: "1rem", color: "#f3d38a" }}>{row.pts}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}


            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "18px",
                maxWidth: "1400px",
                margin: "0 auto"
              }}
            >
              {displayedNews.map((item, idx) => (
                <NewsCard
                  key={item.id || idx}
                  {...item}
                  onClick={() => handleCardClick(item)}
                />
              ))}
            </div>
          </>
        )}

    {tab === "intel" && (
  <div
    style={{
      maxWidth: "1400px",
      margin: "0 auto",
      display: "grid",
      gap: "28px"
    }}
  >
    <ErrorBoundary>
      <GlobalIntelligenceCenter news={displayedNews} />
    </ErrorBoundary>

    <ErrorBoundary>
      <ThreatRadar news={displayedNews} />
    </ErrorBoundary>

    <ErrorBoundary>
      <StrategicForecast news={displayedNews} />
    </ErrorBoundary>

    <ErrorBoundary>
      <EnergyShockIndex news={displayedNews} />
    </ErrorBoundary>
  </div>
)}

        {tab === "live" && (
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <ErrorBoundary>
              <LiveChannelsPanel />
            </ErrorBoundary>
          </div>
        )}
      </main>

      <ArticleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        article={modalArticle}
      />

      {tab === "intel" && (
        <>
          <div
            style={{
              display: "flex",
              gap: "24px",
              flexWrap: "wrap",
              justifyContent: "center",
              margin: "10px 20px 32px"
            }}
          >
            <ErrorBoundary>
              <WarRiskPanel news={displayedNews} />
            </ErrorBoundary>

            <ErrorBoundary>
              <StatsPanel
                news={displayedNews}
                updated={news.length > 0 ? news[0].time : DEMO_NEWS[0].time}
              />
            </ErrorBoundary>
          </div>

          <div style={{ margin: "32px 20px" }}>
            <ErrorBoundary>
              <GlobalRiskMeter news={displayedNews} />
            </ErrorBoundary>
          </div>

          <div style={{ margin: "32px 20px" }}>
            <ErrorBoundary>
              <AISummaryPanel news={displayedNews} />
            </ErrorBoundary>
          </div>

          <div style={{ margin: "32px 20px" }}>
            <ErrorBoundary>
              <EscalationTimelinePanel news={displayedNews} />
            </ErrorBoundary>
          </div>
        </>
      )}
      {tab === "xfeed" && (
  <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
    <ErrorBoundary>
      <XNewsFeed />
    </ErrorBoundary>
  </div>
)}

      {tab === "live" && (
        <div style={{ margin: "32px 20px" }}>
          <ErrorBoundary>
            <LiveConflictMap />
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}
