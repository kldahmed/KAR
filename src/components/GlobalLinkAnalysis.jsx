/**
 * GlobalLinkAnalysis — Phase 5: Cross-Domain Influence Chains
 * Visualizes relationships: Iran → Israel → Oil Markets → Global Economy
 * Shows systemic effects between events and sectors.
 */
import React, { useEffect, useState } from "react";
import { getWorldState, subscribeWorldState } from "../lib/worldStateEngine";
import { useI18n } from "../i18n/I18nProvider";

const P = {
  bg: "#060a10",
  surface: "#0a0f1c",
  gold: "#f3d38a",
  blue: "#38bdf8",
  green: "#22c55e",
  red: "#ef4444",
  amber: "#f59e0b",
  purple: "#a78bfa",
  text: "#e2e8f0",
  textDim: "#64748b",
  muted: "#475569",
};

function ChainNode({ label, icon, color, x, y, isActive }) {
  return (
    <g>
      <circle cx={x} cy={y} r={isActive ? 14 : 11}
        fill={`${color}15`} stroke={`${color}40`} strokeWidth={1.2} />
      {isActive && (
        <circle cx={x} cy={y} r={14} fill="none"
          stroke={color} strokeWidth={0.6} opacity={0.3}>
          <animate attributeName="r" from="14" to="20" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.3" to="0" dur="2.5s" repeatCount="indefinite" />
        </circle>
      )}
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central"
        fontSize={10} fill={color}>{icon}</text>
      <text x={x} y={y + 20} textAnchor="middle"
        fontSize={5.5} fontWeight={700} fill={P.text} fontFamily="Inter, system-ui">
        {label}
      </text>
    </g>
  );
}

function ChainArrow({ fromX, fromY, toX, toY, color, strength }) {
  const opacity = 0.15 + strength * 0.35;
  return (
    <g>
      <line x1={fromX + 14} y1={fromY} x2={toX - 14} y2={toY}
        stroke={color} strokeWidth={1 + strength} opacity={opacity}
        strokeDasharray="4,3" />
      {/* Flow dot */}
      <circle r={2} fill={color} opacity={opacity + 0.2}>
        <animate attributeName="cx"
          from={fromX + 14} to={toX - 14} dur="2s" repeatCount="indefinite" />
        <animate attributeName="cy"
          from={fromY} to={toY} dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

export default function GlobalLinkAnalysis() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const [ws, setWs] = useState(null);

  useEffect(() => {
    setWs(getWorldState());
    const unsub = subscribeWorldState(s => setWs(s));
    return unsub;
  }, []);

  if (!ws) return null;

  const { linkedDynamics, eventClusters } = ws;

  if (!linkedDynamics?.length && !eventClusters?.length) return null;

  const chains = linkedDynamics || [];

  return (
    <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 10, fontWeight: 900, letterSpacing: 4,
          color: P.gold, textTransform: "uppercase", marginBottom: 2,
        }}>
          {isAr ? "تحليل الربط العالمي" : "GLOBAL LINK ANALYSIS"}
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: P.text }}>
          {isAr ? "كيف تترابط الأحداث والقطاعات؟" : "How do events and sectors connect?"}
        </div>
      </div>

      {/* Chain cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 12,
      }}>
        {chains.slice(0, 6).map((chain, i) => (
          <div key={chain.id || i} style={{
            background: `linear-gradient(135deg, ${P.bg}, ${P.surface})`,
            border: `1px solid ${chain.color}15`,
            borderRadius: 16,
            padding: "16px 18px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Top accent */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${chain.color}60, transparent)`,
            }} />

            {/* Chain header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{chain.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: P.text }}>
                    {isAr ? chain.nameAr : chain.nameEn}
                  </div>
                  <div style={{ fontSize: 10, color: P.textDim, fontWeight: 600 }}>
                    {chain.evidenceCount} {isAr ? "دليل" : "evidence items"}
                  </div>
                </div>
              </div>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
              }}>
                <div style={{
                  fontSize: 18, fontWeight: 900, color: chain.color,
                  fontFamily: "Inter, system-ui",
                }}>
                  {chain.strength}%
                </div>
                <div style={{
                  fontSize: 8, fontWeight: 700, color: chain.color,
                  background: `${chain.color}12`, borderRadius: 4, padding: "1px 6px",
                  textTransform: "uppercase",
                }}>
                  {isAr ? chain.confidenceLabel : chain.confidenceLabelEn}
                </div>
              </div>
            </div>

            {/* Visual chain representation */}
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "8px 0",
            }}>
              {chain.regions.map((region, ri) => (
                <React.Fragment key={ri}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: chain.color,
                    background: `${chain.color}10`,
                    border: `1px solid ${chain.color}20`,
                    borderRadius: 8, padding: "4px 10px",
                    whiteSpace: "nowrap",
                  }}>
                    {region}
                  </div>
                  {ri < chain.regions.length - 1 && (
                    <span style={{ fontSize: 12, color: chain.color, opacity: 0.6 }}>→</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Matched triggers */}
            <div style={{
              display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6,
            }}>
              {chain.matchedTriggers.map((trigger, ti) => (
                <span key={ti} style={{
                  fontSize: 9, fontWeight: 600, color: P.textDim,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 4, padding: "2px 6px",
                }}>
                  {trigger.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
