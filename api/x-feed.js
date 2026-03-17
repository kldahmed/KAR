// ── Account Registry ─────────────────────────────────────────────────────────
// trustScore: 0-100 used in impact calculation
// tier: "official" | "breaking" | "media" | "analysis"
const WATCHED_ACCOUNTS = [
  // UAE Official
  { account: "WAM News",                   handle: "wamnews_eng",    category: "uae",      lang: "en", sourceType: "official", verified: true,  tier: "official", trustScore: 95 },
  { account: "UAE Ministry of Foreign Affairs", handle: "mofauae",  category: "uae",      lang: "en", sourceType: "official", verified: true,  tier: "official", trustScore: 98 },
  { account: "Dubai Media Office",         handle: "DXBMediaOffice", category: "uae",      lang: "en", sourceType: "official", verified: true,  tier: "official", trustScore: 93 },
  { account: "Abu Dhabi Government",       handle: "AbuDhabiGov",    category: "uae",      lang: "en", sourceType: "official", verified: true,  tier: "official", trustScore: 95 },
  { account: "UAE Government",             handle: "UAEGov",         category: "uae",      lang: "en", sourceType: "official", verified: true,  tier: "official", trustScore: 96 },
  // Regional Official
  { account: "Saudi Press Agency",         handle: "SPAEnglish",     category: "regional", lang: "en", sourceType: "official", verified: true,  tier: "official", trustScore: 90 },
  // Breaking / Tier-1 Media
  { account: "Reuters World",              handle: "ReutersWorld",   category: "world",    lang: "en", sourceType: "breaking", verified: true,  tier: "breaking", trustScore: 92 },
  { account: "Reuters",                    handle: "Reuters",        category: "world",    lang: "en", sourceType: "breaking", verified: true,  tier: "breaking", trustScore: 92 },
  { account: "BBC Breaking News",          handle: "BBCBreaking",    category: "world",    lang: "en", sourceType: "breaking", verified: true,  tier: "breaking", trustScore: 91 },
  { account: "AP News",                    handle: "AP",             category: "world",    lang: "en", sourceType: "breaking", verified: true,  tier: "breaking", trustScore: 91 },
  // Regional Media
  { account: "Sky News Arabia",            handle: "skynewsarabia",  category: "regional", lang: "ar", sourceType: "media",    verified: true,  tier: "media",    trustScore: 82 },
  { account: "Al Jazeera English",         handle: "AJEnglish",      category: "world",    lang: "en", sourceType: "media",    verified: true,  tier: "media",    trustScore: 80 },
  { account: "Al Jazeera Arabic",          handle: "AJArabic",       category: "regional", lang: "ar", sourceType: "media",    verified: true,  tier: "media",    trustScore: 80 },
  { account: "France 24 Arabic",           handle: "France24Arabic", category: "regional", lang: "ar", sourceType: "media",    verified: true,  tier: "media",    trustScore: 78 },
  // Economy / Markets
  { account: "Bloomberg",                  handle: "Bloomberg",      category: "economy",  lang: "en", sourceType: "media",    verified: true,  tier: "media",    trustScore: 88 },
  { account: "Bloomberg Markets",          handle: "BloombergMkts",  category: "economy",  lang: "en", sourceType: "media",    verified: true,  tier: "media",    trustScore: 87 },
  // Sports UAE
  { account: "UAE Pro League",             handle: "ArabianGulf",    category: "sports",   lang: "ar", sourceType: "official", verified: true,  tier: "official", trustScore: 90 },
  { account: "Al Ain FC",                  handle: "alainfcofficial",category: "sports",   lang: "ar", sourceType: "official", verified: true,  tier: "official", trustScore: 85 },
  { account: "Al Ahli Dubai",              handle: "alahlicfc",      category: "sports",   lang: "ar", sourceType: "official", verified: true,  tier: "official", trustScore: 85 },
  // Analysis
  { account: "K.A.R",                      handle: "khalldahmd",     category: "analysis", lang: "ar", sourceType: "analysis", verified: true,  tier: "analysis", trustScore: 80 }
];

const DEFAULT_AVATAR =
  "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";

const CACHE_TTL_MS = 45 * 1000; // 45 seconds — aggressive but live

let memoryCache = {
  updated: 0,
  payload: null
};

