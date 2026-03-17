/**
 * api/x-feed.js
 *
 * X Intelligence Discovery Engine
 *
 * Architecture:
 *   X Recent Search API (query-based, not account-based)
 *   → ingestion → dedupe → NLP extraction → scoring → clustering → cache → UI
 *
 * No hardcoded accounts. Everything is dynamically discovered via search queries.
 */

// ── Search Query Bank ─────────────────────────────────────────────────────────
// Each query targets a signal domain. Results are merged and processed.
const SEARCH_QUERIES = [
  // Geopolitics / Conflict
  { q: "war OR conflict OR military strike -is:retweet -is:reply lang:en",    domain: "conflict",    weight: 10 },
  { q: "sanctions OR embargo OR blockade -is:retweet -is:reply lang:en",       domain: "conflict",    weight: 8  },
  { q: "ceasefire OR diplomacy OR peace talks -is:retweet -is:reply lang:en",  domain: "politics",    weight: 7  },
  { q: "missile OR drone attack OR airstrike -is:retweet -is:reply lang:en",   domain: "conflict",    weight: 10 },
  { q: "elections OR coup OR protest -is:retweet -is:reply lang:en",           domain: "politics",    weight: 7  },
  // Economy / Markets
  { q: "oil price OR crude oil OR OPEC -is:retweet -is:reply lang:en",         domain: "economy",     weight: 9  },
  { q: "sanctions economy OR market crash -is:retweet -is:reply lang:en",      domain: "economy",     weight: 8  },
  { q: "inflation OR interest rate OR Fed -is:retweet -is:reply lang:en",      domain: "economy",     weight: 7  },
  { q: "gold price OR dollar OR currency crisis -is:retweet -is:reply lang:en",domain: "economy",     weight: 7  },
  // Regional
  { q: "Middle East OR Gaza OR Lebanon -is:retweet -is:reply lang:en",         domain: "regional",    weight: 9  },
  { q: "UAE OR Dubai OR Abu Dhabi -is:retweet -is:reply lang:en",              domain: "uae",         weight: 9  },
  { q: "Saudi Arabia OR Gulf OR Qatar -is:retweet -is:reply lang:en",          domain: "regional",    weight: 8  },
  { q: "Iran OR Yemen OR Syria -is:retweet -is:reply lang:en",                 domain: "regional",    weight: 9  },
  { q: "Ukraine OR Russia war -is:retweet -is:reply lang:en",                  domain: "conflict",    weight: 9  },
  // Arabic signals
  { q: "عاجل OR هجوم OR ضربات -is:retweet -is:reply lang:ar",                domain: "conflict",    weight: 10 },
  { q: "الإمارات OR دبي OR أبوظبي -is:retweet -is:reply lang:ar",            domain: "uae",         weight: 9  },
  { q: "نفط OR أسواق OR اقتصاد -is:retweet -is:reply lang:ar",               domain: "economy",     weight: 8  },
  { q: "سياسة OR دبلوماسية OR مفاوضات -is:retweet -is:reply lang:ar",        domain: "politics",    weight: 7  },
  // Sports
  { q: "football transfer OR signing OR deal -is:retweet -is:reply lang:en",   domain: "sports",      weight: 7  },
  { q: "UAE Pro League OR الدوري الإماراتي -is:retweet",                       domain: "sports",      weight: 9  },
  { q: "Champions League OR Premier League -is:retweet -is:reply lang:en",     domain: "sports",      weight: 7  },
];

const CACHE_TTL_MS   = 25 * 1000;  // 25 seconds
const CLUSTER_WINDOW = 10 * 60 * 1000; // 10 minutes for clustering

let memoryCache = { updated: 0, payload: null };

