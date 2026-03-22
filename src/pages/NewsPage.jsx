import React, { useMemo } from "react";
import { PageHero, pageShell, panelStyle } from "./shared/pagePrimitives";

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
}) {
  const ranked = useMemo(() => rankNews(Array.isArray(displayedNews) ? displayedNews : []), [displayedNews]);
  const hero = ranked[0] || null;
  const featured = ranked.slice(1, 5);
  const regular = ranked.slice(5);

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
            <div className="news-hero__meta">
              <span>{hero?.source || (language === "ar" ? "مصدر معتمد" : "Verified source")}</span>
              <span>•</span>
              <span>{formatTime(hero?.time || hero?.published_at, language)}</span>
            </div>
            <button type="button" className="news-hero__cta" onClick={() => handleCardClick(hero)}>
              {language === "ar" ? "قراءة المزيد" : "Read more"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="news-section">
        <div className="news-section__head">
          <h3>{language === "ar" ? "أخبار بارزة" : "Featured stories"}</h3>
        </div>
        <div className="news-featured-grid">
          {featured.map((item) => (
            <StoryCard key={item.id || item.title} item={item} language={language} onOpen={handleCardClick} />
          ))}
        </div>
      </section>

      <section className="news-section">
        <div className="news-section__head">
          <h3>{language === "ar" ? "آخر الأخبار" : "Latest news"}</h3>
        </div>
        <div className="news-regular-grid">
          {regular.map((item) => (
            <StoryCard key={item.id || item.title} item={item} language={language} onOpen={handleCardClick} compact />
          ))}
        </div>
      </section>

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
