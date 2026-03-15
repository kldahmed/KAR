function decodeHtml(str = "") {
  return str
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(str = "") {
  return decodeHtml(str).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function parseRss(xml) {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];
  return items.map((item, index) => {
    const title = stripHtml(extractTag(item, "title"));
    const link = extractTag(item, "link");
    const pubDate = extractTag(item, "pubDate");
    const description = stripHtml(extractTag(item, "description"));

    let source = "Google News";
    const sourceMatch = title.match(/\s*-\s*([^-\n]+)$/);
    const cleanTitle = sourceMatch ? title.replace(/\s*-\s*([^-\n]+)$/, "").trim() : title;
    if (sourceMatch) source = sourceMatch[1].trim();

    return {
      id: `${Date.now()}-${index}`,
      title: cleanTitle || "بدون عنوان",
      summary: description || "لا يوجد ملخص متاح.",
      urgency: "medium",
      source,
      time: pubDate || new Date().toISOString(),
      url: link
    };
  });
}

function scoreUrgency(text = "") {
  const t = text.toLowerCase();
  if (
    /breaking|urgent|attack|strike|killed|missile|drone|explosion|عاجل|هجوم|قصف|صاروخ|انفجار|اشتباك/.test(t)
  ) {
    return "high";
  }
  if (
    /talks|statement|meeting|warning|analysis|تصريحات|اجتماع|تحذير|بيان|تحليل/.test(t)
  ) {
    return "medium";
  }
  return "low";
}

function categoryQuery(category) {
  switch (category) {
    case "regional":
      return "Middle East OR Gulf OR UAE OR Saudi OR Iran OR Iraq";
    case "politics":
      return "Middle East politics OR government OR diplomacy OR statement";
    case "military":
      return "Middle East military OR missile OR drone OR airstrike OR conflict";
    case "economy":
      return "Middle East economy OR oil OR shipping OR markets";
    default:
      return "Middle East";
  }
}

async function fetchGoogleNews(category) {
  const q = encodeURIComponent(`${categoryQuery(category)} when:12h`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=ar&gl=AE&ceid=AE:ar`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!res.ok) {
    throw new Error(`RSS fetch failed: ${res.status}`);
  }

  const xml = await res.text();
  const parsed = parseRss(xml);

  return parsed
    .map((item) => ({
      ...item,
      urgency: scoreUrgency(`${item.title} ${item.summary}`),
      category
    }))
    .slice(0, 12);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { category = "all" } = req.query;

    const news = await fetchGoogleNews(category);

    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");

    return res.status(200).json({
      news,
      updated: new Date().toLocaleString("ar-AE", { timeZone: "Asia/Dubai" }),
      live: true,
      source: "Google News RSS"
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch live news"
    });
  }
}
