import React, { useEffect, useMemo, useState } from "react";
import { pageShell, panelStyle } from "./shared/pagePrimitives";

// ── helpers ────────────────────────────────────────────────────────────────

function getEmbedUrl(channel) {
  if (channel?.mode !== "embed" || !channel?.youtubeId) return "";
  return `https://www.youtube.com/embed/${channel.youtubeId}?autoplay=1&rel=0&modestbranding=1`;
}

function ChannelCard({ channel, active, onClick, language }) {
  const isAr = language === "ar";
  const isEmbed = channel.mode === "embed" && Boolean(channel.youtubeId);
  return (
    <button
      type="button"
      onClick={() => onClick(channel)}
      style={{
        textAlign: "start",
        width: "100%",
        borderRadius: 14,
        border: active ? "1px solid rgba(34,197,94,0.45)" : "1px solid rgba(255,255,255,0.08)",
        background: active
          ? "linear-gradient(135deg, rgba(5,46,22,0.75), rgba(6,78,59,0.4))"
          : "linear-gradient(140deg, rgba(15,23,42,0.78), rgba(30,41,59,0.58))",
        padding: "12px 12px",
        color: "#e2e8f0",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {channel.flag} {channel.name}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>{channel.country}</div>
        </div>
        <span
          style={{
            borderRadius: 999,
            padding: "3px 8px",
            fontWeight: 700,
            fontSize: 10,
            background: isEmbed ? "rgba(34,197,94,0.18)" : "rgba(56,189,248,0.14)",
            color: isEmbed ? "#4ade80" : "#67e8f9",
            flexShrink: 0,
          }}
        >
          {isEmbed ? (isAr ? "داخل الصفحة" : "In-page") : (isAr ? "مصدر خارجي" : "External")}
        </span>
      </div>
    </button>
  );
}

export default function LivePage({ language = "ar" }) {
  const isAr = language === "ar";
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");

  const loadChannels = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/live");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const items = Array.isArray(data?.channels) ? data.channels : [];
      setChannels(items);
      setLastUpdated(new Date().toISOString());
      setSelected((prev) => {
        if (prev && items.find((c) => c.id === prev.id)) return prev;
        return items.find((c) => c.mode === "embed" && c.youtubeId) || items[0] || null;
      });
    } catch {
      setError(isAr ? "تعذر تحميل القنوات حالياً" : "Unable to load channels now");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
    const timer = setInterval(loadChannels, 300000);
    return () => clearInterval(timer);
  }, [language]);

  const countries = useMemo(() => {
    const map = new Map();
    channels.forEach((ch) => {
      const key = ch.countryCode || "OTHER";
      if (!map.has(key)) {
        map.set(key, { code: key, name: ch.country || (isAr ? "غير مصنف" : "Other"), flag: ch.flag || "🌍", count: 0 });
      }
      const item = map.get(key);
      item.count += 1;
      map.set(key, item);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [channels, isAr]);

  const filtered = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    return channels.filter((ch) => {
      const countryOk = countryFilter === "all" || ch.countryCode === countryFilter;
      if (!countryOk) return false;
      if (!q) return true;
      const hay = `${ch.name || ""} ${ch.country || ""} ${ch.title || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [channels, countryFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((ch) => {
      const key = ch.countryCode || "OTHER";
      if (!map.has(key)) {
        map.set(key, { country: ch.country || (isAr ? "غير مصنف" : "Other"), flag: ch.flag || "🌍", channels: [] });
      }
      map.get(key).channels.push(ch);
    });
    return Array.from(map.entries())
      .map(([code, info]) => ({ code, ...info }))
      .sort((a, b) => b.channels.length - a.channels.length || a.country.localeCompare(b.country, "ar"));
  }, [filtered, isAr]);

  const summary = {
    title: isAr ? "مركز البث الحي للقنوات العربية" : "Arabic Live Channels Center",
    subtitle: isAr
      ? "أكبر تجميعة قنوات عربية ممكنة، مرتبة حسب الدول مع تشغيل مباشر عند توفره"
      : "A large Arabic channels directory grouped by country with in-page playback where available",
    all: isAr ? "كل الدول" : "All countries",
    search: isAr ? "ابحث عن قناة أو دولة..." : "Search channel or country...",
    loading: isAr ? "جارٍ تحميل القنوات..." : "Loading channels...",
    empty: isAr ? "لا توجد قنوات مطابقة للفلاتر الحالية" : "No channels match current filters",
    retry: isAr ? "إعادة المحاولة" : "Retry",
    watchExternal: isAr ? "المشاهدة من المصدر" : "Watch on source",
    pickChannel: isAr ? "اختر قناة للعرض" : "Select a channel",
    updated: isAr ? "آخر تحديث" : "Updated",
  };

  return (
    <div style={pageShell}>
      <section style={{ ...panelStyle, padding: "20px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "#22d3ee", fontWeight: 800, marginBottom: 6, letterSpacing: "0.08em" }}>
              LIVE DIRECTORY
            </div>
            <h1 style={{ margin: 0, color: "#f8fafc", fontSize: 28, lineHeight: 1.3 }}>{summary.title}</h1>
            <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 13 }}>{summary.subtitle}</p>
          </div>
          <div style={{ color: "#64748b", fontSize: 12 }}>
            {channels.length} {isAr ? "قناة" : "channels"} • {countries.length} {isAr ? "دولة" : "countries"}
            {lastUpdated ? (
              <div style={{ marginTop: 4 }}>
                {summary.updated}: {new Date(lastUpdated).toLocaleTimeString(isAr ? "ar-SA" : "en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" })}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section style={{ ...panelStyle, padding: "16px", marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={summary.search}
            style={{
              width: "100%",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              padding: "10px 12px",
              background: "rgba(15,23,42,0.65)",
              color: "#f8fafc",
              fontSize: 13,
            }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setCountryFilter("all")}
              style={{
                borderRadius: 999,
                border: countryFilter === "all" ? "1px solid #22d3ee" : "1px solid rgba(255,255,255,0.12)",
                background: countryFilter === "all" ? "rgba(34,211,238,0.18)" : "rgba(15,23,42,0.55)",
                color: countryFilter === "all" ? "#22d3ee" : "#cbd5e1",
                fontWeight: 700,
                fontSize: 12,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              🌍 {summary.all}
            </button>
            {countries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => setCountryFilter(country.code)}
                style={{
                  borderRadius: 999,
                  border: countryFilter === country.code ? "1px solid #4ade80" : "1px solid rgba(255,255,255,0.12)",
                  background: countryFilter === country.code ? "rgba(74,222,128,0.18)" : "rgba(15,23,42,0.55)",
                  color: countryFilter === country.code ? "#4ade80" : "#cbd5e1",
                  fontWeight: 700,
                  fontSize: 12,
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                {country.flag} {country.name} ({country.count})
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...panelStyle, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1", fontWeight: 800 }}>
          {selected?.name ? `${selected.flag} ${selected.name}` : summary.pickChannel}
        </div>

        {selected?.mode === "embed" && selected.youtubeId ? (
          <div style={{ position: "relative", paddingTop: "56.25%" }}>
            <iframe
              src={getEmbedUrl(selected)}
              title={selected.title || selected.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", background: "#000" }}
            />
          </div>
        ) : (
          <div style={{ padding: "34px 16px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📺</div>
            <div style={{ marginBottom: 14 }}>
              {isAr ? "هذه القناة تعمل من المصدر الرسمي مباشرة" : "This channel is available on its official source"}
            </div>
            {selected?.externalUrl ? (
              <a
                href={selected.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  borderRadius: 10,
                  border: "1px solid rgba(34,211,238,0.35)",
                  background: "rgba(34,211,238,0.12)",
                  color: "#67e8f9",
                  fontWeight: 700,
                  textDecoration: "none",
                  padding: "8px 14px",
                }}
              >
                {summary.watchExternal}
              </a>
            ) : null}
          </div>
        )}
      </section>

      {loading ? (
        <section style={{ ...panelStyle, padding: "26px", textAlign: "center", color: "#67e8f9" }}>{summary.loading}</section>
      ) : null}

      {!loading && error ? (
        <section style={{ ...panelStyle, padding: "26px", textAlign: "center" }}>
          <div style={{ color: "#f87171", marginBottom: 12 }}>{error}</div>
          <button
            type="button"
            onClick={loadChannels}
            style={{ borderRadius: 8, border: "1px solid rgba(248,113,113,0.4)", background: "rgba(248,113,113,0.12)", color: "#fecaca", padding: "7px 14px", cursor: "pointer" }}
          >
            {summary.retry}
          </button>
        </section>
      ) : null}

      {!loading && !error && grouped.length === 0 ? (
        <section style={{ ...panelStyle, padding: "26px", textAlign: "center", color: "#94a3b8" }}>{summary.empty}</section>
      ) : null}

      {!loading && !error && grouped.length > 0 ? (
        <div style={{ display: "grid", gap: 16 }}>
          {grouped.map((group) => (
            <section key={group.code} style={{ ...panelStyle, padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h2 style={{ margin: 0, fontSize: 17, color: "#f1f5f9" }}>
                  {group.flag} {group.country}
                </h2>
                <span style={{ color: "#94a3b8", fontSize: 12 }}>{group.channels.length} {isAr ? "قناة" : "channels"}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                {group.channels.map((channel) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    active={selected?.id === channel.id}
                    onClick={setSelected}
                    language={language}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
