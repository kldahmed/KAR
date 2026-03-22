import React, { Suspense, lazy, useEffect, useState } from "react";
import BreakingNewsTicker from "./components/BreakingNewsTicker";
import ArticleModal from "./components/ArticleModal";
import { useI18n } from "./i18n/I18nProvider";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { startEngine as startGlobalEventsEngine, stopEngine as stopGlobalEventsEngine } from "./lib/globalEventsEngine";
import AgentPresence from "./components/AgentPresence";
import GlobalVoiceBriefing from "./components/GlobalVoiceBriefing";
import WorldEyeMode from "./components/WorldEyeMode";
import TopSectionNav from "./components/TopSectionNav";
import { useCurrentPath } from "./lib/simpleRouter";
import { useDashboardData } from "./lib/useDashboardData";
import AppSectionBoundary from "./components/AppSectionBoundary";

const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const WorldStatePage = lazy(() => import("./pages/WorldStatePage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const RadarPage = lazy(() => import("./pages/RadarPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const AnalysisCenterPage = lazy(() => import("./pages/AnalysisCenterPage"));
const LinkCenterPage = lazy(() => import("./pages/LinkCenterPage"));
const ForecastPage = lazy(() => import("./pages/ForecastPage"));
const AgentPage = lazy(() => import("./pages/AgentPage"));
const LivePage = lazy(() => import("./pages/LivePage"));

export default function App() {
  const { t, direction, language } = useI18n();
  const { currentPath, currentRoute, navigate } = useCurrentPath("/");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalArticle, setModalArticle] = useState(null);
  const [worldEyeOpen, setWorldEyeOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  const {
    categories,
    sportsCompetitions,
    cat,
    setCat,
    sportsCompetition,
    setSportsCompetition,
    displayedNews,
    loading,
    error,
    uaeStandings,
    uaeStandingsUpdatedAt,
    isStandingsLoading,
    intelRefreshKey,
    intelMetrics,
    tickerHeadlines,
    lastUpdated,
  } = useDashboardData({ t, currentPath });

  useEffect(() => {
    document.title = `${t("app.title")} 🌍`;
  }, [t, language]);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 520);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    startGlobalEventsEngine();
    return () => stopGlobalEventsEngine();
  }, []);

  useEffect(() => {
    setRouteLoading(true);
    const timer = window.setTimeout(() => setRouteLoading(false), 260);
    return () => window.clearTimeout(timer);
  }, [currentPath]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!event.altKey) return;
      const keyRouteMap = {
        "1": "/",
        "2": "/world-state",
        "3": "/news",
        "4": "/events",
        "5": "/radar",
        "6": "/analysis-center",
        "7": "/link-center",
        "8": "/forecast",
        "9": "/agent",
        "0": "/live",
      };
      const nextRoute = keyRouteMap[event.key];
      if (!nextRoute) return;
      event.preventDefault();
      navigate(nextRoute);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  const handleCardClick = (article) => {
    setModalArticle(article);
    setModalOpen(true);
  };

  const routeFallback = (
    <div style={{ maxWidth: 1400, margin: "24px auto", padding: "16px 20px" }}>
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
          borderRadius: 16,
          minHeight: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontSize: 13,
        }}
      >
        جارٍ تحميل الصفحة...
      </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPath) {
      case "/world-state":
        return <WorldStatePage language={language} intelMetrics={intelMetrics} refreshKey={intelRefreshKey} />;
      case "/news":
        return (
          <NewsPage
            language={language}
            categories={categories}
            cat={cat}
            setCat={setCat}
            sportsCompetitions={sportsCompetitions}
            sportsCompetition={sportsCompetition}
            setSportsCompetition={setSportsCompetition}
            displayedNews={displayedNews}
            loading={loading}
            error={error}
            handleCardClick={handleCardClick}
            uaeStandings={uaeStandings}
            uaeStandingsUpdatedAt={uaeStandingsUpdatedAt}
            isStandingsLoading={isStandingsLoading}
          />
        );
      case "/radar":
        return <RadarPage language={language} />;
      case "/events":
        return <EventsPage language={language} />;
      case "/link-center":
        return <LinkCenterPage language={language} refreshKey={intelRefreshKey} />;
      case "/analysis-center":
        return <AnalysisCenterPage language={language} displayedNews={displayedNews} intelMetrics={intelMetrics} refreshKey={intelRefreshKey} />;
      case "/forecast":
        return <ForecastPage language={language} displayedNews={displayedNews} refreshKey={intelRefreshKey} />;
      case "/agent":
        return <AgentPage language={language} refreshKey={intelRefreshKey} />;
      case "/live":
        return <LivePage language={language} />;
      default:
        return (
          <OverviewPage
            language={language}
            navigate={navigate}
            tickerHeadlines={tickerHeadlines}
            lastUpdated={lastUpdated}
            intelMetrics={intelMetrics}
            refreshKey={intelRefreshKey}
            displayedNews={displayedNews}
            loading={loading}
          />
        );
    }
  };

  return (
    <div
      dir={direction}
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #060a10, #0a0f1c 15%, #070b12)",
        color: "#e2e8f0",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        position: "relative"
      }}
    >
      <div className="nr-bg-grid" />
      <div className="nr-bg-beam" />

      <header
        style={{
          padding: "16px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(243,211,138,0.06)",
          background: "linear-gradient(180deg, rgba(6,10,16,0.98), rgba(10,15,28,0.96))",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 900,
              letterSpacing: "0.5px",
              color: "#f8fafc",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontFamily: "Inter, system-ui, -apple-system, sans-serif"
            }}
          >
            🌐 {t("app.title")}
          </div>
          <div
            style={{
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "3px",
              color: "#f3d38a",
              textTransform: "uppercase",
              marginTop: 3,
              opacity: 0.7
            }}
          >
            {language === "ar" ? "منصة الوعي العالمي العربية" : "Arabic World Awareness Platform"}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setWorldEyeOpen(true)}
            style={{
              background: "linear-gradient(135deg, rgba(56,189,248,0.08), rgba(167,139,250,0.08))",
              border: "1px solid rgba(56,189,248,0.2)",
              borderRadius: 10,
              padding: "6px 14px",
              color: "#38bdf8",
              fontWeight: 700,
              fontSize: "0.78rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.25s ease",
              fontFamily: "Inter, system-ui, sans-serif"
            }}
            title={language === "ar" ? "عين العالم — وضع المراقبة" : "World Eye — Monitoring Mode"}
          >
            👁️ {language === "ar" ? "عين العالم" : "World Eye"}
          </button>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="app-ops-strip">
        <div className="app-ops-strip__inner">
          <div className="app-ops-strip__group">
            <span className="app-ops-strip__dot" />
            <span>{language === "ar" ? "النظام تشغيلي" : "System operational"}</span>
          </div>
          <div className="app-ops-strip__group">
            <span>{language === "ar" ? "المسار الحالي" : "Current route"}:</span>
            <strong>{language === "ar" ? currentRoute.titleAr : currentRoute.titleEn}</strong>
          </div>
          <div className="app-ops-strip__group">
            <span>{language === "ar" ? "آخر تحديث" : "Last update"}:</span>
            <strong>{lastUpdated}</strong>
          </div>
          <div className="app-ops-strip__group">
            <span>{language === "ar" ? "اختصارات" : "Shortcuts"}:</span>
            <strong>Alt+1..0</strong>
          </div>
        </div>
        <div className={routeLoading ? "app-route-progress active" : "app-route-progress"} />
      </div>

      <TopSectionNav currentPath={currentPath} navigate={navigate} language={language} />

      <BreakingNewsTicker headlines={tickerHeadlines} />

      {worldEyeOpen ? <WorldEyeMode onClose={() => setWorldEyeOpen(false)} /> : null}

      <main>
        <AppSectionBoundary resetKey={currentPath}>
          <Suspense fallback={routeFallback}>{renderPage()}</Suspense>
        </AppSectionBoundary>
      </main>

      {showBackToTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={language === "ar" ? "العودة للأعلى" : "Back to top"}
          title={language === "ar" ? "العودة للأعلى" : "Back to top"}
          style={{
            position: "fixed",
            right: 20,
            bottom: 92,
            zIndex: 98,
            border: "1px solid rgba(56,189,248,0.22)",
            background: "linear-gradient(160deg, rgba(11,18,32,0.94), rgba(6,10,16,0.96))",
            color: "#38bdf8",
            borderRadius: 999,
            padding: "11px 16px",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontSize: "0.82rem",
            fontWeight: 800,
            boxShadow: "0 10px 24px rgba(0,0,0,0.32)",
          }}
        >
          <span>↑</span>
          <span>{language === "ar" ? "العودة للأعلى" : "Back to top"}</span>
        </button>
      ) : null}

      <ArticleModal open={modalOpen} onClose={() => setModalOpen(false)} article={modalArticle} />

      <GlobalVoiceBriefing headlines={tickerHeadlines} />

      <AppSectionBoundary>
        <AgentPresence refreshKey={intelRefreshKey} />
      </AppSectionBoundary>
    </div>
  );
}