function cleanText(text = "") {
  return String(text || "")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = String(block || "").match(re);
  return m ? cleanText(m[1]) : "";
}

function scoreUrgency(text = "") {
  const t = String(text || "").toLowerCase();

  if (
    /عاجل|breaking|urgent|هجوم|قصف|غارة|صاروخ|صواريخ|مسيرة|طائرة مسيرة|انفجار|اعتراض|استهداف|ضربة|ضربات|اشتباكات|drone|missile|strike|attack|raid|intercept|rocket|explosion/i.test(
      t
    )
  ) {
    return "high";
  }

  if (
    /تحرك|deployment|military|defense|warning|alert|توتر|تحذير|تعزيزات|naval|بحري|ملاحة/i.test(
      t
    )
  ) {
    return "medium";
  }

  return "low";
}

function normalizeCategory(text = "") {
  const t = String(text || "").toLowerCase();

  if (/نفط|غاز|طاقة|oil|gas|energy|market|اقتصاد|أسواق|shipping|ملاحة/.test(t)) {
    return "economy";
  }

  if (/حكومة|وزير|رئيس|statement|تصريحات|politic|سياسة|diplomatic|مفاوضات/.test(t)) {
    return "politics";
  }

  if (/هجوم|قصف|غارة|صاروخ|صواريخ|مسيرة|drone|missile|strike|attack|raid|اعتراض|اشتباكات/.test(t)) {
    return "military";
  }

  return "regional";
}

function isRelevantIntel(text = "") {
  const t = String(text || "").toLowerCase();

  return /هجوم|قصف|غارة|صاروخ|صواريخ|مسيرة|طائرة مسيرة|انفجار|اعتراض|استهداف|ضربة|ضربات|اشتباكات|drone|missile|strike|attack|raid|intercept|rocket|explosion|air defense|naval|warship|military|deployment|red sea|hormuz|iran|israel|lebanon|syria|iraq|yemen|gaza/i.test(
    t
  );
}

function parseRss(xml = "", account = "") {
  const items = String(xml || "").match(/<item>([\s\S]*?)<\/item>/g) || [];

  return items.slice(0, 8).map((item, index) => {
    const title = extractTag(item, "title");
    const link = extractTag(item, "link");
    const description = extractTag(item, "description");
    const pubDate = extractTag(item, "pubDate");

    const fullText = `${title} ${description}`;

    return {
      id: `x-${account}-${index}-${Date.now()}`,
      title: title || "بدون عنوان",
      summary: description || `رصد مباشر من ${account}`,
      source: `X / ${account}`,
      time: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      urgency: scoreUrgency(fullText),
      category: normalizeCategory(fullText),
      url: link || "#"
    };
  });
}

async function fetchFirstWorkingFeed(urls = []) {
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(url, {
        headers: {
          "user-agent": "Mozilla/5.0",
          accept: "application/rss+xml, application/xml, text/xml"
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!res.ok) continue;

      const xml = await res.text();

      if (xml && xml.includes("<item>")) {
        return xml;
      }
    } catch {}
  }

  return "";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      news: [],
      updated: new Date().toISOString(),
      source: "x-intel-feed",
      error: "Method not allowed"
    });
  }

  try {
    const accounts = [
      {
        name: "sentdefender",
        feeds: [
          "https://nitter.poast.org/sentdefender/rss",
          "https://nitter.privacydev.net/sentdefender/rss",
          "https://nitter.net/sentdefender/rss",
          "https://rsshub.app/twitter/user/sentdefender"
        ]
      },
      {
        name: "OSINTdefender",
        feeds: [
          "https://nitter.poast.org/OSINTdefender/rss",
          "https://nitter.privacydev.net/OSINTdefender/rss",
          "https://nitter.net/OSINTdefender/rss",
          "https://rsshub.app/twitter/user/OSINTdefender"
        ]
      },
      {
        name: "ELINTNews",
        feeds: [
          "https://nitter.poast.org/ELINTNews/rss",
          "https://nitter.privacydev.net/ELINTNews/rss",
          "https://nitter.net/ELINTNews/rss",
          "https://rsshub.app/twitter/user/ELINTNews"
        ]
      },
      {
        name: "IntelCrab",
        feeds: [
          "https://nitter.poast.org/IntelCrab/rss",
          "https://nitter.privacydev.net/IntelCrab/rss",
          "https://nitter.net/IntelCrab/rss",
          "https://rsshub.app/twitter/user/IntelCrab"
        ]
      },
      {
        name: "WarMonitors",
        feeds: [
          "https://nitter.poast.org/WarMonitors/rss",
          "https://nitter.privacydev.net/WarMonitors/rss",
          "https://nitter.net/WarMonitors/rss",
          "https://rsshub.app/twitter/user/WarMonitors"
        ]
      },
      {
        name: "AuroraIntel",
        feeds: [
          "https://nitter.poast.org/AuroraIntel/rss",
          "https://nitter.privacydev.net/AuroraIntel/rss",
          "https://nitter.net/AuroraIntel/rss",
          "https://rsshub.app/twitter/user/AuroraIntel"
        ]
      },
      {
        name: "IntelSky",
        feeds: [
          "https://nitter.poast.org/IntelSky/rss",
          "https://nitter.privacydev.net/IntelSky/rss",
          "https://nitter.net/IntelSky/rss",
          "https://rsshub.app/twitter/user/IntelSky"
        ]
      }
    ];

    let news = [];

    for (const account of accounts) {
      const xml = await fetchFirstWorkingFeed(account.feeds);
      if (!xml) continue;

      const parsed = parseRss(xml, account.name);
      news.push(...parsed);
    }

    news = news.filter((item) => {
      const fullText = `${item.title} ${item.summary}`;
      return isRelevantIntel(fullText);
    });

    const seen = new Set();
    news = news.filter((item) => {
      const key = cleanText(item.title).toLowerCase().slice(0, 140);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    news.sort((a, b) => {
      const tb = new Date(b.time).getTime() || 0;
      const ta = new Date(a.time).getTime() || 0;

      if (tb !== ta) return tb - ta;

      const weight = { high: 3, medium: 2, low: 1 };
      return (weight[b.urgency] || 1) - (weight[a.urgency] || 1);
    });

    news = news.slice(0, 25);

    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=240");

    return res.status(200).json({
      news,
      updated: new Date().toISOString(),
      source: "x-intel-feed"
    });
  } catch (e) {
    return res.status(200).json({
      news: [],
      updated: new Date().toISOString(),
      source: "x-intel-feed"
    });
  }
}