// ── Text Utilities ────────────────────────────────────────────────────────────
function cleanText(value) {
  return String(value || "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toUAETime(isoString) {
  try {
    return new Intl.DateTimeFormat("ar-AE", {
      timeZone: "Asia/Dubai",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
      hour12: false
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

// ── Entity Extraction ─────────────────────────────────────────────────────────
const ENTITY_PATTERNS = [
  // Countries / regions
  { pattern: /\b(iran|إيران)\b/i,       entity: "إيران",       type: "country",  sensitivity: 9 },
  { pattern: /\b(israel|إسرائيل)\b/i,   entity: "إسرائيل",     type: "country",  sensitivity: 9 },
  { pattern: /\b(gaza|غزة)\b/i,         entity: "غزة",         type: "region",   sensitivity: 10 },
  { pattern: /\b(ukraine|أوكرانيا)\b/i, entity: "أوكرانيا",    type: "country",  sensitivity: 8 },
  { pattern: /\b(russia|روسيا)\b/i,     entity: "روسيا",       type: "country",  sensitivity: 8 },
  { pattern: /\b(china|الصين)\b/i,      entity: "الصين",       type: "country",  sensitivity: 7 },
  { pattern: /\b(saudi|السعودية)\b/i,   entity: "السعودية",    type: "country",  sensitivity: 6 },
  { pattern: /\b(uae|الإمارات)\b/i,     entity: "الإمارات",    type: "country",  sensitivity: 6 },
  { pattern: /\b(lebanon|لبنان)\b/i,    entity: "لبنان",       type: "country",  sensitivity: 7 },
  { pattern: /\b(yemen|اليمن)\b/i,      entity: "اليمن",       type: "country",  sensitivity: 8 },
  { pattern: /\b(syria|سوريا)\b/i,      entity: "سوريا",       type: "country",  sensitivity: 8 },
  { pattern: /\b(iraq|العراق)\b/i,      entity: "العراق",      type: "country",  sensitivity: 7 },
  // Organizations
  { pattern: /\b(OPEC|أوبك)\b/i,        entity: "أوبك",        type: "org",      sensitivity: 7 },
  { pattern: /\b(NATO|الناتو)\b/i,       entity: "الناتو",      type: "org",      sensitivity: 8 },
  { pattern: /\b(UN|الأمم المتحدة)\b/i, entity: "الأمم المتحدة",type: "org",     sensitivity: 6 },
  { pattern: /\b(hamas|حماس)\b/i,       entity: "حماس",        type: "org",      sensitivity: 9 },
  { pattern: /\b(hezbollah|حزب الله)\b/i,entity: "حزب الله",   type: "org",      sensitivity: 9 },
  { pattern: /\b(houthis|الحوثيون)\b/i, entity: "الحوثيون",   type: "org",      sensitivity: 9 },
  { pattern: /\b(IMF|صندوق النقد)\b/i,  entity: "صندوق النقد", type: "org",      sensitivity: 6 },
  // Markets
  { pattern: /\b(oil|نفط|crude)\b/i,    entity: "أسواق النفط", type: "market",   sensitivity: 7 },
  { pattern: /\b(gold|ذهب)\b/i,         entity: "الذهب",       type: "market",   sensitivity: 6 },
  { pattern: /\b(dollar|دولار)\b/i,     entity: "الدولار",     type: "market",   sensitivity: 6 },
  // UAE Clubs
  { pattern: /\b(al ain|العين)\b/i,     entity: "العين",       type: "club",     sensitivity: 5 },
  { pattern: /\b(al ahli|الأهلي)\b/i,   entity: "الأهلي",      type: "club",     sensitivity: 5 },
  { pattern: /\b(al wasl|الوصل)\b/i,    entity: "الوصل",       type: "club",     sensitivity: 5 },
  { pattern: /\b(sharjah|الشارقة)\b/i,  entity: "الشارقة",     type: "club",     sensitivity: 5 },
];

function extractEntities(text) {
  const t = cleanText(text);
  const found = [];
  const seen = new Set();
  for (const p of ENTITY_PATTERNS) {
    if (p.pattern.test(t) && !seen.has(p.entity)) {
      seen.add(p.entity);
      found.push({ name: p.entity, type: p.type, sensitivity: p.sensitivity });
    }
  }
  return found;
}

function maxEntitySensitivity(entities) {
  if (!entities.length) return 0;
  return Math.max(...entities.map(e => e.sensitivity));
}

// ── Category Inference ────────────────────────────────────────────────────────
function inferCategory(text, fallback = "world") {
  const t = (text || "").toLowerCase();
  if (/نفط|oil|crude|gas|غاز|opec|أوبك|gold|ذهب|market|سوق|brent|wti|dollar|economy|اقتصاد/.test(t)) return "economy";
  if (/missile|drone|attack|strike|raid|غارة|قصف|صاروخ|مسيرة|انفجار|hamas|حماس|hezbollah|حزب الله|houthis|الحوثي|war|حرب|military|عسكري/.test(t)) return "conflict";
  if (/دوري|league|football|كرة|مباراة|match|goal|هدف|transfer|انتقال|cup|كأس|fifa|اتحاد/.test(t)) return "sports";
  if (/إمارات|dubai|abu dhabi|uae|وام|دبي|أبوظبي|sharjah|الشارقة/.test(t)) return "uae";
  if (/رئيس|وزير|خارجية|diplomatic|minister|president|government|اتفاق|معاهدة|قمة|summit/.test(t)) return "politics";
  if (/إيران|iran|israel|إسرائيل|غزة|gaza|لبنان|lebanon|سوريا|syria|العراق|iraq|اليمن|yemen|خليج|gulf|regional|إقليمي/.test(t)) return "geopolitics";
  return fallback;
}

// ── Region Inference ──────────────────────────────────────────────────────────
function inferRegion(text, fallback = "global") {
  const t = (text || "").toLowerCase();
  if (/إمارات|dubai|abu dhabi|uae|sharjah|الشارقة/.test(t)) return "الإمارات";
  if (/خليج|gulf|سعودية|saudi|قطر|qatar|كويت|kuwait|بحرين|bahrain|عمان|oman/.test(t)) return "الخليج";
  if (/غزة|gaza|إسرائيل|israel|فلسطين|palestine|لبنان|lebanon|سوريا|syria/.test(t)) return "الشرق الأوسط";
  if (/إيران|iran/.test(t)) return "إيران";
  if (/اليمن|yemen/.test(t)) return "اليمن";
  if (/أوكرانيا|ukraine|روسيا|russia/.test(t)) return "أوروبا الشرقية";
  if (/china|الصين|taiwan|تايوان|asia|آسيا/.test(t)) return "آسيا";
  if (/europe|أوروبا/.test(t)) return "أوروبا";
  if (/africa|أفريقيا/.test(t)) return "أفريقيا";
  if (/us|usa|america|أمريكا/.test(t)) return "أمريكا";
  return "دولي";
}

// ── Urgency ───────────────────────────────────────────────────────────────────
function inferUrgency(text) {
  const t = (text || "").toLowerCase();
  if (/urgent|breaking|عاجل|هجوم|attack|strike|explosion|انفجار|مقتل|killed|شهيد|قصف|raid|war|حرب/.test(t)) return "high";
  if (/alert|تحذير|تصعيد|escalation|deployment|توتر|tension|warning|مخاطر|threat/.test(t)) return "medium";
  return "low";
}

// ── Impact Scoring ────────────────────────────────────────────────────────────
// Returns 0-100
function calcImpactScore(accountInfo, text, entities, metrics) {
  // Account trust component (0-40)
  const trustComponent = Math.round((accountInfo.trustScore / 100) * 40);

  // Urgency component (0-30)
  const urg = inferUrgency(text);
  const urgencyComponent = urg === "high" ? 30 : urg === "medium" ? 15 : 5;

  // Entity sensitivity component (0-20)
  const maxSens = maxEntitySensitivity(entities);
  const entityComponent = Math.round((maxSens / 10) * 20);

  // Engagement component (0-10) — from public_metrics if available
  const engagement = metrics || {};
  const engagementSum = (engagement.retweet_count || 0) + (engagement.reply_count || 0) + (engagement.like_count || 0);
  const engagementComponent = engagementSum > 5000 ? 10 : engagementSum > 1000 ? 7 : engagementSum > 100 ? 4 : 1;

  return Math.min(100, trustComponent + urgencyComponent + entityComponent + engagementComponent);
}

// ── Confidence Scoring ────────────────────────────────────────────────────────
function calcConfidenceScore(accountInfo, createdAt) {
  // Source type component (0-50)
  const sourceComponent = accountInfo.tier === "official" ? 50
    : accountInfo.tier === "breaking" ? 45
    : accountInfo.tier === "media" ? 38
    : 30;

  // Verified component (0-30)
  const verifiedComponent = accountInfo.verified ? 30 : 0;

  // Recency component (0-20)
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageH = ageMs / (1000 * 60 * 60);
  const recencyComponent = ageH < 1 ? 20 : ageH < 3 ? 16 : ageH < 6 ? 12 : ageH < 12 ? 8 : 4;

  return Math.min(100, sourceComponent + verifiedComponent + recencyComponent);
}

// ── Rank Score ────────────────────────────────────────────────────────────────
// Higher = shown first
function calcRankScore(accountInfo, post) {
  let score = 0;

  // Tier bonus
  if (accountInfo.tier === "official") score += 50;
  else if (accountInfo.tier === "breaking") score += 42;
  else if (accountInfo.tier === "media") score += 30;
  else score += 20;

  // Verified bonus
  if (post.verified) score += 25;

  // Urgency bonus
  if (post.urgency === "high") score += 30;
  else if (post.urgency === "medium") score += 15;

  // Impact bonus (weighted)
  score += Math.round(post.impactScore * 0.2);

  // Recency bonus (max +20 for <30min)
  const ageMs = Date.now() - new Date(post.createdAt).getTime();
  const ageMin = ageMs / 60000;
  score += ageMin < 30 ? 20 : ageMin < 60 ? 15 : ageMin < 180 ? 10 : ageMin < 360 ? 5 : 0;

  return score;
}

// ── Explainability ────────────────────────────────────────────────────────────
function buildExplanation(accountInfo, post) {
  const reasons = [];

  if (accountInfo.tier === "official") reasons.push("مصدر رسمي موثوق");
  else if (accountInfo.tier === "breaking") reasons.push("وكالة أنباء متخصصة");

  if (post.urgency === "high") reasons.push("إشارة عاجلة");
  else if (post.urgency === "medium") reasons.push("إشارة ذات أهمية");

  if (post.entities.length > 0) {
    const sensitive = post.entities.filter(e => e.sensitivity >= 8);
    if (sensitive.length > 0) {
      reasons.push(`كيانات حساسة: ${sensitive.map(e => e.name).join("، ")}`);
    }
  }

  if (post.impactScore >= 75) reasons.push("تأثير مرتفع جداً");
  else if (post.impactScore >= 55) reasons.push("تأثير مرتفع");

  if (post.region && post.region !== "دولي") reasons.push(`منطقة: ${post.region}`);

  return reasons.length > 0
    ? reasons.join(" · ")
    : `مصدر ${accountInfo.tier === "official" ? "رسمي" : "موثوق"}`;
}

// ── Translation (optional external API) ──────────────────────────────────────
async function translateToArabic(text, sourceLang = "en") {
  const raw = cleanText(text);
  if (!raw) return "";
  if (sourceLang === "ar") return raw;

  const url = process.env.TRANSLATION_API_URL;
  const apiKey = process.env.TRANSLATION_API_KEY;
  if (!url) return raw;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
      body: JSON.stringify({ text: raw, source: sourceLang, target: "ar" })
    });
    if (!res.ok) throw new Error("translation_failed");
    const data = await res.json();
    return cleanText(data.translatedText || data.translation || data.result || raw);
  } catch {
    return raw;
  }
}

// ── X API Client ──────────────────────────────────────────────────────────────
async function xFetch(url) {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) throw new Error("missing_x_bearer_token");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`x_api_error:${res.status}:${text}`);
  }
  return res.json();
}

