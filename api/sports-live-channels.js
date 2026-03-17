/**
 * API endpoint: /api/sports-live-channels
 * Returns live status and metadata for Arabic sports channels.
 * Only uses official/public sources.
 */

const CACHE_TTL = 30_000; // 30 seconds
let cachedResponse = null;
let lastFetch = 0;

// Simulated live status detection.
// In production, this would check official APIs, YouTube Data API,
// or scrape official schedule pages for live broadcast detection.
function detectLiveChannels() {
  const now = new Date();
  const hour = now.getUTCHours();
  const dayOfWeek = now.getUTCDay(); // 0=Sun

  const liveIds = [];
  const statuses = {};

  // UAE channels — typically broadcast during match hours (14:00–22:00 UAE time = UTC+4)
  const uaeHour = (hour + 4) % 24;

  if (uaeHour >= 16 && uaeHour <= 23) {
    liveIds.push("dubai-sports");
    statuses["dubai-sports"] = { currentProgram: "تغطية رياضية مباشرة" };
  }
  if (uaeHour >= 15 && uaeHour <= 23) {
    liveIds.push("abu-dhabi-sports");
    statuses["abu-dhabi-sports"] = { currentProgram: "أستوديو الرياضة" };
  }

  // SSC — Saudi matches typically 17:00–23:00 Saudi time (UTC+3)
  const saudiHour = (hour + 3) % 24;
  if (saudiHour >= 17 && saudiHour <= 23) {
    liveIds.push("ssc-sports");
    statuses["ssc-sports"] = { currentProgram: "دوري روشن السعودي" };
  }

  // beIN Sports — almost always live
  if (hour >= 10 || hour <= 2) {
    liveIds.push("bein-sports");
    statuses["bein-sports"] = { currentProgram: "تغطية رياضية" };
  }

  // Al Kass — evening coverage
  const qatarHour = (hour + 3) % 24;
  if (qatarHour >= 16 && qatarHour <= 23) {
    liveIds.push("al-kass-sports");
    statuses["al-kass-sports"] = { currentProgram: "ملعب الكأس" };
  }

  // ON Time Sports — Egyptian broadcasts
  const egyptHour = (hour + 2) % 24;
  if (egyptHour >= 17 && egyptHour <= 24) {
    liveIds.push("on-time-sports");
    statuses["on-time-sports"] = { currentProgram: "الدوري المصري الممتاز" };
  }

  // Arryadia — Morocco evening
  const moroccoHour = (hour + 1) % 24;
  if (moroccoHour >= 18 && moroccoHour <= 23) {
    liveIds.push("arryadia-morocco");
    statuses["arryadia-morocco"] = { currentProgram: "البطولة الاحترافية" };
  }

  // Weekend: more channels are typically live
  if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday/Saturday = main match days in Middle East
    if (!liveIds.includes("sharjah-sports") && uaeHour >= 15) {
      liveIds.push("sharjah-sports");
      statuses["sharjah-sports"] = { currentProgram: "بث رياضي مباشر" };
    }
    if (!liveIds.includes("kuwait-sports")) {
      liveIds.push("kuwait-sports");
      statuses["kuwait-sports"] = { currentProgram: "تغطية رياضية" };
    }
    if (!liveIds.includes("bahrain-sports")) {
      liveIds.push("bahrain-sports");
      statuses["bahrain-sports"] = { currentProgram: "الدوري البحريني" };
    }
  }

  return { liveIds, statuses };
}

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const now = Date.now();

  if (cachedResponse && now - lastFetch < CACHE_TTL) {
    return res.status(200).json(cachedResponse);
  }

  try {
    const { liveIds, statuses } = detectLiveChannels();

    cachedResponse = {
      liveIds,
      statuses,
      totalChannels: 17,
      updatedAt: new Date().toISOString(),
    };
    lastFetch = now;

    return res.status(200).json(cachedResponse);
  } catch (err) {
    console.error("[sports-live-channels] Error:", err.message);
    return res.status(500).json({ error: "Internal server error", liveIds: [], statuses: {} });
  }
}
