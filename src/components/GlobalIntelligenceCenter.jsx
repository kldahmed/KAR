import React, { useEffect, useMemo, useState } from "react";

function cleanText(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatArabicTime(value) {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "وقت غير متوفر";
    return new Intl.DateTimeFormat("ar", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(d);
  } catch {
    return "وقت غير متوفر";
  }
}

function urgencyColor(level) {
  if (level === "high") return "#ef4444";
  if (level === "medium") return "#f59e0b";
  return "#facc15";
}

function regionConfig() {
  return [
    {
      id: "middle-east",
      label: "الشرق الأوسط",
      short: "الشرق الأوسط",
      x: 73,
      y: 52,
      glow: "rgba(239,68,68,.22)",
      color: "#ef4444",
      keywords:
        /إيران|اسرائيل|إسرائيل|غزة|لبنان|سوريا|العراق|اليمن|الخليج|قطر|الإمارات|السعودية|البحرين|الكويت|عُمان|هرمز|تل أبيب|طهران|دبي|أبوظبي/i
    },
    {
      id: "ukraine",
      label: "أوكرانيا",
      short: "أوكرانيا",
      x: 56,
      y: 33,
      glow: "rgba(239,68,68,.18)",
      color: "#ef4444",
      keywords: /أوكرانيا|روسيا|كييف|موسكو|القرم/i
    },
    {
      id: "red-sea",
      label: "البحر الأحمر",
      short: "البحر الأحمر",
      x: 67,
      y: 60,
      glow: "rgba(245,158,11,.18)",
      color: "#f59e0b",
      keywords: /البحر الأحمر|باب المندب|الحديدة|ملاحة|سفن|ناقلات|شحن|بحري/i
    },
    {
      id: "taiwan",
      label: "مضيق تايوان",
      short: "مضيق تايوان",
      x: 86,
      y: 46,
      glow: "rgba(250,204,21,.18)",
      color: "#facc15",
      keywords: /تايوان|الصين|بكين|تايبيه|بحر الصين|المحيط الهادئ/i
    },
    {
      id: "north-america",
      label: "أمريكا الشمالية",
      short: "أمريكا",
      x: 26,
      y: 36,
      glow: "rgba(56,189,248,.18)",
      color: "#38bdf8",
      keywords:
        /الولايات المتحدة|أمريكا|واشنطن|البيت الأبيض|البنتاغون|كندا|ترامب|بايدن/i
    }
  ];
}

function computeRegionData(news = []) {
  const base = regionConfig();

  return base.map((region) => {
    const related = news.filter((item) => {
      const hay = `${cleanText(item.title)} ${cleanText(item.summary)}`;
      return region.keywords.test(hay);
    });

    let score = 0;

    related.forEach((item) => {
      if (item.urgency === "high") score += 28;
      else if (item.urgency === "medium") score += 16;
      else score += 8;
    });

    const normalizedScore = Math.min(100, score || 10);

    const sources = Array.from(
      new Set(related.map((item) => cleanText(item.source)).filter(Boolean))
    ).slice(0, 6);

    const headlines = related
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);

    return {
      ...region,
      related,
      sources,
      headlines,
      score: normalizedScore,
      urgency:
        normalizedScore >= 70
          ? "high"
          : normalizedScore >= 35
          ? "medium"
          : "low",
      markerColor:
        normalizedScore >= 70
          ? "#ef4444"
          : normalizedScore >= 35
          ? "#f59e0b"
          : region.color,
      latestTime: headlines[0]?.time || null
    };
  });
}