// ── Normalize a single tweet into full intelligence schema ───────────────────
async function normalizeTweet(tweet, author, accountInfo) {
  const rawText = cleanText(tweet.text);
  const translated = await translateToArabic(rawText, tweet.lang || accountInfo.lang || "en");
  const entities = extractEntities(rawText + " " + translated);
  const category = inferCategory(rawText + " " + translated, accountInfo.category);
  const urgency = inferUrgency(rawText + " " + translated);
  const region = inferRegion(rawText + " " + translated);
  const createdAt = tweet.created_at || new Date().toISOString();
  const metrics = tweet.public_metrics || {};
  const verified = typeof author?.verified === "boolean" ? author.verified : accountInfo.verified;

  const impactScore = calcImpactScore(accountInfo, rawText, entities, metrics);
  const confidenceScore = calcConfidenceScore(accountInfo, createdAt);

  const post = {
    id: `${accountInfo.handle}-${tweet.id}`,
    account: author?.name || accountInfo.account,
    handle: `@${author?.username || accountInfo.handle}`,
    text: rawText,
    translated,
    category,
    region,
    entities,
    urgency,
    impactScore,
    confidenceScore,
    sourceType: accountInfo.sourceType,
    tier: accountInfo.tier,
    verified,
    createdAt,
    localTimeUAE: toUAETime(createdAt),
    url: `https://x.com/${author?.username || accountInfo.handle}/status/${tweet.id}`,
    avatar: author?.profile_image_url || DEFAULT_AVATAR,
    engagement: metrics
  };

  post.rankScore = calcRankScore(accountInfo, post);
  post.explanation = buildExplanation(accountInfo, post);

  return post;
}

