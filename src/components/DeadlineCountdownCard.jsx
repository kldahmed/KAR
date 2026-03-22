import React, { useEffect, useMemo, useRef, useState } from "react";
import { DEADLINE_CONFIG } from "../config/deadlineConfig";
import { getDeadlineState, resolveDeadlineStart } from "../lib/deadlineUtils";

function pad(n) {
  return String(n).padStart(2, "0");
}

/* ── Cinematic digit card with flash-on-change ── */
function DigitCard({ value, label, expired, intense }) {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(true);
      prevRef.current = value;
      const t = setTimeout(() => setFlash(false), 280);
      return () => clearTimeout(t);
    }
  }, [value]);

  const borderCol = expired
    ? "rgba(71,85,105,0.3)"
    : intense
    ? "rgba(239,68,68,0.65)"
    : "rgba(185,28,28,0.45)";

  const bgCard = expired
    ? "linear-gradient(170deg, rgba(15,23,42,0.92), rgba(10,15,30,0.97))"
    : "linear-gradient(170deg, rgba(80,8,8,0.92), rgba(22,4,4,0.97))";

  const numColor = expired ? "#475569" : intense ? "#ff8080" : "#fecaca";

  const shadow = flash
    ? "0 0 48px rgba(239,68,68,0.75), inset 0 0 18px rgba(185,28,28,0.12)"
    : expired
    ? "none"
    : intense
    ? "0 0 28px rgba(239,68,68,0.55), 0 0 56px rgba(185,28,28,0.28)"
    : "0 0 18px rgba(185,28,28,0.35), 0 0 40px rgba(127,29,29,0.18)";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        style={{
          position: "relative",
          width: "clamp(68px, 10vw, 96px)",
          height: "clamp(76px, 11vw, 106px)",
          borderRadius: 12,
          border: `1px solid ${borderCol}`,
          background: bgCard,
          boxShadow: shadow,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transition: "box-shadow 0.22s ease",
        }}
      >
        {/* scanline texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.013) 3px, rgba(255,255,255,0.013) 4px)",
            pointerEvents: "none",
          }}
        />
        {/* mid-line separator */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "14%",
            right: "14%",
            height: 1,
            background: expired ? "rgba(71,85,105,0.18)" : "rgba(185,28,28,0.28)",
            transform: "translateY(-50%)",
          }}
        />
        {/* top glint */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.07) 50%, transparent 90%)",
          }}
        />
        <div
          style={{
            fontSize: "clamp(36px, 6vw, 54px)",
            fontWeight: 900,
            color: numColor,
            fontFamily: "'Courier New', 'Consolas', monospace",
            lineHeight: 1,
            letterSpacing: "-1px",
            fontVariantNumeric: "tabular-nums",
            textShadow: expired
              ? "none"
              : `0 0 18px rgba(248,113,113,0.55), 0 0 36px rgba(185,28,28,0.25)`,
            userSelect: "none",
            position: "relative",
            zIndex: 1,
          }}
        >
          {value}
        </div>
      </div>
      <div
        style={{
          fontSize: "clamp(9px, 1.2vw, 11px)",
          fontWeight: 800,
          color: expired ? "#475569" : "#fca5a5",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          opacity: 0.9,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ── Animated colon separator ── */
function ColonSep({ expired, intense }) {
  return (
    <div
      style={{
        fontSize: "clamp(28px, 5vw, 44px)",
        fontWeight: 900,
        color: expired ? "#1e293b" : intense ? "#ef4444" : "#7f1d1d",
        marginBottom: 20,
        opacity: expired ? 0.4 : 0.75,
        animation: expired ? "none" : "dlColonBlink 1s step-end infinite",
        userSelect: "none",
        lineHeight: 1,
      }}
    >
      :
    </div>
  );
}

/* ── Left tension panel (abstract force bars) ── */
function LeftPanel() {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: "clamp(80px, 22%, 200px)",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Angled energy bars */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 7,
          paddingLeft: 16,
        }}
      >
        {[
          { w: "88%", op: 0.9, anim: "dlSideBar 1.9s ease-in-out infinite" },
          { w: "70%", op: 0.55, anim: "dlSideBar 2.1s ease-in-out infinite 0.3s" },
          { w: "50%", op: 0.3, anim: "dlSideBar 2.4s ease-in-out infinite 0.6s" },
          { w: "32%", op: 0.14, anim: "dlSideBar 2.8s ease-in-out infinite 0.9s" },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              height: Math.max(1, 3 - i * 0.6),
              width: b.w,
              background:
                "linear-gradient(to right, transparent, rgba(185,28,28,0.55), rgba(239,68,68,0.85))",
              opacity: b.op,
              borderRadius: 2,
              animation: b.anim,
            }}
          />
        ))}
      </div>
      {/* corner bracket */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          width: 16,
          height: 16,
          borderTop: "1.5px solid rgba(185,28,28,0.5)",
          borderLeft: "1.5px solid rgba(185,28,28,0.5)",
          borderRadius: "2px 0 0 0",
          opacity: 0.65,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 14,
          width: 16,
          height: 16,
          borderBottom: "1.5px solid rgba(185,28,28,0.5)",
          borderLeft: "1.5px solid rgba(185,28,28,0.5)",
          borderRadius: "0 0 0 2px",
          opacity: 0.65,
        }}
      />
      {/* fade-to-center overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, rgba(10,3,7,0.08), rgba(10,3,7,0.9))",
        }}
      />
    </div>
  );
}

/* ── Right tension panel (mirror) ── */
function RightPanel() {
  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: "clamp(80px, 22%, 200px)",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 7,
          paddingRight: 16,
          alignItems: "flex-end",
        }}
      >
        {[
          { w: "88%", op: 0.9, anim: "dlSideBar 2.0s ease-in-out infinite 0.15s" },
          { w: "70%", op: 0.55, anim: "dlSideBar 2.2s ease-in-out infinite 0.45s" },
          { w: "50%", op: 0.3, anim: "dlSideBar 2.5s ease-in-out infinite 0.75s" },
          { w: "32%", op: 0.14, anim: "dlSideBar 2.9s ease-in-out infinite 1.05s" },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              height: Math.max(1, 3 - i * 0.6),
              width: b.w,
              background:
                "linear-gradient(to left, transparent, rgba(185,28,28,0.55), rgba(239,68,68,0.85))",
              opacity: b.op,
              borderRadius: 2,
              animation: b.anim,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          width: 16,
          height: 16,
          borderTop: "1.5px solid rgba(185,28,28,0.5)",
          borderRight: "1.5px solid rgba(185,28,28,0.5)",
          borderRadius: "0 2px 0 0",
          opacity: 0.65,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 14,
          right: 14,
          width: 16,
          height: 16,
          borderBottom: "1.5px solid rgba(185,28,28,0.5)",
          borderRight: "1.5px solid rgba(185,28,28,0.5)",
          borderRadius: "0 0 2px 0",
          opacity: 0.65,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to left, rgba(10,3,7,0.08), rgba(10,3,7,0.9))",
        }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════ */
