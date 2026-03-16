import React, { useEffect, useRef } from "react";

export default function BreakingNewsTicker({ headlines = [], interval = 60000 }) {
  const tickerRef = useRef(null);

  useEffect(() => {
    if (!tickerRef.current) return;
    tickerRef.current.scrollLeft = 0;
  }, [headlines]);

  return (
    <div style={{
      width: "100%",
      overflow: "hidden",
      background: "#222",
      color: "#f3d38a",
      fontWeight: "bold",
      fontSize: "1.1rem",
      borderBottom: "2px solid #f3d38a",
      padding: "8px 0",
      whiteSpace: "nowrap"
    }}>
      <div
        ref={tickerRef}
        style={{
          display: "inline-block",
          animation: `ticker-scroll 30s linear infinite`,
          minWidth: "100%"
        }}
      >
        {headlines.map((title, idx) => (
          <span key={idx} style={{ marginRight: "32px" }}>
            {title}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
