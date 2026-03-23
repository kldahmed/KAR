const TITLE_MIN_LENGTH = 16;
const TITLE_MAX_LENGTH = 155;
const SUMMARY_MIN_LENGTH = 40;
const SUMMARY_MAX_LENGTH = 420;

function stripHtml(value = "") {
  return String(value || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function hasGibberish(value = "") {
  const text = String(value || "").trim();
  if (!text) return true;
  if (/^[\W_]+$/.test(text)) return true;
  if (/(.)\1{5,}/.test(text)) return true;
  if (/\?{3,}|!{3,}|\.{4,}/.test(text)) return true;
  return false;
}

function arabicCoverage(value = "") {
  const text = String(value || "");
  const letters = text.match(/[\p{L}]/gu) || [];
  if (!letters.length) return 0;
  const arabicLetters = text.match(/[\u0600-\u06FF]/g) || [];
  return arabicLetters.length / letters.length;
}

function looksIncompleteHeadline(value = "") {
  const text = String(value || "").trim();
  if (!text) return true;
  if (/^(breaking|update|urgent|عاجل|تحديث)\s*[:\-]?\s*$/i.test(text)) return true;
  if (/\b(read more|watch now|click here|المزيد|اضغط هنا)\b/i.test(text)) return true;
  return false;
}

export function evaluateNewsQuality(item, { language = "ar" } = {}) {
  const title = stripHtml(item?.title || "");
  const summary = stripHtml(item?.summary || item?.description || "");
  const reasons = [];

  if (title.length < TITLE_MIN_LENGTH) reasons.push("title_too_short");
  if (title.length > TITLE_MAX_LENGTH) reasons.push("title_too_long");
  if (summary.length < SUMMARY_MIN_LENGTH) reasons.push("summary_too_short");
  if (summary.length > SUMMARY_MAX_LENGTH) reasons.push("summary_too_long");
  if (hasGibberish(title) || hasGibberish(summary)) reasons.push("gibberish_content");
  if (looksIncompleteHeadline(title)) reasons.push("incomplete_headline");

  if (language === "ar") {
    const titleArabicCoverage = arabicCoverage(title);
    const summaryArabicCoverage = arabicCoverage(summary);
    if (titleArabicCoverage > 0 && titleArabicCoverage < 0.25) reasons.push("weak_arabic_headline");
    if (summaryArabicCoverage > 0 && summaryArabicCoverage < 0.18) reasons.push("weak_arabic_summary");
  }

  const score = Math.max(0, 100 - reasons.length * 18 - Math.max(0, TITLE_MIN_LENGTH - title.length));
  return {
    ok: reasons.length === 0,
    reasons,
    score,
    title,
    summary,
  };
}

export function applyQualityGate(items = [], options = {}) {
  const accepted = [];
  const rejected = [];

  items.forEach((item) => {
    const quality = evaluateNewsQuality(item, options);
    const normalizedItem = {
      ...item,
      title: quality.title,
      summary: quality.summary,
      qualityScore: quality.score,
      qualityReasons: quality.reasons,
    };

    if (!quality.ok) {
      rejected.push(normalizedItem);
      return;
    }

    accepted.push(normalizedItem);
  });

  return {
    accepted,
    rejected,
    stats: {
      accepted: accepted.length,
      rejected: rejected.length,
      rejectionRate: items.length > 0 ? Number((rejected.length / items.length).toFixed(4)) : 0,
    },
  };
}
