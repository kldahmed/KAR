import React from "react";
import NewsCard from "../components/NewsCard";
import { localizeSummaryText } from "../lib/i18n/summaryLocalizer";
import { PageHero, pageShell, panelStyle } from "./shared/pagePrimitives";

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
  const healthySources = Number(feedStatus?.stats?.healthySources || 0);
  const totalSources = Number(feedStatus?.stats?.totalSources || 0);
  const breakingCount = Number(feedStatus?.stats?.breakingCount || 0);
  const avgQuality = Number(feedStatus?.stats?.averageQuality || 0);
  const quarantinedSources = Number(feedStatus?.stats?.quarantinedSources || 0);
  const featuredAlert = feedStatus?.featuredAlert || null;
  const dashboard = feedStatus?.dashboard || null;
  const sourceRegistry = Array.isArray(feedStatus?.sources) ? feedStatus.sources : [];
  const capacityProjection = dashboard?.capacity_projection || null;
  const weakestSources = Array.isArray(dashboard?.weakest_sources) ? dashboard.weakest_sources.slice(0, 6) : [];
  const fastestSources = Array.isArray(dashboard?.fastest_sources) ? dashboard.fastest_sources.slice(0, 6) : [];
  const sourceRegistryPreview = sourceRegistry.slice(0, 12);
  const alerts = dashboard?.alerts || {};
  const persistence = dashboard?.persistence || null;
  const dailyCounters = dashboard?.counters || {};

  return (
    <div style={pageShell}>
      <PageHero
        eyebrow={language === "ar" ? "الأخبار" : "NEWS"}
        title={language === "ar" ? "الأخبار الأساسية الآن" : "Core News Now"}
        description={language === "ar"
          ? "الإشارات الفارقة فقط: عاجل، جودة المصادر، والقصص الأهم."
          : "Only high-signal output: breaking, source quality, and top stories."}
      />

      <section style={{ ...panelStyle, padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 800 }}>
            {language === "ar" ? `المصادر الجاهزة ${healthySources}/${totalSources}` : `Healthy sources ${healthySources}/${totalSources}`}
          </span>
          <span style={{ color: "#f87171", fontSize: 12, fontWeight: 800 }}>
            {language === "ar" ? `عاجل الآن ${breakingCount}` : `Breaking now ${breakingCount}`}
          </span>
          <span style={{ color: quarantinedSources > 0 ? "#fca5a5" : "#94a3b8", fontSize: 12, fontWeight: 800 }}>
            {language === "ar" ? `معزول مؤقتا ${quarantinedSources}` : `Quarantined ${quarantinedSources}`}
          </span>
          <span style={{ color: "#67e8f9", fontSize: 12, fontWeight: 800 }}>
            {language === "ar" ? `متوسط الجودة ${avgQuality}/100` : `Average quality ${avgQuality}/100`}
          </span>
          <span style={{ color: "#94a3b8", fontSize: 12 }}>
            {language === "ar"
              ? localizeSummaryText(feedStatus?.sourceMode || "", "ar", { kind: "label" })
              : (feedStatus?.sourceMode || "")}
          </span>
        </div>
      </section>

      {dashboard ? (
        <section style={{ ...panelStyle, padding: "14px 14px 12px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div>
              <div style={{ color: "#f8fafc", fontSize: 14, fontWeight: 900, marginBottom: 4 }}>
                {language === "ar" ? "لوحة تشغيل غرفة الأخبار" : "Newsroom operations"}
              </div>
              <div style={{ color: "#94a3b8", fontSize: 12 }}>
                {language === "ar"
                  ? `مستورد خام ${dailyCounters.imported_today_raw || 0} | فريد ${dailyCounters.imported_today_unique || 0} | منشور ${dailyCounters.published_today || 0} | مراجعة ${dailyCounters.review_required_today || 0}`
                  : `Raw ${dailyCounters.imported_today_raw || 0} | Unique ${dailyCounters.imported_today_unique || 0} | Published ${dailyCounters.published_today || 0} | Review ${dailyCounters.review_required_today || 0}`}
              </div>
            </div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>
              {language === "ar"
                ? `آخر تحديث تشغيلي ${feedStatus?.operationsUpdatedAt || dashboard?.generated_at || ""}`
                : `Ops updated ${feedStatus?.operationsUpdatedAt || dashboard?.generated_at || ""}`}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
            <div style={{ border: "1px solid rgba(56,189,248,0.18)", borderRadius: 12, padding: 10, background: "rgba(15,23,42,0.55)" }}>
              <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>{language === "ar" ? "الهدف اليومي الأدنى" : "Daily minimum"}</div>
              <div style={{ color: "#67e8f9", fontSize: 18, fontWeight: 900 }}>{feedStatus?.stats?.ingestTargetMinimum || 1000}</div>
            </div>
            <div style={{ border: "1px solid rgba(56,189,248,0.18)", borderRadius: 12, padding: 10, background: "rgba(15,23,42,0.55)" }}>
              <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>{language === "ar" ? "توقع الفريد اليومي" : "Projected unique/day"}</div>
              <div style={{ color: capacityProjection?.meets_minimum_1000 ? "#86efac" : "#fca5a5", fontSize: 18, fontWeight: 900 }}>{capacityProjection?.projected_unique_per_day || 0}</div>
            </div>
            <div style={{ border: "1px solid rgba(56,189,248,0.18)", borderRadius: 12, padding: 10, background: "rgba(15,23,42,0.55)" }}>
              <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>{language === "ar" ? "معدل التكرار" : "Duplicate rate"}</div>
              <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: 900 }}>{Math.round(Number(dashboard?.rates?.duplicates_rate || 0) * 100)}%</div>
            </div>
            <div style={{ border: "1px solid rgba(56,189,248,0.18)", borderRadius: 12, padding: 10, background: "rgba(15,23,42,0.55)" }}>
              <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>{language === "ar" ? "معدل الفشل" : "Failure rate"}</div>
              <div style={{ color: Number(dashboard?.rates?.failure_rate || 0) > 0.2 ? "#fca5a5" : "#f8fafc", fontSize: 18, fontWeight: 900 }}>{Math.round(Number(dashboard?.rates?.failure_rate || 0) * 100)}%</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 14 }}>
            <div style={{ border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12, padding: 12, background: "rgba(30,41,59,0.42)" }}>
              <div style={{ color: "#fca5a5", fontWeight: 900, fontSize: 12, marginBottom: 8 }}>
                {language === "ar" ? "إنذارات التشغيل" : "Operational alerts"}
              </div>
              <div style={{ display: "grid", gap: 6, color: "#e2e8f0", fontSize: 12 }}>
                <div>{alerts.below_minimum_1000 ? (language === "ar" ? "السعة الحالية أقل من 1000 خبر فريد يوميا" : "Projected below 1000 unique/day") : (language === "ar" ? "الحد الأدنى اليومي محقق" : "Daily minimum currently met")}</div>
                <div>{alerts.active_sources_below_50 ? (language === "ar" ? "المصادر النشطة أقل من 50" : "Active sources below 50") : (language === "ar" ? "عدد المصادر النشطة ضمن الهدف" : "Active source count on target")}</div>
                <div>{alerts.source_failure_above_20_percent ? (language === "ar" ? "معدل فشل المصادر تجاوز 20%" : "Source failure rate above 20%") : (language === "ar" ? "معدل فشل المصادر تحت الحد" : "Source failure rate below threshold")}</div>
                <div>{alerts.sensitive_review_backlog ? (language === "ar" ? "تراكم مرتفع في طابور مراجعة المحتوى الحساس" : "Sensitive-content review queue is elevated") : (language === "ar" ? "طابور مراجعة الحساسية ضمن المستوى الطبيعي" : "Sensitive review queue is within normal range")}</div>
              </div>
            </div>

            <div style={{ border: "1px solid rgba(103,232,249,0.18)", borderRadius: 12, padding: 12, background: "rgba(15,23,42,0.42)" }}>
              <div style={{ color: "#67e8f9", fontWeight: 900, fontSize: 12, marginBottom: 8 }}>
                {language === "ar" ? "الاستدامة والحفظ" : "Persistence"}
              </div>
              <div style={{ display: "grid", gap: 6, color: "#e2e8f0", fontSize: 12 }}>
                <div>{language === "ar" ? `الحفظ مفعل: ${persistence?.enabled ? "نعم" : "لا"}` : `Persistence enabled: ${persistence?.enabled ? "yes" : "no"}`}</div>
                <div>{language === "ar" ? `تمت الاستعادة من snapshot: ${persistence?.hydrated_from_disk ? "نعم" : "لا"}` : `Hydrated from snapshot: ${persistence?.hydrated_from_disk ? "yes" : "no"}`}</div>
                <div>{language === "ar" ? `آخر حفظ: ${persistence?.last_persisted_at || "-"}` : `Last persisted: ${persistence?.last_persisted_at || "-"}`}</div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 14 }}>
            <div style={{ border: "1px solid rgba(248,113,113,0.18)", borderRadius: 12, padding: 12, background: "rgba(15,23,42,0.42)" }}>
              <div style={{ color: "#fecaca", fontWeight: 900, fontSize: 12, marginBottom: 8 }}>
                {language === "ar" ? "أضعف المصادر حاليا" : "Weakest sources"}
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {weakestSources.map((item) => (
                  <div key={item.source_id} style={{ display: "flex", justifyContent: "space-between", gap: 8, color: "#e2e8f0", fontSize: 12 }}>
                    <span>{item.name}</span>
                    <span style={{ color: "#fca5a5" }}>{language === "ar" ? `إخفاقات ${item.failures}` : `fail ${item.failures}`}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: "1px solid rgba(56,189,248,0.18)", borderRadius: 12, padding: 12, background: "rgba(15,23,42,0.42)" }}>
              <div style={{ color: "#bae6fd", fontWeight: 900, fontSize: 12, marginBottom: 8 }}>
                {language === "ar" ? "أسرع المصادر استجابة" : "Fastest sources"}
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {fastestSources.map((item) => (
                  <div key={item.source_id} style={{ display: "flex", justifyContent: "space-between", gap: 8, color: "#e2e8f0", fontSize: 12 }}>
                    <span>{item.name}</span>
                    <span style={{ color: "#67e8f9" }}>{item.last_latency_ms || 0}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ border: "1px solid rgba(148,163,184,0.18)", borderRadius: 12, padding: 12, background: "rgba(15,23,42,0.38)" }}>
            <div style={{ color: "#f8fafc", fontWeight: 900, fontSize: 12, marginBottom: 8 }}>
              {language === "ar" ? "سجل المصادر النشطة" : "Active source registry"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
              {sourceRegistryPreview.map((item) => (
                <div key={item.id} style={{ border: "1px solid rgba(71,85,105,0.55)", borderRadius: 10, padding: 10, background: "rgba(2,6,23,0.35)" }}>
                  <div style={{ color: "#f8fafc", fontSize: 12, fontWeight: 800, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 5 }}>{item.category} | {item.language}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: 11 }}>
                    <span>{item.status}</span>
                    <span>{item.update_interval_seconds}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {featuredAlert?.title ? (
        <section style={{ ...panelStyle, padding: "12px 14px", marginBottom: 14, border: "1px solid rgba(248,113,113,0.35)", background: "linear-gradient(145deg, rgba(127,29,29,0.14), rgba(30,41,59,0.5))" }}>
          <div style={{ color: "#fecaca", fontSize: 12, fontWeight: 900, marginBottom: 5 }}>
            {language === "ar" ? "تنبيه عاجل" : "Breaking alert"}
          </div>
          <div style={{ color: "#f8fafc", fontSize: 14, lineHeight: 1.7, marginBottom: 10 }}>
            {featuredAlert.title}
          </div>
          <button
            type="button"
            onClick={() => handleCardClick(featuredAlert)}
            style={{ border: "1px solid rgba(56,189,248,0.55)", background: "rgba(56,189,248,0.16)", color: "#bae6fd", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
          >
            {language === "ar" ? "فتح الخبر" : "Open story"}
          </button>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
        {(displayedNews || []).map((item, idx) => (
          <NewsCard key={item.id || idx} {...item} onClick={() => handleCardClick(item)} />
        ))}
      </div>

      {!loading && !error && (displayedNews || []).length === 0 ? (
        <div style={{ textAlign: "center", color: "#94a3b8", padding: 16 }}>
          {language === "ar" ? "لا توجد أخبار متاحة حاليا." : "No stories available right now."}
        </div>
      ) : null}
    </div>
  );
}