export default function DeadlineCountdownCard({ language = "ar" }) {
  const isAr = language === "ar";
  const [clockNow, setClockNow] = useState(Date.now());
  const [startMeta, setStartMeta] = useState({
    startAt: new Date(DEADLINE_CONFIG.fallbackStartIso),
    source: "fallback",
  });

  useEffect(() => {
    let mounted = true;
    resolveDeadlineStart(DEADLINE_CONFIG).then((meta) => {
      if (mounted) setStartMeta(meta);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const state = useMemo(
    () => getDeadlineState(startMeta.startAt, DEADLINE_CONFIG, clockNow),
    [startMeta.startAt, clockNow]
  );

  const { days, hours, minutes, seconds } = state.parts;
  const expired = state.expired;
  const intense = !expired && state.remainingMs <= 6 * 3600 * 1000;

  /* border / bg / glow colors */
  const borderColor = expired
    ? "rgba(71,85,105,0.28)"
    : intense
    ? "rgba(239,68,68,0.6)"
    : "rgba(185,28,28,0.42)";

  const heroBg = expired
    ? "linear-gradient(135deg, #050d1a 0%, #090f1f 100%)"
    : "linear-gradient(135deg, #0a0307 0%, #180408 45%, #0d0208 100%)";

  const heroShadow = expired
    ? "0 24px 70px rgba(0,0,0,0.55)"
    : intense
    ? "0 0 0 1px rgba(239,68,68,0.22), 0 24px 80px rgba(127,29,29,0.55), 0 0 60px rgba(185,28,28,0.12)"
    : "0 0 0 1px rgba(185,28,28,0.14), 0 24px 70px rgba(127,29,29,0.42)";

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        border: `1px solid ${borderColor}`,
        background: heroBg,
        boxShadow: heroShadow,
        padding: "clamp(24px, 4vw, 38px) clamp(16px, 3vw, 28px)",
        minHeight: "clamp(160px, 18vw, 220px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        animation: expired ? "none" : "dlHeroBreath 2.4s ease-in-out infinite",
      }}
    >
      {/* ── All keyframes ── */}
      <style>{`
        @keyframes dlHeroBreath {
          0%,100% { box-shadow: 0 0 0 1px rgba(185,28,28,0.14), 0 24px 70px rgba(127,29,29,0.38); }
          50%      { box-shadow: 0 0 0 1px rgba(185,28,28,0.22), 0 28px 80px rgba(127,29,29,0.55), 0 0 40px rgba(185,28,28,0.1); }
        }
        @keyframes dlIntenseBreath {
          0%,100% { box-shadow: 0 0 0 1px rgba(239,68,68,0.22), 0 24px 80px rgba(127,29,29,0.5); }
          50%      { box-shadow: 0 0 0 2px rgba(239,68,68,0.38), 0 30px 90px rgba(127,29,29,0.7), 0 0 50px rgba(239,68,68,0.15); }
        }
        @keyframes dlSideBar {
          0%,100% { opacity: var(--bar-op, 0.4); }
          50%      { opacity: calc(var(--bar-op, 0.4) * 1.6); }
        }
        @keyframes dlColonBlink {
          0%,100% { opacity: 0.75; }
          49%     { opacity: 0.75; }
          50%     { opacity: 0.15; }
          51%     { opacity: 0.75; }
        }
        @keyframes dlCenterOrb {
          0%,100% { transform: translate(-50%,-50%) scale(1);   opacity: 0.4; }
          50%      { transform: translate(-50%,-50%) scale(1.08); opacity: 0.72; }
        }
        @keyframes dlTensionLine {
          0%,100% { opacity: 0.38; transform: scaleX(1); }
          50%      { opacity: 0.72; transform: scaleX(1.02); }
        }
        @keyframes dlExpiredPulse {
          0%,100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }
        @keyframes dlLiveDot {
          0%,100% { transform:scale(1); opacity:1; }
          50%      { transform:scale(1.5); opacity:0.55; }
        }
        @keyframes dlScanDown {
          0%   { transform: translateY(-200%); opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(2000%); opacity: 0; }
        }
      `}</style>

      {/* ── Background: center glow orb ── */}
      {!expired && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "min(340px, 70%)",
            height: "min(340px, 70%)",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(185,28,28,0.2) 0%, rgba(127,29,29,0.07) 55%, transparent 80%)",
            pointerEvents: "none",
            animation: "dlCenterOrb 2.6s ease-in-out infinite",
          }}
        />
      )}

      {/* ── Background: horizontal tension line ── */}
      {!expired && (
        <div
          style={{
            position: "absolute",
            left: "8%",
            right: "8%",
            top: "50%",
            height: 1,
            transform: "translateY(-50%)",
            background:
              "linear-gradient(to right, transparent, rgba(185,28,28,0.5) 20%, rgba(239,68,68,0.65) 50%, rgba(185,28,28,0.5) 80%, transparent)",
            pointerEvents: "none",
            animation: "dlTensionLine 2.4s ease-in-out infinite",
          }}
        />
      )}

      {/* ── Background: slow scan line ── */}
      {!expired && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, transparent 10%, rgba(239,68,68,0.18) 50%, transparent 90%)",
            pointerEvents: "none",
            animation: "dlScanDown 6s linear infinite",
          }}
        />
      )}

      {/* ── Left + Right force panels ── */}
      {!expired && <LeftPanel />}
      {!expired && <RightPanel />}

      {/* ══ Main content layer ══ */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(12px, 2vw, 20px)",
          width: "100%",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          {/* Status chip */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: expired
                ? "rgba(71,85,105,0.12)"
                : "rgba(185,28,28,0.16)",
              border: `1px solid ${expired ? "rgba(71,85,105,0.28)" : "rgba(185,28,28,0.38)"}`,
              borderRadius: 999,
              padding: "4px 14px",
              color: expired ? "#64748b" : "#fca5a5",
              fontSize: "clamp(9px, 1.4vw, 11px)",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {!expired && (
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: intense ? "#ef4444" : "#dc2626",
                  display: "inline-block",
                  boxShadow: "0 0 7px rgba(239,68,68,0.9)",
                  animation: "dlLiveDot 1.4s ease-in-out infinite",
                  flexShrink: 0,
                }}
              />
            )}
            {expired
              ? isAr
                ? "انتهاء المهلة"
                : "DEADLINE PASSED"
              : isAr
              ? "عدّ تنازلي مباشر"
              : "LIVE COUNTDOWN"}
          </div>

          {/* Main title */}
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(15px, 2.8vw, 22px)",
              fontWeight: 900,
              color: expired ? "#475569" : "#fef2f2",
              textAlign: "center",
              letterSpacing: "0.01em",
              textShadow: expired
                ? "none"
                : "0 2px 20px rgba(185,28,28,0.45)",
              lineHeight: 1.25,
            }}
          >
            {expired
              ? isAr
                ? "انتهت المهلة الاستراتيجية"
                : "Strategic Deadline Elapsed"
              : isAr
              ? "المهلة الاستراتيجية"
              : "Strategic Deadline"}
          </h2>

          {/* Subtitle */}
          <p
            style={{
              margin: 0,
              fontSize: "clamp(10px, 1.4vw, 12px)",
              color: expired ? "#334155" : "#fca5a5",
              textAlign: "center",
              opacity: 0.8,
              maxWidth: 500,
              lineHeight: 1.5,
            }}
          >
            {expired
              ? isAr
                ? "تجاوزت المهلة المعلنة — المنصة تواصل متابعة التطورات"
                : "The announced deadline has elapsed — monitoring continues"
              : isAr
              ? "العدّاد مرتبط بالمرجع الزمني المعتمد للمهلة المعلنة"
              : "Countdown synced with the announced deadline reference time"}
          </p>
        </div>

        {/* ── Countdown digits or expired state ── */}
        {expired ? (
          <div
            style={{
              fontSize: "clamp(22px, 4.5vw, 38px)",
              fontWeight: 900,
              color: "#475569",
              letterSpacing: "-0.01em",
              textAlign: "center",
              padding: "16px 36px",
              border: "1px solid rgba(71,85,105,0.22)",
              borderRadius: 14,
              background: "rgba(15,23,42,0.72)",
              animation: "dlExpiredPulse 3.5s ease-in-out infinite",
            }}
          >
            {isAr ? "انقضت المهلة" : "Deadline Elapsed"}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(4px, 1.2vw, 14px)",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {days > 0 && (
              <>
                <DigitCard
                  value={pad(days)}
                  label={isAr ? "أيام" : "Days"}
                  expired={expired}
                  intense={intense}
                />
                <ColonSep expired={expired} intense={intense} />
              </>
            )}
            <DigitCard
              value={pad(hours)}
              label={isAr ? "ساعات" : "Hours"}
              expired={expired}
              intense={intense}
            />
            <ColonSep expired={expired} intense={intense} />
            <DigitCard
              value={pad(minutes)}
              label={isAr ? "دقائق" : "Minutes"}
              expired={expired}
              intense={intense}
            />
            <ColonSep expired={expired} intense={intense} />
            <DigitCard
              value={pad(seconds)}
              label={isAr ? "ثوانٍ" : "Seconds"}
              expired={expired}
              intense={intense}
            />
          </div>
        )}

        {/* Time reference label */}
        <div
          style={{
            fontSize: "clamp(9px, 1.2vw, 11px)",
            color: expired ? "#1e293b" : "rgba(127,29,29,0.85)",
            letterSpacing: "0.07em",
            textAlign: "center",
          }}
        >
          {isAr ? "المرجع الزمني" : "TIME REF"}&nbsp;·&nbsp;
          <span style={{ color: expired ? "#334155" : "#fca5a5" }}>
            {startMeta.source === "global-events"
              ? isAr
                ? "مصدر مباشر"
                : "Live API"
              : isAr
              ? "مرجع مضمّن"
              : "Built-in reference"}
          </span>
        </div>
      </div>
    </section>
  );
}
