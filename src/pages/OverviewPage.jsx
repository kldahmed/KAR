import React, { useMemo } from "react";
import { SECTION_ROUTES } from "../lib/simpleRouter";
import {
  FeaturedShortcutCard,
  OverviewMetric,
  pageShell,
  panelStyle,
  ShortcutCard,
} from "./shared/pagePrimitives";

export default function OverviewPage({
  language,
  navigate,
  tickerHeadlines,
  lastUpdated,
  intelMetrics,
  refreshKey,
  displayedNews,
  loading,
}) {
  const cards = SECTION_ROUTES.filter((route) => route.path !== "/");
  const featuredCards = cards.slice(0, 4);
  const criticalAlerts = useMemo(
    () => (displayedNews || []).filter((item) => item?.urgency === "high").slice(0, 3),
    [displayedNews]
  );
  const topSignals = useMemo(
    () => (displayedNews || []).slice(0, 5),
    [displayedNews]
  );
  const moduleShortcuts = cards.slice(0, 6);

  return (
    <div style={pageShell}>
      <section className="overview-top-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 0.95fr)", gap: 18, marginBottom: 28 }}>
        <div style={{ ...panelStyle, padding: "22px 24px" }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, color: "#f3d38a", textTransform: "uppercase", marginBottom: 10 }}>
            {language === "ar" ? "الواجهة المختصرة" : "OVERVIEW"}
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: "#f8fafc", lineHeight: 1.15, marginBottom: 10 }}>
            {language === "ar" ? "لوحة تنفيذية للوعي العالمي" : "Executive intelligence overview"}
          </div>
          <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 16 }}>
            {language === "ar"
              ? "الصفحة الرئيسية الآن تركز فقط على الصورة التنفيذية: تنبيهات حرجة، إشارات نشطة، مؤشرات أساسية، واختصارات تشغيلية مباشرة."
              : "The homepage now focuses on an executive picture: critical alerts, active signals, key metrics, and direct operational shortcuts."}
          </div>

          <div style={{ ...panelStyle, padding: "14px 16px", marginBottom: 16, background: "linear-gradient(160deg, rgba(56,189,248,0.05) 0%, rgba(255,255,255,0.02) 100%)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>{language === "ar" ? "آخر تحديث تشغيلي" : "Latest operational update"}</div>
              <div style={{ fontSize: 11, color: loading ? "#f59e0b" : "#22c55e", fontWeight: 800 }}>{loading ? (language === "ar" ? "جارٍ التحديث" : "Refreshing") : (language === "ar" ? "مستقر" : "Stable")}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#f3d38a", marginBottom: 6 }}>{lastUpdated || "—"}</div>
            <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.7 }}>
              {tickerHeadlines[0] || (language === "ar" ? "في انتظار التحديثات التنفيذية" : "Awaiting executive updates")}
            </div>
          </div>

          <div className="overview-metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: 14 }}>
            <OverviewMetric
              label={language === "ar" ? "حجم الذاكرة التحليلية" : "Analytical Memory"}
              value={intelMetrics?.totalItems || 0}
              hint={language === "ar" ? "السجلات التحليلية الحالية" : "Current intelligence records"}
              color="#38bdf8"
            />
            <OverviewMetric
              label={language === "ar" ? "الإشارات النشطة" : "Active Signals"}
              value={intelMetrics?.activeSignals || 0}
              hint={language === "ar" ? "إشارات مترابطة قابلة للرصد" : "Correlated and trackable signals"}
              color="#22c55e"
            />
            <OverviewMetric
              label={language === "ar" ? "الكيانات المرصودة" : "Tracked Entities"}
              value={intelMetrics?.entityCount || 0}
              hint={language === "ar" ? "الكيانات والأسماء المرصودة" : "Observed names and entities"}
              color="#a78bfa"
            />
            <OverviewMetric
              label={language === "ar" ? "مفتاح التحديث" : "Refresh Key"}
              value={refreshKey}
              hint={language === "ar" ? "نبض تدفق البيانات الحالي" : "Current pipeline heartbeat"}
              color="#f3d38a"
            />
          </div>
        </div>

        <div style={{ ...panelStyle, padding: "20px 20px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 3, color: "#475569", textTransform: "uppercase", marginBottom: 12 }}>
            {language === "ar" ? "البوابات التشغيلية" : "Operational Gateways"}
          </div>
          <div className="overview-featured-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {featuredCards.map((route) => (
              <FeaturedShortcutCard key={route.path} route={route} language={language} navigate={navigate} />
            ))}
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)", gap: 18, marginBottom: 28 }} className="overview-exec-grid">
        <div style={{ ...panelStyle, padding: "18px 18px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 3, color: "#475569", textTransform: "uppercase", marginBottom: 12 }}>
            {language === "ar" ? "تنبيهات حرجة" : "Critical Alerts"}
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {criticalAlerts.length === 0 ? (
              <div style={{ color: "#94a3b8", fontSize: 13 }}>{language === "ar" ? "لا توجد تنبيهات حرجة حالياً" : "No critical alerts right now"}</div>
            ) : criticalAlerts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate("/news")}
                className="nr-card-hover"
                style={{ ...panelStyle, padding: "14px 14px 12px", cursor: "pointer", textAlign: "inherit", color: "inherit" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc" }}>{item.title}</div>
                  <div style={{ color: "#ef4444", fontSize: 11, fontWeight: 900 }}>{item.urgency}</div>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{item.summary}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...panelStyle, padding: "18px 18px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 3, color: "#475569", textTransform: "uppercase", marginBottom: 12 }}>
            {language === "ar" ? "الإشارات العليا" : "Top Active Signals"}
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {topSignals.map((item, index) => (
              <div key={item.id || `headline-${index}`} style={{ borderBottom: index === topSignals.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)", paddingBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0", marginBottom: 4 }}>{item.title}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11, color: "#64748b" }}>
                  <span>{item.source}</span>
                  <span>{item.category}</span>
                  <span>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 3, color: "#475569", textTransform: "uppercase", marginBottom: 14 }}>
          {language === "ar" ? "اختصارات تشغيلية" : "Operational Shortcuts"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {moduleShortcuts.map((route) => (
            <ShortcutCard key={route.path} route={route} language={language} navigate={navigate} />
          ))}
        </div>
      </section>
    </div>
  );
}
