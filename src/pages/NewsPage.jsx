import React, { useMemo } from "react";
import { PageHero, pageShell, panelStyle } from "./shared/pagePrimitives";

const CATEGORY_BLOCKS = [
  { key: "politics", labelAr: "سياسة", labelEn: "Politics" },
  { key: "economy", labelAr: "اقتصاد", labelEn: "Economy" },
  { key: "regional", labelAr: "إقليمي", labelEn: "Regional" },
  { key: "sports", labelAr: "رياضة", labelEn: "Sports" },
  { key: "technology", labelAr: "تقنية", labelEn: "Technology" },
];

function formatTime(value = "", language = "ar") {
  if (!value) return language === "ar" ? "الآن" : "Now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(language === "ar" ? "ar-AE" : "en-GB", {
    timeZone: "Asia/Dubai",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stripHtml(value = "") {
  return String(value || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function clampText(value = "", max = 160) {
  const clean = stripHtml(value);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function rankNews(items = []) {
  return [...items]
    .map((item, index) => {
      const urgency = String(item?.urgency || "low").toLowerCase();
      const urgencyScore = urgency === "high" ? 50 : urgency === "medium" ? 30 : 12;
      const fresh = Math.max(0, 40 - Math.min(40, Number(item?.freshnessMinutes || 0)));
      const quality = Math.min(30, Number(item?.qualityScore || 0) / 3.2);
      const weight = urgencyScore + fresh + quality - Math.min(16, index * 1.4);
      return {
        ...item,
        __weight: weight,
        title: clampText(item?.title || "", 120),
        summary: clampText(item?.summary || "", 160),
        source: clampText(item?.source || "", 60),
      };
    })
    .sort((a, b) => Number(b.__weight || 0) - Number(a.__weight || 0));
}

function StoryCard({ item, language, onOpen, compact = false }) {
  const image = item?.image || item?.image_url || "";
  const confidence = Number(item?.orchestrationScore || 0);
  const confidenceLabel = confidence >= 85
    ? (language === "ar" ? "ثقة عالية" : "High confidence")
    : confidence >= 70
      ? (language === "ar" ? "ثقة جيدة" : "Solid confidence")
      : (language === "ar" ? "قيد التحقق" : "Verification in progress");

  return (
    <article className={compact ? "news-card news-card--compact" : "news-card"}>
      <div className="news-card__image-wrap">
        {image ? (
          <img src={image} loading="lazy" alt={item?.title || "news"} className="news-card__image" />
        ) : (
          <div className="news-card__image news-card__image--fallback" />
        )}
      </div>
      <div className="news-card__body">
        <h3 className="news-card__title">{item?.title}</h3>
        <p className="news-card__summary">{item?.summary}</p>
        <div className="news-card__meta">
          <span>{item?.source || (language === "ar" ? "مصدر معتمد" : "Verified source")}</span>
          <span>•</span>
          <span>{formatTime(item?.time || item?.published_at, language)}</span>
        </div>
        <div className="news-card__meta" style={{ marginTop: 6 }}>
          <span style={{ color: "#fca5a5" }}>{language === "ar" ? "مؤشر التنبيه" : "Alert confidence"}</span>
          <span>•</span>
          <span>{confidenceLabel}</span>
        </div>
        {Array.isArray(item?.whyThisMatters) && item.whyThisMatters.length > 0 ? (
          <div style={{ marginTop: 10, color: "#bfdbfe", fontSize: 12, lineHeight: 1.7 }}>
            {item.whyThisMatters.join(language === "ar" ? " • " : " • ")}
          </div>
        ) : null}
        <button type="button" className="news-card__cta" onClick={() => onOpen(item)}>
          {language === "ar" ? "قراءة المزيد" : "Read more"}
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
  retryNews,
  handleCardClick,
  newsroomState,
  trackNewsInteraction,
}) {
  const ranked = useMemo(() => rankNews(Array.isArray(displayedNews) ? displayedNews : []), [displayedNews]);
  const orchestratedList = useMemo(() => {
    if (!Array.isArray(newsroomState?.homepage) || newsroomState.homepage.length === 0) {
      return ranked;
    }
    return newsroomState.homepage;
  }, [newsroomState, ranked]);

  const hero = newsroomState?.hero || orchestratedList[0] || null;
  const featured = orchestratedList.slice(1, 5);
  const latest = orchestratedList.slice(5, 17);
  const breaking = Array.isArray(newsroomState?.breaking) ? newsroomState.breaking.slice(0, 6) : [];

  const onStoryOpen = (story) => {
    if (typeof trackNewsInteraction === "function") {
      trackNewsInteraction("open", story, {
        dwellMs: 0,
        scrollDepth: typeof window !== "undefined" ? Math.round((window.scrollY / Math.max(1, document.body.scrollHeight)) * 100) : 0,
      });
    }
    handleCardClick(story);
  };

  const categoryRows = useMemo(() => {
    return CATEGORY_BLOCKS.map((block) => {
      const primary = orchestratedList.filter((item) => String(item?.category || "").toLowerCase() === block.key).slice(0, 4);
      if (primary.length >= 4) {
        return { ...block, items: primary };
      }

      const fallback = orchestratedList
        .filter((item) => String(item?.category || "").toLowerCase() !== block.key)
        .filter((item) => !primary.some((entry) => String(entry?.id || entry?.title) === String(item?.id || item?.title)))
        .slice(0, 4 - primary.length);

      return {
        ...block,
        items: [...primary, ...fallback].slice(0, 4),
      };
    });
  }, [orchestratedList]);

  React.useEffect(() => {
    if (typeof trackNewsInteraction !== "function") return;
    orchestratedList.slice(0, 12).forEach((story) => {
      trackNewsInteraction("impression", story, {
        dwellMs: 0,
        scrollDepth: 0,
      });
    });
  }, [orchestratedList, trackNewsInteraction]);

  return (
    <div style={pageShell} className="news-modern-page">
      <PageHero
        eyebrow={language === "ar" ? "الأخبار" : "News"}
        title={language === "ar" ? "واجهة أخبار حديثة ومنظمة" : "Modern and Structured News Surface"}
        description={language === "ar"
          ? "تغطية نظيفة بصريا: صورة، عنوان واضح، ملخص مختصر، ومصدر موثوق بدون محتوى خام أو نصوص مزدحمة."
          : "A clean editorial experience: image, clear headline, concise summary, and trusted source with no raw content."}
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
        <section className="news-hero" style={panelStyle}>
          <div className="news-hero__media">
            {hero?.image || hero?.image_url ? (
              <img src={hero.image || hero.image_url} loading="lazy" alt={hero.title} className="news-hero__image" />
            ) : (
              <div className="news-hero__image news-hero__image--fallback" />
            )}
          </div>
          <div className="news-hero__content">
            <div className="news-hero__tag">{language === "ar" ? "الخبر الرئيسي" : "Hero news"}</div>
            <h2 className="news-hero__title">{hero.title}</h2>
            <p className="news-hero__summary">{hero.summary}</p>
            {Array.isArray(hero?.whyThisMatters) && hero.whyThisMatters.length > 0 ? (
              <div style={{ color: "#bfdbfe", fontSize: 12, lineHeight: 1.8 }}>
                {language === "ar" ? "لماذا هذا مهم: " : "Why this matters: "}
                {hero.whyThisMatters.join(language === "ar" ? " • " : " • ")}
              </div>
            ) : null}
            {hero?.whatChanged ? (
              <div style={{ color: "#f8dfa9", fontSize: 12 }}>
                {language === "ar" ? "ما الذي تغيّر: " : "What changed: "}{hero.whatChanged}
              </div>
            ) : null}
            <div className="news-hero__meta">
              <span>{hero?.source || (language === "ar" ? "مصدر معتمد" : "Verified source")}</span>
              <span>•</span>
              <span>{formatTime(hero?.time || hero?.published_at, language)}</span>
              {hero?.orchestrationScore ? (
                <>
                  <span>•</span>
                  <span>{language === "ar" ? `درجة القرار ${Math.round(hero.orchestrationScore)}` : `Decision score ${Math.round(hero.orchestrationScore)}`}</span>
                </>
              ) : null}
            </div>
            <button type="button" className="news-hero__cta" onClick={() => onStoryOpen(hero)}>
              {language === "ar" ? "قراءة المزيد" : "Read more"}
            </button>
          </div>
        </section>
      ) : null}

      {breaking.length > 0 ? (
        <section style={{ ...panelStyle, padding: "12px 14px", marginBottom: 20 }}>
          <div className="news-breaking-strip">
            <div className="news-breaking-strip__label">{language === "ar" ? "عاجل" : "Breaking"}</div>
            <div className="news-breaking-strip__items">
              {breaking.map((item) => (
                <button key={item.id || item.title} type="button" className="news-breaking-strip__item" onClick={() => onStoryOpen(item)}>
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="news-section">
        <div className="news-section__head">
          <h3>{language === "ar" ? "أخبار بارزة" : "Featured stories"}</h3>
        </div>
        <div className="news-featured-grid">
          {featured.map((item) => (
            <StoryCard key={item.id || item.title} item={item} language={language} onOpen={onStoryOpen} />
          ))}
        </div>
      </section>

      <section className="news-section">
        <div className="news-section__head">
          <h3>{language === "ar" ? "آخر الأخبار" : "Latest news"}</h3>
        </div>
        <div className="news-regular-grid">
          {latest.map((item) => (
            <StoryCard key={item.id || item.title} item={item} language={language} onOpen={onStoryOpen} compact />
          ))}
        </div>
      </section>

      {categoryRows.map((section) => (
        <section className="news-section" key={section.key}>
          <div className="news-section__head">
            <h3>{language === "ar" ? section.labelAr : section.labelEn}</h3>
          </div>
          <div className="news-featured-grid">
            {section.items.map((item) => (
              <StoryCard key={`${section.key}-${item.id || item.title}`} item={item} language={language} onOpen={onStoryOpen} />
            ))}
          </div>
        </section>
      ))}

      {loading ? <div className="news-state">{language === "ar" ? "جارٍ التحديث" : "Refreshing"}</div> : null}
      {error ? (
        <div className="news-state news-state--error">
          <div>{error}</div>
          <button type="button" onClick={retryNews}>{language === "ar" ? "إعادة المحاولة" : "Retry"}</button>
        </div>
      ) : null}
    </div>
  );
}
