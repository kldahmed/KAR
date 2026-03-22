import React, { useMemo, useState } from "react";
import { PageHero, pageShell, panelStyle } from "./shared/pagePrimitives";

const CATEGORY_SECTIONS = [
  { key: "politics", labelAr: "سياسة", labelEn: "Politics" },
  { key: "economy", labelAr: "اقتصاد", labelEn: "Economy" },
  { key: "regional", labelAr: "إقليم", labelEn: "Regional" },
  { key: "sports", labelAr: "رياضة", labelEn: "Sports" },
  { key: "technology", labelAr: "تقنية", labelEn: "Technology" },
  { key: "health", labelAr: "صحة", labelEn: "Health" },
];

function formatTime(value = "", language = "ar") {
  if (!value) return language === "ar" ? "الآن" : "Now";
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return String(value);
  return time.toLocaleString(language === "ar" ? "ar-AE" : "en-GB", {
    timeZone: "Asia/Dubai",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

function toReadNewsLabel(language = "ar") {
  return language === "ar" ? "قراءة المزيد" : "Read more";
}

function scoreArticle(item, index = 0) {
  const urgency = String(item?.urgency || "low").toLowerCase();
  const urgencyScore = urgency === "high" ? 60 : urgency === "medium" ? 34 : 12;
  const reliability = String(item?.reliability || "medium").toLowerCase();
  const reliabilityScore = reliability === "high" ? 18 : reliability === "medium" ? 10 : 4;
  const freshness = Math.max(0, 40 - Math.min(40, Number(item?.freshnessMinutes || 0)));
  const quality = Math.min(30, Number(item?.qualityScore || 0) / 3.4);
  const trending = item?.isBreaking ? 20 : 0;
  const rankingPenalty = Math.min(20, index * 1.8);
  return urgencyScore + reliabilityScore + freshness + quality + trending - rankingPenalty;
}

function sanitizeSummary(value = "", language = "ar") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return language === "ar" ? "تفاصيل إضافية متاحة داخل الخبر." : "More details are available in the full story.";
  return text;
}

function deriveEditorialSections(news = []) {
  const scored = [...news]
    .map((item, index) => ({ ...item, __score: scoreArticle(item, index) }))
    .sort((a, b) => Number(b.__score || 0) - Number(a.__score || 0));

  const hero = scored[0] || null;
  const topStories = scored.slice(1, 7);
  const breaking = scored.filter((item) => item?.isBreaking || String(item?.urgency || "").toLowerCase() === "high").slice(0, 10);
  const trending = scored.slice(0, 8);

  const byCategory = CATEGORY_SECTIONS.reduce((acc, section) => {
    acc[section.key] = scored
      .filter((item) => String(item?.category || "").toLowerCase() === section.key)
      .slice(0, 4);
    return acc;
  }, {});

  return {
    hero,
    topStories,
    breaking,
    trending,
    byCategory,
    ranked: scored,
  };
}

function ensureMinimumNews(items = [], backup = []) {
  if (items.length >= 20) return items;
  const merged = [...items];
  backup.forEach((entry) => {
    if (merged.length >= 20) return;
    const exists = merged.some((item) => String(item?.id || "") === String(entry?.id || ""));
    if (!exists) merged.push(entry);
  });
  return merged;
}

function StoryCard({ item, language, onOpen, compact = false }) {
  const image = item?.image || item?.image_url || "";
  return (
    <article className={compact ? "news-story-card news-story-card--compact" : "news-story-card"}>
      {image ? (
        <img src={image} alt={item?.title || "story"} loading="lazy" className="news-story-card__image" />
      ) : (
        <div className="news-story-card__image news-story-card__image--fallback" />
      )}
      <div className="news-story-card__body">
        <div className="news-story-card__meta">
          <span>{item?.source || (language === "ar" ? "مصدر معتمد" : "Verified source")}</span>
          <span>•</span>
          <span>{formatTime(item?.time || item?.published_at, language)}</span>
          <span>•</span>
          <span>{item?.category || (language === "ar" ? "عام" : "General")}</span>
        </div>
        <h3 className="news-story-card__title">{item?.title}</h3>
        <p className="news-story-card__summary">{sanitizeSummary(item?.summary, language)}</p>
        <button type="button" className="news-story-card__cta" onClick={() => onOpen(item)}>
          {toReadNewsLabel(language)}
        </button>
      </div>
    </article>
  );
}

export default function NewsPage({
  language,
  categories,
  cat,
  setCat,
  displayedNews,
  loading,
  error,
  feedStatus,
  retryNews,
  handleCardClick,
}) {
  const [latestVisibleCount, setLatestVisibleCount] = useState(12);
  const newsPool = Array.isArray(displayedNews) ? displayedNews : [];
  const backupPool = useMemo(() => {
    const sectionNews = Array.isArray(feedStatus?.sections?.latest) ? feedStatus.sections.latest : [];
    const trendingNews = Array.isArray(feedStatus?.sections?.trending) ? feedStatus.sections.trending : [];
    return [...sectionNews, ...trendingNews];
  }, [feedStatus]);

  const effectiveNews = useMemo(() => ensureMinimumNews(newsPool, backupPool), [newsPool, backupPool]);
  const editorial = useMemo(() => deriveEditorialSections(effectiveNews), [effectiveNews]);

  const hero = editorial.hero;
  const topStories = editorial.topStories;
  const breaking = editorial.breaking;
  const trending = editorial.trending;
  const latest = editorial.ranked.slice(0, Math.max(20, latestVisibleCount));

  return (
    <div style={pageShell} className="news-landing">
      <PageHero
        eyebrow={language === "ar" ? "غرفة الأخبار" : "Newsroom"}
        title={language === "ar" ? "منصة أخبار احترافية مباشرة" : "Professional Live News Surface"}
        description={language === "ar"
          ? "أخبار مرتبة حسب التأثير والأهمية والحداثة مع عرض بصري حديث يشبه غرف الأخبار العالمية."
          : "A modern editorial surface ranked by impact, importance, and freshness."}
      />

      <section style={{ ...panelStyle, padding: "12px 14px", marginBottom: 16 }}>
        <div className="news-categories-row">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCat(item.id)}
              className={cat === item.id ? "news-category-chip active" : "news-category-chip"}
            >
              {item.emoji} {item.label}
            </button>
          ))}
        </div>
      </section>

      {hero ? (
        <section className="news-hero-story" style={panelStyle}>
          <div className="news-hero-story__media">
            {hero?.image || hero?.image_url ? (
              <img src={hero.image || hero.image_url} loading="lazy" alt={hero.title} className="news-hero-story__image" />
            ) : (
              <div className="news-hero-story__image news-hero-story__image--fallback" />
            )}
          </div>
          <div className="news-hero-story__content">
            <div className="news-hero-story__kicker">{language === "ar" ? "الخبر الأهم" : "Hero story"}</div>
            <h2 className="news-hero-story__title">{hero.title}</h2>
            <p className="news-hero-story__summary">{sanitizeSummary(hero.summary, language)}</p>
            <div className="news-hero-story__meta">
              <span>{hero.source || (language === "ar" ? "مصدر معتمد" : "Verified source")}</span>
              <span>•</span>
              <span>{formatTime(hero.time || hero.published_at, language)}</span>
              <span>•</span>
              <span>{hero.category || (language === "ar" ? "عام" : "General")}</span>
            </div>
            <button type="button" className="news-hero-story__cta" onClick={() => handleCardClick(hero)}>
              {toReadNewsLabel(language)}
            </button>
          </div>
        </section>
      ) : null}

      {breaking.length > 0 ? (
        <section style={{ ...panelStyle, padding: "12px 14px", marginBottom: 18 }}>
          <div className="news-breaking-strip">
            <span className="news-breaking-strip__label">{language === "ar" ? "عاجل" : "Breaking"}</span>
            <div className="news-breaking-strip__items">
              {breaking.slice(0, 8).map((item) => (
                <button key={item.id || item.title} type="button" className="news-breaking-strip__item" onClick={() => handleCardClick(item)}>
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section style={{ marginBottom: 22 }}>
        <div className="news-section-head">
          <h3>{language === "ar" ? "الأخبار الرئيسية" : "Top stories"}</h3>
        </div>
        <div className="news-top-grid">
          {topStories.map((item) => (
            <StoryCard key={item.id || item.title} item={item} language={language} onOpen={handleCardClick} />
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <div className="news-section-head">
          <h3>{language === "ar" ? "آخر الأخبار" : "Latest news"}</h3>
        </div>
        <div className="news-latest-feed">
          {latest.slice(0, latestVisibleCount).map((item) => (
            <StoryCard key={item.id || item.title} item={item} language={language} onOpen={handleCardClick} compact />
          ))}
        </div>
        {latestVisibleCount < latest.length ? (
          <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
            <button type="button" className="news-load-more" onClick={() => setLatestVisibleCount((count) => count + 8)}>
              {language === "ar" ? "عرض المزيد" : "Load more"}
            </button>
          </div>
        ) : null}
      </section>

      <section style={{ marginBottom: 24 }}>
        <div className="news-section-head">
          <h3>{language === "ar" ? "التصنيفات" : "Categories"}</h3>
        </div>
        <div className="news-categories-grid">
          {CATEGORY_SECTIONS.map((section) => {
            const items = editorial.byCategory[section.key] || [];
            const fallback = editorial.ranked.filter((item) => String(item?.category || "") !== section.key).slice(0, 4 - items.length);
            const finalItems = [...items, ...fallback].slice(0, 4);

            return (
              <div key={section.key} className="news-category-column" style={panelStyle}>
                <div className="news-category-column__title">{language === "ar" ? section.labelAr : section.labelEn}</div>
                <div className="news-category-column__list">
                  {finalItems.map((item) => (
                    <button key={`${section.key}-${item.id || item.title}`} type="button" className="news-category-column__item" onClick={() => handleCardClick(item)}>
                      <span>{item.title}</span>
                      <small>{item.source}</small>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <div className="news-section-head">
          <h3>{language === "ar" ? "الأكثر تداولا" : "Trending"}</h3>
        </div>
        <div className="news-trending-grid">
          {trending.map((item) => (
            <article key={item.id || item.title} className="news-trending-item" style={panelStyle}>
              <h4>{item.title}</h4>
              <div>{item.source} • {formatTime(item.time || item.published_at, language)}</div>
              <button type="button" onClick={() => handleCardClick(item)}>{toReadNewsLabel(language)}</button>
            </article>
          ))}
        </div>
      </section>

      {loading ? <div className="news-page-state">{language === "ar" ? "جارٍ التحديث" : "Refreshing"}</div> : null}
      {error ? (
        <div className="news-page-state news-page-state--error">
          <div>{error}</div>
          <button type="button" onClick={retryNews}>{language === "ar" ? "إعادة المحاولة" : "Retry"}</button>
        </div>
      ) : null}
    </div>
  );
}
