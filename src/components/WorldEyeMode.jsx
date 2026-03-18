/**
 * WorldEyeMode — Phase 6: "عين العالم" Full-Screen Monitoring System
 * A strategic monitoring center mode showing:
 * - Global orbital radar
 * - Event pulses
 * - Regional pressure
 * - Live signal flow
 * - Agent interpretation
 */
import React, { useEffect, useState, useRef, useCallback } from "react";
import { getWorldState, subscribeWorldState } from "../lib/worldStateEngine";
import { REGION_COORDS, REGION_EN } from "../lib/world/eventPulseEngine";
import { useI18n } from "../i18n/I18nProvider";

const P = {
  bg: "#030508",
  surface: "#060a10",
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
  "آسيا": { icon: "🏯", en: "Asia" },
  "أفريقيا": { icon: "🌍", en: "Africa" },
  "أمريكا الشمالية": { icon: "🗽", en: "N. America" },
  "أمريكا الجنوبية": { icon: "🌎", en: "S. America" },
  "الأسواق العالمية": { icon: "💹", en: "Markets" },
};

function pressureColor(p) {
  if (p >= 60) return P.red;
  if (p >= 40) return P.amber;
  if (p >= 20) return "#eab308";
  return P.green;
}

function computeWorldPulse(ws) {
  if (!ws) return 0;
  const t = ws.tension?.value || 0;
  const e = ws.economic?.value || 0;
  const ev = ws.eventIntensity?.value || 0;
  return Math.round(Math.min(100, t * 0.35 + e * 0.25 + ev * 0.25 + (ws.intelligence?.value || 0) * 0.15));
}