// ── NLP Utilities ─────────────────────────────────────────────────────────────
function clean(v) {
  return String(v || "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
}

function toUAETime(iso) {
  try {
    return new Intl.DateTimeFormat("ar-AE", {
      timeZone: "Asia/Dubai",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).format(new Date(iso));
  } catch { return iso; }
}

// Entity extraction — returns array of {name, type, sensitivity}
const ENTITIES = [
  { r: /\b(Iran|إيران)\b/i,              name: "إيران",         type: "country",  s: 9  },
  { r: /\b(Israel|إسرائيل)\b/i,          name: "إسرائيل",       type: "country",  s: 9  },
  { r: /\b(Gaza|غزة)\b/i,                name: "غزة",           type: "region",   s: 10 },
  { r: /\b(Ukraine|أوكرانيا)\b/i,        name: "أوكرانيا",      type: "country",  s: 8  },
  { r: /\b(Russia|روسيا)\b/i,            name: "روسيا",         type: "country",  s: 8  },
  { r: /\b(China|الصين)\b/i,             name: "الصين",         type: "country",  s: 7  },
  { r: /\b(Saudi|السعودية)\b/i,          name: "السعودية",      type: "country",  s: 6  },
  { r: /\b(UAE|الإمارات|Emirates)\b/i,   name: "الإمارات",      type: "country",  s: 6  },
  { r: /\b(Lebanon|لبنان)\b/i,           name: "لبنان",         type: "country",  s: 7  },
  { r: /\b(Yemen|اليمن)\b/i,             name: "اليمن",         type: "country",  s: 8  },
  { r: /\b(Syria|سوريا)\b/i,             name: "سوريا",         type: "country",  s: 8  },
  { r: /\b(Iraq|العراق)\b/i,             name: "العراق",        type: "country",  s: 7  },
  { r: /\b(Hamas|حماس)\b/i,              name: "حماس",          type: "org",      s: 9  },
  { r: /\b(Hezbollah|حزب الله)\b/i,      name: "حزب الله",      type: "org",      s: 9  },
  { r: /\b(Houthis|الحوثيون)\b/i,        name: "الحوثيون",      type: "org",      s: 9  },
  { r: /\b(OPEC|أوبك)\b/i,               name: "أوبك",          type: "org",      s: 7  },
  { r: /\b(NATO|الناتو)\b/i,             name: "الناتو",        type: "org",      s: 8  },
  { r: /\b(IMF|صندوق النقد)\b/i,         name: "صندوق النقد",   type: "org",      s: 6  },
  { r: /\b(oil|crude|نفط)\b/i,           name: "النفط",         type: "market",   s: 7  },
  { r: /\b(gold|ذهب)\b/i,                name: "الذهب",         type: "market",   s: 6  },
  { r: /\b(dollar|دولار)\b/i,            name: "الدولار",       type: "market",   s: 6  },
  { r: /\b(Al Ain|العين)\b/i,            name: "العين",         type: "club",     s: 5  },
  { r: /\b(Al Ahli|الأهلي)\b/i,          name: "الأهلي",        type: "club",     s: 5  },
  { r: /\b(Sharjah|الشارقة)\b/i,         name: "الشارقة",       type: "club",     s: 5  },
  { r: /\b(Al Wasl|الوصل)\b/i,           name: "الوصل",         type: "club",     s: 5  },
];

function extractEntities(text) {
  const found = [], seen = new Set();
  for (const e of ENTITIES) {
    if (e.r.test(text) && !seen.has(e.name)) {
      seen.add(e.name);
      found.push({ name: e.name, type: e.type, sensitivity: e.s });
    }
  }
  return found;
}

function maxSensitivity(entities) {
  return entities.length ? Math.max(...entities.map(e => e.sensitivity)) : 0;
}

// Extract keywords (high-signal words found in text)
const KEYWORD_GROUPS = {
  breaking: ["breaking", "urgent", "عاجل", "alert", "warning"],
  conflict: ["attack", "strike", "missile", "drone", "explosion", "killed", "war", "هجوم", "ضربة", "انفجار", "مقتل"],
  economy:  ["crash", "sanctions", "embargo", "inflation", "oil", "crude", "نفط", "عقوبات", "أسواق"],
  diplomatic: ["ceasefire", "talks", "agreement", "summit", "هدنة", "محادثات", "اتفاق", "قمة"],
  transfer: ["transfer", "signing", "deal", "loan", "انتقال", "صفقة", "عقد"],
};

function extractKeywords(text) {
  const t = text.toLowerCase();
  const found = [];
  for (const [group, words] of Object.entries(KEYWORD_GROUPS)) {
    for (const w of words) {
      if (t.includes(w)) { found.push({ word: w, group }); break; }
    }
  }
  return found;
}

function inferUrgency(text, keywords) {
  const t = text.toLowerCase();
  if (keywords.some(k => k.group === "breaking" || k.group === "conflict")) return "high";
  if (/attack|strike|missile|killed|explosion|هجوم|انفجار|مقتل|ضربة/.test(t)) return "high";
  if (/escalat|alert|tension|warning|تصعيد|تحذير|توتر/.test(t)) return "medium";
  return "low";
}

function inferCategory(text, domain) {
  const t = text.toLowerCase();
  if (domain === "uae") return "uae";
  if (domain === "sports") return "sports";
  if (domain === "economy") return "economy";
  if (/attack|missile|drone|war|explosion|هجوم|حرب/.test(t)) return "conflict";
  if (/diplomacy|ceasefire|talks|election|هدنة|محادثات/.test(t)) return "politics";
  if (/middle east|gulf|iran|israel|غزة|الخليج/.test(t)) return "geopolitics";
  return domain || "global";
}

function inferRegion(text) {
  const t = text.toLowerCase();
  if (/uae|emirates|dubai|abu dhabi|إمارات|دبي|أبوظبي/.test(t)) return "الإمارات";
  if (/gulf|خليج|saudi|سعودية|qatar|قطر|kuwait|كويت|bahrain|بحرين/.test(t)) return "الخليج";
  if (/gaza|غزة|israel|إسرائيل|palestine|فلسطين|lebanon|لبنان/.test(t)) return "الشرق الأوسط";
  if (/iran|إيران/.test(t)) return "إيران";
  if (/yemen|اليمن/.test(t)) return "اليمن";
  if (/syria|سوريا|iraq|العراق/.test(t)) return "بلاد الشام";
  if (/ukraine|أوكرانيا|russia|روسيا/.test(t)) return "أوروبا الشرقية";
  if (/china|الصين|asia|آسيا/.test(t)) return "آسيا";
  if (/europe|أوروبا/.test(t)) return "أوروبا";
  if (/us |usa|america|أمريكا/.test(t)) return "أمريكا";
  return "دولي";
}

// ── Scoring ───────────────────────────────────────────────────────────────────
function scorePost(post, entities, keywords, metrics, queryWeight, authorInfo) {
  let score = 0;

  // Account trust (0-30)
  if (authorInfo?.verified)       score += 20;
  if (/gov|official|ministry|وزارة|حكومة/.test((authorInfo?.description || "").toLowerCase())) score += 30;
  else if (authorInfo?.verified)  score += 0; // already counted above

  // Keyword urgency (0-15)
  if (keywords.some(k => k.group === "breaking"))  score += 15;
  else if (keywords.some(k => k.group === "conflict")) score += 12;
  else if (keywords.length > 0)                    score += 6;

  // Entity sensitivity (0-20)
  score += Math.round((maxSensitivity(entities) / 10) * 20);

  // Engagement (0-10)
  const eng = (metrics?.retweet_count || 0) + (metrics?.reply_count || 0) + (metrics?.like_count || 0);
  if (eng > 10000) score += 10;
  else if (eng > 1000)  score += 7;
  else if (eng > 100)   score += 4;
  else                  score += 1;

  // Query domain weight bonus (0-10)
  score += Math.min(10, queryWeight);

  return Math.min(100, score);
}

function calcConfidence(authorInfo, createdAt) {
  let c = 30;
  if (authorInfo?.verified) c += 25;
  const age = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (age < 10)       c += 25;
  else if (age < 30)  c += 18;
  else if (age < 60)  c += 12;
  else if (age < 180) c += 6;
  return Math.min(95, c);
}

function buildExplanation(entities, keywords, urgency, region, impactScore) {
  const parts = [];
  if (urgency === "high") parts.push("إشارة عاجلة");
  const highSens = entities.filter(e => e.sensitivity >= 8);
  if (highSens.length) parts.push(`كيانات: ${highSens.map(e => e.name).join("، ")}`);
  if (keywords.some(k => k.group === "breaking")) parts.push("كلمة عاجلة");
  if (keywords.some(k => k.group === "conflict")) parts.push("إشارة نزاع");
  if (keywords.some(k => k.group === "economy")) parts.push("إشارة اقتصادية");
  if (region && region !== "دولي") parts.push(`منطقة: ${region}`);
  if (impactScore >= 70) parts.push("تأثير مرتفع جداً");
  return parts.length ? parts.join(" · ") : "إشارة مرصودة من بحث حي";
}

// ── Translation ───────────────────────────────────────────────────────────────
async function translateToArabic(text, lang) {
  if (!text || lang === "ar") return text;
  const url = process.env.TRANSLATION_API_URL;
  if (!url) return text;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json",
        ...(process.env.TRANSLATION_API_KEY ? { Authorization: `Bearer ${process.env.TRANSLATION_API_KEY}` } : {}) },
      body: JSON.stringify({ text, source: lang || "en", target: "ar" })
    });
    if (!res.ok) return text;
    const d = await res.json();
    return clean(d.translatedText || d.translation || d.result || text);
  } catch { return text; }
}

