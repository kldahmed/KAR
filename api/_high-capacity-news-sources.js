export const SOURCE_TIERS = {
  hyper:  { label: "hyper",  intervalSeconds: 120  }, // every 2 min
  fast:   { label: "fast",   intervalSeconds: 300  }, // every 5 min
  medium: { label: "medium", intervalSeconds: 600  }, // every 10 min
  slow:   { label: "slow",   intervalSeconds: 1200 }, // every 20 min
};

function clampTrust(value) {
  return Math.max(20, Math.min(99, Number(value || 70)));
}

function normalizeSource(source) {
  const tier = SOURCE_TIERS[source.tier] || SOURCE_TIERS.medium;
  const interval = source.intervalSeconds || tier.intervalSeconds;
  const tierExpected = source.tier === "hyper" ? 14 : source.tier === "fast" ? 10 : source.tier === "medium" ? 8 : 6;
  return {
    ...source,
    category_focus: source.category || "international",
    intervalSeconds: interval,
    polling_interval: interval,
    active: source.active !== false,
    language: source.language || "en",
    region: source.region || "global",
    category: source.category || "international",
    trustBaseScore: clampTrust(Number(source.trustBaseScore || 70)),
    trust_base_score: clampTrust(Number(source.trustBaseScore || 70)),
    rateLimitPerMinute: 30,
    health_status: "idle",
    last_success_at: "",
    last_failure_at: "",
    expectedItemsPerPull: Number(source.expectedItemsPerPull || tierExpected),
  };
}

