const MIN_SPORTS = 20;
const MAX_SPORTS = 60;
const FETCH_TIMEOUT = 5000;
const CACHE_TTL = 60 * 1000;

const SPORTS_SOURCES = [
  {
    name: "BBC Sport Football",
    url: "https://feeds.bbci.co.uk/sport/football/rss.xml",
    competition: "world"
  },
  {
    name: "Sky Sports Football",
    url: "https://www.skysports.com/rss/12040",
    competition: "world"
  },
  {
    name: "ESPN Soccer",
    url: "https://www.espn.com/espn/rss/soccer/news",
    competition: "world"
  },
  {
    name: "Goal",
    url: "https://www.goal.com/feeds/en/news",
    competition: "world"
  }
];

const FALLBACK_SPORTS_SOURCES = [
  {
    name: "The Guardian Football",
    url: "https://www.theguardian.com/football/rss",
    competition: "world"
  },
  {
    name: "Google News Premier League",
    url: "https://news.google.com/rss/search?q=premier+league+football&hl=en-US&gl=US&ceid=US:en",
    competition: "premier-league"
  },
  {
    name: "Google News UAE Football",
    url: "https://news.google.com/rss/search?q=UAE+Pro+League+ADNOC+football&hl=en&gl=AE&ceid=AE:en",
    competition: "uae"
  },
  {
    name: "Google News Champions League",
    url: "https://news.google.com/rss/search?q=UEFA+Champions+League+football&hl=en-US&gl=US&ceid=US:en",
    competition: "champions-league"
  },
  {
    name: "Google News LaLiga",
    url: "https://news.google.com/rss/search?q=LaLiga+Real+Madrid+Barcelona&hl=en-US&gl=US&ceid=US:en",
    competition: "laliga"
  },
  {
    name: "Google News Football Transfers",
    url: "https://news.google.com/rss/search?q=football+transfer+signing+news&hl=en-US&gl=US&ceid=US:en",
    competition: "transfers"
  }
];

const CATEGORY_CACHE = new Map();
const TRANSLATION_CACHE = new Map();

function decodeHtml(str = "") {
  return String(str || "")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanText(str = "") {
  return decodeHtml(String(str || ""))
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(str = "") {
  return decodeHtml(String(str || ""))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isArabicText(str = "") {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(str);
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = String(block || "").match(re);
  return m ? m[1].trim() : "";
}

function extractImageFromDescription(str = "") {
  if (!str) return "";

  let match =
    str.match(/<img[^>]+src="([^"]+)"/i) ||
    str.match(/<img[^>]+src='([^']+)'/i);

  if (match?.[1]) return match[1];

  return "";
}

function makeId(source, url, title) {
  return encodeURIComponent(
    `${source}|${url || ""}|${title || ""}`.toLowerCase().trim()
  ).slice(0, 180);
}

function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timer));
}

function normalizeCompetition(title = "", summary = "", source = "") {
  const hay = `${title} ${summary} ${source}`.toLowerCase();

  if (
    /uae|emirates|adnoc|pro league|دوري أدنوك|الدوري الإماراتي|الإماراتي|العين|الجزيرة|الوصل|شباب الأهلي|النصر|الشارقة/.test(
      hay
    )
  ) {
    return "uae";
  }

  if (
    /premier league|english premier league|الدوري الإنجليزي|ليفربول|مانشستر|أرسنال|تشيلسي|توتنهام|نيوكاسل|برشلونة vs|real madrid vs/.test(
      hay
    )
  ) {
    return "premier-league";
  }

  if (
    /laliga|la liga|الدوري الإسباني|ريال مدريد|برشلونة|أتلتيكو|جيرونا|فالنسيا|إشبيلية/.test(
      hay
    )
  ) {
    return "laliga";
  }

  if (
    /champions league|uefa champions|دوري أبطال أوروبا|الأبطال|ucl|uefa/.test(hay)
  ) {
    return "champions-league";
  }

  if (
    /transfer|transfers|deadline|signed|signing|loan|انتقال|انتقالات|تعاقد|إعارة/.test(
      hay
    )
  ) {
    return "transfers";
  }

  return "world";
}