// ── Fetch posts for one account via X API v2 ─────────────────────────────────
async function fetchPostsForHandle(accountInfo) {
  const query = encodeURIComponent(`from:${accountInfo.handle} -is:retweet -is:reply`);
  const url =
    `https://api.x.com/2/tweets/search/recent` +
    `?query=${query}&max_results=5` +
    `&tweet.fields=created_at,lang,public_metrics,source` +
    `&expansions=author_id` +
    `&user.fields=name,username,profile_image_url,verified`;

  const data = await xFetch(url);
  const users = new Map((data.includes?.users || []).map(u => [u.id, u]));
  const tweets = data.data || [];

  const normalized = [];
  for (const tweet of tweets) {
    const author = users.get(tweet.author_id);
    const post = await normalizeTweet(tweet, author, accountInfo);
    normalized.push(post);
  }
  return normalized;
}

// ── Fallback posts (fully normalized schema) ──────────────────────────────────
function buildFallbackPost(opts) {
  const now = new Date(Date.now() - opts.ageMs).toISOString();
  const acc = WATCHED_ACCOUNTS.find(a => a.handle === opts.handle) || WATCHED_ACCOUNTS[0];
  const entities = extractEntities(opts.text + " " + opts.translated);
  const impactScore = calcImpactScore(acc, opts.text, entities, {});
  const confidenceScore = calcConfidenceScore(acc, now);
  const post = {
    id: `fallback-${opts.handle}-${opts.ageMs}`,
    account: opts.account,
    handle: `@${opts.handle}`,
    text: opts.text,
    translated: opts.translated,
    category: opts.category,
    region: opts.region || inferRegion(opts.text),
    entities,
    urgency: opts.urgency || "medium",
    impactScore,
    confidenceScore,
    sourceType: acc.sourceType,
    tier: acc.tier,
    verified: true,
    createdAt: now,
    localTimeUAE: toUAETime(now),
    url: `https://x.com/${opts.handle}`,
    avatar: DEFAULT_AVATAR,
    engagement: {}
  };
  post.rankScore = calcRankScore(acc, post);
  post.explanation = buildExplanation(acc, post);
  return post;
}

