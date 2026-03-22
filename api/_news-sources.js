// Centralized registry for all RSS sources used by news endpoints.
// Endpoints can import profile lists instead of hardcoding their own feeds.

export const NEWS_SOURCE_REGISTRY = [
  // Global wire / mainstream
  { name: "BBC", url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "world", tier: "global-core" },
  { name: "Reuters", url: "https://feeds.reuters.com/reuters/worldNews", category: "world", tier: "global-core" },
  { name: "AP News", url: "https://apnews.com/hub/ap-top-news?output=rss", category: "world", tier: "global-core" },
  { name: "NPR", url: "https://feeds.npr.org/1004/rss.xml", category: "world", tier: "global-core" },
  { name: "The Guardian", url: "https://www.theguardian.com/world/rss", category: "world", tier: "global-core" },
  { name: "NYTimes", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", category: "world", tier: "global-core" },

  // Regional Arabic / Gulf
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", category: "world", tier: "arabic-core" },
  { name: "Sky News", url: "https://feeds.skynews.com/feeds/rss/world.xml", category: "world", tier: "arabic-core" },
  { name: "France 24 Arabic", url: "https://www.france24.com/ar/rss", category: "world", tier: "arabic-extended" },
  { name: "DW Arabic", url: "https://rss.dw.com/rdf/rss-ar-top", category: "world", tier: "arabic-extended" },
  { name: "RT Arabic", url: "https://arabic.rt.com/rss/", category: "world", tier: "arabic-extended" },
  { name: "Arab News", url: "https://www.arabnews.com/rss.xml", category: "world", tier: "gulf-extended" },
  { name: "The National", url: "https://www.thenationalnews.com/world/rss", category: "world", tier: "gulf-extended" },
  { name: "Khaleej Times", url: "https://www.khaleejtimes.com/rss/world", category: "world", tier: "gulf-extended" },
  { name: "Gulf News", url: "https://gulfnews.com/rss", category: "world", tier: "gulf-extended" },

  // Economy / markets
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex", category: "markets", tier: "markets-core" },
  { name: "CNBC", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", category: "markets", tier: "markets-core" },
  { name: "World Bank", url: "https://www.worldbank.org/en/news/all/rss", category: "markets", tier: "markets-core" },
  { name: "Bloomberg Markets", url: "https://feeds.bloomberg.com/markets/news.rss", category: "markets", tier: "markets-extended" },
  { name: "IMF", url: "https://www.imf.org/en/News/RSS", category: "markets", tier: "markets-extended" },

  // Humanitarian / institutions
  { name: "UN News", url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml", category: "world", tier: "institutional" },
  { name: "ReliefWeb", url: "https://reliefweb.int/updates/rss.xml", category: "world", tier: "institutional" },
];

export const BREAKING_SOURCE_REGISTRY = [
  { name: "BBC Breaking", url: "https://feeds.bbci.co.uk/news/rss.xml", category: "world", tier: "breaking-core" },
  { name: "Reuters Top", url: "https://feeds.reuters.com/reuters/topNews", category: "world", tier: "breaking-core" },
  { name: "AP Breaking", url: "https://apnews.com/hub/breaking-news?output=rss", category: "world", tier: "breaking-core" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", category: "world", tier: "breaking-extended" },
  { name: "Sky News", url: "https://feeds.skynews.com/feeds/rss/home.xml", category: "world", tier: "breaking-extended" },
];

// Lean profile for fast endpoint.
export const FAST_NEWS_SOURCE_URLS = [
  "https://feeds.bbci.co.uk/news/world/rss.xml",
  "https://www.aljazeera.com/xml/rss/all.xml",
  "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
  "https://feeds.reuters.com/reuters/worldNews",
  "https://feeds.skynews.com/feeds/rss/world.xml",
  "https://www.theguardian.com/world/rss",
  "https://www.france24.com/ar/rss",
];

// Wider profile for intelligence endpoint.
export const INTEL_NEWS_SOURCE_URLS = [
  "https://feeds.bbci.co.uk/news/world/rss.xml",
  "https://www.aljazeera.com/xml/rss/all.xml",
  "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
  "https://feeds.reuters.com/reuters/worldNews",
  "https://feeds.skynews.com/feeds/rss/world.xml",
  "https://feeds.bloomberg.com/markets/news.rss",
  "https://www.france24.com/ar/rss",
  "https://rss.dw.com/rdf/rss-ar-top",
];

export function resolveSourceNameFromUrl(url = "") {
  const entry = NEWS_SOURCE_REGISTRY.find((item) => item.url === url)
    || BREAKING_SOURCE_REGISTRY.find((item) => item.url === url);
  return entry?.name || url || "News Feed";
}
