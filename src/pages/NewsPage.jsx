import React, { lazy, useEffect, useMemo, useState } from "react";
import NewsCard from "../components/NewsCard";
import { localizeSourceLabel, localizeSummaryText } from "../lib/i18n/summaryLocalizer";
import { LazySection, PageHero, PageTakeaways, pageShell, panelStyle } from "./shared/pagePrimitives";

const SportsLiveChannels = lazy(() => import("../components/SportsLiveChannels"));
const XNewsFeed = lazy(() => import("../components/XNewsFeed"));

export default function NewsPage({
  language,
  mode = "simplified",
  categories,
  cat,
  setCat,
  sportsCompetitions,
  sportsCompetition,
  setSportsCompetition,
  displayedNews,
  loading,
  error,
  feedStatus,
  retryNews,
  routeSearch,
  handleCardClick,
  uaeStandings,
  uaeStandingsUpdatedAt,
  isStandingsLoading,
}) {
  const [sourceFilters, setSourceFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePreset, setActivePreset] = useState("");
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const PRESETS = useMemo(() => ([
    {
      id: "trusted-wire",
      label: language === "ar" ? "موثوق سلكي" : "Trusted Wire",
      sources: language === "ar" ? ["رويترز", "بي بي سي", "أسوشيتد برس", "إن بي آر"] : ["Reuters", "BBC", "AP", "NPR"],
      categoryHint: "all",
    },
    {
      id: "financial-watch",
      label: language === "ar" ? "مراقبة مالية" : "Financial Watch",
      sources: language === "ar" ? ["سي إن بي سي", "ياهو فاينانس", "البنك الدولي", "رويترز"] : ["CNBC", "Yahoo Finance", "World Bank", "Reuters"],
      categoryHint: "economy",
    },
    {
      id: "regional-focus",
      label: language === "ar" ? "تركيز إقليمي" : "Regional Focus",
      sources: language === "ar" ? ["الجزيرة", "سكاي نيوز", "بي بي سي", "رويترز"] : ["Al Jazeera", "Sky News", "BBC", "Reuters"],
      categoryHint: "regional",
    },
  ]), [language]);

  const writeFilterStateToUrl = ({ nextSources = sourceFilters, nextQuery = searchQuery, nextPreset = activePreset, replace = false } = {}) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search || "");

    if (Array.isArray(nextSources) && nextSources.length > 0) {
      params.set("source", nextSources.join(","));
      try {
        window.sessionStorage.setItem("kar-news-source-filters", JSON.stringify(nextSources));
      } catch {
        // ignore storage errors
      }
    } else {
      params.delete("source");
      try {
        window.sessionStorage.removeItem("kar-news-source-filters");
      } catch {
        // ignore storage errors
      }
    }

    const queryValue = String(nextQuery || "").trim();
    if (queryValue) {
      params.set("q", queryValue);
      try {
        window.sessionStorage.setItem("kar-news-search-query", queryValue);
      } catch {
        // ignore storage errors
      }
    } else {
      params.delete("q");
      try {
        window.sessionStorage.removeItem("kar-news-search-query");
      } catch {
        // ignore storage errors
      }
    }

    if (nextPreset) {
      params.set("preset", nextPreset);
      try {
        window.sessionStorage.setItem("kar-news-source-preset", nextPreset);
      } catch {
        // ignore storage errors
      }
    } else {
      params.delete("preset");
      try {
        window.sessionStorage.removeItem("kar-news-source-preset");
      } catch {
        // ignore storage errors
      }
    }

    const search = params.toString();
    const next = `${window.location.pathname}${search ? `?${search}` : ""}`;
    const method = replace ? "replaceState" : "pushState";
    window.history[method]({}, "", next);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  useEffect(() => {
    const readFilterState = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(String(routeSearch || window.location.search || "").replace(/^\?/, ""));
      const raw = String(params.get("source") || "").trim();
      const rawQuery = String(params.get("q") || "").trim();
      const rawPreset = String(params.get("preset") || "").trim();

      let nextSources = [];
      let nextQuery = rawQuery;
      let nextPreset = rawPreset;
      let needsSeed = false;

      if (raw) {
        nextSources = raw.split(",").map((item) => decodeURIComponent(String(item || "").trim())).filter(Boolean).slice(0, 8);
      } else {
        try {
          const rawStored = window.sessionStorage.getItem("kar-news-source-filters");
          const stored = rawStored ? JSON.parse(rawStored) : [];
          if (Array.isArray(stored) && stored.length > 0) {
            nextSources = stored.slice(0, 8);
            needsSeed = true;
          }
        } catch {
          // ignore storage errors
        }
      }

      if (!rawQuery) {
        try {
          const storedQuery = String(window.sessionStorage.getItem("kar-news-search-query") || "").trim();
          if (storedQuery) {
            nextQuery = storedQuery;
            needsSeed = true;
          }
        } catch {
          // ignore storage errors
        }
      }

      if (!rawPreset) {
        try {
          const storedPreset = String(window.sessionStorage.getItem("kar-news-source-preset") || "").trim();
          if (storedPreset) {
            nextPreset = storedPreset;
            needsSeed = true;
          }
        } catch {
          // ignore storage errors
        }
      }

      setSourceFilters(nextSources);
      setSearchQuery(nextQuery);
      setActivePreset(nextPreset);

      if (needsSeed) {
        writeFilterStateToUrl({
          nextSources,
          nextQuery,
          nextPreset,
          replace: true,
        });
      }
    };

    readFilterState();
  }, [routeSearch]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem("kar-news-dismissed-alerts");
      const parsed = raw ? JSON.parse(raw) : [];
      setDismissedAlerts(Array.isArray(parsed) ? parsed.slice(0, 40) : []);
    } catch {
      setDismissedAlerts([]);
    }
  }, []);

  const filteredNews = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalized = sourceFilters.map((item) => item.toLowerCase());
    return (displayedNews || []).filter((item) => {
      const source = String(item?.source || "").toLowerCase();
      const title = String(item?.title || "").toLowerCase();
      const summary = String(item?.summary || "").toLowerCase();
      const category = String(item?.category || "").toLowerCase();
      const sourceMatch = normalized.length === 0 || normalized.some((needle) => source.includes(needle));
      const queryMatch = !normalizedQuery || `${title} ${summary} ${source} ${category}`.includes(normalizedQuery);
      return sourceMatch && queryMatch;
    });
  }, [displayedNews, sourceFilters, searchQuery]);

  const availableSourceChips = useMemo(() => {
    const counts = new Map();
    (displayedNews || []).forEach((item) => {
      const source = String(item?.source || "").trim();
      if (!source) return;
      counts.set(language === "ar" ? localizeSourceLabel(source, "ar") : source, (counts.get(language === "ar" ? localizeSourceLabel(source, "ar") : source) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([source]) => source);
  }, [displayedNews]);

  const isAdvanced = mode === "advanced";
  const topStories = filteredNews.slice(0, 3);
  const healthySources = feedStatus?.stats?.healthySources || 0;
  const totalSources = feedStatus?.stats?.totalSources || 0;
  const breakingCount = feedStatus?.stats?.breakingCount || 0;
  const avgQuality = Number(feedStatus?.stats?.averageQuality || 0);
  const quarantinedSources = Number(feedStatus?.stats?.quarantinedSources || 0);

  const sourceQuality = useMemo(() => {
    const list = Array.isArray(feedStatus?.health) ? feedStatus.health : [];
    return [...list]
      .sort((a, b) => Number(b?.qualityScore || 0) - Number(a?.qualityScore || 0))
      .slice(0, 6);
  }, [feedStatus?.health]);

  const mediaTimeline = useMemo(() => {
    return (filteredNews || [])
      .filter((item) => item?.videoUrl || item?.image)
      .sort((a, b) => {
        const av = a?.videoUrl ? 1 : 0;
        const bv = b?.videoUrl ? 1 : 0;
        if (av !== bv) return bv - av;
        const at = new Date(a?.time || 0).getTime() || 0;
        const bt = new Date(b?.time || 0).getTime() || 0;
        return bt - at;
      })
      .slice(0, 16);
  }, [filteredNews]);

  const smartAlerts = useMemo(() => {
    const alerts = [];
    const featured = feedStatus?.featuredAlert;
    if (featured?.title) {
      alerts.push({
        id: `featured-${featured.id || featured.title}`,
        type: "breaking",
        title: language === "ar" ? "تنبيه عاجل" : "Breaking alert",
        message: featured.title,
        item: featured,
      });
    }

    if (quarantinedSources > 0) {
      alerts.push({
        id: `quarantine-${quarantinedSources}`,
        type: "quality",
        title: language === "ar" ? "حماية الجودة مفعلة" : "Quality protection active",
        message: language === "ar"
          ? `تم عزل ${quarantinedSources} مصدر مؤقتا بسبب ضعف الجودة أو تكرار الأعطال.`
          : `${quarantinedSources} source(s) are temporarily quarantined due to low quality or repeated failures.`,
      });
    }

    if (breakingCount >= 5) {
      alerts.push({
        id: `surge-${breakingCount}`,
        type: "surge",
        title: language === "ar" ? "تصاعد عاجل" : "Breaking surge",
        message: language === "ar"
          ? `تم رصد ${breakingCount} إشارات عاجلة حاليا، الأولوية للمصادر الأعلى موثوقية.`
          : `${breakingCount} breaking signals detected now; trusted sources are prioritized.`,
      });
    }

    return alerts.filter((entry) => !dismissedAlerts.includes(entry.id)).slice(0, 3);
  }, [feedStatus?.featuredAlert, quarantinedSources, breakingCount, dismissedAlerts, language]);

  const dismissAlert = (id) => {
    setDismissedAlerts((prev) => {
      const next = Array.from(new Set([...prev, id])).slice(-40);
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem("kar-news-dismissed-alerts", JSON.stringify(next));
        } catch {
          // ignore storage errors
        }
      }
      return next;
    });
  };

  const takeaways = [
    language === "ar"
      ? `الخبر الأهم: ${topStories[0]?.title || "غير متاح"}`
      : `Top story: ${topStories[0]?.title || "Unavailable"}`,
    language === "ar"
      ? `التأثير العام: ${topStories[1]?.summary || "متابعة مستمرة لأثر التطورات"}`
      : `Overall impact: ${topStories[1]?.summary || "Ongoing monitoring of impact"}`,
    language === "ar"
      ? "القراءة الحالية مبنية على مصادر متعددة مع إزالة التكرار."
      : "Current view is aggregated from multiple sources with deduplication.",
  ];

  return (
    <div style={pageShell}>
      <PageHero
        eyebrow={language === "ar" ? "الأخبار" : "NEWS"}
        title={language === "ar" ? "أخبار اليوم باختصار" : "Today in Brief"}
        description={language === "ar"
          ? "ابدأ بأهم القصص وتأثيرها، ثم انتقل للتفاصيل عند الحاجة."
          : "Start with key stories and impact, then expand into details when needed."}
      />

      <PageTakeaways language={language} items={takeaways} />

      <section style={{ ...panelStyle, padding: "14px 16px", marginBottom: 16, background: "linear-gradient(160deg, rgba(103,232,249,0.08), rgba(255,255,255,0.02) 62%, rgba(244,201,123,0.05))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={{ color: "#f8fafc", fontWeight: 800, marginBottom: 5 }}>
              {language === "ar" ? "شبكة مصادر مفتوحة ذكية" : "Smart open-source feed network"}
            </div>
            <div style={{ color: "#aebccd", fontSize: 13, lineHeight: 1.75 }}>
              {language === "ar"
                ? "يتم دمج خلاصات الأخبار المفتوحة، أخبار غوغل، والمصادر التحليلية المساندة مع إزالة التكرار وترجيح الأخبار العاجلة تلقائياً."
                : "Open RSS, Google News, and supplemental intelligence sources are merged with deduplication and automatic breaking-priority ranking."}
            </div>
          </div>
          <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
            {[language === "ar" ? "سحب سريع" : "Fast pull", language === "ar" ? "ترتيب ذكي" : "Smart ranking", language === "ar" ? "مصادر مفتوحة" : "Open sources"].map((label) => (
              <span key={label} style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#9be7f0", fontSize: 11, fontWeight: 800 }}>
                {label}
              </span>
            ))}
          </div>
        </div>
        {totalSources > 0 ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 800 }}>
              {language === "ar" ? `المصادر الجاهزة ${healthySources}/${totalSources}` : `Healthy sources ${healthySources}/${totalSources}`}
            </span>
            <span style={{ color: "#f87171", fontSize: 12, fontWeight: 800 }}>
              {language === "ar" ? `عاجل الآن ${breakingCount}` : `Breaking now ${breakingCount}`}
            </span>
            <span style={{ color: quarantinedSources > 0 ? "#fca5a5" : "#94a3b8", fontSize: 12, fontWeight: 800 }}>
              {language === "ar" ? `معزول مؤقتا ${quarantinedSources}` : `Quarantined ${quarantinedSources}`}
            </span>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>
              {language === "ar"
                ? localizeSummaryText(feedStatus?.sourceMode || "", "ar", { kind: "label" })
                : (feedStatus?.sourceMode || "")}
            </span>
          </div>
        ) : null}
      </section>

      {smartAlerts.length > 0 ? (
        <section style={{ ...panelStyle, padding: "12px 14px", marginBottom: 14, border: "1px solid rgba(248,113,113,0.35)", background: "linear-gradient(145deg, rgba(127,29,29,0.18), rgba(30,41,59,0.5))" }}>
          <div style={{ color: "#fee2e2", fontWeight: 900, marginBottom: 10 }}>
            {language === "ar" ? "مركز التنبيهات الذكية" : "Smart alerts center"}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {smartAlerts.map((alert) => {
              const isBreaking = alert.type === "breaking";
              return (
                <div key={alert.id} style={{ border: "1px solid rgba(248,113,113,0.35)", borderRadius: 10, background: "rgba(15,23,42,0.55)", padding: "9px 10px", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 220, flex: "1 1 240px" }}>
                    <div style={{ color: "#fecaca", fontSize: 12, fontWeight: 900, marginBottom: 4 }}>{alert.title}</div>
                    <div style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.65 }}>{alert.message}</div>
                  </div>
                  <div style={{ display: "inline-flex", gap: 8 }}>
                    {isBreaking ? (
                      <button
                        type="button"
                        onClick={() => handleCardClick(alert.item)}
                        style={{ border: "1px solid rgba(56,189,248,0.55)", background: "rgba(56,189,248,0.16)", color: "#bae6fd", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                      >
                        {language === "ar" ? "فتح الخبر" : "Open story"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => dismissAlert(alert.id)}
                      style={{ border: "1px solid rgba(148,163,184,0.4)", background: "rgba(15,23,42,0.45)", color: "#cbd5e1", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                    >
                      {language === "ar" ? "إخفاء" : "Dismiss"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {sourceQuality.length > 0 ? (
        <section style={{ ...panelStyle, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ color: "#f8fafc", fontWeight: 800 }}>
              {language === "ar" ? "جودة المصادر اللحظية" : "Live source quality"}
            </div>
            <div style={{ color: "#67e8f9", fontSize: 12, fontWeight: 800 }}>
              {language === "ar" ? `متوسط الجودة ${avgQuality}/100` : `Average quality ${avgQuality}/100`}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
            {sourceQuality.map((entry) => {
              const quality = Math.max(0, Math.min(100, Number(entry?.qualityScore || 0)));
              const color = quality >= 75 ? "#22c55e" : quality >= 50 ? "#f59e0b" : "#f87171";
              return (
                <div key={entry.id} style={{ border: "1px solid rgba(148,163,184,0.18)", borderRadius: 10, padding: "8px 10px", background: "rgba(15,23,42,0.45)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <span style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 700 }}>{entry.id}</span>
                    <span style={{ color, fontSize: 12, fontWeight: 800 }}>{quality}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: "rgba(148,163,184,0.2)", overflow: "hidden", marginBottom: 6 }}>
                    <div style={{ width: `${quality}%`, height: "100%", background: color }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: "#94a3b8", fontSize: 11 }}>
                    <span>{language === "ar" ? "زمن" : "Latency"}: {entry?.latencyMs ?? "-"}ms</span>
                    <span>{language === "ar" ? "مواد" : "Media"}: {Math.round(Number(entry?.metrics?.mediaRichness || 0) * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {mediaTimeline.length > 0 ? (
        <section style={{ ...panelStyle, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ color: "#f8fafc", fontWeight: 800, marginBottom: 10 }}>
            {language === "ar" ? "الخط الزمني للوسائط (فيديو + صور)" : "Media timeline (video + photo)"}
          </div>
          <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(210px, 210px)", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {mediaTimeline.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => handleCardClick(item)}
                style={{ textAlign: "start", border: "1px solid rgba(148,163,184,0.22)", borderRadius: 12, background: "rgba(15,23,42,0.5)", color: "#e2e8f0", cursor: "pointer", overflow: "hidden", padding: 0 }}
              >
                <div style={{ position: "relative", height: 118, background: "#0f172a" }}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title || "media"}
                      style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b", fontSize: 13 }}>
                      {language === "ar" ? "بدون صورة" : "No image"}
                    </div>
                  )}
                  <span style={{ position: "absolute", top: 8, insetInlineStart: 8, borderRadius: 999, background: item.videoUrl ? "rgba(239,68,68,0.84)" : "rgba(56,189,248,0.84)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "4px 8px" }}>
                    {item.videoUrl ? (language === "ar" ? "فيديو" : "Video") : (language === "ar" ? "صورة" : "Photo")}
                  </span>
                </div>
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.5, minHeight: 36, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {item.title}
                  </div>
                  <div style={{ marginTop: 6, color: "#94a3b8", fontSize: 11 }}>{item.source || "-"}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCat(item.id)}
            style={{
              background: cat === item.id ? "#38bdf8" : "#222",
              color: cat === item.id ? "#fff" : "#38bdf8",
              border: "none",
              borderRadius: 10,
              padding: "8px 16px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer"
            }}
          >
            {item.emoji} {item.label}
          </button>
        ))}
      </div>

      <div style={{ ...panelStyle, padding: "10px 12px", marginBottom: 12, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={language === "ar" ? "ابحث في العناوين والمحتوى والمصدر..." : "Search titles, summary, and source..."}
            style={{
              flex: "1 1 260px",
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.3)",
              background: "rgba(15,23,42,0.65)",
              color: "#e2e8f0",
              padding: "8px 10px",
              fontSize: 13,
            }}
          />
          <button
            type="button"
            onClick={() => writeFilterStateToUrl({ nextQuery: searchQuery })}
            style={{ border: "1px solid rgba(56,189,248,0.5)", background: "rgba(56,189,248,0.15)", color: "#bae6fd", borderRadius: 8, padding: "7px 10px", fontWeight: 700, cursor: "pointer" }}
          >
            {language === "ar" ? "تطبيق البحث" : "Apply search"}
          </button>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                writeFilterStateToUrl({ nextQuery: "" });
              }}
              style={{ border: "1px solid rgba(148,163,184,0.35)", background: "rgba(15,23,42,0.45)", color: "#cbd5e1", borderRadius: 8, padding: "7px 10px", fontWeight: 700, cursor: "pointer" }}
            >
              {language === "ar" ? "مسح" : "Clear"}
            </button>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PRESETS.map((preset) => {
            const active = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  if (active) {
                    setActivePreset("");
                    writeFilterStateToUrl({ nextPreset: "", nextSources: [] });
                    return;
                  }

                  setActivePreset(preset.id);
                  setSourceFilters(preset.sources);
                  if (preset.categoryHint && preset.categoryHint !== cat) setCat(preset.categoryHint);
                  writeFilterStateToUrl({ nextPreset: preset.id, nextSources: preset.sources });
                }}
                style={{
                  border: `1px solid ${active ? "rgba(244,201,123,0.58)" : "rgba(148,163,184,0.26)"}`,
                  background: active ? "rgba(244,201,123,0.16)" : "rgba(15,23,42,0.45)",
                  color: active ? "#fde68a" : "#cbd5e1",
                  borderRadius: 999,
                  padding: "7px 11px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {sourceFilters.length > 0 ? (
        <div style={{ ...panelStyle, padding: "10px 12px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", border: "1px solid rgba(56,189,248,0.32)", background: "rgba(56,189,248,0.08)" }}>
          <div style={{ color: "#dbeafe", fontSize: 13, fontWeight: 800, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span>{language === "ar" ? "فلاتر المصادر:" : "Source filters:"}</span>
            {sourceFilters.map((filterValue) => (
              <span key={filterValue} style={{ padding: "3px 9px", borderRadius: 999, background: "rgba(2,6,23,0.42)", border: "1px solid rgba(148,163,184,0.3)", fontSize: 12 }}>
                {filterValue}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setActivePreset("");
              writeFilterStateToUrl({ nextSources: [], nextPreset: "" });
            }}
            style={{ border: "1px solid rgba(148,163,184,0.45)", background: "rgba(15,23,42,0.55)", color: "#cbd5e1", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}
          >
            {language === "ar" ? "إزالة الفلتر" : "Clear filter"}
          </button>
        </div>
      ) : null}

      {availableSourceChips.length > 0 ? (
        <div style={{ ...panelStyle, padding: "10px 12px", marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {availableSourceChips.map((chip) => {
            const active = sourceFilters.some((item) => item.toLowerCase() === chip.toLowerCase());
            return (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  const next = active
                    ? sourceFilters.filter((item) => item.toLowerCase() !== chip.toLowerCase())
                    : [...sourceFilters, chip].slice(0, 8);
                  setActivePreset("");
                  writeFilterStateToUrl({ nextSources: next, nextPreset: "" });
                }}
                style={{
                  border: `1px solid ${active ? "rgba(56,189,248,0.6)" : "rgba(148,163,184,0.25)"}`,
                  background: active ? "rgba(56,189,248,0.14)" : "rgba(15,23,42,0.45)",
                  color: active ? "#bae6fd" : "#cbd5e1",
                  borderRadius: 999,
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {chip}
              </button>
            );
          })}
        </div>
      ) : null}

      {cat === "sports" ? (
        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          {sportsCompetitions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSportsCompetition(item.id)}
              style={{
                background: sportsCompetition === item.id ? "#f3d38a" : "#1a1f27",
                color: sportsCompetition === item.id ? "#222" : "#f3d38a",
                border: "1px solid rgba(243,211,138,0.3)",
                borderRadius: 10,
                padding: "7px 14px",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer"
              }}
            >
              {item.emoji} {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {cat === "sports" && sportsCompetition === "uae" ? (
        <div style={{ ...panelStyle, overflow: "hidden", marginBottom: 22 }}>
          <div style={{ padding: "16px 20px", background: "rgba(74,222,128,0.08)", borderBottom: "1px solid rgba(74,222,128,0.15)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🇦🇪</span>
            <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#4ade80" }}>{language === "ar" ? "ترتيب الدوري الإماراتي" : "UAE League Standings"}</span>
          </div>
          {isStandingsLoading && !uaeStandings.length ? (
            <div style={{ textAlign: "center", color: "#4ade80", padding: 24 }}>{language === "ar" ? "⏳ جارٍ تحميل الترتيب" : "Loading standings"}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", color: "#e2e8f0" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", fontSize: "0.78rem" }}>
                    {["#", language === "ar" ? "الفريق" : "Team", language === "ar" ? "لعب" : "P", language === "ar" ? "فاز" : "W", language === "ar" ? "تعادل" : "D", language === "ar" ? "خسر" : "L", language === "ar" ? "له" : "GF", language === "ar" ? "عليه" : "GA", language === "ar" ? "+/-" : "GD", language === "ar" ? "النقاط" : "Pts"].map((heading) => (
                      <th key={heading} style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uaeStandings.map((row, index) => (
                    <tr key={row.rank ?? index} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#94a3b8" }}>{row.rank}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, whiteSpace: "nowrap" }}>{row.team}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>{row.played}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#4ade80" }}>{row.won}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#fbbf24" }}>{row.drawn}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#f87171" }}>{row.lost}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>{row.goalsFor}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>{row.goalsAgainst}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>{row.goalDifference}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#f3d38a", fontWeight: 900 }}>{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {uaeStandingsUpdatedAt ? (
                <div style={{ textAlign: "center", color: "#64748b", fontSize: "0.75rem", padding: "8px 16px" }}>
                  {language === "ar" ? "آخر تحديث" : "Last update"}: {uaeStandingsUpdatedAt}
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {loading ? <div style={{ textAlign: "center", color: "#38bdf8", padding: 30 }}>{language === "ar" ? "جارٍ التحميل" : "Loading"}</div> : null}
      {error ? (
        <div style={{ textAlign: "center", color: "#e74c3c", padding: 20 }}>
          <div style={{ marginBottom: 10 }}>{error}</div>
          <button
            type="button"
            onClick={retryNews}
            style={{ border: "1px solid rgba(56,189,248,0.35)", background: "rgba(56,189,248,0.12)", color: "#7dd3fc", borderRadius: 8, padding: "7px 12px", fontWeight: 700, cursor: "pointer" }}
          >
            {language === "ar" ? "إعادة المحاولة" : "Retry"}
          </button>
        </div>
      ) : null}

      {cat === "sports" && sportsCompetition === "live-channels" ? (
        <LazySection minHeight={420}>
          <SportsLiveChannels />
        </LazySection>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
          {filteredNews.map((item, idx) => (
            <NewsCard key={item.id || idx} {...item} onClick={() => handleCardClick(item)} />
          ))}
        </div>
      )}

      {!loading && !error && filteredNews.length === 0 ? (
        <div style={{ textAlign: "center", color: "#94a3b8", padding: 16 }}>
          {language === "ar"
            ? "لا توجد نتائج مطابقة للبحث أو فلاتر المصادر الحالية."
            : "No stories match the current search or source filters."}
        </div>
      ) : null}

      <div style={{ marginTop: 24 }}>
        {isAdvanced ? (
          <LazySection minHeight={280}>
            <XNewsFeed />
          </LazySection>
        ) : (
          <div style={{ ...panelStyle, padding: "14px 16px" }}>
            <div style={{ color: "#f8fafc", fontWeight: 800, marginBottom: 6 }}>
              {language === "ar" ? "تحتاج تفاصيل أعمق؟" : "Need deeper analysis?"}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>
              {language === "ar" ? "انتقل إلى العرض المتقدم لرؤية تفكيك المصادر، الإشارات، والعلاقات." : "Switch to Advanced View to access source breakdown, signal grouping, and relationships."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
