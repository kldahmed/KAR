import React from "react";

function formatArabicTime(value) {
  try {
    return new Intl.DateTimeFormat("ar", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return "وقت غير متوفر";
  }
}

export default function XPostCard({ post }) {
  if (!post) return null;

  return (
    <div
      style={{
        background: "linear-gradient(180deg,#0f172a,#111827)",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: "18px",
        padding: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,.18)"
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "12px"
        }}
      >
        <img
          src={post.avatar}
          alt={post.account}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "1px solid rgba(255,255,255,.12)"
          }}
        />

        <div style={{ flex: 1 }}>
          <div
            style={{
              color: "#f8fafc",
              fontWeight: 900,
              fontSize: "15px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            {post.account}
            {post.verified && <span style={{ color: "#38bdf8" }}>✔</span>}
          </div>

          <div style={{ color: "#94a3b8", fontSize: "13px" }}>
            {post.handle}
          </div>
        </div>

        <div
          style={{
            color: "#94a3b8",
            fontSize: "12px",
            whiteSpace: "nowrap"
          }}
        >
          {formatArabicTime(post.time)}
        </div>
      </div>

      <div
        style={{
          color: "#e5e7eb",
          lineHeight: 1.9,
          fontSize: "14px",
          marginBottom: "12px"
        }}
      >
        {post.translated || post.text}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap"
          }}
        >
          <span
            style={{
              background: "rgba(56,189,248,.1)",
              color: "#7dd3fc",
              border: "1px solid rgba(56,189,248,.15)",
              padding: "6px 10px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 800
            }}
          >
            𝕏
          </span>

          <span
            style={{
              background: "rgba(255,255,255,.05)",
              color: "#cbd5e1",
              border: "1px solid rgba(255,255,255,.08)",
              padding: "6px 10px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 800
            }}
          >
            {post.category}
          </span>
        </div>

        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#38bdf8",
            textDecoration: "none",
            fontWeight: 800,
            fontSize: "13px"
          }}
        >
          فتح المنشور
        </a>
      </div>
    </div>
  );
}
