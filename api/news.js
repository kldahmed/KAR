const ANALYZE_LIMIT = 5;
const MAX_NEWS = 20;

/* ⚡ CACHE سريع */
let CACHE = {
  data: null,
  time: 0
};

function decodeHtml(str = "") {
  return String(str || "")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(str = "") {
  return decodeHtml(String(str || ""))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = String(block || "").match(re);
  return m ? m[1].trim() : "";
}

function extractImageFromDescription(str = "") {
  const match =
    str.match(/<img[^>]+src="([^"]+)"/i) ||
    str.match(/<img[^>]+src='([^']+)'/i);

  return match?.[1] || "";
}

function scoreUrgency(text = "") {
  const t = String(text || "").toLowerCase();

  if (
    /عاجل|breaking|urgent|هجوم|قصف|غارة|صاروخ|انفجار|اشتباكات|drone|missile|strike|attack/i.test(
      t
    )
  ) {
    return "high";
  }

  if (/تصريحات|تحليل|سياسة|اقتصاد|government|minister/i.test(t)) {
    return "medium";
  }

  return "low";
}

function categoryQuery(category) {
  switch (category) {
    case "regional":
      return "الشرق الأوسط OR iran OR israel OR syria OR iraq";
    case "politics":
      return "سياسة OR government OR diplomacy";
    case "military":
      return "صاروخ OR drone OR missile OR strike OR military";
    case "economy":
      return "اقتصاد OR النفط OR markets OR economy";
    case "sports":
      return "football OR soccer OR match OR fifa OR nba";
    case "tourism":
      return "tourism OR travel OR airport OR flights";
    case "markets":
      return "stocks OR markets OR nasdaq OR dow";
    default:
      return "الشرق الأوسط OR iran OR israel OR war OR missile";
  }
}

function parseGoogleRss(xml, category) {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];

  return items.map((item, index) => {
    const rawTitle = stripHtml(extractTag(item, "title"));

    let link = extractTag(item, "link");

    try {
      const googleMatch = link.match(/url=(https?:\/\/[^&]+)/);
      if (googleMatch) link = decodeURIComponent(googleMatch[1]);
    } catch {}

    const pubDate = extractTag(item, "pubDate");
    const rawDescription = extractTag(item, "description");
    const description = stripHtml(rawDescription);
    const image = extractImageFromDescription(rawDescription);

    let source = "Google News";
    let title = rawTitle || "بدون عنوان";

    const sourceMatch = rawTitle.match(/\s*-\s*([^-\n]+)$/);
    if (sourceMatch) {
      source = sourceMatch[1].trim();
      title = rawTitle.replace(/\s*-\s*([^-\n]+)$/, "").trim();
    }

    return {
      id: `gnews-${Date.now()}-${index}`,
      title,
      summary: description,
      source,
      time: pubDate || new Date().toISOString(),
      url: link,
      category,
      urgency: scoreUrgency(`${title} ${description}`),
      image
    };
  });
}

async function fetchGoogleNews(category) {
  const q = encodeURIComponent(`${categoryQuery(category)} when:12h`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=ar&gl=AE&ceid=AE:ar`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    },
    signal: controller.signal
  });

  clearTimeout(timeout);

  if (!res.ok) return [];

  const xml = await res.text();
  return parseGoogleRss(xml, category);
}

export default async function handler(req, res) {
  const now = Date.now();

  /* ⚡ إذا كانت الأخبار محفوظة أقل من دقيقة يرجعها فوراً */
  if (CACHE.data && now - CACHE.time < 60000) {
    return res.status(200).json(CACHE.data);
  }

  try {
    const { category = "all" } = req.query;

    const news = await fetchGoogleNews(category);

    const finalNews = news.slice(0, MAX_NEWS);

    const result = {
      news: finalNews,
      updated: new Date().toLocaleString("ar-AE", { timeZone: "Asia/Dubai" }),
      source: "fast-cache-news"
    };

    /* حفظ في الكاش */
    CACHE.data = result;
    CACHE.time = Date.now();

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");

    return res.status(200).json(result);
  } catch (error) {
    return res.status(200).json({
      news: [],
      source: "fallback"
    });
  }
}
