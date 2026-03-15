function decodeHtml(str = "") {
  return str
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtml(str = "") {
  return decodeHtml(str)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function normalizeText(str = "") {
  return stripHtml(str)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeUrl(url = "") {
  try {
    const u = new URL(url);
    return u.toString();
  } catch {
    return "";
  }
}

function categoryQuery(category) {
  switch (category) {
    case "regional":
      return "Middle East OR Gulf OR UAE OR Saudi OR Iran OR Iraq OR Syria OR Lebanon OR Yemen";
    case "politics":
      return "Middle East politics OR diplomacy OR government OR statement OR minister";
    case "military":
      return "Middle East military OR missile OR drone OR strike OR conflict OR attack";
    case "economy":
      return "Middle East economy OR oil OR shipping OR ports OR markets OR energy";
    default:
      return "Middle East latest";
  }
}

function scoreUrgency(text = "") {
  const t = text.toLowerCase();

  if (
    /breaking|urgent|attack|strike|killed|missile|drone|explosion|raid|war|conflict|bomb|navy|airstrike|عاجل|هجوم|قصف|صاروخ|انفجار|غارة|اشتباكات|حرب|استهداف|طائرة مسيرة/.test(
      t
    )
  ) {
    return "high";
  }

  if (
    /statement|meeting|talks|warning|analysis|government|policy|minister|economy|oil|shipping|تصريحات|بيان|اجتماع|تحذير|تحليل|حكومة|سياسة|وزير|اقتصاد|نفط|موانئ/.test(
      t
    )
  ) {
    return "medium";
  }

  return "low";
}

function urgencyWeight(level) {
  if (level === "high") return 3;
  if (level === "medium") return 2;
  return 1;
}

function parseGoogleRss(xml, category) {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];

  return items.map((item, index) => {
    const rawTitle = stripHtml(extractTag(item, "title"));
    const link = safeUrl(extractTag(item, "link"));
    const pubDate = extractTag(item, "pubDate");
    const description = stripHtml(extractTag(item, "description"));

    let source = "Google News";
    let title = rawTitle || "بدون عنوان";

    const sourceMatch = rawTitle.match(/\s*-\s*([^-\n]+)$/);
    if (sourceMatch) {
      source = sourceMatch[1].trim();
      title = rawTitle.replace(/\s*-\s*([^-\n]+)$/, "").trim();
    }

    const urgency = scoreUrgency(`${title} ${description}`);

    return {
      id: `gn-${Date.now()}-${index}`,
      title,
      summary: description || "لا يوجد ملخص متاح.",
      source,
      time: pubDate || new Date().toISOString(),
      url: link,
      category,
      urgency,
      sourceType: "google"
    };
  });
}

async function fetchGoogleNews(category) {
  const q = encodeURIComponent(`${categoryQuery(category)} when:12h`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=ar&gl=AE&ceid=AE:ar`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  if (!res.ok) {
    throw new Error(`Google RSS failed: ${res.status}`);
  }

  const xml = await res.text();
  return parseGoogleRss(xml, category);
}

function buildGdeltQuery(category) {
  switch (category) {
    case "regional":
      return '(("Middle East" OR Gulf OR UAE OR Saudi OR Iran OR Iraq OR Syria OR Lebanon OR Yemen))';
    case "politics":
      return '(("Middle East" OR Gulf) AND (politics OR diplomacy OR government OR statement OR minister))';
    case "military":
      return '(("Middle East" OR Gulf) AND (missile OR drone OR attack OR strike OR military OR conflict))';
    case "economy":
      return '(("Middle East" OR Gulf) AND (economy OR oil OR shipping OR energy OR markets))';
    default:
      return '("Middle East" OR Gulf OR UAE OR Saudi OR Iran OR Iraq OR Syria OR Lebanon OR Yemen)';
  }
}

async function fetchGdelt(category) {
  const query = buildGdeltQuery(category);
  const url =
    "https://api.gdeltproject.org/api/v2/doc/doc?" +
    new URLSearchParams({
      query,
      mode: "ArtList",
      maxrecords: "20",
      format: "json",
      sort: "HybridRel",
      timespan: "1d"
    }).toString();

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  if (!res.ok) {
    throw new Error(`GDELT failed: ${res.status}`);
  }

  const data = await res.json();
  const articles = Array.isArray(data?.articles) ? data.articles : [];

  return articles.map((item, index) => {
    const title = stripHtml(item?.title || "");
    const summary = stripHtml(item?.seendate || item?.socialimage || "");
    const domain = stripHtml(item?.domain || "GDELT");
    const url = safeUrl(item?.url || "");
    const time = item?.seendate
      ? new Date(item.seendate.replace(" ", "T") + "Z").toISOString()
      : new Date().toISOString();
    const urgency = scoreUrgency(`${title} ${summary}`);

    return {
      id: `gdelt-${Date.now()}-${index}`,
      title: title || "بدون عنوان",
      summary: summary || "لا يوجد ملخص متاح.",
      source: domain,
      time,
      url,
      category,
      urgency,
      sourceType: "gdelt"
    };
  });
}

function dedupeArticles(items) {
  const seen = new Map();

  for (const item of items) {
    const key = normalizeText(item.title).slice(0, 140);
    if (!key) continue;

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, item);
      continue;
    }

    const existingScore =
      urgencyWeight(existing.urgency) +
      (existing.sourceType === "google" ? 1 : 0) +
      (safeUrl(existing.url) ? 1 : 0);

    const nextScore =
      urgencyWeight(item.urgency) +
      (item.sourceType === "google" ? 1 : 0) +
      (safeUrl(item.url) ? 1 : 0);

    if (nextScore > existingScore) {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values());
}

function sortArticles(items) {
  return items.sort((a, b) => {
    const urgencyDiff = urgencyWeight(b.urgency) - urgencyWeight(a.urgency);
    if (urgencyDiff !== 0) return urgencyDiff;

    const timeA = new Date(a.time).getTime() || 0;
    const timeB = new Date(b.time).getTime() || 0;
    return timeB - timeA;
  });
}

function cleanBadArticles(items) {
  return items.filter((item) => {
    const title = normalizeText(item.title);
    const summary = normalizeText(item.summary);

    if (!title || title.length < 8) return false;
    if (/^pr newswire|business wire|globe newswire/.test(title)) return false;
    if (/pr newswire|business wire|globe newswire/.test(summary)) return false;

    return true;
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { category = "all" } = req.query;

    const [googleResult, gdeltResult] = await Promise.allSettled([
      fetchGoogleNews(category),
      fetchGdelt(category)
    ]);

    const googleNews =
      googleResult.status === "fulfilled" ? googleResult.value : [];
    const gdeltNews =
      gdeltResult.status === "fulfilled" ? gdeltResult.value : [];

    let news = [...googleNews, ...gdeltNews];
    news = cleanBadArticles(news);
    news = dedupeArticles(news);
    news = sortArticles(news).slice(0, 24);

    res.setHeader("Cache-Control", "s-maxage=90, stale-while-revalidate=180");

    return res.status(200).json({
      news,
      updated: new Date().toLocaleString("ar-AE", { timeZone: "Asia/Dubai" }),
      live: true,
      source: "Google News RSS + GDELT"
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch live news"
    });
  }
}
