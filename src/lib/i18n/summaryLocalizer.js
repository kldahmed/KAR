const TRANSLATION_CACHE = new Map();
const TRANSLATION_CACHE_STORAGE_KEY = "kar-summary-localization-cache";
const TRANSLATION_CACHE_LIMIT = 300;

const EN_TO_AR_TERMS = [
  ["breaking", "عاجل"],
  ["live", "مباشر"],
  ["conflict", "صراع"],
  ["tension", "توتر"],
  ["summit", "قمة"],
  ["ceasefire", "هدنة"],
  ["economy", "اقتصاد"],
  ["economic", "اقتصادي"],
  ["markets", "الأسواق"],
  ["market", "السوق"],
  ["oil", "النفط"],
  ["energy", "الطاقة"],
  ["risk", "مخاطر"],
  ["impact", "أثر"],
  ["global", "عالمي"],
  ["regional", "إقليمي"],
  ["politics", "سياسة"],
  ["political", "سياسي"],
  ["military", "عسكري"],
  ["war", "حرب"],
  ["security", "أمن"],
  ["attack", "هجوم"],
  ["strike", "ضربة"],
  ["drone", "طائرة مسيّرة"],
  ["missile", "صاروخ"],
  ["talks", "محادثات"],
  ["agreement", "اتفاق"],
  ["government", "الحكومة"],
  ["president", "الرئيس"],
  ["minister", "الوزير"],
  ["election", "انتخابات"],
  ["trade", "تجارة"],
  ["sanctions", "عقوبات"],
  ["inflation", "تضخم"],
  ["supply", "إمدادات"],
  ["ship", "سفينة"],
  ["shipping", "الشحن"],
  ["aircraft", "طائرة"],
  ["track", "مسار"],
  ["sports", "رياضة"],
  ["football", "كرة القدم"],
  ["transfer", "انتقال"],
  ["source", "المصدر"],
  ["summary", "ملخص"],
  ["confidence", "الموثوقية"],
  ["signals", "مؤشرات مهمة"],
  ["signal", "مؤشر مهم"],
  ["pattern", "اتجاه متكرر"],
  ["region", "المنطقة"],
  ["country", "الدولة"],
  ["related events", "أحداث مرتبطة"],
  ["last update", "آخر تحديث"],
];

const SOURCE_LABELS_AR = {
  bbc: "بي بي سي",
  reuters: "رويترز",
  "google news": "أخبار غوغل",
  google: "غوغل",
  ap: "أسوشيتد برس",
  "associated press": "أسوشيتد برس",
  npr: "إن بي آر",
  "sky news": "سكاي نيوز",
  "al jazeera": "الجزيرة",
  cnbc: "سي إن بي سي",
  "yahoo finance": "ياهو فاينانس",
  "world bank": "البنك الدولي",
  x: "إكس",
  twitter: "إكس",
  news: "الأخبار",
  sports: "رياضة",
  live: "مباشر",
  "live-intake": "التجميع المباشر",
  "live-intake-open-source": "التجميع المباشر من مصادر مفتوحة",
  intelnews: "الأخبار التحليلية",
  "x-feed": "إشارات إكس",
  "global-events": "الأحداث العالمية",
  "global-map-state": "حالة الخريطة العالمية",
  radar: "الرادار",
  "fallback feed": "المصدر الاحتياطي",
  "open source": "مصدر مفتوح",
  system: "النظام",
};

const CATEGORY_LABELS_AR = {
  all: "الكل",
  regional: "إقليمي",
  politics: "سياسة",
  political: "سياسي",
  military: "عسكري",
  economy: "اقتصاد",
  economic: "اقتصادي",
  sports: "رياضة",
  conflict: "صراع",
  diplomacy: "دبلوماسية",
  market: "أسواق",
  energy: "طاقة",
  humanitarian: "إنساني",
  technology: "تقنية",
  environment: "بيئة",
  breaking: "عاجل",
  emerging: "ناشئ",
  air: "جوي",
  aviation: "طيران",
  maritime: "بحري",
  logistics: "إمداد",
  geopolitics: "جيوسياسي",
  uae: "الإمارات",
};