// ── X API ─────────────────────────────────────────────────────────────────────
async function xSearch(query, maxResults = 10) {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) throw new Error("missing_x_bearer_token");

  const q = encodeURIComponent(query);
  const url =
    `https://api.x.com/2/tweets/search/recent` +
    `?query=${q}&max_results=${maxResults}` +
    `&tweet.fields=created_at,lang,public_metrics,author_id` +
    `&expansions=author_id` +
    `&user.fields=name,username,verified,description,public_metrics`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 429) throw new Error("rate_limited");
  if (!res.ok) throw new Error(`x_api_error:${res.status}`);
  return res.json();
}

// ── Normalize one tweet ───────────────────────────────────────────────────────
async function normalizeTweet(tweet, users, queryMeta) {
  const author = users.get(tweet.author_id) || {};
  const rawText = clean(tweet.text);
  const lang = tweet.lang || "en";
  const translated = await translateToArabic(rawText, lang);
  const displayText = lang === "ar" ? rawText : (translated || rawText);

  const entities = extractEntities(rawText + " " + translated);
  const keywords = extractKeywords(rawText);
  const urgency = inferUrgency(rawText, keywords);
  const category = inferCategory(rawText, queryMeta.domain);
  const region = inferRegion(rawText + " " + translated);
  const createdAt = tweet.created_at || new Date().toISOString();
  const metrics = tweet.public_metrics || {};
  const impactScore = scorePost(tweet, entities, keywords, metrics, queryMeta.weight, author);
  const confidence = calcConfidence(author, createdAt);

  return {
    id: `xq-${tweet.id}`,
    text: rawText,
    translated: displayText,
    entities,
    keywords: keywords.map(k => k.word).slice(0, 5),
    region,
    category,
    urgency,
    impactScore,
    confidence,
    clusterId: null, // assigned later
    createdAt,
    localTimeUAE: toUAETime(createdAt),
    explanation: buildExplanation(entities, keywords, urgency, region, impactScore),
    // UI extras
    authorName: author.name || "مستخدم X",
    authorHandle: `@${author.username || "x"}`,
    authorVerified: !!author.verified,
    avatar: null,
    engagement: metrics,
    url: `https://x.com/${author.username || "x"}/status/${tweet.id}`,
    queryDomain: queryMeta.domain,
  };
}