function getFallbackPosts() {
  return [
    buildFallbackPost({ handle: "ReutersWorld", account: "Reuters World", ageMs: 120000, text: "Oil markets react to rising shipping risk near strategic waterways.", translated: "أسواق النفط تتفاعل مع ارتفاع مخاطر الملاحة قرب الممرات المائية الاستراتيجية.", category: "economy", region: "الخليج", urgency: "medium" }),
    buildFallbackPost({ handle: "skynewsarabia", account: "Sky News Arabia", ageMs: 360000, text: "تحركات سياسية واقتصادية جديدة مرتبطة بالتوترات الإقليمية.", translated: "تحركات سياسية واقتصادية جديدة مرتبطة بالتوترات الإقليمية.", category: "geopolitics", region: "الشرق الأوسط", urgency: "medium" }),
    buildFallbackPost({ handle: "DXBMediaOffice", account: "Dubai Media Office", ageMs: 600000, text: "Official updates continue regarding regional developments and travel conditions.", translated: "تتواصل التحديثات الرسمية بشأن التطورات الإقليمية وظروف السفر.", category: "uae", region: "الإمارات", urgency: "low" }),
    buildFallbackPost({ handle: "wamnews_eng", account: "WAM News", ageMs: 840000, text: "UAE agencies continue monitoring regional developments and humanitarian responses.", translated: "تواصل الجهات الإماراتية متابعة التطورات الإقليمية والاستجابات الإنسانية.", category: "uae", region: "الإمارات", urgency: "low" }),
    buildFallbackPost({ handle: "Bloomberg", account: "Bloomberg", ageMs: 300000, text: "Crude oil prices rise amid escalating tensions in key shipping routes.", translated: "أسعار النفط الخام ترتفع وسط تصاعد التوترات في ممرات الشحن الرئيسية.", category: "economy", region: "دولي", urgency: "medium" }),
    buildFallbackPost({ handle: "AP", account: "AP News", ageMs: 480000, text: "Diplomatic talks continue as regional powers seek de-escalation frameworks.", translated: "محادثات دبلوماسية مستمرة في ظل سعي القوى الإقليمية إلى أطر لخفض التصعيد.", category: "politics", region: "الشرق الأوسط", urgency: "medium" }),
    buildFallbackPost({ handle: "khalldahmd", account: "K.A.R", ageMs: 1080000, text: "متابعة وتحليل للتطورات الجيوسياسية والاقتصادية العالمية.", translated: "متابعة وتحليل للتطورات الجيوسياسية والاقتصادية العالمية.", category: "analysis", region: "دولي", urgency: "low" }),
  ];
}

