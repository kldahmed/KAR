const ARABIC_STOPWORDS = new Set([
  "من", "في", "على", "الى", "إلى", "عن", "مع", "هذا", "هذه", "ذلك", "تلك", "التي", "الذي", "كما", "قد", "تم", "أو", "و", "ثم",
]);

function normalizeSpaces(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanArabic(value = "") {
  return normalizeSpaces(
    String(value || "")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\s+([،.:؛!؟])/g, "$1")
      .replace(/([،.:؛!؟])(\S)/g, "$1 $2")
      .replace(/\.{2,}/g, "…")
  );
}

function titleCaseEnglish(value = "") {
  return String(value || "")
    .split(" ")
    .map((token) => {
      if (!token) return token;
      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
    })
    .join(" ");
}

function scoreUrgencyByLexicon(text = "") {
  const lowered = String(text || "").toLowerCase();
  const urgentHits = ["عاجل", "هجوم", "انفجار", "تصعيد", "strike", "explosion", "breaking"].filter((token) => lowered.includes(token)).length;
  const importantHits = ["اتفاق", "قرار", "budget", "sanction", "election", "summit", "market"].filter((token) => lowered.includes(token)).length;
  if (urgentHits >= 2) return "urgent";
  if (urgentHits >= 1 || importantHits >= 2) return "important";
  if (importantHits >= 1) return "follow_up";
  return "normal";
}

function inferSensitivity(text = "") {
  const lowered = String(text || "").toLowerCase();
  const security = ["حرب", "هجوم", "عسكري", "صاروخ", "ضربة", "war", "missile", "military"].some((k) => lowered.includes(k));
  const markets = ["نفط", "غاز", "بورصة", "تضخم", "سعر الفائدة", "oil", "inflation", "stocks"].some((k) => lowered.includes(k));
  if (security) return "high";
  if (markets) return "medium";
  return "low";
}

function needsVerification(source = "", text = "") {
  const lowTrustSource = /blog|forum|unknown|rumor|anonymous/i.test(String(source || ""));
  const rumorSignals = /شائعات|غير مؤكد|unconfirmed|reportedly|rumor/i.test(String(text || ""));
  return lowTrustSource || rumorSignals;
}

function polishArabicHeadline(value = "") {
  const clean = cleanArabic(value);
  if (!clean) return "";
  const words = clean.split(" ").filter(Boolean);
  const polishedWords = words.map((word) => {
    if (ARABIC_STOPWORDS.has(word)) return word;
    if (/^[A-Za-z]/.test(word)) return titleCaseEnglish(word);
    return word;
  });
  return polishedWords.join(" ");
}

function polishArabicSummary(value = "", maxSentences = 2) {
  const clean = cleanArabic(value);
  if (!clean) return "";
  const sentences = clean
    .split(/(?<=[.!؟])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, maxSentences);
  const joined = sentences.join(" ");
  if (joined.length <= 220) return joined;
  return `${joined.slice(0, 219).trim()}…`;
}

export function applyArabicEditorialPolish(item, { language = "ar" } = {}) {
  const titleRaw = item?.title || "";
  const summaryRaw = item?.summary || item?.description || "";
  const source = item?.source || "";
  const text = `${titleRaw} ${summaryRaw}`;

  const title = language === "ar" ? polishArabicHeadline(titleRaw) : normalizeSpaces(titleRaw);
  const summary = language === "ar" ? polishArabicSummary(summaryRaw, 2) : normalizeSpaces(summaryRaw);
  const editorialImportance = scoreUrgencyByLexicon(text);
  const sensitivity = inferSensitivity(text);
  const verificationRequired = needsVerification(source, text);

  const editorialNotes = [];
  if (verificationRequired) editorialNotes.push(language === "ar" ? "يتطلب تحققًا إضافيًا" : "Needs additional verification");
  if (sensitivity === "high") editorialNotes.push(language === "ar" ? "حساسية عالية" : "High sensitivity");

  return {
    ...item,
    title,
    summary,
    editorialImportance,
    editorialSensitivity: sensitivity,
    editorialVerificationRequired: verificationRequired,
    editorialNotes,
    isArabicReady: language !== "ar" || title.length > 10,
  };
}

export function polishEditorialBatch(items = [], options = {}) {
  return items.map((item) => applyArabicEditorialPolish(item, options));
}
