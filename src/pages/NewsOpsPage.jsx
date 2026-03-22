import React, { useMemo, useState } from "react";
import { PageHero, pageShell, panelStyle } from "./shared/pagePrimitives";

function SourceRow({ source, language, opsBusy, onApply }) {
  const [active, setActive] = useState(Boolean(source?.active));
  const [intervalSeconds, setIntervalSeconds] = useState(Number(source?.update_interval_seconds || 600));
  const [trustBaseScore, setTrustBaseScore] = useState(Number(source?.trust_base_score || 70));

  return (
    <div style={{ border: "1px solid rgba(71,85,105,0.46)", borderRadius: 14, padding: 12, background: "rgba(2,6,23,0.34)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 800 }}>{source.name}</div>
          <div style={{ color: "#94a3b8", fontSize: 11 }}>{source.category} | {source.language} | {source.status}</div>
        </div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#e2e8f0", fontSize: 12 }}>
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} disabled={opsBusy} />
          {language === "ar" ? "نشط" : "Active"}
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 10 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ color: "#94a3b8", fontSize: 11 }}>{language === "ar" ? "التردد بالثواني" : "Interval seconds"}</span>
          <input
            type="number"
            min="120"
            max="3600"
            step="30"
            value={intervalSeconds}
            disabled={opsBusy}
            onChange={(event) => setIntervalSeconds(Number(event.target.value || 600))}
            style={{ borderRadius: 10, border: "1px solid rgba(71,85,105,0.7)", background: "rgba(15,23,42,0.78)", color: "#f8fafc", padding: "8px 10px" }}
          />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ color: "#94a3b8", fontSize: 11 }}>{language === "ar" ? "الثقة الأساسية" : "Trust base"}</span>
          <input
            type="number"
            min="20"
            max="99"
            step="1"
            value={trustBaseScore}
            disabled={opsBusy}
            onChange={(event) => setTrustBaseScore(Number(event.target.value || 70))}
            style={{ borderRadius: 10, border: "1px solid rgba(71,85,105,0.7)", background: "rgba(15,23,42,0.78)", color: "#f8fafc", padding: "8px 10px" }}
          />
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ color: "#94a3b8", fontSize: 11 }}>
          {language === "ar"
            ? `نجاحات ${source.successes || 0} | إخفاقات ${source.failures || 0} | آخر دفعة ${source.last_item_count || 0}`
            : `Success ${source.successes || 0} | Fail ${source.failures || 0} | Last batch ${source.last_item_count || 0}`}
        </div>
        <button
          type="button"
          disabled={opsBusy}
          onClick={() => onApply({
            source_id: source.id,
            active,
            update_interval_seconds: intervalSeconds,
            trust_base_score: trustBaseScore,
          })}
          style={{ border: "1px solid rgba(56,189,248,0.48)", background: "rgba(56,189,248,0.14)", color: "#bae6fd", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 800, cursor: opsBusy ? "wait" : "pointer" }}
        >
          {language === "ar" ? "تطبيق" : "Apply"}
        </button>
      </div>
    </div>
  );
}

export default function NewsOpsPage({
  language,
  feedStatus,
  opsBusy,
  opsMessage,
  updateNewsSource,
  reprocessNewsBatch,
  refreshOperations,
}) {
  const dashboard = feedStatus?.dashboard || null;
  const sources = Array.isArray(feedStatus?.sources) ? feedStatus.sources : [];

  const sourceGroups = useMemo(() => {
    const grouped = new Map();
    sources.forEach((source) => {
      const key = source.category || "other";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(source);
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [sources]);

  return (
    <div style={pageShell}>
      <PageHero
        eyebrow={language === "ar" ? "عمليات" : "Operations"}
        title={language === "ar" ? "مركز تشغيل الأخبار" : "News Operations Center"}
        description={language === "ar"
          ? "تحكم مباشر في المصادر، الترددات، درجات الثقة، وإعادة المعالجة دون مغادرة التطبيق."
          : "Direct control over sources, intervals, trust levels, and reprocessing without leaving the app."}
        right={
          <div style={{ ...panelStyle, padding: "14px 16px", minWidth: 250 }}>
            <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 8 }}>{language === "ar" ? "السعة المتوقعة" : "Projected capacity"}</div>
            <div style={{ color: "#f8fafc", fontSize: 24, fontWeight: 900 }}>{dashboard?.capacity_projection?.projected_unique_per_day || 0}</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>{language === "ar" ? "خبر فريد يوميا" : "unique items/day"}</div>
          </div>
        }
      />

      <section style={{ ...panelStyle, padding: "16px 18px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ color: "#e2e8f0", fontSize: 13 }}>
            {language === "ar"
              ? `المصادر ${sources.length} | قيد المراجعة ${feedStatus?.stats?.reviewQueueDepth || 0} | معزول ${feedStatus?.stats?.quarantinedSources || 0}`
              : `Sources ${sources.length} | Review ${feedStatus?.stats?.reviewQueueDepth || 0} | Quarantined ${feedStatus?.stats?.quarantinedSources || 0}`}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={opsBusy}
              onClick={() => refreshOperations()}
              style={{ border: "1px solid rgba(148,163,184,0.36)", background: "rgba(148,163,184,0.08)", color: "#e2e8f0", borderRadius: 10, padding: "8px 12px", fontWeight: 800, cursor: opsBusy ? "wait" : "pointer" }}
            >
              {language === "ar" ? "تحديث اللوحة" : "Refresh panel"}
            </button>
            <button
              type="button"
              disabled={opsBusy}
              onClick={() => reprocessNewsBatch(300)}
              style={{ border: "1px solid rgba(243,211,138,0.36)", background: "rgba(243,211,138,0.08)", color: "#f8e3aa", borderRadius: 10, padding: "8px 12px", fontWeight: 800, cursor: opsBusy ? "wait" : "pointer" }}
            >
              {language === "ar" ? "إعادة معالجة 300" : "Reprocess 300"}
            </button>
            <button
              type="button"
              disabled={opsBusy}
              onClick={() => reprocessNewsBatch(1000)}
              style={{ border: "1px solid rgba(248,113,113,0.36)", background: "rgba(248,113,113,0.08)", color: "#fecaca", borderRadius: 10, padding: "8px 12px", fontWeight: 800, cursor: opsBusy ? "wait" : "pointer" }}
            >
              {language === "ar" ? "إعادة معالجة 1000" : "Reprocess 1000"}
            </button>
          </div>
        </div>
        {opsMessage ? (
          <div style={{ color: "#67e8f9", fontSize: 12, marginTop: 10 }}>{opsMessage}</div>
        ) : null}
      </section>

      <div style={{ display: "grid", gap: 16 }}>
        {sourceGroups.map(([category, entries]) => (
          <section key={category} style={{ ...panelStyle, padding: "16px 18px" }}>
            <div style={{ color: "#f8fafc", fontSize: 14, fontWeight: 900, marginBottom: 12 }}>
              {language === "ar" ? `فئة ${category}` : `Category ${category}`}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
              {entries.map((source) => (
                <SourceRow
                  key={source.id}
                  source={source}
                  language={language}
                  opsBusy={opsBusy}
                  onApply={updateNewsSource}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
