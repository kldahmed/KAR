const WATCHED_ACCOUNTS = [
  { account: "WAM News", handle: "wamnews_eng", category: "uae", lang: "en", sourceType: "official", verified: true },
  { account: "Sky News Arabia", handle: "skynewsarabia", category: "media", lang: "ar", sourceType: "media", verified: true },
  { account: "UAE Ministry of Foreign Affairs", handle: "mofauae", category: "uae", lang: "en", sourceType: "official", verified: true },
  { account: "Dubai Media Office", handle: "DXBMediaOffice", category: "uae", lang: "en", sourceType: "official", verified: true },
  { account: "Reuters World", handle: "ReutersWorld", category: "world", lang: "en", sourceType: "media", verified: true },
  { account: "Reuters", handle: "Reuters", category: "world", lang: "en", sourceType: "media", verified: true },
  { account: "BBC Breaking News", handle: "BBCBreaking", category: "world", lang: "en", sourceType: "media", verified: true },
  { account: "BBC World", handle: "BBCWorld", category: "world", lang: "en", sourceType: "media", verified: true },
  { account: "AP News", handle: "AP", category: "world", lang: "en", sourceType: "media", verified: true },
  { account: "Al Jazeera English", handle: "AJEnglish", category: "world", lang: "en", sourceType: "media", verified: true },
  { account: "Al Jazeera Arabic", handle: "AJArabic", category: "regional", lang: "ar", sourceType: "media", verified: true },
  { account: "France 24 English", handle: "France24_en", category: "world", lang: "en", sourceType: "media", verified: true },
  { account: "DW News", handle: "dwnews", category: "world", lang: "en", sourceType: "media", verified: true },
  { account: "Euronews", handle: "euronews", category: "world", lang: "en", sourceType: "media", verified: true },
  { account: "Bloomberg", handle: "Bloomberg", category: "economy", lang: "en", sourceType: "media", verified: true },
  { account: "K.A.R", handle: "khalldahmd", category: "analysis", lang: "ar", sourceType: "official", verified: true }
];

const DEFAULT_AVATAR =
  "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";

const CACHE_TTL_MS = 30 * 1000;

let memoryCache = {
  updated: 0,
  payload: null
};

function cleanText(value) {
  return String(value || "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferCategory(text, fallback = "world") {
  const t = cleanText(text);

  if (/نفط|النفط|طاقة|غاز|oil|energy|crude|gas/i.test(t)) return "economy";
  if (/إيران|اسرائيل|إسرائيل|غزة|لبنان|سوريا|العراق|اليمن|أوكرانيا|روسيا|china|taiwan|ukraine|russia/i.test(t)) {
    return "regional";
  }
  if (/رئيس|وزير|خارجية|محادثات|اتفاق|بيان|diplomatic|minister|president|government/i.test(t)) {
    return "politics";
  }

  return fallback;
}

function inferUrgency(text) {
  const t = cleanText(text);

  if (/urgent|breaking|عاجل|هجوم|ضربات|انفجار|مقتل|تحذير/i.test(t)) return "high";
  if (/تصعيد|توتر|deployment|alert|مخاطر|تهديد/i.test(t)) return "medium";
  return "low";
}

async function translateToArabic(text, sourceLang = "en") {
  const raw = cleanText(text);
  if (!raw) return "";
  if (sourceLang === "ar") return raw;

  const url = process.env.TRANSLATION_API_URL;
  const apiKey = process.env.TRANSLATION_API_KEY;

  if (!url) {
    return raw;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({
        text: raw,
        source: sourceLang,
        target: "ar"
      })
    });

    if (!res.ok) throw new Error("translation_failed");
    const data = await res.json();

    return cleanText(
      data.translatedText ||
        data.translation ||
        data.result ||
        raw
    );
  } catch {
    return raw;
  }
}

async function xFetch(url) {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    throw new Error("missing_x_bearer_token");
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`x_api_error:${res.status}:${text}`);
  }

  return res.json();
}

async function fetchPostsForHandle(accountInfo) {
  const query = encodeURIComponent(
    `from:${accountInfo.handle} -is:retweet -is:reply`
  );

  const url =
    `https://api.x.com/2/tweets/search/recent` +
    `?query=${query}` +
    `&max_results=5` +
    `&tweet.fields=created_at,lang,public_metrics,source` +
    `&expansions=author_id` +
    `&user.fields=name,username,profile_image_url,verified`;

  const data = await xFetch(url);

  const users = new Map(
    (data.includes?.users || []).map((u) => [u.id, u])
  );

  const tweets = data.data || [];
  const normalized = [];

  for (const tweet of tweets) {
    const author = users.get(tweet.author_id);

    const translated = await translateToArabic(tweet.text, tweet.lang || accountInfo.lang || "en");

    normalized.push({
      id: `${accountInfo.handle}-${tweet.id}`,
      account: author?.name || accountInfo.account,
      handle: `@${author?.username || accountInfo.handle}`,
      text: cleanText(tweet.text),
      translated,
      time: tweet.created_at,
      url: `https://x.com/${author?.username || accountInfo.handle}/status/${tweet.id}`,
      verified: typeof author?.verified === "boolean" ? author.verified : accountInfo.verified,
      category: inferCategory(tweet.text, accountInfo.category),
      lang: tweet.lang || accountInfo.lang || "en",
      sourceType: accountInfo.sourceType,
      avatar: author?.profile_image_url || DEFAULT_AVATAR,
      urgency: inferUrgency(tweet.text),
      metrics: tweet.public_metrics || {}
    });
  }

  return normalized;
}

async function fetchLivePosts() {
  const chunks = [];
  for (const account of WATCHED_ACCOUNTS) {
    try {
      const posts = await fetchPostsForHandle(account);
      chunks.push(...posts);
    } catch (error) {
      console.error(`X feed failed for ${account.handle}:`, error.message);
    }
  }

  const deduped = [];
  const seen = new Set();

  for (const post of chunks) {
    if (seen.has(post.id)) continue;
    seen.add(post.id);
    deduped.push(post);
  }

  deduped.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return {
    posts: deduped.slice(0, 60),
    accounts: WATCHED_ACCOUNTS,
    updated: new Date().toISOString(),
    live: true
  };
}

async function getPayload() {
  const now = Date.now();

  if (
    memoryCache.payload &&
    now - memoryCache.updated < CACHE_TTL_MS
  ) {
    return memoryCache.payload;
  }

  const payload = await fetchLivePosts();

  memoryCache = {
    updated: now,
    payload
  };

  return payload;
}

export default async function handler(req, res) {
  try {
    const payload = await getPayload();
    res.status(200).json(payload);
  } catch (error) {
    console.error("x-feed fatal:", error.message);

    res.status(200).json({
      posts: [],
      accounts: WATCHED_ACCOUNTS,
      updated: new Date().toISOString(),
      live: false,
      error:
        error.message === "missing_x_bearer_token"
          ? "Missing X_BEARER_TOKEN"
          : "Failed to load live X feed"
    });
  }
}
