function safeText(value = "", fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function stripHtml(str = "") {
  return String(str || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(str = "") {
  return String(str || "")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function looksArabic(text = "") {
  return /[\u0600-\u06FF]/.test(String(text || ""));
}

function urgencyWeight(level) {
  if (level === "high") return 3;
  if (level === "medium") return 2;
  return 1;
}

function scoreUrgency(text = "") {
  const t = String(text || "").toLowerCase();

  if (
    /عاجل|هجوم|قصف|غارة|صاروخ|صواريخ|انفجار|اشتباكات|استهداف|ضربة|ضربات|اعتراض|طائرة مسيرة|مسيرة|هجمات|توتر|تحرك عسكري|drone|missile|strike|raid|attack|intercept/i.test(
      t
    )
  ) {
    return "high";
  }

  if (
    /تحذير|بيان|تصريحات|اجتماع|تحليل|انتشار|مناورات|تعزيزات|دبلوماسية|مفاوضات/i.test(
      t
    )
  ) {
    return "medium";
  }

  return "low";
}

function detectCategory(title = "", summary = "") {
  const hay = `${title} ${summary}`.toLowerCase();

  if (/اقتصاد|نفط|غاز|طاقة|أسواق|شحن|موانئ|بورصة/i.test(hay)) return "economy";
  if (/سياسة|حكومة|وزير|رئيس|بيان|دبلوماسية|مفاوضات/i.test(hay)) return "politics";
  if (/هجوم|قصف|غارة|صاروخ|مسيرة|اشتباكات|استهداف|ضربة|اعتراض|drone|missile|strike|raid|attack/i.test(hay)) {
    return "military";
  }
  if (/إيران|إسرائيل|غزة|لبنان|سوريا|العراق|اليمن|الخليج|الشرق الأوسط/i.test(hay)) {
    return "regional";
  }

  return "all";
}

function regionRules() {
  return [
    { name: "إيران", lat: 32.4279, lng: 53.688, re: /إيران|ايران|iran/i },
    { name: "إسرائيل", lat: 31.0461, lng: 34.8516, re: /إسرائيل|اسرائيل|israel/i },
    { name: "غزة", lat: 31.3547, lng: 34.3088, re: /غزة|gaza/i },
    { name: "لبنان", lat: 33.8547, lng: 35.8623, re: /لبنان|lebanon/i },
    { name: "سوريا", lat: 34.8021, lng: 38.9968, re: /سوريا|syria/i },
    { name: "العراق", lat: 33.2232, lng: 43.6793, re: /العراق|iraq/i },
    { name: "اليمن", lat: 15.5527, lng: 48.5164, re: /اليمن|yemen/i },
    { name: "السعودية", lat: 23.8859, lng: 45.0792, re: /السعودية|saudi/i },
    { name: "قطر", lat: 25.3548, lng: 51.1839, re: /قطر|qatar/i },
    { name: "الأردن", lat: 30.5852, lng: 36.2384, re: /الأردن|jordan/i },
    { name: "البحر الأحمر", lat: 20.0, lng: 38.0, re: /البحر الأحمر|red sea/i },
    { name: "مضيق هرمز", lat: 26.5667, lng: 56.25, re: /مضيق هرمز|هرمز|strait of hormuz/i }
  ];
}

function extractLocation(title = "", summary = "") {
  const hay = `${title} ${summary}`;

  for (const rule of regionRules()) {
    if (rule.re.test(hay)) {
      return {
        location: rule.name,
        lat: rule.lat,
        lng: rule.lng
      };
    }
  }

  return {
    location: "غير محدد",
    lat: null,
    lng: null
  };
}

function normalizeNewsItem(item, index = 0) {
  const title = safeText(item?.title, "بدون عنوان");
  const summary = stripHtml(decodeHtml(item?.summary || item?.description || "لا يوجد ملخص متاح."));
  const source = safeText(item?.source, "مصدر غير معروف");
  const urgency =
    ["high", "medium", "low"].includes(item?.urgency) ? item.urgency : scoreUrgency(`${title} ${summary}`);
  const category = detectCategory(title, summary);
  const loc = extractLocation(title, summary);

  return {
    id: item?.id || `event-${Date.now()}-${index}`,
    title,
    summary,
    source,
    time: item?.time || new Date().toISOString(),
    url: item?.url || item?.link || "#",
    category,
    urgency,
    image: item?.image || item?.imageUrl || item?.thumbnail || "",
    location: loc.location,
    lat: loc.lat,
    lng: loc.lng
  };
}

function eventScore(item) {
  const baseUrgency = urgencyWeight(item.urgency) * 100;
  const hasCoords = Number.isFinite(item.lat) && Number.isFinite(item.lng) ? 20 : 0;
  const recency = Math.floor((new Date(item.time).getTime() || 0) / 1e11);
  return baseUrgency + hasCoords + recency;
}

function cleanItems(items) {
  return items.filter((item) => {
    const title = safeText(item?.title, "");
    const summary = safeText(item?.summary, "");
    const source = safeText(item?.source, "");

    if (!title || title.length < 8) return false;
    if (!looksArabic(title) && !looksArabic(summary)) return false;

    const blocked =
      /pr newswire|business wire|globe newswire|accesswire|benzinga|yahoo finance|sponsored/i;

    if (blocked.test(title) || blocked.test(summary) || blocked.test(source)) return false;

    return true;
  });
}

function dedupeItems(items) {
  const seen = new Map();

  for (const item of items) {
    const key = `${stripHtml(item.title).toLowerCase().replace(/\s+/g, " ").slice(0, 140)}-${item.location}`;

    if (!seen.has(key)) {
      seen.set(key, item);
      continue;
    }

    const oldItem = seen.get(key);
    if (eventScore(item) > eventScore(oldItem)) {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values());
}

function sortItems(items) {
  return [...items].sort((a, b) => eventScore(b) - eventScore(a));
}

async function fetchJson(url, field = "news") {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" }
    });

    if (!res.ok) return [];

    const data = await res.json();
    const arr = Array.isArray(data?.[field]) ? data[field] : [];
    return arr.map(normalizeNewsItem);
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const base = `${proto}://${host}`;

    const [newsMain, fastNews, intelNews, xIntel] = await Promise.all([
      fetchJson(`${base}/api/news`, "news"),
      fetchJson(`${base}/api/fastnews`, "news"),
      fetchJson(`${base}/api/intelnews`, "news"),
      fetchJson(`${base}/api/xintel`, "news")
    ]);

    let events = [...newsMain, ...fastNews, ...intelNews, ...xIntel];

    events = cleanItems(events)
      .filter((item) => item.urgency === "high" || item.category === "military" || item.category === "regional")
      .map((item, index) => ({
        ...item,
        id: item.id || `live-event-${index}`
      }));

    events = dedupeItems(events);
    events = sortItems(events).slice(0, 30);

    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=240");

    return res.status(200).json({
      events,
      updated: new Date().toLocaleString("ar-AE", { timeZone: "Asia/Dubai" }),
      live: true,
      source: "live-events-engine"
    });
  } catch {
    return res.status(500).json({
      events: [],
      error: "Failed to build live events"
    });
  }
}