// ── Auto Clustering ───────────────────────────────────────────────────────────
function buildClusters(posts) {
  // Group posts that share entities + are within CLUSTER_WINDOW
  const clusters = new Map();

  for (const post of posts) {
    const topEntities = post.entities.filter(e => e.sensitivity >= 6).map(e => e.name).sort();
    if (!topEntities.length) continue;

    const key = topEntities.slice(0, 2).join("+") + ":" + post.category;
    const now = new Date(post.createdAt).getTime();

    if (!clusters.has(key)) {
      clusters.set(key, {
        clusterId: `cl-${key.replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 24)}`,
        topic: topEntities.slice(0, 2).join(" × ") + (post.region !== "دولي" ? ` (${post.region})` : ""),
        entities: topEntities,
        region: post.region,
        category: post.category,
        confidence: post.confidence,
        volume: 0,
        firstSeen: post.createdAt,
        latestUpdate: post.createdAt,
        posts: [],
        maxImpact: 0,
        urgencyCount: 0,
      });
    }

    const cl = clusters.get(key);
    cl.volume += 1;
    cl.posts.push(post.id);
    cl.confidence = Math.min(95, cl.confidence + Math.round(post.confidence * 0.15));
    cl.maxImpact = Math.max(cl.maxImpact, post.impactScore);
    if (post.urgency === "high") cl.urgencyCount += 1;

    // Track time range
    if (now < new Date(cl.firstSeen).getTime()) cl.firstSeen = post.createdAt;
    if (now > new Date(cl.latestUpdate).getTime()) cl.latestUpdate = post.createdAt;

    // Assign clusterId back to post
    post.clusterId = cl.clusterId;
  }

  // Build cluster labels
  const result = [];
  for (const cl of clusters.values()) {
    if (cl.volume < 2) continue; // skip singletons
    cl.label = cl.urgencyCount > 0 ? "إشارة عاجلة مرتفعة" :
      cl.category === "economy" ? "إشارة تأثير اقتصادي" :
      cl.category === "sports"  ? "إشارة انتقالات رياضية" :
      cl.maxImpact >= 60        ? "إشارة استراتيجية صاعدة" :
                                  "إشارة ناشئة";
    result.push(cl);
  }

  return result.sort((a, b) => b.maxImpact - a.maxImpact).slice(0, 8);
}

