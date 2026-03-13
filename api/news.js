module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    const feeds = [
      "https://www.aljazeera.net/aljazeerarss/ar/home.xml",
      "https://feeds.bbci.co.uk/arabic/rss.xml",
      "https://www.france24.com/ar/rss",
    ];

    const results = await Promise.allSettled(
      feeds.map(async (url) => {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0",
            Accept: "application/rss+xml, application/xml, text/xml",
          },
        });

        if (!response.ok) {
          throw new Error(`Feed failed: ${url}`);
        }

        const xml = await response.text();
        return parseRSS(xml);
      })
    );

    const allItems = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value);

    const unique = dedupeByTitle(allItems)
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, 20);

    const normalized = unique.map(normalizeNewsItem);

    return res.status(200).json({
      ok: true,
      items: normalized,
      count: normalized.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Failed to fetch news",
    });
  }
};

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item\b[\s\S]*?<\/item>/gi;

  const matches = xml.match(itemRegex) || [];

  for (const itemXml of matches) {
    const title = decodeHtml(getTag(itemXml, "title"));
    const description = decodeHtml(stripHtml(getTag(itemXml, "description")));
    const link = getTag(itemXml, "link");
    const pubDate = getTag(itemXml, "pubDate") || new Date().toISOString();

    if (!title) continue;

    items.push({
      title: cleanText(title),
      description: cleanText(description),
      link: cleanText(link),
      pubDate,
    });
  }

  return items;
}

function getTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function stripHtml(text) {
  return String(text || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function cleanText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function dedupeByTitle(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeNewsItem(item) {
  const category = detectCategory(item.title + " " + item.description);
  const urgency = detectUrgency(item.title + " " + item.description);

  return {
    title: item.title,
    summary: item.description || "لا يوجد ملخص متاح",
    category,
    urgency,
    time: timeAgoArabic(item.pubDate),
    link: item.link,
    pubDate: item.pubDate,
  };
}

function detectCategory(text) {
  const t = String(text || "").toLowerCase();

  if (
    t.includes("إيران") || t.includes("ايران") ||
    t.includes("طهران") || t.includes("الحرس الثوري")
  ) {
    return "iran";
  }

  if (
    t.includes("الإمارات") || t.includes("الامارات") ||
    t.includes("السعودية") || t.includes("الخليج") ||
    t.includes("قطر") || t.includes("البحرين") ||
    t.includes("الكويت") || t.includes("عمان")
  ) {
    return "gulf";
  }

  if (
    t.includes("أمريكا") || t.includes("امريكا") ||
    t.includes("واشنطن") || t.includes("البنتاغون") ||
    t.includes("الولايات المتحدة")
  ) {
    return "usa";
  }

  if (
    t.includes("إسرائيل") || t.includes("اسرائيل") ||
    t.includes("تل أبيب") || t.includes("تل ابيب")
  ) {
    return "israel";
  }

  return "all";
}

function detectUrgency(text) {
  const t = String(text || "");

  if (
    t.includes("عاجل") ||
    t.includes("قصف") ||
    t.includes("هجوم") ||
    t.includes("انفجار") ||
    t.includes("ضربة") ||
    t.includes("اغتيال")
  ) {
    return "high";
  }

  if (
    t.includes("توتر") ||
    t.includes("تحذير") ||
    t.includes("محادثات") ||
    t.includes("مناورات")
  ) {
    return "medium";
  }

  return "low";
}

function timeAgoArabic(dateInput) {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now - date;

  if (Number.isNaN(date.getTime())) return "الآن";

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${days} يوم`;
}