function buildArabicBrief(news = []) {
  const allText = news.map((n) => `${n.title} ${n.summary}`).join(" ");

  const flags = {
    middleEast:
      /إيران|اسرائيل|إسرائيل|غزة|لبنان|سوريا|العراق|اليمن|الخليج|هرمز/i.test(
        allText
      ),
    ukraine: /أوكرانيا|روسيا|كييف|موسكو/i.test(allText),
    redSea: /البحر الأحمر|باب المندب|ملاحة|ناقلات|شحن/i.test(allText),
    taiwan: /تايوان|الصين|بكين|تايبيه/i.test(allText),
    diplomacy: /محادثات|وساطة|اتفاق|بيان|تحذير|مفاوضات|لقاء/i.test(allText)
  };

  const high = news.filter((n) => n.urgency === "high").length;
  const medium = news.filter((n) => n.urgency === "medium").length;

  let overview =
    "المشهد العالمي تحت المراقبة مع ضغوط متوسطة وتوزع واضح لمراكز التوتر.";
  if (high >= 8) {
    overview =
      "المشهد العالمي شديد الحساسية مع ارتفاع واضح في التطورات العاجلة واتساع مؤشرات التصعيد الجيوسياسي.";
  } else if (high >= 4 || medium >= 6) {
    overview =
      "المشهد العالمي متوتر مع تسارع ملحوظ في الأخبار المرتبطة بالنزاعات والتحركات الاستراتيجية.";
  }

  const bullets = [
    flags.middleEast
      ? "يبقى الشرق الأوسط المحرك الأبرز للتوتر الحالي في دورة الأخبار."
      : null,
    flags.ukraine
      ? "ما تزال جبهة أوكرانيا مؤثرة في مستوى المخاطر داخل أوروبا والمشهد الأمني الأوسع."
      : null,
    flags.redSea
      ? "أمن الملاحة في البحر الأحمر يؤثر مباشرة في سلاسل التوريد والطاقة."
      : null,
    flags.taiwan
      ? "آسيا والمحيط الهادئ تحت المتابعة بسبب حساسية ملف الصين وتايوان."
      : null,
    flags.diplomacy
      ? "هناك نشاط دبلوماسي متزامن مع التصعيد، ما يشير إلى محاولات احتواء موازية للمخاطر."
      : null
  ].filter(Boolean);

  return { overview, bullets };
}

function cameraForRegion(regionId) {
  switch (regionId) {
    case "north-america":
      return "translate3d(7%, 2%, 0) scale(1.08) rotateX(8deg) rotateZ(-1deg)";
    case "ukraine":
      return "translate3d(-4%, 1%, 0) scale(1.1) rotateX(8deg) rotateZ(.5deg)";
    case "middle-east":
      return "translate3d(-9%, -3%, 0) scale(1.13) rotateX(8deg) rotateZ(1deg)";
    case "red-sea":
      return "translate3d(-7%, -6%, 0) scale(1.14) rotateX(8deg) rotateZ(.8deg)";
    case "taiwan":
      return "translate3d(-15%, 0, 0) scale(1.16) rotateX(8deg) rotateZ(1deg)";
    default:
      return "translate3d(0,0,0) scale(1) rotateX(8deg)";
  }
}

function MiniStat({ label, value, color = "#f8fafc" }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: "16px",
        padding: "16px"
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "8px" }}>
        {label}
      </div>
      <div style={{ color, fontSize: "28px", fontWeight: 900 }}>{value}</div>
    </div>
  );
}