// ── Build intelligence layer from ranked posts ────────────────────────────────
function buildIntelligenceLayer(posts) {
  const top = (filter, n = 5) =>
    posts.filter(filter).sort((a, b) => b.rankScore - a.rankScore).slice(0, n);

  return {
    urgent:     top(p => p.urgency === "high"),
    verified:   top(p => p.verified && p.tier !== "analysis"),
    uae:        top(p => p.category === "uae"),
    economy:    top(p => p.category === "economy"),
    sports:     top(p => p.category === "sports"),
    geopolitics:top(p => ["geopolitics", "conflict", "regional"].includes(p.category)),
    topSignals: posts
      .filter(p => p.impactScore >= 60)
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 8)
      .map(p => ({
        id: p.id,
        account: p.account,
        text: p.translated || p.text,
        impactScore: p.impactScore,
        confidenceScore: p.confidenceScore,
        category: p.category,
        region: p.region,
        urgency: p.urgency,
        explanation: p.explanation,
        localTimeUAE: p.localTimeUAE
      }))
  };
}

// ── Main fetch pipeline ───────────────────────────────────────────────────────
async function fetchLivePosts() {
  const chunks = [];
  const debug = [];

  for (const account of WATCHED_ACCOUNTS) {
    try {
      const posts = await fetchPostsForHandle(account);
      debug.push({ handle: account.handle, fetched: posts.length });
      chunks.push(...posts);
    } catch (err) {
      console.error(`X feed failed for ${account.handle}:`, err.message);
      debug.push({ handle: account.handle, fetched: 0, error: err.message });
    }
  }

  // Deduplicate by id
  const deduped = [];
  const seen = new Set();
  for (const post of chunks) {
    if (!seen.has(post.id)) {
      seen.add(post.id);
      deduped.push(post);
    }
  }

  // Use fallback silently if nothing returned
  const finalPosts = deduped.length > 0 ? deduped : getFallbackPosts();
  const isLive = deduped.length > 0;

  // Sort by rank score (intelligence-based, not just recency)
  finalPosts.sort((a, b) => b.rankScore - a.rankScore);

  const intelligenceLayer = buildIntelligenceLayer(finalPosts);

  return {
    posts: finalPosts.slice(0, 80),
    accounts: WATCHED_ACCOUNTS.map(a => ({ account: a.account, handle: a.handle, tier: a.tier, trustScore: a.trustScore })),
    intelligenceLayer,
    updated: new Date().toISOString(),
    live: isLive,
    debug
  };
}

// ── Cache + handler ───────────────────────────────────────────────────────────
async function getPayload() {
  const now = Date.now();
  if (memoryCache.payload && now - memoryCache.updated < CACHE_TTL_MS) {
    return memoryCache.payload;
  }
  const payload = await fetchLivePosts();
  memoryCache = { updated: now, payload };
  return payload;
}

export default async function handler(req, res) {
  try {
    const payload = await getPayload();
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=15");
    res.status(200).json(payload);
  } catch (err) {
    console.error("x-feed fatal:", err.message);
    const fallback = getFallbackPosts();
    res.status(200).json({
      posts: fallback,
      accounts: WATCHED_ACCOUNTS.map(a => ({ account: a.account, handle: a.handle, tier: a.tier, trustScore: a.trustScore })),
      intelligenceLayer: buildIntelligenceLayer(fallback),
      updated: new Date().toISOString(),
      live: false
    });
  }
}

