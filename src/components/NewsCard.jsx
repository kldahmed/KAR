
import React from "react";

export default function NewsCard({
  title = "",
  summary = "",
  source = "",
  time = "",
  image = "",
  url = "#",
  urgency = "low"
}) {
  const safeTitle = typeof title === "string" ? title : "خبر";
  const safeSummary = typeof summary === "string" ? summary : "";
  const safeSource = typeof source === "string" ? source : "";
  const safeTime = typeof time === "string" ? time : "";

  return (
    <a
      href={url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="news-card"
    >
      {image && (
        <img
          src={image}
          alt={safeTitle}
          onError={(e) => (e.target.style.display = "none")}
        />
      )}

      <div className="news-content">
        <h3>{safeTitle}</h3>
        <p>{safeSummary}</p>

        <div className="news-meta">
          <span>{safeSource}</span>
          <span>{safeTime}</span>
        </div>
      </div>
    </a>
  );
}
