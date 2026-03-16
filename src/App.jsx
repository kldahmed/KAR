import React, { useEffect, useState } from "react";
import NewsCard from "./components/NewsCard";

const DEMO_NEWS = [
  {
    id: "demo-1",
    title: "تحديثات إقليمية مستمرة في عدد من المناطق",
    summary: "هذه بيانات احتياطية تظهر عند تعذر الوصول إلى الخادم.",
    urgency: "medium",
    source: "Fallback Feed",
    time: new Date().toISOString(),
    category: "regional",
    url: "#",
    image: ""
  }
];

const TABS = [
  { id: "news", label: "الأخبار", icon: "📰" }
];
const CATEGORIES = [
  { id: "all", label: "الكل", emoji: "🌍" },
  { id: "regional", label: "إقليمي", emoji: "🗺️" },
  { id: "politics", label: "سياسة", emoji: "🏛️" },
  { id: "military", label: "عسكري", emoji: "⚔️" },
  { id: "economy", label: "اقتصاد", emoji: "💰" }
];

export default function App() {
  const [tab, setTab] = useState("news");
  const [cat, setCat] = useState("all");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/news?category=${cat}`)
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        setNews(Array.isArray(data.news) ? data.news : []);
        setError("");
      })
      .catch(() => {
        setNews([]);
        setError("تعذر تحميل الأخبار من الخادم");
      })
      .finally(() => setLoading(false));
  }, [cat]);

  const displayedNews = news.length > 0 ? news : DEMO_NEWS;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#11151a", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ padding: "24px 0 12px", textAlign: "center", fontWeight: "bold", fontSize: "2rem", letterSpacing: "2px" }}>
        🦅 لوحة الحرب Dashboard
      </header>
      {/* Tabs */}
      <nav style={{ display: "flex", justifyContent: "center", gap: "18px", marginBottom: "18px" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{ background: tab === t.id ? "#f3d38a" : "#222", color: tab === t.id ? "#222" : "#f3d38a", border: "none", borderRadius: "8px", padding: "8px 22px", fontWeight: "700", fontSize: "1rem", cursor: "pointer" }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>
      {/* Category Buttons */}
      <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "24px" }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            style={{ background: cat === c.id ? "#38bdf8" : "#222", color: cat === c.id ? "#fff" : "#38bdf8", border: "none", borderRadius: "8px", padding: "6px 16px", fontWeight: "700", fontSize: "1rem", cursor: "pointer" }}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
      {/* News Cards Grid */}
      <main style={{ padding: "0 20px 50px" }}>
        {loading && <div style={{ textAlign: "center", color: "#38bdf8", padding: "30px" }}>جاري التحميل...</div>}
        {error && <div style={{ textAlign: "center", color: "#e74c3c", padding: "30px" }}>{error}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px", maxWidth: "1400px", margin: "0 auto" }}>
          {displayedNews.map((item, idx) => (
            <NewsCard key={item.id || idx} {...item} />
          ))}
        </div>
      </main>
    </div>
  );
}