// ── Build intelligence layers from processed posts ────────────────────────────
function buildLayers(posts, clusters) {
  const rank = p => p.impactScore + (p.urgency === "high" ? 25 : p.urgency === "medium" ? 10 : 0);
  const top = (filter, n = 6) =>
    posts.filter(filter).sort((a, b) => rank(b) - rank(a)).slice(0, n);

  return {
    topSignals:  top(p => p.impactScore >= 40, 8),
    urgent:      top(p => p.urgency === "high"),
    regional:    top(p => ["الإمارات","الخليج","الشرق الأوسط","إيران","اليمن"].includes(p.region)),
    economy:     top(p => p.category === "economy"),
    sports:      top(p => p.category === "sports"),
    uae:         top(p => p.category === "uae"),
    rising: clusters.filter(cl => cl.volume >= 2)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5),
  };
}

// ── Fallback posts (no X API key) ─────────────────────────────────────────────
function getFallbackPosts() {
  const now = Date.now();
  const make = (id, text, domain, ago, urgency = "medium") => {
    const entities = extractEntities(text);
    const keywords = extractKeywords(text);
    const createdAt = new Date(now - ago).toISOString();
    const impactScore = Math.min(100, 35 + Math.round((maxSensitivity(entities) / 10) * 20)
      + (urgency === "high" ? 20 : urgency === "medium" ? 10 : 0));
    return {
      id: `fb-${id}`,
      text, translated: text, entities, keywords: keywords.map(k => k.word),
      region: inferRegion(text), category: inferCategory(text, domain), urgency,
      impactScore, confidence: 45,
      clusterId: null, createdAt, localTimeUAE: toUAETime(createdAt),
      explanation: buildExplanation(entities, keywords, urgency, inferRegion(text), impactScore),
      authorName: "محرك الاستخبارات", authorHandle: "@x_intelligence",
      authorVerified: false, avatar: null, engagement: {},
      url: "https://x.com/search?q=" + encodeURIComponent(domain),
      queryDomain: domain,
    };
  };

  const posts = [
    make("1", "Oil markets react to rising shipping risk near strategic waterways as tensions escalate in the region.", "economy", 120000, "medium"),
    make("2", "Military movements reported near contested border. Drone activity detected in the area.", "conflict", 300000, "high"),
    make("3", "UAE announces new trade framework with regional partners amid economic diplomacy push.", "uae", 480000, "low"),
    make("4", "Ceasefire talks resume as international pressure builds for de-escalation agreement.", "politics", 600000, "medium"),
    make("5", "OPEC+ considering output adjustment in response to market volatility and geopolitical risk.", "economy", 900000, "medium"),
    make("6", "Transfer window: Major club reportedly close to announcing high-profile signing.", "sports", 360000, "low"),
    make("7", "Sanctions package under consideration targeting key economic sectors.", "conflict", 720000, "high"),
    make("8", "Diplomatic talks between regional powers continue behind closed doors.", "politics", 1200000, "medium"),
  ];

  const clusters = buildClusters(posts);
  return { posts, clusters };
}

