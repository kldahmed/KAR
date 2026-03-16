import React, { useEffect, useMemo, useRef, useState } from "react";
import XPostCard from "./XPostCard";

export default function XNewsFeed() {
  const [posts, setPosts] = useState([]);
  const [updated, setUpdated] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const intervalRef = useRef(null);

  const fetchPosts = () => {
    setLoading(true);
    setError("");

    fetch("/api/x-feed")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setPosts(Array.isArray(data.posts) ? data.posts : []);
        setUpdated(data.updated || "");
      })
      .catch(() => {
        setPosts([]);
        setError("تعذر تحميل نبض X");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchPosts, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const uniqueSources = useMemo(() => {
    return ["all", ...Array.from(new Set(posts.map((p) => p.account)))];
  }, [posts]);

  const displayedPosts = useMemo(() => {
    if (sourceFilter === "all") return posts;
    return posts.filter((p) => p.account === sourceFilter);
  }, [posts, sourceFilter]);

  return (
    <section
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        display: "grid",
        gap: "20px"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "16px",
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        <div>
          <div
            style={{
              color: "#f8fafc",
              fontSize: "32px",
              fontWeight: 900
            }}
          >
            نبض X
          </div>
          <div
            style={{
              color: "#94a3b8",
              marginTop: "6px",
              fontSize: "14px"
            }}
          >
            تحديثات فورية من الحسابات الرسمية والموثوقة
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap"
          }}
        >
          {uniqueSources.map((src) => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              style={{
                background: sourceFilter === src ? "#38bdf8" : "#1f2937",
                color: sourceFilter === src ? "#fff" : "#93c5fd",
                border: "none",
                borderRadius: "999px",
                padding: "8px 14px",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              {src === "all" ? "الكل" : src}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ color: "#38bdf8", textAlign: "center", padding: "20px" }}>
          جاري تحديث نبض X...
        </div>
      )}

      {error && (
        <div style={{ color: "#ef4444", textAlign: "center", padding: "20px" }}>
          {error}
        </div>
      )}

      <div
        style={{
          color: "#94a3b8",
          fontSize: "13px"
        }}
      >
        آخر تحديث: {updated ? new Date(updated).toLocaleString("ar") : "غير متوفر"}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "18px"
        }}
      >
        {displayedPosts.map((post) => (
          <XPostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
