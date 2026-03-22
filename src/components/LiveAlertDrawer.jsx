import React from "react";
import { formatDisplayTime } from "../AppHelpers";
import { localizeDisplayItem, localizeSourceLabel } from "../lib/i18n/summaryLocalizer";

export default function LiveAlertDrawer({ alert, history = [], language = "ar", onDismiss, onOpenNews }) {
  if (!alert) return null;

  const localizedAlert = language === "ar" ? localizeDisplayItem(alert, "ar") : alert;

  const recentAlerts = Array.isArray(history)
    ? history
        .filter((item) => item?.id && item.id !== alert.id)
        .slice(0, 3)
        .map((item) => (language === "ar" ? localizeDisplayItem(item, "ar") : item))
    : [];

  return (
    <div className="live-alert-drawer" role="status" aria-live="polite">
      <div className="live-alert-drawer__pulse" />
      <div className="live-alert-drawer__body">
        <div className="live-alert-drawer__eyebrow">
          {language === "ar" ? "تنبيه فوري عالي الأهمية" : "High-priority instant alert"}
        </div>
        <div className="live-alert-drawer__title">{localizedAlert.title}</div>
        <div className="live-alert-drawer__summary">{localizedAlert.summary || (language === "ar" ? "خبر عاجل تم رفعه تلقائياً من محرك الرصد الحي." : "A breaking item was automatically elevated by the live intake engine.")}</div>
        <div className="live-alert-drawer__meta">
          <span>{language === "ar" ? localizeSourceLabel(localizedAlert.source || alert.source, "ar") : (localizedAlert.source || "Live Intake")}</span>
          <span>{formatDisplayTime(localizedAlert.time || alert.time, language === "en" ? "en" : "ar") || localizedAlert.time || alert.time || "—"}</span>
          <span>{language === "ar" ? `أولوية ${localizedAlert.intakePriority || alert.intakePriority || 0}` : `Priority ${localizedAlert.intakePriority || alert.intakePriority || 0}`}</span>
        </div>
        {recentAlerts.length > 0 ? (
          <div className="live-alert-drawer__timeline">
            <div className="live-alert-drawer__timeline-title">{language === "ar" ? "آخر التنبيهات" : "Recent alerts"}</div>
            {recentAlerts.map((item) => (
              <div key={item.id} className="live-alert-drawer__timeline-item">
                <span className="live-alert-drawer__timeline-dot" />
                <span className="live-alert-drawer__timeline-text">{item.title}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="live-alert-drawer__actions">
        <button type="button" className="live-alert-drawer__primary" onClick={onOpenNews}>
          {language === "ar" ? "عرض التفاصيل" : "Open details"}
        </button>
        <button type="button" className="live-alert-drawer__ghost" onClick={onDismiss}>
          {language === "ar" ? "إغلاق" : "Dismiss"}
        </button>
      </div>
    </div>
  );
}