// ── Main ingestion pipeline ───────────────────────────────────────────────────
async function runPipeline() {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    const fallback = getFallbackPosts();
    return {
      ...fallback,
      layers: buildLayers(fallback.posts, fallback.clusters),
      live: false, updated: new Date().toISOString(),
    };
  }

  const allTweets = [];
  const userMap = new Map();

  // Run queries in batches of 3 to avoid hammering the API
  for (let i = 0; i < SEARCH_QUERIES.length; i += 3) {
    const batch = SEARCH_QUERIES.slice(i, i + 3);
    const results = await Promise.allSettled(
      batch.map(q => xSearch(q.q, 8).then(data => ({ data, meta: q })))
    );
    for (const r of results) {
      if (r.status !== "fulfilled") continue;
      const { data, meta } = r.value;
      (data.includes?.users || []).forEach(u => userMap.set(u.id, u));
      for (const tweet of (data.data || [])) {
        allTweets.push({ tweet, meta });
      }
    }
  }

  // Deduplicate by tweet id
  const seen = new Set();
  const unique = allTweets.filter(({ tweet }) => {
    if (seen.has(tweet.id)) return false;
    seen.add(tweet.id);
    return true;
  });

  // Normalize all tweets through intelligence pipeline
  const normalized = [];
  for (const { tweet, meta } of unique) {
    try {
      const post = await normalizeTweet(tweet, userMap, meta);
      normalized.push(post);
    } catch { /* skip bad tweets */ }
  }

  // Sort by impact descending
  normalized.sort((a, b) => b.impactScore - a.impactScore);

  const clusters = buildClusters(normalized);
  const layers = buildLayers(normalized, clusters);

  return {
    posts: normalized.slice(0, 100),
    clusters,
    layers,
    live: true,
    updated: new Date().toISOString(),
    stats: {
      total: normalized.length,
      urgent: normalized.filter(p => p.urgency === "high").length,
      clusterCount: clusters.length,
      domains: [...new Set(normalized.map(p => p.queryDomain))].length,
    }
  };
}

// ── Cache + handler ───────────────────────────────────────────────────────────
async function getPayload() {
  const now = Date.now();
  if (memoryCache.payload && now - memoryCache.updated < CACHE_TTL_MS) {
    return memoryCache.payload;
  }
  const payload = await runPipeline();
  memoryCache = { updated: now, payload };
  return payload;
}

export default async function handler(req, res) {
  try {
    const payload = await getPayload();
    res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=10");
    res.status(200).json(payload);
  } catch (err) {
    console.error("x-feed fatal:", err.message);
    const fallback = getFallbackPosts();
    res.status(200).json({
      ...fallback,
      layers: buildLayers(fallback.posts, fallback.clusters),
      live: false,
      updated: new Date().toISOString(),
    });
  }
}