const ENTITY_LABELS_AR = [
  ["middle east", "الشرق الأوسط"],
  ["europe", "أوروبا"],
  ["asia-pacific", "آسيا والمحيط الهادئ"],
  ["asia", "آسيا"],
  ["north america", "أمريكا الشمالية"],
  ["americas", "الأمريكتان"],
  ["global", "عالمي"],
  ["international", "دولي"],
  ["israel", "إسرائيل"],
  ["gaza", "غزة"],
  ["iran", "إيران"],
  ["saudi", "السعودية"],
  ["uae", "الإمارات"],
  ["ukraine", "أوكرانيا"],
  ["russia", "روسيا"],
  ["china", "الصين"],
  ["taiwan", "تايوان"],
  ["united states", "الولايات المتحدة"],
  ["america", "أمريكا"],
  ["red sea", "البحر الأحمر"],
  ["oil", "النفط"],
  ["gas", "الغاز"],
  ["opec", "أوبك"],
];

function guessScript(text) {
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[A-Za-z]/.test(text)) return "en";
  return "unknown";
}

function normalizeText(text) {
  return String(text || "")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[\[\]{}<>]/g, " ")
    .replace(/[|_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureCacheHydrated() {
  if (TRANSLATION_CACHE.size > 0 || typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(TRANSLATION_CACHE_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    parsed.slice(-TRANSLATION_CACHE_LIMIT).forEach(([key, value]) => {
      if (typeof key === "string" && typeof value === "string") {
        TRANSLATION_CACHE.set(key, value);
      }
    });
  } catch {
    // Ignore malformed persisted cache.
  }
}

function persistCache() {
  if (typeof window === "undefined") return;
  try {
    const entries = Array.from(TRANSLATION_CACHE.entries()).slice(-TRANSLATION_CACHE_LIMIT);
    window.sessionStorage.setItem(TRANSLATION_CACHE_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage failures.
  }
}

function writeCacheEntry(key, value) {
  if (TRANSLATION_CACHE.size >= TRANSLATION_CACHE_LIMIT) {
    const oldestKey = TRANSLATION_CACHE.keys().next().value;
    if (oldestKey) {
      TRANSLATION_CACHE.delete(oldestKey);
    }
  }
  TRANSLATION_CACHE.set(key, value);
  persistCache();
}

function replaceKnownTerms(text) {
  let localized = text;

  EN_TO_AR_TERMS.forEach(([from, to]) => {
    localized = localized.replace(new RegExp(`\\b${from}\\b`, "gi"), to);
  });

  ENTITY_LABELS_AR.forEach(([from, to]) => {
    localized = localized.replace(new RegExp(from, "gi"), to);
  });

  return localized;
}

function stripResidualLatin(text) {
  return String(text || "")
    .replace(/[A-Za-z][A-Za-z0-9+&@#'./:-]*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function synthesizeArabicText(originalText, { kind = "summary", category = "", source = "" } = {}) {
  const localizedCategory = localizeCategoryLabel(category, "ar") || "عام";
  const localizedSource = localizeSourceLabel(source, "ar") || "المصدر";
  const body = normalizeText(originalText);
  const hasConflict = /غزة|إسرائيل|إيران|صاروخ|هجوم|ضربة|attack|strike|missile|war|conflict/i.test(body);
  const hasEconomy = /نفط|أسواق|تضخم|اقتصاد|oil|market|economy|inflation/i.test(body);

  if (kind === "title") {
    if (hasConflict) return "تطور أمني قيد المتابعة";
    if (hasEconomy) return "تطور اقتصادي قيد المتابعة";
    if (localizedCategory && localizedCategory !== "عام") return `تطور ${localizedCategory} قيد المتابعة`;
    return "تطور خبري قيد المتابعة";
  }

  if (hasConflict) return `ملخص عربي موجز لخبر أمني من ${localizedSource} حول تطورات قيد المتابعة.`;
  if (hasEconomy) return `ملخص عربي موجز لخبر اقتصادي من ${localizedSource} يتعلق بحركة الأسواق والطاقة.`;
  return `ملخص عربي موجز لخبر من ${localizedSource} ضمن تصنيف ${localizedCategory}.`;
}

export function containsLatinChars(text) {
  return /[A-Za-z]/.test(String(text || ""));
}

export function containsArabicChars(text) {
  return /[\u0600-\u06FF]/.test(String(text || ""));
}

export function localizeSourceLabel(source, language = "ar") {
  const normalized = normalizeText(source).toLowerCase();
  if (!normalized) return language === "ar" ? "مصدر غير محدد" : "Unknown source";
  if (language !== "ar") return source;

  const direct = SOURCE_LABELS_AR[normalized];
  if (direct) return direct;

  for (const [key, value] of Object.entries(SOURCE_LABELS_AR)) {
    if (normalized.includes(key)) return value;
  }

  const replaced = stripResidualLatin(replaceKnownTerms(normalized));
  return containsArabicChars(replaced) ? replaced : "مصدر مفتوح";
}

export function localizeCategoryLabel(category, language = "ar") {
  const normalized = normalizeText(category).toLowerCase();
  if (!normalized) return language === "ar" ? "عام" : "General";
  if (language !== "ar") return category;
  return CATEGORY_LABELS_AR[normalized] || stripResidualLatin(replaceKnownTerms(normalized)) || "عام";
}

export function localizeSummaryText(text, language, options = {}) {
  const normalizedText = normalizeText(text);
  if (!normalizedText) return "";

  ensureCacheHydrated();

  const cacheKey = `${language}:${options.kind || "text"}:${options.category || ""}:${normalizedText}`;
  if (TRANSLATION_CACHE.has(cacheKey)) {
    return TRANSLATION_CACHE.get(cacheKey);
  }

  if (language !== "ar") {
    writeCacheEntry(cacheKey, normalizedText);
    return normalizedText;
  }

  const script = guessScript(normalizedText);
  let localized = normalizedText;

  if (script === "en" || containsLatinChars(normalizedText)) {
    localized = replaceKnownTerms(normalizedText);
    localized = stripResidualLatin(localized);
  }

  if (!containsArabicChars(localized)) {
    localized = synthesizeArabicText(normalizedText, options);
  }

  localized = normalizeText(localized);
  writeCacheEntry(cacheKey, localized);
  return localized;
}

export function localizeDisplayItem(item, language = "ar") {
  if (!item || typeof item !== "object") return item;

  if (language !== "ar") {
    return {
      ...item,
      title: normalizeText(item.title || item.title_en || item.headline || item.label || item.translated || item.text || ""),
      summary: normalizeText(item.summary || item.summary_en || item.description || item.explanation || item.text || ""),
      source: normalizeText(item.source || item.authorName || item.author || ""),
      category: normalizeText(item.category || item.type || item.domain || item.queryDomain || ""),
    };
  }

  const title = localizeSummaryText(
    item.title_ar || item.titleAr || item.headline_ar || item.translatedTitle || item.title || item.headline || item.label || item.translated || item.text || "",
    "ar",
    {
      kind: "title",
      category: item.category || item.type,
      source: item.source || item.authorName || item.author,
    }
  );

  const summary = localizeSummaryText(
    item.summary_ar || item.summaryAr || item.description_ar || item.translatedSummary || item.summary || item.description || item.explanation || item.text || title,
    "ar",
    {
      kind: "summary",
      category: item.category || item.type,
      source: item.source || item.authorName || item.author,
    }
  );

  return {
    ...item,
    title,
    summary,
    description: summary,
    source: localizeSourceLabel(item.source || item.authorName || item.author || "", "ar"),
    sourceLabel: localizeSourceLabel(item.source || item.authorName || item.author || "", "ar"),
    category: localizeCategoryLabel(item.category || item.type || item.domain || item.queryDomain || "", "ar"),
    isArabicReady: containsArabicChars(title) && !containsLatinChars(title) && !containsLatinChars(summary),
  };
}

export function clearSummaryLocalizationCache() {
  TRANSLATION_CACHE.clear();
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(TRANSLATION_CACHE_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