function competitionLabel(competition = "world") {
  switch (competition) {
    case "uae":
      return "الدوري الإماراتي";
    case "premier-league":
      return "الدوري الإنجليزي";
    case "laliga":
      return "الدوري الإسباني";
    case "champions-league":
      return "دوري أبطال أوروبا";
    case "transfers":
      return "الانتقالات";
    default:
      return "كرة القدم العالمية";
  }
}

function competitionMatches(itemCompetition = "world", requested = "all") {
  if (requested === "all") return true;
  return itemCompetition === requested;
}

function sportsUrgency(title = "", summary = "") {
  const hay = `${title} ${summary}`.toLowerCase();

  if (/breaking|official|confirmed|عاجل|رسمي|مؤكد|نهائي/.test(hay)) return "high";

  // Goals and match results are high-priority live events
  if (/\bgoal(s)?\b|hat.?trick|full.?time|final score|match result|هدف|أهداف|نتيجة المباراة|انتهت المباراة/.test(hay)) return "high";

  // Confirmed transfers are high priority
  if (/transfer confirmed|deal done|officially signed|انتقل رسميًا|تم التعاقد|وقّع رسميًا/.test(hay)) return "high";

  if (/injury|injuries|injured|suspension|win|defeat|goal|draw|transfer|signing|loan|إصابة|إيقاف|فوز|خسارة|تعادل|هدف|انتقال|تعاقد|إعارة/.test(hay)) {
    return "medium";
  }
  return "low";
}

function sportsScore(item, nowTime) {
  let score = 0;
  const joined = `${item.title} ${item.summary}`.toLowerCase();

  if (item.urgency === "high") score += 40;
  else if (item.urgency === "medium") score += 20;

  // Bonus for specific high-value content types
  if (/\bgoal(s)?\b|hat.?trick|scored/.test(joined)) score += 15;
  if (/match result|full.?time|final score/.test(joined)) score += 12;
  if (/transfer|signing|signed/.test(joined)) score += 10;
  if (/injur(y|ies|ed)/.test(joined)) score += 8;

  if (["BBC Sport Football", "Sky Sports Football", "ESPN Soccer", "Goal", "The Guardian Football"].includes(item.source)) {
    score += 20;
  }

  if (item.competition === "champions-league") score += 20;
  if (item.competition === "uae") score += 18;
  if (item.competition === "premier-league") score += 16;
  if (item.competition === "laliga") score += 16;
  if (item.competition === "transfers") score += 12;

  if (/liverpool|arsenal|manchester|chelsea|tottenham|real madrid|barcelona|atletico|al ain|al jazira|al wasl/.test(joined)) {
    score += 8;
  }

  const t = new Date(item.time).getTime();
  if (!Number.isNaN(t)) {
    const diff = nowTime - t;
    if (diff < 3 * 60 * 60 * 1000) score += 25;
    else if (diff < 12 * 60 * 60 * 1000) score += 10;
  }

  if (item.image) score += 5;

  return score;
}