export default function WorldEyeMode({ onClose }) {
  const { language } = useI18n();
  const isAr = language === "ar";
  const [ws, setWs] = useState(null);
  const [scanAngle, setScanAngle] = useState(0);
  const [signalLog, setSignalLog] = useState([]);
  const animRef = useRef(null);

  useEffect(() => {
    setWs(getWorldState());
    const unsub = subscribeWorldState(s => {
      setWs(s);
      // Add to signal log
      if (s?.agentLines?.length) {
        const newLine = s.agentLines[Math.floor(Math.random() * s.agentLines.length)];
        if (newLine) {
          setSignalLog(prev => [{
            id: Date.now(),
            text: isAr ? newLine.ar : newLine.en,
            icon: newLine.icon,
            type: newLine.type,
            time: new Date().toLocaleTimeString(isAr ? "ar-AE" : "en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          }, ...prev].slice(0, 15));
        }
      }
    });
    return unsub;
  }, [isAr]);

  // Radar scan
  useEffect(() => {
    let angle = 0;
    const animate = () => {
      angle = (angle + 0.4) % 360;
      setScanAngle(angle);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && onClose) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!ws) return null;

  const pulse = computeWorldPulse(ws);
  const pulseColor = pulse >= 70 ? P.red : pulse >= 50 ? P.amber : pulse >= 30 ? P.blue : P.green;
  const { regionalPressures, pulseData, linkedDynamics, forecasts, agentState, tension, economic } = ws;
  const { links } = pulseData || { links: [] };

  const regionNodes = (regionalPressures || []).map(rp => {
    const coords = REGION_COORDS[rp.region];
    if (!coords) return null;
    return { ...rp, x: coords.x, y: coords.y };
  }).filter(Boolean);

  const timeStr = new Date(ws.timestamp).toLocaleTimeString(isAr ? "ar-AE" : "en-GB", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Dubai"
  });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: P.bg,
      color: P.text,
      display: "grid",
      gridTemplateColumns: "1fr 320px",
      gridTemplateRows: "auto 1fr auto",
      fontFamily: "Inter, system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* ─── Top Bar ─── */}
      <div style={{
        gridColumn: "1 / -1",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 20px",
        borderBottom: `1px solid ${pulseColor}12`,
        background: "rgba(6,10,16,0.95)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>👁️</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: P.gold }}>
              {isAr ? "عين العالم" : "WORLD EYE"}
            </div>
            <div style={{ fontSize: 10, color: P.textDim, fontWeight: 600 }}>
              {isAr ? "وضع المراقبة الاستراتيجية" : "Strategic Monitoring Mode"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* World Pulse */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: P.muted, letterSpacing: 2 }}>
              {isAr ? "نبض العالم" : "WORLD PULSE"}
            </span>
            <span style={{ fontSize: 22, fontWeight: 900, color: pulseColor, fontFamily: "Inter" }}>
              {pulse}%
            </span>
          </div>

          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="nr-live-dot" style={{ width: 6, height: 6 }} />
            <span style={{ fontSize: 11, color: P.green, fontWeight: 700 }}>LIVE</span>
            <span style={{ fontSize: 11, color: P.muted }}>{timeStr}</span>
          </div>

          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: "6px 14px",
            color: P.textDim, fontWeight: 700, fontSize: 12,
            cursor: "pointer",
          }}>
            {isAr ? "إغلاق" : "EXIT"} ✕
          </button>
        </div>
      </div>

      {/* ─── Main Radar Area ─── */}
      <div style={{
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {/* Grid background */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(56,189,248,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }} />

        <svg viewBox="0 0 100 80" style={{
          width: "100%", height: "100%", maxHeight: "calc(100vh - 120px)",
        }}>
          {/* Orbital rings */}
          {[35, 28, 20, 12].map((r, i) => (
            <circle key={i} cx="50" cy="40" r={r}
              fill="none" stroke={`rgba(56,189,248,${0.04 - i * 0.008})`}
              strokeWidth="0.3" strokeDasharray="2,4" />
          ))}

          {/* Scan line */}
          <line x1="50" y1="40"
            x2={50 + 38 * Math.cos(scanAngle * Math.PI / 180)}
            y2={40 + 38 * Math.sin(scanAngle * Math.PI / 180)}
            stroke="rgba(56,189,248,0.15)" strokeWidth="0.5" />

          {/* Influence arcs */}
          {links.map((link, i) => (
            <g key={i}>
              <path
                d={`M ${link.fromX} ${link.fromY} Q ${(link.fromX + link.toX) / 2} ${(link.fromY + link.toY) / 2 - 6 * link.strength} ${link.toX} ${link.toY}`}
                fill="none" stroke={link.color}
                strokeWidth={0.6 + link.strength * 0.6}
                opacity={0.15 + link.strength * 0.2}
                strokeDasharray="3,3">
                <animate attributeName="stroke-dashoffset" from="6" to="0" dur="2s" repeatCount="indefinite" />
              </path>
            </g>
          ))}

          {/* Region nodes */}
          {regionNodes.map((node, i) => {
            const color = pressureColor(node.pressure);
            const name = isAr ? node.region : (REGION_DISPLAY[node.region]?.en || node.region);
            const baseR = 6 + Math.min(node.pressure, 80) * 0.12;
            return (
              <g key={node.region || i}>
                <circle cx={node.x} cy={node.y} r={baseR + 4}
                  fill={`${color}08`} stroke="none" />
                <circle cx={node.x} cy={node.y} r={baseR}
                  fill={`${color}18`} stroke={`${color}40`} strokeWidth={1} />
                {node.pressure >= 40 && (
                  <circle cx={node.x} cy={node.y} r={baseR} fill="none"
                    stroke={color} strokeWidth={0.6} opacity={0.3}>
                    <animate attributeName="r" from={baseR} to={baseR + 10} dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.3" to="0" dur="3s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={node.x} cy={node.y} r={2.5} fill={color} opacity={0.8} />
                <text x={node.x} y={node.y - baseR - 3} textAnchor="middle"
                  fill={P.text} fontSize={5.5} fontWeight={700}>{name}</text>
                <text x={node.x} y={node.y + baseR + 5} textAnchor="middle"
                  fill={color} fontSize={6} fontWeight={900}>{node.pressure}%</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ─── Right Panel: Signal Feed ─── */}
      <div style={{
        borderLeft: "1px solid rgba(56,189,248,0.06)",
        display: "flex", flexDirection: "column",
        background: "rgba(6,10,16,0.95)",
        overflow: "hidden",
      }}>
        {/* Panel header: Metrics */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(56,189,248,0.06)" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
          }}>
            {[
              { l: isAr ? "التوتر" : "Tension", v: tension?.value, c: tension?.color },
              { l: isAr ? "الاقتصاد" : "Economy", v: economic?.value, c: economic?.color },
            ].map((m, i) => (
              <div key={i} style={{
                background: `${m.c}08`,
                border: `1px solid ${m.c}15`,
                borderRadius: 10, padding: "8px 10px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: m.c, fontFamily: "Inter" }}>
                  {m.v || 0}
                </div>
                <div style={{ fontSize: 9, color: P.muted, fontWeight: 700, letterSpacing: 1 }}>
                  {m.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Bars */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(56,189,248,0.06)" }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: P.muted, letterSpacing: 2, marginBottom: 8 }}>
            {isAr ? "ضغط المناطق" : "REGIONAL PRESSURE"}
          </div>
          {(regionalPressures || []).slice(0, 6).map((rp, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <span style={{ fontSize: 9, color: P.textDim, fontWeight: 600, width: 80, flexShrink: 0 }}>
                {isAr ? rp.region : rp.regionEn}
              </span>
              <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
                <div style={{
                  width: `${Math.min(100, rp.pressure)}%`, height: "100%",
                  background: rp.color, borderRadius: 2,
                  transition: "width 1s ease",
                }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 800, color: rp.color, width: 28, textAlign: "end" }}>
                {rp.pressure}
              </span>
            </div>
          ))}
        </div>

        {/* Forecasts */}
        {forecasts && forecasts.length > 0 && (
          <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(56,189,248,0.06)" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: P.muted, letterSpacing: 2, marginBottom: 8 }}>
              {isAr ? "التنبؤات" : "FORECASTS"}
            </div>
            {forecasts.slice(0, 3).map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
                padding: "4px 8px",
                background: "rgba(243,211,138,0.03)",
                borderRadius: 8,
              }}>
                <span style={{ fontSize: 12 }}>{f.icon || "🔮"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: P.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.title}
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 900, color: P.gold, fontFamily: "Inter" }}>
                  {f.probability}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Live Signal Log */}
        <div style={{ flex: 1, overflow: "auto", padding: "10px 16px" }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: P.muted, letterSpacing: 2, marginBottom: 8 }}>
            {isAr ? "تدفق الإشارات" : "SIGNAL FLOW"}
          </div>
          {signalLog.length === 0 && (
            <div style={{ fontSize: 10, color: P.muted, textAlign: "center", padding: 20 }}>
              {isAr ? "جارٍ رصد الإشارات..." : "Monitoring signals..."}
            </div>
          )}
          {signalLog.map((log, i) => (
            <div key={log.id} style={{
              padding: "6px 0",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
              opacity: 1 - i * 0.05,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                <span style={{ fontSize: 10 }}>{log.icon}</span>
                <span style={{ fontSize: 9, color: P.muted, fontWeight: 600 }}>{log.time}</span>
              </div>
              <div style={{ fontSize: 10, color: P.text, fontWeight: 500, lineHeight: 1.5 }}>
                {log.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Bottom Status Bar ─── */}
      <div style={{
        gridColumn: "1 / -1",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "6px 20px",
        borderTop: "1px solid rgba(56,189,248,0.06)",
        background: "rgba(6,10,16,0.95)",
        fontSize: 10, color: P.muted, fontWeight: 600,
      }}>
        <span>
          👁️ {isAr ? "عين العالم — وضع المراقبة الاستراتيجية" : "World Eye — Strategic Monitoring Mode"}
        </span>
        <span>
          {ws.totalEvents} {isAr ? "حدث" : "events"} · {ws.totalIntelItems} {isAr ? "عنصر استخباري" : "intel items"}
        </span>
        {agentState && (
          <span style={{ color: agentState.color }}>
            {agentState.icon} {isAr ? agentState.ar : agentState.en}
          </span>
        )}
      </div>
    </div>
  );
}