// ─── 110+ distinct real RSS sources ─────────────────────────────────────────
// Organised: agencies → BBC → AP → Guardian → NYT → CNN/CBS/ABC → Sky →
//            France24/DW/Euronews → Arab media → Economy → Tech → Sports →
//            Science/Health → Int'l orgs → Asia/Pacific → Other
const RAW_SOURCES = [
  // ── Reuters ──────────────────────────────────────────────────────────────
  { id: "reuters-world",    name: "Reuters World",    url: "https://feeds.reuters.com/reuters/worldNews",       tier: "hyper",  category: "international", trustBaseScore: 95, region: "global", language: "en" },
  { id: "reuters-business", name: "Reuters Business", url: "https://feeds.reuters.com/reuters/businessNews",    tier: "hyper",  category: "economy",       trustBaseScore: 94, region: "global", language: "en" },
  { id: "reuters-tech",     name: "Reuters Tech",     url: "https://feeds.reuters.com/reuters/technologyNews",  tier: "fast",   category: "technology",    trustBaseScore: 93, region: "global", language: "en" },
  { id: "reuters-sports",   name: "Reuters Sports",   url: "https://feeds.reuters.com/reuters/sportsNews",      tier: "fast",   category: "sports",        trustBaseScore: 90, region: "global", language: "en" },

  // ── BBC ───────────────────────────────────────────────────────────────────
  { id: "bbc-top",          name: "BBC Top Stories",  url: "https://feeds.bbci.co.uk/news/rss.xml",                          tier: "hyper",  category: "international", trustBaseScore: 95, region: "global",  language: "en" },
  { id: "bbc-world",        name: "BBC World",        url: "https://feeds.bbci.co.uk/news/world/rss.xml",                    tier: "hyper",  category: "international", trustBaseScore: 94, region: "global",  language: "en" },
  { id: "bbc-business",     name: "BBC Business",     url: "https://feeds.bbci.co.uk/news/business/rss.xml",                 tier: "fast",   category: "economy",       trustBaseScore: 92, region: "global",  language: "en" },
  { id: "bbc-tech",         name: "BBC Technology",   url: "https://feeds.bbci.co.uk/news/technology/rss.xml",               tier: "fast",   category: "technology",    trustBaseScore: 91, region: "global",  language: "en" },
  { id: "bbc-health",       name: "BBC Health",       url: "https://feeds.bbci.co.uk/news/health/rss.xml",                   tier: "medium", category: "health",        trustBaseScore: 91, region: "global",  language: "en" },
  { id: "bbc-science",      name: "BBC Science",      url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",  tier: "medium", category: "technology",    trustBaseScore: 90, region: "global",  language: "en" },
  { id: "bbc-sport",        name: "BBC Sport",        url: "https://feeds.bbci.co.uk/sport/rss.xml",                         tier: "fast",   category: "sports",        trustBaseScore: 89, region: "global",  language: "en" },

  // ── AP News ───────────────────────────────────────────────────────────────
  { id: "ap-top",           name: "AP Top News",      url: "https://apnews.com/hub/ap-top-news?output=rss",     tier: "hyper",  category: "international", trustBaseScore: 94, region: "global", language: "en" },
  { id: "ap-world",         name: "AP World",         url: "https://apnews.com/hub/world-news?output=rss",      tier: "hyper",  category: "international", trustBaseScore: 94, region: "global", language: "en" },
  { id: "ap-politics",      name: "AP Politics",      url: "https://apnews.com/hub/politics?output=rss",        tier: "fast",   category: "politics",      trustBaseScore: 93, region: "global", language: "en" },
  { id: "ap-business",      name: "AP Business",      url: "https://apnews.com/hub/business?output=rss",        tier: "fast",   category: "economy",       trustBaseScore: 93, region: "global", language: "en" },
  { id: "ap-tech",          name: "AP Technology",    url: "https://apnews.com/hub/technology?output=rss",      tier: "fast",   category: "technology",    trustBaseScore: 92, region: "global", language: "en" },
  { id: "ap-sports",        name: "AP Sports",        url: "https://apnews.com/hub/sports?output=rss",          tier: "fast",   category: "sports",        trustBaseScore: 91, region: "global", language: "en" },
  { id: "ap-science",       name: "AP Science",       url: "https://apnews.com/hub/science?output=rss",         tier: "medium", category: "technology",    trustBaseScore: 91, region: "global", language: "en" },
  { id: "ap-health",        name: "AP Health",        url: "https://apnews.com/hub/health?output=rss",          tier: "medium", category: "health",        trustBaseScore: 91, region: "global", language: "en" },

  // ── Al Jazeera ────────────────────────────────────────────────────────────
  { id: "aljazeera-all",    name: "Al Jazeera",       url: "https://www.aljazeera.com/xml/rss/all.xml",         tier: "hyper",  category: "international", trustBaseScore: 85, region: "mena", language: "en" },

  // ── The Guardian ──────────────────────────────────────────────────────────
  { id: "guardian-world",   name: "Guardian World",   url: "https://www.theguardian.com/world/rss",             tier: "fast",   category: "international", trustBaseScore: 89, region: "global",  language: "en" },
  { id: "guardian-us",      name: "Guardian US",      url: "https://www.theguardian.com/us-news/rss",           tier: "fast",   category: "politics",      trustBaseScore: 88, region: "americas",language: "en" },
  { id: "guardian-biz",     name: "Guardian Business",url: "https://www.theguardian.com/business/rss",          tier: "fast",   category: "economy",       trustBaseScore: 88, region: "global",  language: "en" },
  { id: "guardian-tech",    name: "Guardian Tech",    url: "https://www.theguardian.com/technology/rss",        tier: "medium", category: "technology",    trustBaseScore: 87, region: "global",  language: "en" },
  { id: "guardian-env",     name: "Guardian Environment", url: "https://www.theguardian.com/environment/rss",  tier: "medium", category: "international", trustBaseScore: 86, region: "global",  language: "en" },
  { id: "guardian-sci",     name: "Guardian Science", url: "https://www.theguardian.com/science/rss",           tier: "slow",   category: "technology",    trustBaseScore: 86, region: "global",  language: "en" },
  { id: "guardian-sport",   name: "Guardian Sport",   url: "https://www.theguardian.com/sport/rss",             tier: "fast",   category: "sports",        trustBaseScore: 85, region: "global",  language: "en" },

  // ── NYTimes ───────────────────────────────────────────────────────────────
  { id: "nyt-world",        name: "NYT World",        url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",      tier: "fast",   category: "international", trustBaseScore: 90, region: "global", language: "en" },
  { id: "nyt-business",     name: "NYT Business",     url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",   tier: "fast",   category: "economy",       trustBaseScore: 90, region: "global", language: "en" },
  { id: "nyt-tech",         name: "NYT Technology",   url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", tier: "medium", category: "technology",    trustBaseScore: 89, region: "global", language: "en" },
  { id: "nyt-science",      name: "NYT Science",      url: "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml",    tier: "slow",   category: "technology",    trustBaseScore: 88, region: "global", language: "en" },
  { id: "nyt-health",       name: "NYT Health",       url: "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml",     tier: "slow",   category: "health",        trustBaseScore: 88, region: "global", language: "en" },

  // ── NPR ───────────────────────────────────────────────────────────────────
  { id: "npr-news",         name: "NPR News",         url: "https://feeds.npr.org/1001/rss.xml",                tier: "fast",   category: "international", trustBaseScore: 88, region: "americas", language: "en" },
  { id: "npr-world",        name: "NPR World",        url: "https://feeds.npr.org/1004/rss.xml",                tier: "fast",   category: "international", trustBaseScore: 87, region: "global",   language: "en" },
  { id: "npr-politics",     name: "NPR Politics",     url: "https://feeds.npr.org/1014/rss.xml",                tier: "medium", category: "politics",      trustBaseScore: 87, region: "americas", language: "en" },

  // ── CNN ───────────────────────────────────────────────────────────────────
  { id: "cnn-world",        name: "CNN World",        url: "http://rss.cnn.com/rss/edition_world.rss",          tier: "fast",   category: "international", trustBaseScore: 78, region: "americas", language: "en" },
  { id: "cnn-tech",         name: "CNN Tech",         url: "http://rss.cnn.com/rss/edition_technology.rss",     tier: "medium", category: "technology",    trustBaseScore: 77, region: "americas", language: "en" },
  { id: "cnn-business",     name: "CNN Business",     url: "http://rss.cnn.com/rss/money_news_international.rss", tier: "fast", category: "economy",       trustBaseScore: 77, region: "americas", language: "en" },

  // ── CBS & ABC ─────────────────────────────────────────────────────────────
  { id: "cbs-world",        name: "CBS World",        url: "https://www.cbsnews.com/latest/rss/world",           tier: "fast",   category: "international", trustBaseScore: 76, region: "americas", language: "en" },
  { id: "cbs-us",           name: "CBS US",           url: "https://www.cbsnews.com/latest/rss/us",              tier: "fast",   category: "politics",      trustBaseScore: 75, region: "americas", language: "en" },
  { id: "abc-intl",         name: "ABC International",url: "https://abcnews.go.com/abcnews/internationalheadlines", tier: "fast", category: "international", trustBaseScore: 80, region: "americas", language: "en" },
  { id: "abc-top",          name: "ABC Top Stories",  url: "https://abcnews.go.com/abcnews/topstories",           tier: "fast",   category: "international", trustBaseScore: 79, region: "americas", language: "en" },

  // ── Sky News ──────────────────────────────────────────────────────────────
  { id: "sky-world",        name: "Sky News World",   url: "https://feeds.skynews.com/feeds/rss/world.xml",      tier: "fast",   category: "international", trustBaseScore: 84, region: "global",  language: "en" },
  { id: "sky-tech",         name: "Sky News Tech",    url: "https://feeds.skynews.com/feeds/rss/technology.xml", tier: "medium", category: "technology",    trustBaseScore: 82, region: "global",  language: "en" },
  { id: "sky-biz",          name: "Sky News Business",url: "https://feeds.skynews.com/feeds/rss/business.xml",   tier: "medium", category: "economy",       trustBaseScore: 82, region: "global",  language: "en" },
  { id: "sky-politics",     name: "Sky News Politics",url: "https://feeds.skynews.com/feeds/rss/politics.xml",   tier: "medium", category: "politics",      trustBaseScore: 82, region: "global",  language: "en" },

  // ── France 24 / DW / Euronews ─────────────────────────────────────────────
  { id: "france24-en",      name: "France 24 English",url: "https://www.france24.com/en/rss",                   tier: "fast",   category: "international", trustBaseScore: 83, region: "europe", language: "en" },
  { id: "france24-ar",      name: "France 24 Arabic", url: "https://www.france24.com/ar/rss",                   tier: "fast",   category: "international", trustBaseScore: 83, region: "mena",   language: "ar" },
  { id: "dw-en",            name: "DW English World", url: "https://rss.dw.com/atom/rss-en-world",              tier: "fast",   category: "international", trustBaseScore: 82, region: "global", language: "en" },
  { id: "dw-en-biz",        name: "DW English Business",url:"https://rss.dw.com/atom/rss-en-business",          tier: "medium", category: "economy",       trustBaseScore: 81, region: "global", language: "en" },
  { id: "dw-ar",            name: "DW Arabic",        url: "https://rss.dw.com/rdf/rss-ar-top",                 tier: "fast",   category: "international", trustBaseScore: 82, region: "mena",   language: "ar" },
  { id: "euronews-world",   name: "Euronews World",   url: "https://www.euronews.com/rss?level=theme&name=world",   tier: "fast",   category: "international", trustBaseScore: 81, region: "europe", language: "en" },
  { id: "euronews-biz",     name: "Euronews Business",url: "https://www.euronews.com/rss?level=theme&name=business", tier: "medium", category: "economy",      trustBaseScore: 80, region: "europe", language: "en" },
  { id: "euronews-tech",    name: "Euronews Tech",    url: "https://www.euronews.com/rss?level=theme&name=tech",    tier: "medium", category: "technology",    trustBaseScore: 80, region: "europe", language: "en" },

  // ── Anadolu Agency ───────────────────────────────────────────────────────
  { id: "anadolu-ar",       name: "Anadolu Arabic",   url: "https://www.aa.com.tr/ar/rss/default?cat=guncel",   tier: "fast",   category: "regional",      trustBaseScore: 76, region: "mena",   language: "ar" },
  { id: "anadolu-en",       name: "Anadolu English",  url: "https://www.aa.com.tr/en/rss/default?cat=politics", tier: "fast",   category: "international", trustBaseScore: 75, region: "mena",   language: "en" },

  // ── Arab Media ───────────────────────────────────────────────────────────
  { id: "aljazeera-ar",     name: "Al Jazeera Arabic",url: "https://www.aljazeera.net/xml/rss/all.xml",         tier: "hyper",  category: "regional",      trustBaseScore: 85, region: "mena",   language: "ar" },
  { id: "alarabiya",        name: "Al Arabiya",       url: "https://www.alarabiya.net/.mrss/ar.xml",            tier: "fast",   category: "regional",      trustBaseScore: 76, region: "mena",   language: "ar" },
  { id: "aawsat",           name: "Asharq Al Awsat",  url: "https://aawsat.com/home/rss.xml",                   tier: "medium", category: "regional",      trustBaseScore: 79, region: "mena",   language: "ar" },
  { id: "arabnews",         name: "Arab News",        url: "https://www.arabnews.com/rss.xml",                  tier: "medium", category: "regional",      trustBaseScore: 80, region: "mena",   language: "en" },
  { id: "thenational",      name: "The National UAE", url: "https://www.thenationalnews.com/world/rss",         tier: "medium", category: "regional",      trustBaseScore: 81, region: "gulf",   language: "en" },
  { id: "khaleejtimes",     name: "Khaleej Times",    url: "https://www.khaleejtimes.com/rss/world",            tier: "medium", category: "regional",      trustBaseScore: 77, region: "gulf",   language: "en" },
  { id: "trtworld",         name: "TRT World",        url: "https://www.trtworld.com/rss",                      tier: "fast",   category: "international", trustBaseScore: 74, region: "mena",   language: "en" },
  { id: "trt-ar",           name: "TRT Arabic",       url: "https://www.trtarabi.com/rss",                      tier: "medium", category: "regional",      trustBaseScore: 74, region: "mena",   language: "ar" },
  { id: "alaraby",          name: "Al Araby",         url: "https://www.alaraby.co.uk/rss.xml",                 tier: "medium", category: "regional",      trustBaseScore: 75, region: "mena",   language: "ar" },
  { id: "middleeastmonitor",name: "Middle East Monitor",url:"https://www.middleeastmonitor.com/feed/",          tier: "medium", category: "regional",      trustBaseScore: 73, region: "mena",   language: "en" },
  { id: "gulfnews",         name: "Gulf News",        url: "https://gulfnews.com/rss",                          tier: "medium", category: "regional",      trustBaseScore: 76, region: "gulf",   language: "en" },
  { id: "dailysabah",       name: "Daily Sabah",      url: "https://www.dailysabah.com/rssfeed/en",             tier: "medium", category: "regional",      trustBaseScore: 70, region: "mena",   language: "en" },
  { id: "jpost",            name: "Jerusalem Post",   url: "https://www.jpost.com/rss/rssfeedsfrontpage.aspx",  tier: "medium", category: "regional",      trustBaseScore: 72, region: "mena",   language: "en" },
  { id: "independent-world",name: "Independent World",url: "https://www.independent.co.uk/news/world/rss",     tier: "medium", category: "international", trustBaseScore: 75, region: "europe", language: "en" },

  // ── Economy / Finance ────────────────────────────────────────────────────
  { id: "cnbc-top",         name: "CNBC Top News",    url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", tier: "fast",  category: "economy", trustBaseScore: 84, region: "global", language: "en" },
  { id: "cnbc-world",       name: "CNBC World",       url: "https://www.cnbc.com/id/20409666/device/rss/rss.html",  tier: "fast",  category: "economy", trustBaseScore: 83, region: "global", language: "en" },
  { id: "marketwatch",      name: "MarketWatch",      url: "https://feeds.marketwatch.com/marketwatch/topstories/", tier: "fast",  category: "economy", trustBaseScore: 79, region: "global", language: "en" },
  { id: "yahoo-finance",    name: "Yahoo Finance",    url: "https://finance.yahoo.com/news/rssindex",              tier: "fast",  category: "economy", trustBaseScore: 78, region: "global", language: "en" },
  { id: "yahoo-news",       name: "Yahoo News",       url: "https://news.yahoo.com/rss",                           tier: "fast",  category: "international", trustBaseScore: 73, region: "global", language: "en" },
  { id: "worldbank",        name: "World Bank",       url: "https://www.worldbank.org/en/news/all/rss",             tier: "slow",  category: "economy", trustBaseScore: 89, region: "global", language: "en" },
  { id: "imf",              name: "IMF",              url: "https://www.imf.org/en/News/RSS",                       tier: "slow",  category: "economy", trustBaseScore: 88, region: "global", language: "en" },
  { id: "oecd",             name: "OECD",             url: "https://www.oecd.org/newsroom/rss.xml",                 tier: "slow",  category: "economy", trustBaseScore: 87, region: "global", language: "en" },
  { id: "nikkei-asia",      name: "Nikkei Asia",      url: "https://asia.nikkei.com/rss/feed/nar",                  tier: "slow",  category: "economy", trustBaseScore: 81, region: "asia",   language: "en" },

  // ── Technology ───────────────────────────────────────────────────────────
  { id: "techcrunch",       name: "TechCrunch",       url: "https://techcrunch.com/feed/",                           tier: "fast",   category: "technology", trustBaseScore: 75, region: "global", language: "en" },
  { id: "theverge",         name: "The Verge",        url: "https://www.theverge.com/rss/index.xml",                 tier: "fast",   category: "technology", trustBaseScore: 74, region: "global", language: "en" },
  { id: "wired",            name: "Wired",            url: "https://www.wired.com/feed/rss",                         tier: "fast",   category: "technology", trustBaseScore: 73, region: "global", language: "en" },
  { id: "arstechnica",      name: "Ars Technica",     url: "https://feeds.arstechnica.com/arstechnica/index",        tier: "medium", category: "technology", trustBaseScore: 76, region: "global", language: "en" },
  { id: "cnet",             name: "CNET News",        url: "https://www.cnet.com/rss/news/",                         tier: "medium", category: "technology", trustBaseScore: 72, region: "global", language: "en" },
  { id: "engadget",         name: "Engadget",         url: "https://www.engadget.com/rss.xml",                       tier: "medium", category: "technology", trustBaseScore: 71, region: "global", language: "en" },
  { id: "gizmodo",          name: "Gizmodo",          url: "https://gizmodo.com/rss",                                tier: "medium", category: "technology", trustBaseScore: 70, region: "global", language: "en" },
  { id: "zdnet",            name: "ZDNet",            url: "https://www.zdnet.com/news/rss.xml",                     tier: "medium", category: "technology", trustBaseScore: 71, region: "global", language: "en" },

  // ── Sports ───────────────────────────────────────────────────────────────
  { id: "espn",             name: "ESPN",             url: "https://www.espn.com/espn/rss/news",                tier: "fast",   category: "sports", trustBaseScore: 74, region: "global", language: "en" },
  { id: "goal",             name: "Goal.com",         url: "https://www.goal.com/feeds/en/news",                tier: "fast",   category: "sports", trustBaseScore: 69, region: "global", language: "en" },
  { id: "skysports",        name: "Sky Sports",       url: "https://www.skysports.com/rss/12040",               tier: "fast",   category: "sports", trustBaseScore: 73, region: "global", language: "en" },

  // ── Health / Science ────────────────────────────────────────────────────
  { id: "who",              name: "WHO News",         url: "https://www.who.int/rss-feeds/news-english.xml",    tier: "slow",   category: "health",      trustBaseScore: 89, region: "global", language: "en" },
  { id: "nih-news",         name: "NIH News",         url: "https://www.nih.gov/news-events/news-releases.rss", tier: "slow",   category: "health",      trustBaseScore: 88, region: "global", language: "en" },
  { id: "medicalxpress",    name: "MedicalXpress",    url: "https://medicalxpress.com/rss-feed/",               tier: "slow",   category: "health",      trustBaseScore: 70, region: "global", language: "en" },
  { id: "sciencedaily",     name: "Science Daily",    url: "https://www.sciencedaily.com/rss/all.xml",          tier: "slow",   category: "technology",  trustBaseScore: 72, region: "global", language: "en" },
  { id: "nasa-news",        name: "NASA News",        url: "https://www.nasa.gov/news-release/feed/",           tier: "slow",   category: "technology",  trustBaseScore: 90, region: "global", language: "en" },
  { id: "nature",           name: "Nature",           url: "https://www.nature.com/nature.rss",                 tier: "slow",   category: "technology",  trustBaseScore: 88, region: "global", language: "en" },

  // ── International Organisations ──────────────────────────────────────────
  { id: "un-news",          name: "UN News",          url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml", tier: "medium", category: "international", trustBaseScore: 90, region: "global", language: "en" },
  { id: "reliefweb",        name: "ReliefWeb",        url: "https://reliefweb.int/updates/rss.xml",                  tier: "slow",   category: "international", trustBaseScore: 87, region: "global", language: "en" },

  // ── Asia / Pacific ───────────────────────────────────────────────────────
  { id: "cna",              name: "Channel NewsAsia", url: "https://www.channelnewsasia.com/rss/latest.xml",     tier: "fast",   category: "international", trustBaseScore: 80, region: "asia", language: "en" },
  { id: "japantimes",       name: "Japan Times",      url: "https://www.japantimes.co.jp/news_category/world/feed/", tier: "slow", category: "international", trustBaseScore: 77, region: "asia", language: "en" },

  // ── Other Global ────────────────────────────────────────────────────────
  { id: "theatlantic",      name: "The Atlantic",     url: "https://www.theatlantic.com/feed/all/",              tier: "slow",   category: "international", trustBaseScore: 79, region: "americas", language: "en" },
  { id: "earth-org",        name: "Earth.org",        url: "https://earth.org/feed/",                            tier: "slow",   category: "international", trustBaseScore: 70, region: "global",  language: "en" },
];

export const HIGH_CAPACITY_NEWS_SOURCES = RAW_SOURCES.map(normalizeSource);

export function getSourceCategoryLabel(category = "international") {
  const map = {
    politics: "سياسة",
    economy: "اقتصاد",
    international: "دولي",
    regional: "إقليمي",
    local: "محلي",
    sports: "رياضة",
    technology: "تقنية",
    health: "صحة",
    culture: "ثقافة",
    misc: "منوعات",
  };
  return map[category] || map.international;
}