async function translateToArabic(text) {
  const t = cleanText(text);
  if (!t) return "";
  if (isArabicText(t)) return t;

  if (TRANSLATION_CACHE.has(t)) return TRANSLATION_CACHE.get(t);

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ar&dt=t&q=${encodeURIComponent(
      t
    )}`;
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!res.ok) {
      TRANSLATION_CACHE.set(t, t);
      return t;
    }

    const data = await res.json();
    const translated =
      Array.isArray(data) && Array.isArray(data[0])
        ? data[0].map((chunk) => chunk[0] || "").join("")
        : t;

    const cleaned = cleanText(translated || t);
    TRANSLATION_CACHE.set(t, cleaned);
    return cleaned;
  } catch {
    TRANSLATION_CACHE.set(t, t);
    return t;
  }
}

function parseSportsRss(xml, source) {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];

  return items.map((item, index) => {
    const rawTitle = extractTag(item, "title");
    const rawDescription = extractTag(item, "description");

    const title = stripHtml(rawTitle) || "بدون عنوان";
    const summary = stripHtml(rawDescription);
    const url = extractTag(item, "link") || "#";
    const time = extractTag(item, "pubDate") || new Date().toISOString();
    const image = extractImageFromDescription(rawDescription);
    const competition = normalizeCompetition(title, summary, source);

    return {
      id: makeId(source, url, `${title}-${index}`),
      title,
      summary,
      source,
      time,
      url,
      image,
      category: "sports",
      competition,
      competitionLabel: competitionLabel(competition),
      urgency: sportsUrgency(title, summary)
    };
  });
}

async function fetchSportsSources(competition = "all") {
  const results = [];

  await Promise.all(
    SPORTS_SOURCES.map(async (src) => {
      try {
        const res = await fetchWithTimeout(src.url, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });

        if (!res.ok) return;
        const xml = await res.text();

        const parsed = parseSportsRss(xml, src.name).filter((item) =>
          competitionMatches(item.competition, competition)
        );

        results.push(...parsed);
      } catch {}
    })
  );

  // If primary sources returned fewer than the minimum, try fallback sources
  if (results.length < MIN_SPORTS) {
    await Promise.all(
      FALLBACK_SPORTS_SOURCES.map(async (src) => {
        // For specific competition requests, prefer matching fallback sources;
        // always include "world"-tagged fallbacks as they cover all competitions
        if (
          competition !== "all" &&
          src.competition !== "world" &&
          src.competition !== competition
        ) {
          return;
        }
        try {
          const res = await fetchWithTimeout(src.url, {
            headers: { "User-Agent": "Mozilla/5.0" }
          });

          if (!res.ok) return;
          const xml = await res.text();

          const parsed = parseSportsRss(xml, src.name).filter((item) =>
            competitionMatches(item.competition, competition)
          );

          results.push(...parsed);
        } catch {}
      })
    );
  }

  return results;
}

async function fetchUaeStandingsAndFixtures() {
  const standingsUrl =
    "https://news.google.com/rss/search?q=UAE+Pro+League+standings+table&hl=en&gl=AE&ceid=AE:en";
  const fixturesUrl =
    "https://news.google.com/rss/search?q=UAE+Pro+League+fixtures+schedule+match&hl=en&gl=AE&ceid=AE:en";

  async function fetchAndParse(url, sourceName) {
    try {
      const res = await fetchWithTimeout(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (!res.ok) return [];
      const xml = await res.text();
      return parseSportsRss(xml, sourceName).slice(0, 5);
    } catch {
      return [];
    }
  }

  const [standings, fixtures] = await Promise.all([
    fetchAndParse(standingsUrl, "UAE Standings"),
    fetchAndParse(fixturesUrl, "UAE Fixtures")
  ]);

  return { standings, fixtures };
}

function getFallbackSports(competition = "all") {
  const base = [
    {
      id: "sports-fallback-1",
      title: "آخر تطورات كرة القدم العالمية",
      summary: "هذه بيانات احتياطية رياضية تظهر عند تعذر الوصول إلى المصادر.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "world",
      competitionLabel: "كرة القدم العالمية",
      urgency: "low"
    },
    {
      id: "sports-fallback-2",
      title: "متابعة مستمرة لأخبار الدوري الإنجليزي الممتاز",
      summary: "يمكن استبدال هذا المحتوى مباشرة بالأخبار الحية عند عودة المصادر.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "premier-league",
      competitionLabel: "الدوري الإنجليزي",
      urgency: "medium"
    },
    {
      id: "sports-fallback-3",
      title: "رصد مستمر لأخبار دوري أبطال أوروبا",
      summary: "محتوى احتياطي لتبويب الرياضة حتى لا يبقى القسم فارغًا.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "champions-league",
      competitionLabel: "دوري أبطال أوروبا",
      urgency: "medium"
    },
    {
      id: "sports-fallback-4",
      title: "آخر أخبار الدوري الإسباني لكرة القدم",
      summary: "تابع آخر أخبار برشلونة وريال مدريد وباقي أندية لاليغا.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "laliga",
      competitionLabel: "الدوري الإسباني",
      urgency: "low"
    },
    {
      id: "sports-fallback-5",
      title: "تحديثات سوق الانتقالات الكروية",
      summary: "آخر صفقات الانتقالات والإعارات في كرة القدم الأوروبية والعالمية.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "transfers",
      competitionLabel: "الانتقالات",
      urgency: "medium"
    },
    {
      id: "sports-fallback-6",
      title: "آخر نتائج الدوري الإماراتي للمحترفين",
      summary: "تابع أحدث نتائج وأخبار أندية دوري أدنوك الإماراتي للمحترفين.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "uae",
      competitionLabel: "الدوري الإماراتي",
      urgency: "medium"
    },
    {
      id: "sports-fallback-7",
      title: "جدول ترتيب الدوري الإنجليزي الممتاز",
      summary: "تابع الترتيب الحالي وأبرز المباريات القادمة في البريميرليغ.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "premier-league",
      competitionLabel: "الدوري الإنجليزي",
      urgency: "low"
    },
    {
      id: "sports-fallback-8",
      title: "أبرز أخبار مباريات دوري أبطال أوروبا",
      summary: "تغطية مستمرة لمرحلة المجموعات والأدوار الإقصائية في دوري الأبطال.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "champions-league",
      competitionLabel: "دوري أبطال أوروبا",
      urgency: "medium"
    },
    {
      id: "sports-fallback-9",
      title: "تقارير الإصابات وغيابات لاعبي الدوري الإنجليزي",
      summary: "آخر تقارير الإصابات التي قد تؤثر على مباريات الجولة القادمة.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "premier-league",
      competitionLabel: "الدوري الإنجليزي",
      urgency: "medium"
    },
    {
      id: "sports-fallback-10",
      title: "ملخص أهداف الجولة في دوري لاليغا الإسباني",
      summary: "أبرز الأهداف والأحداث من جولة نهاية الأسبوع في الدوري الإسباني.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "laliga",
      competitionLabel: "الدوري الإسباني",
      urgency: "medium"
    },
    {
      id: "sports-fallback-11",
      title: "تشكيلات الجولة القادمة من الدوري الإماراتي",
      summary: "تفاصيل مواعيد وملاعب مباريات الجولة القادمة في دوري أدنوك الإماراتي.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "uae",
      competitionLabel: "الدوري الإماراتي",
      urgency: "low"
    },
    {
      id: "sports-fallback-12",
      title: "صفقات الانتقالات الرسمية المعلنة هذا الأسبوع",
      summary: "أبرز الصفقات المعلنة رسميًا في نوافذ الانتقالات الشتوية والصيفية.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "transfers",
      competitionLabel: "الانتقالات",
      urgency: "medium"
    },
    {
      id: "sports-fallback-13",
      title: "أبرز تصريحات المدربين قبل مباريات نهاية الأسبوع",
      summary: "مؤتمرات صحفية وتصريحات مدربي الفرق الكبرى قبيل الجولة الجديدة.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "world",
      competitionLabel: "كرة القدم العالمية",
      urgency: "low"
    },
    {
      id: "sports-fallback-14",
      title: "تقرير: أفضل لاعبي الجولة في الدوريات الأوروبية الكبرى",
      summary: "إحصائيات وتقييمات أفضل لاعبي الجولة في الدوريات الخمس الكبرى.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "world",
      competitionLabel: "كرة القدم العالمية",
      urgency: "low"
    },
    {
      id: "sports-fallback-15",
      title: "نتائج مباريات الدوري الإماراتي للمحترفين",
      summary: "نتائج وملخصات مباريات الجولة الأخيرة في دوري أدنوك للمحترفين.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "uae",
      competitionLabel: "الدوري الإماراتي",
      urgency: "medium"
    },
    {
      id: "sports-fallback-16",
      title: "تقرير الإصابات والغيابات في دوري أبطال أوروبا",
      summary: "قائمة اللاعبين الغائبين عن مباريات دوري الأبطال في الجولات القادمة.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "champions-league",
      competitionLabel: "دوري أبطال أوروبا",
      urgency: "medium"
    },
    {
      id: "sports-fallback-17",
      title: "إحصائيات الهدافين في الدوريات الأوروبية الكبرى",
      summary: "ترتيب الهدافين والمُمررين في الدوري الإنجليزي والإسباني ودوري الأبطال.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "world",
      competitionLabel: "كرة القدم العالمية",
      urgency: "low"
    },
    {
      id: "sports-fallback-18",
      title: "صفقة محتملة تجمع نجمًا عالميًا بنادٍ من الدوري الإماراتي",
      summary: "تقارير عن اهتمام أندية إماراتية بالتعاقد مع لاعبين عالميين بارزين.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "uae",
      competitionLabel: "الدوري الإماراتي",
      urgency: "medium"
    },
    {
      id: "sports-fallback-19",
      title: "تحليل تكتيكي لأبرز مباريات الجولة الأخيرة",
      summary: "تحليل ملاعب وتكتيكات المدربين في أبرز مباريات الأسبوع.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "world",
      competitionLabel: "كرة القدم العالمية",
      urgency: "low"
    },
    {
      id: "sports-fallback-20",
      title: "ترتيب الدوري الإسباني بعد انتهاء الجولة",
      summary: "جدول ترتيب فرق لاليغا الإسبانية بعد نتائج آخر جولة في الدوري.",
      source: "Sports Feed",
      time: new Date().toISOString(),
      url: "#",
      image: "",
      category: "sports",
      competition: "laliga",
      competitionLabel: "الدوري الإسباني",
      urgency: "low"
    }
  ];

  if (competition === "all") return base;
  const filtered = base.filter((item) => item.competition === competition);
  // If no items match the requested competition, return the full base as fallback
  return filtered.length > 0 ? filtered : base;
}

export default async function handler(req, res) {
  const now = Date.now();
  const competition = String(req.query?.competition || "all").trim();

  const cached = CATEGORY_CACHE.get(competition);
  if (cached && now - cached.time < CACHE_TTL) {
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json(cached.payload);
  }

  let news = [];
  let sourceState = "ok";
  let uaeStandings = [];
  let uaeFixtures = [];

  try {
    if (competition === "uae") {
      const [fetchedNews, uaeData] = await Promise.all([
        fetchSportsSources(competition),
        fetchUaeStandingsAndFixtures()
      ]);
      news = fetchedNews;
      uaeStandings = uaeData.standings;
      uaeFixtures = uaeData.fixtures;
    } else {
      news = await fetchSportsSources(competition);
    }
  } catch {
    sourceState = "fallback";
  }

  const seen = new Set();
  news = news.filter((item) => {
    const key = cleanText((item.url && item.url !== "#" ? item.url : item.title) || "")
      .toLowerCase();

    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  news = news
    .map((item) => ({
      ...item,
      _score: sportsScore(item, now)
    }))
    .sort(
      (a, b) =>
        b._score - a._score ||
        new Date(b.time).getTime() - new Date(a.time).getTime()
    )
    .slice(0, MAX_SPORTS);

  if (!news.length) {
    news = getFallbackSports(competition);
    sourceState = "fallback";
  }

  news = await Promise.all(
    news.map(async (item) => {
      const title = cleanText(item.title);
      const summary = cleanText(item.summary);

      const [translatedTitle, translatedSummary] = await Promise.all([
        isArabicText(title) ? title : translateToArabic(title),
        isArabicText(summary) ? summary : translateToArabic(summary)
      ]);

      return {
        ...item,
        title: translatedTitle || title,
        summary: translatedSummary || summary
      };
    })
  );

  news = news.map(({ _score, ...rest }) => rest);

  const result = {
    news,
    updated: new Date().toLocaleString("ar-AE", {
      timeZone: "Asia/Dubai"
    }),
    category: "sports",
    competition,
    source: sourceState,
    ...(competition === "uae" && { standings: uaeStandings, fixtures: uaeFixtures })
  };

  CATEGORY_CACHE.set(competition, {
    time: now,
    payload: result
  });

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
  return res.status(200).json(result);
}
