import React, { useMemo } from "react";

const FALLBACK_SOURCES = [
  "Live Intake",
  "Reuters",
  "BBC",
  "Al Jazeera",
  "AP",
  "Guardian",
  "NPR",
  "France24",
  "DW",
  "Sky News",
];

function sourceShortName(name) {
  const safe = String(name || "").trim();
  if (!safe) return "SRC";
  const parts = safe.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}${parts[2]?.[0] || ""}`.toUpperCase();
}

export default function SourceLogoStrip({ language = "ar", news = [], onSourceClick }) {
  const topSources = useMemo(() => {
    const counts = new Map();
    (Array.isArray(news) ? news : []).forEach((item) => {
      const source = String(item?.source || "").trim();
      if (!source) return;
      counts.set(source, (counts.get(source) || 0) + 1);
    });

    const ranked = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name]) => name);

    return ranked.length > 0 ? ranked : FALLBACK_SOURCES;
  }, [news]);

  const stripItems = [...topSources, ...topSources];

  return (
    <section className="source-logo-strip" aria-label={language === "ar" ? "مصادر المراقبة" : "Source watch"}>
      <div className="source-logo-strip__header">
        <h3>{language === "ar" ? "شبكة المصادر" : "Source Network"}</h3>
        <p>{language === "ar" ? "مصادر مفتوحة موثوقة تُغذي الرصد اللحظي" : "Trusted open sources powering live monitoring"}</p>
      </div>

      <div className="source-logo-strip__track" role="list">
        {stripItems.map((source, index) => (
          <button
            key={`${source}-${index}`}
            type="button"
            className="source-logo-strip__item"
            role="listitem"
            onClick={() => onSourceClick?.(source)}
            title={language === "ar" ? `افتح أخبار ${source}` : `Open ${source} news`}
          >
            <span className="source-logo-strip__badge">{sourceShortName(source)}</span>
            <span className="source-logo-strip__name">{source}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