export default function GlobalIntelligenceCenter({ news = [] }) {
  const [tick, setTick] = useState(0);
  const [selectedRegionId, setSelectedRegionId] = useState("middle-east");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => (prev + 1) % 1000);
      setNow(new Date());
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const regions = useMemo(() => computeRegionData(news), [news]);
  const brief = useMemo(() => buildArabicBrief(news), [news]);

  const selectedRegion =
    regions.find((r) => r.id === selectedRegionId) || regions[0] || null;

  const high = news.filter((n) => n.urgency === "high").length;
  const medium = news.filter((n) => n.urgency === "medium").length;
  const low = news.filter((n) => n.urgency === "low").length;

  const latest = useMemo(() => {
    return [...news]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);
  }, [news]);

  const pulseScale = tick % 2 === 0 ? 1 : 1.14;
  const mapTransform = cameraForRegion(selectedRegion?.id);

  return (
    <>
      <style>{`
        @keyframes gpPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: .72; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes gpSweep {
          0% { transform: rotate(0deg); opacity: .16; }
          100% { transform: rotate(360deg); opacity: .04; }
        }

        @keyframes gpFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
          100% { transform: translateY(0px); }
        }

        @media (max-width: 1180px) {
          .gic-hero-grid,
          .gic-bottom-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <section
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "grid",
          gap: "22px"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap"
          }}
        >
          <div>
            <div style={{ color: "#f8fafc", fontSize: "38px", fontWeight: 900 }}>
              مركز الاستخبارات العالمي
            </div>
            <div
              style={{
                color: "#94a3b8",
                marginTop: "8px",
                fontSize: "14px",
                lineHeight: 1.8
              }}
            >
              مراقبة جيوسياسية تفاعلية، تحليل مصادر المخاطر، والتنقل السلس بين بؤر التوتر
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center"
            }}
          >
            <span style={{ color: "#ef4444", fontWeight: 800 }}>● نزاع نشط</span>
            <span style={{ color: "#f59e0b", fontWeight: 800 }}>● تصعيد</span>
            <span style={{ color: "#facc15", fontWeight: 800 }}>● توتر</span>
            <span
              style={{
                color: "#7dd3fc",
                fontWeight: 800,
                background: "rgba(56,189,248,.08)",
                border: "1px solid rgba(56,189,248,.16)",
                borderRadius: "999px",
                padding: "6px 10px"
              }}
            >
              آخر تحديث: {formatArabicTime(now)}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap"
          }}
        >
          {regions.map((region) => {
            const active = selectedRegion?.id === region.id;
            return (
              <button
                key={region.id}
                onClick={() => setSelectedRegionId(region.id)}
                style={{
                  border: active
                    ? `1px solid ${region.markerColor}`
                    : "1px solid rgba(255,255,255,.08)",
                  background: active
                    ? "rgba(255,255,255,.06)"
                    : "rgba(255,255,255,.03)",
                  color: "#f8fafc",
                  borderRadius: "999px",
                  padding: "10px 16px",
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all .25s ease",
                  boxShadow: active ? `0 0 0 1px ${region.markerColor}22` : "none"
                }}
              >
                {region.label}
              </button>
            );
          })}
        </div>

        <div
          className="gic-hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr .95fr",
            gap: "22px"
          }}
        >
          <div
            style={{
              background: "linear-gradient(180deg,#171a20,#0f1319)",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,.25)"
            }}
          >
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid rgba(255,255,255,.06)",
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap"
              }}
            >
              <div style={{ color: "#f8fafc", fontSize: "28px", fontWeight: 900 }}>
                خريطة النزاعات التفاعلية
              </div>
              <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                اضغط على أي منطقة لمعرفة مصادر المخاطر والتنقل بينها
              </div>
            </div>

            <div
              style={{
                position: "relative",
                minHeight: "600px",
                overflow: "hidden",
                background:
                  "radial-gradient(circle at 30% 28%, rgba(56,189,248,.14), transparent 18%), radial-gradient(circle at 76% 46%, rgba(239,68,68,.12), transparent 18%), radial-gradient(circle at 70% 62%, rgba(245,158,11,.10), transparent 18%), linear-gradient(180deg,#07111c,#05080d)",
                perspective: "1600px"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "24px",
                  borderRadius: "22px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,.05)"
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    transform: mapTransform,
                    transformStyle: "preserve-3d",
                    transition: "transform .9s cubic-bezier(.2,.8,.2,1)",
                    background:
                      "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)",
                    backgroundSize: "82px 82px, 82px 82px"
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: "660px",
                      height: "660px",
                      borderRadius: "50%",
                      border: "1px solid rgba(56,189,248,.12)",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%)",
                      animation: "gpSweep 9s linear infinite",
                      background:
                        "conic-gradient(from 0deg, rgba(56,189,248,.16), transparent 20%, transparent 100%)"
                    }}
                  />

                  {[
                    { label: "أمريكا الشمالية", x: "22%", y: "35%" },
                    { label: "أوروبا", x: "49%", y: "31%" },
                    { label: "أوكرانيا", x: "56%", y: "36%" },
                    { label: "الشرق الأوسط", x: "74%", y: "50%" },
                    { label: "البحر الأحمر", x: "67%", y: "60%" },
                    { label: "مضيق تايوان", x: "86%", y: "46%" }
                  ].map((r) => (
                    <div
                      key={r.label}
                      style={{
                        position: "absolute",
                        left: r.x,
                        top: r.y,
                        transform: "translate(-50%,-50%) translateZ(18px)",
                        color: "#6b7280",
                        fontWeight: 800,
                        fontSize: "13px",
                        letterSpacing: ".4px",
                        pointerEvents: "none"
                      }}
                    >
                      {r.label}
                    </div>
                  ))}

                  {regions.map((region) => {
                    const active = selectedRegion?.id === region.id;
                    const size =
                      region.urgency === "high"
                        ? 22
                        : region.urgency === "medium"
                        ? 18
                        : 16;

                    return (
                      <button
                        key={region.id}
                        onClick={() => setSelectedRegionId(region.id)}
                        style={{
                          position: "absolute",
                          left: `${region.x}%`,
                          top: `${region.y}%`,
                          transform: `translate(-50%,-50%) scale(${
                            active ? pulseScale : 1
                          }) translateZ(${active ? 32 : 18}px)`,
                          width: `${size}px`,
                          height: `${size}px`,
                          borderRadius: "50%",
                          border: "none",
                          cursor: "pointer",
                          background: region.markerColor,
                          color: region.markerColor,
                          boxShadow: active
                            ? `0 0 0 10px ${region.markerColor}22, 0 0 30px ${region.markerColor}`
                            : `0 0 0 6px ${region.markerColor}18, 0 0 16px ${region.markerColor}`,
                          transition:
                            "transform .45s ease, box-shadow .45s ease, opacity .35s ease",
                          animation: active
                            ? "gpPulse 1.7s infinite"
                            : "gpFloat 3.4s ease-in-out infinite",
                          zIndex: active ? 5 : 3
                        }}
                        aria-label={region.label}
                        title={region.label}
                      />
                    );
                  })}
                </div>
              </div>

              {selectedRegion && (
                <div
                  style={{
                    position: "absolute",
                    left: "24px",
                    bottom: "24px",
                    width: "320px",
                    maxWidth: "calc(100% - 48px)",
                    background: "rgba(9,12,18,.88)",
                    border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: "20px",
                    padding: "16px",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 12px 40px rgba(0,0,0,.35)"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      alignItems: "center",
                      marginBottom: "10px"
                    }}
                  >
                    <div style={{ color: "#f8fafc", fontWeight: 900, fontSize: "22px" }}>
                      {selectedRegion.label}
                    </div>
                    <div
                      style={{
                        color: selectedRegion.markerColor,
                        fontWeight: 900,
                        fontSize: "13px"
                      }}
                    >
                      {selectedRegion.score}%
                    </div>
                  </div>

                  <div style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.8 }}>
                    آخر نشاط:{" "}
                    {selectedRegion.latestTime
                      ? formatArabicTime(selectedRegion.latestTime)
                      : "لا توجد بيانات كافية"}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: "18px" }}>
            <div
              style={{
                background: "linear-gradient(180deg,#171a20,#101317)",
                border: "1px solid rgba(255,255,255,.06)",
                borderRadius: "24px",
                padding: "18px"
              }}
            >
              <div style={{ color: "#f8fafc", fontSize: "26px", fontWeight: 900, marginBottom: "14px" }}>
                موجز الوضع
              </div>

              <div style={{ color: "#dbe3ee", lineHeight: 1.9, fontSize: "15px", marginBottom: "16px" }}>
                {brief.overview}
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {brief.bullets.map((bullet, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,.03)",
                      border: "1px solid rgba(255,255,255,.05)",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      color: "#cbd5e1",
                      lineHeight: 1.8,
                      fontSize: "14px"
                    }}
                  >
                    • {bullet}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(180deg,#171a20,#101317)",
                border: "1px solid rgba(255,255,255,.06)",
                borderRadius: "24px",
                padding: "18px"
              }}
            >
              <div style={{ color: "#f8fafc", fontSize: "26px", fontWeight: 900, marginBottom: "14px" }}>
                تفاصيل المنطقة المختارة
              </div>

              {selectedRegion ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginBottom: "14px"
                    }}
                  >
                    <span
                      style={{
                        color: selectedRegion.markerColor,
                        fontWeight: 900,
                        fontSize: "15px"
                      }}
                    >
                      مستوى التهديد:{" "}
                      {selectedRegion.urgency === "high"
                        ? "عالي"
                        : selectedRegion.urgency === "medium"
                        ? "متوسط"
                        : "منخفض"}
                    </span>

                    <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                      الضغط: {selectedRegion.score}%
                    </span>
                  </div>

                  <div style={{ marginBottom: "12px" }}>
                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: "13px",
                        marginBottom: "8px"
                      }}
                    >
                      مصادر المخاطر
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {selectedRegion.sources.length ? (
                        selectedRegion.sources.map((source, idx) => (
                          <span
                            key={`${source}-${idx}`}
                            style={{
                              background: "rgba(255,255,255,.04)",
                              border: "1px solid rgba(255,255,255,.07)",
                              color: "#f8fafc",
                              padding: "7px 10px",
                              borderRadius: "999px",
                              fontSize: "12px",
                              fontWeight: 800
                            }}
                          >
                            {source}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                          لا توجد مصادر كافية لهذه المنطقة
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: "13px",
                        marginBottom: "8px"
                      }}
                    >
                      أبرز التطورات
                    </div>

                    <div style={{ display: "grid", gap: "10px" }}>
                      {selectedRegion.headlines.length ? (
                        selectedRegion.headlines.slice(0, 4).map((item, idx) => (
                          <div
                            key={item.id || idx}
                            style={{
                              background: "rgba(255,255,255,.03)",
                              border: "1px solid rgba(255,255,255,.05)",
                              borderRadius: "14px",
                              padding: "12px"
                            }}
                          >
                            <div
                              style={{
                                color: "#f8fafc",
                                fontWeight: 800,
                                lineHeight: 1.8,
                                fontSize: "13px",
                                marginBottom: "8px"
                              }}
                            >
                              {cleanText(item.title)}
                            </div>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "10px",
                                flexWrap: "wrap",
                                color: "#94a3b8",
                                fontSize: "12px"
                              }}
                            >
                              <span>{item.source}</span>
                              <span>{formatArabicTime(item.time)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                          لا توجد أخبار مرتبطة بهذه المنطقة حاليًا
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className="gic-bottom-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            gap: "22px"
          }}
        >
          <div
            style={{
              background: "linear-gradient(180deg,#171a20,#101317)",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: "24px",
              padding: "18px"
            }}
          >
            <div style={{ color: "#f8fafc", fontSize: "26px", fontWeight: 900, marginBottom: "14px" }}>
              ضغط الأقاليم
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              {regions.map((region) => (
                <button
                  key={region.id}
                  onClick={() => setSelectedRegionId(region.id)}
                  style={{
                    textAlign: "right",
                    width: "100%",
                    border: "none",
                    cursor: "pointer",
                    background: "transparent",
                    padding: 0
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      marginBottom: "7px",
                      color: "#cbd5e1",
                      fontSize: "14px"
                    }}
                  >
                    <span>{region.label}</span>
                    <span style={{ color: region.markerColor, fontWeight: 900 }}>
                      {region.score}%
                    </span>
                  </div>

                  <div
                    style={{
                      height: "12px",
                      background: "#222831",
                      borderRadius: "999px",
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        width: `${region.score}%`,
                        height: "100%",
                        background: region.markerColor,
                        borderRadius: "999px",
                        transition: "width .5s ease"
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "linear-gradient(180deg,#171a20,#101317)",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: "24px",
              padding: "18px"
            }}
          >
            <div style={{ color: "#f8fafc", fontSize: "26px", fontWeight: 900, marginBottom: "14px" }}>
              تغذية التصعيد
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              {latest.map((item, i) => (
                <div
                  key={item.id || i}
                  style={{
                    background: "rgba(255,255,255,.03)",
                    border: "1px solid rgba(255,255,255,.05)",
                    borderRadius: "14px",
                    padding: "12px 14px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      marginBottom: "8px",
                      alignItems: "center"
                    }}
                  >
                    <span
                      style={{
                        color: urgencyColor(item.urgency),
                        fontWeight: 900,
                        fontSize: "12px"
                      }}
                    >
                      {item.urgency === "high"
                        ? "عاجل"
                        : item.urgency === "medium"
                        ? "متوسط"
                        : "منخفض"}
                    </span>

                    <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                      {item.source}
                    </span>
                  </div>

                  <div
                    style={{
                      color: "#f8fafc",
                      lineHeight: 1.7,
                      fontWeight: 800,
                      fontSize: "13px",
                      marginBottom: "8px"
                    }}
                  >
                    {cleanText(item.title)}
                  </div>

                  <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                    {formatArabicTime(item.time)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "linear-gradient(180deg,#171a20,#101317)",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: "24px",
              padding: "18px"
            }}
          >
            <div style={{ color: "#f8fafc", fontSize: "26px", fontWeight: 900, marginBottom: "14px" }}>
              مؤشرات الخطر
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              <MiniStat label="إجمالي الأخبار" value={news.length} />
              <MiniStat label="العاجل" value={high} color="#ef4444" />
              <MiniStat label="المتوسط" value={medium} color="#f59e0b" />
              <MiniStat label="المنخفض" value={low} color="#22c55e" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
