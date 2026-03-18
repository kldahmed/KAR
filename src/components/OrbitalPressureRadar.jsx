/**
 * OrbitalPressureRadar — Phase 3: Orbital Intelligence Radar Map
 * Transforms the flat pressure map into an orbital-style radar with:
 * - Regional heatmap zones (green/yellow/orange/red)
 * - Animated pressure waves from high-intensity events
 * - Influence arcs between linked regions
 * - Rotating scan line for live feel
 */
import React, { useEffect, useState, useRef } from "react";
import { getWorldState, subscribeWorldState } from "../lib/worldStateEngine";
import { REGION_COORDS, REGION_EN } from "../lib/world/eventPulseEngine";
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

const REGION_DISPLAY = {
  "الشرق الأوسط": { icon: "🕌", en: "Middle East" },
  "أوروبا": { icon: "🏰", en: "Europe" },
  "آسيا": { icon: "🏯", en: "Asia-Pacific" },
  "أفريقيا": { icon: "🌍", en: "Africa" },
  "أمريكا الشمالية": { icon: "🗽", en: "N. America" },
  "أمريكا الجنوبية": { icon: "🌎", en: "S. America" },
  "الأسواق العالمية": { icon: "💹", en: "Markets" },
};

function pressureColor(pressure) {
  if (pressure >= 60) return P.red;
  if (pressure >= 40) return P.amber;
  if (pressure >= 20) return "#eab308"; // yellow-ish
  return P.green;
}

function pressureLevelLabel(pressure, isAr) {
  if (pressure >= 60) return isAr ? "حرج" : "Critical";
  if (pressure >= 40) return isAr ? "مرتفع" : "High";
  if (pressure >= 20) return isAr ? "متوسط" : "Moderate";
  return isAr ? "مستقر" : "Stable";
}

function HeatZone({ region, x, y, pressure, eventCount, isAr, pulses }) {
  const color = pressureColor(pressure);
  const name = isAr ? region : (REGION_DISPLAY[region]?.en || region);
  const icon = REGION_DISPLAY[region]?.icon || "🌐";
  const baseR = 8 + Math.min(pressure, 80) * 0.18;
  const hasPulse = pressure >= 40;

  return (
    <g style={{ cursor: "pointer" }}>
      {/* Heatmap zone - graduated fill */}
      <circle cx={x} cy={y} r={baseR + 6}
        fill={`${color}06`} stroke="none" />
      <circle cx={x} cy={y} r={baseR + 3}
        fill={`${color}10`} stroke="none" />
      <circle cx={x} cy={y} r={baseR}
        fill={`${color}18`}
        stroke={`${color}40`} strokeWidth={1.2} />

      {/* Pressure wave animation for hot zones */}
      {hasPulse && (
        <>
          <circle cx={x} cy={y} r={baseR} fill="none"
            stroke={color} strokeWidth={0.8} opacity={0.4}>
            <animate attributeName="r" from={baseR} to={baseR + 14} dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.4" to="0" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx={x} cy={y} r={baseR} fill="none"
            stroke={color} strokeWidth={0.5} opacity={0.3}>
            <animate attributeName="r" from={baseR} to={baseR + 10} dur="3s" begin="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.3" to="0" dur="3s" begin="1.5s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      {/* Core indicator */}
      <circle cx={x} cy={y} r={3} fill={color} opacity={0.9}>
        {hasPulse && (
          <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Region label */}
      <text x={x} y={y - baseR - 4} textAnchor="middle"
        fill={P.text} fontSize={6.5} fontWeight={700} fontFamily="Inter, system-ui">
        {icon} {name}
      </text>

      {/* Pressure value */}
      <text x={x} y={y + 1.5} textAnchor="middle"
        fill={color} fontSize={7} fontWeight={900} fontFamily="Inter, system-ui">
        {pressure}%
      </text>

      {/* Event count */}
      <text x={x} y={y + baseR + 6} textAnchor="middle"
        fill={P.textDim} fontSize={5} fontWeight={600} fontFamily="Inter, system-ui">
        {eventCount} {isAr ? "حدث" : "events"}
      </text>
    </g>
  );
}

function InfluenceArc({ fromX, fromY, toX, toY, color, strength, label }) {
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2 - 6 * strength;
  const opacity = 0.1 + strength * 0.3;

  return (
    <g>
      <path
        d={`M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`}
        fill="none" stroke={color} strokeWidth={0.8 + strength * 0.8}
        opacity={opacity} strokeDasharray="3,3"
      >
        <animate attributeName="stroke-dashoffset" from="6" to="0" dur="2s" repeatCount="indefinite" />
      </path>
      {/* Flow direction dot */}
      <circle r={1.5} fill={color} opacity={opacity + 0.2}>
        <animateMotion dur="3s" repeatCount="indefinite"
          path={`M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`} />
      </circle>
    </g>
  );
}

export default function OrbitalPressureRadar() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const [ws, setWs] = useState(null);
  const [scanAngle, setScanAngle] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    setWs(getWorldState());
    const unsub = subscribeWorldState(s => setWs(s));
    return unsub;
  }, []);

  // Radar scan rotation
  useEffect(() => {
    let angle = 0;
    const animate = () => {
      angle = (angle + 0.3) % 360;
      setScanAngle(angle);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  if (!ws) return null;

  const { pulseData, regionalPressures, linkedDynamics } = ws;
  const { links, regionIntensity } = pulseData || { links: [], regionIntensity: {} };

  const regionNodes = (regionalPressures || []).map(rp => {
    const coords = REGION_COORDS[rp.region];
    if (!coords) return null;
    return { ...rp, x: coords.x, y: coords.y };
  }).filter(Boolean);

  // Add Global Markets
  if (!regionNodes.find(n => n.region === "الأسواق العالمية")) {
    const coords = REGION_COORDS["الأسواق العالمية"];
    const riData = regionIntensity["الأسواق العالمية"] || {};
    if (coords) {
      regionNodes.push({
        region: "الأسواق العالمية",
        regionEn: "Global Markets",
        x: coords.x, y: coords.y,
        pressure: riData.avgSeverity || 0,
        eventCount: riData.count || 0,
        color: riData.color || P.muted,
      });
    }
  }

  return (
    <section style={{ maxWidth: 1400, margin: "0 auto", padding: "0 16px" }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 12, padding: "0 4px",
      }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 900, letterSpacing: 4,
            color: P.gold, textTransform: "uppercase", marginBottom: 2,
          }}>
            {isAr ? "الرادار المداري" : "ORBITAL RADAR"}
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: P.text }}>
            {isAr ? "أين يتصاعد الضغط العالمي؟" : "Where is global pressure rising?"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {[
            { color: P.red, l: isAr ? "حرج" : "Critical" },
            { color: P.amber, l: isAr ? "مرتفع" : "Rising" },
            { color: "#eab308", l: isAr ? "متوسط" : "Moderate" },
            { color: P.green, l: isAr ? "مستقر" : "Stable" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, opacity: 0.8 }} />
              <span style={{ fontSize: 10, color: P.textDim, fontWeight: 600 }}>{item.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Orbital Map Container */}
      <div style={{
        background: `linear-gradient(160deg, ${P.bg}, ${P.surface})`,
        border: "1px solid rgba(56,189,248,0.06)",
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Subtle grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(56,189,248,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          pointerEvents: "none",
        }} />

        <svg viewBox="0 0 100 80" style={{
          width: "100%", height: "auto", minHeight: 280, maxHeight: 440,
          display: "block",
        }}>
          {/* Orbital rings */}
          <circle cx="50" cy="40" r="35" fill="none"
            stroke="rgba(56,189,248,0.04)" strokeWidth="0.3" strokeDasharray="2,4" />
          <circle cx="50" cy="40" r="25" fill="none"
            stroke="rgba(56,189,248,0.03)" strokeWidth="0.3" strokeDasharray="2,4" />
          <circle cx="50" cy="40" r="15" fill="none"
            stroke="rgba(56,189,248,0.02)" strokeWidth="0.3" strokeDasharray="2,4" />

          {/* Scan line */}
          <line
            x1="50" y1="40"
            x2={50 + 38 * Math.cos(scanAngle * Math.PI / 180)}
            y2={40 + 38 * Math.sin(scanAngle * Math.PI / 180)}
            stroke="rgba(56,189,248,0.12)"
            strokeWidth="0.5"
          />
          {/* Scan sweep gradient */}
          <defs>
            <radialGradient id="scanGlow">
              <stop offset="0%" stopColor="rgba(56,189,248,0.06)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="40" r="38" fill="url(#scanGlow)" opacity="0.5" />

          {/* Influence arcs */}
          {links.map((link, i) => (
            <InfluenceArc key={i}
              fromX={link.fromX} fromY={link.fromY}
              toX={link.toX} toY={link.toY}
              color={link.color} strength={link.strength} />
          ))}

          {/* Region heatmap zones */}
          {regionNodes.map((node, i) => (
            <HeatZone key={node.region || i}
              region={node.region}
              x={node.x} y={node.y}
              pressure={node.pressure}
              eventCount={node.eventCount}
              isAr={isAr} />
          ))}
        </svg>

        {/* Bottom status bar */}
        <div style={{
          padding: "8px 16px",
          borderTop: "1px solid rgba(56,189,248,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 8,
        }}>
          <span style={{ fontSize: 10, color: P.textDim, fontWeight: 600 }}>
            {isAr
              ? `${regionNodes.length} مناطق مرصودة · ${links.length} ترابط نشط`
              : `${regionNodes.length} regions tracked · ${links.length} active links`}
          </span>
          <span style={{ fontSize: 10, color: P.muted, fontWeight: 600 }}>
            📡 {isAr ? "رادار مداري مباشر" : "Live orbital radar"}
          </span>
        </div>
      </div>

      {/* Active Dynamic Chains */}
      {linkedDynamics && linkedDynamics.length > 0 && (
        <div style={{
          display: "flex", gap: 8, flexWrap: "wrap",
          marginTop: 12,
        }}>
          {linkedDynamics.slice(0, 4).map((chain, i) => (
            <div key={chain.id || i} style={{
              background: `${chain.color}08`,
              border: `1px solid ${chain.color}18`,
              borderRadius: 10,
              padding: "6px 12px",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 14 }}>{chain.icon}</span>
              <span style={{ fontSize: 11, color: P.text, fontWeight: 600 }}>
                {isAr ? chain.nameAr : chain.nameEn}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 800, color: chain.color,
                background: `${chain.color}12`, borderRadius: 4, padding: "1px 6px",
              }}>
                {chain.strength}%
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
