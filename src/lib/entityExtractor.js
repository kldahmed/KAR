/**
 * Rules-based entity extractor.
 * Honest NLP via keyword matching — no LLM, no invented data.
 */

const REGION_MAP = [
  { region: "الشرق الأوسط",        keys: ["israel","gaza","palestine","iran","iraq","syria","lebanon","jordan","saudi","uae","emirates","bahrain","kuwait","qatar","oman","yemen","هجوم","إسرائيل","غزة","فلسطين","إيران","العراق","سوريا","لبنان","السعودية","الإمارات","اليمن","الخليج"] },
  { region: "أوروبا",               keys: ["ukraine","russia","poland","france","germany","britain","uk","england","spain","italy","nato","eu","europe","أوروبا","روسيا","أوكرانيا","فرنسا","ألمانيا","بريطانيا","إسبانيا","إيطاليا","الناتو"] },
  { region: "أمريكا الشمالية",      keys: ["usa","united states","america","trump","biden","canada","mexico","washington","أمريكا","الولايات المتحدة","ترامب","بايدن","كندا"] },
  { region: "آسيا والمحيط الهادئ",  keys: ["china","japan","korea","india","taiwan","pacific","beijing","tokyo","الصين","اليابان","كوريا","الهند","تايوان"] },
  { region: "أفريقيا",              keys: ["africa","sudan","ethiopia","nigeria","egypt","libya","morocco","أفريقيا","السودان","إثيوبيا","مصر","ليبيا","المغرب"] },
  { region: "أمريكا اللاتينية",     keys: ["brazil","argentina","colombia","venezuela","latin","البرازيل","الأرجنتين"] },
];

const ORG_PATTERNS = [
  "un","united nations","nato","eu","european union","imf","world bank","opec","fifa","uefa",
  "الأمم المتحدة","حلف الناتو","الاتحاد الأوروبي","أوبك","الفيفا","اليويفا",
  "al qaeda","hamas","hezbollah","isis","daesh","حماس","حزب الله","داعش",
];

const UAE_CLUBS = [
  "شباب الأهلي","العين","الشارقة","الوصل","الجزيرة","الوحدة","النصر","عجمان",
  "بني ياس","خورفكان","كلباء","الظفرة","البطائح","دبا",
  "shabab al ahli","al ain","sharjah","al wasl","al jazira","al wahda","al nasr","ajman",
  "bani yas","khorfakkan","kalba","al dhafra","al bataeh","dibba",
];

const GLOBAL_CLUBS = [
  "real madrid","barcelona","manchester","liverpool","chelsea","arsenal","juventus","psg","bayern",
  "inter milan","ac milan","borussia","atletico","tottenham","newcastle","aston villa","man city","man utd",
];

const POSITIVE_SENTIMENT = [
  "agreement","peace","deal","ceasefire","cooperation","growth","surge","win","victory","success","progress","boost",
  "اتفاق","سلام","هدنة","تعاون","نمو","فوز","انتصار","نجاح","تقدم","ارتفاع",
];

const NEGATIVE_SENTIMENT = [
  "war","attack","crisis","tension","collapse","decline","loss","defeat","conflict","escalation","sanctions","bombing",
  "حرب","هجوم","أزمة","توتر","انهيار","تراجع","هزيمة","صراع","تصعيد","عقوبات","قصف","انفجار",
];

const STRATEGIC_KEYWORDS = [
  "nuclear","missile","military","troops","war","invasion","weapons","sanctions","oil","energy","trade","nato",
  "نووي","صاروخ","عسكري","قوات","حرب","غزو","أسلحة","عقوبات","نفط","طاقة","تجارة",
];

const ECONOMIC_KEYWORDS = [
  "gdp","economy","inflation","rate","dollar","market","stock","oil","trade","investment","bank","debt","recession",
  "اقتصاد","تضخم","سوق","نفط","استثمار","بنك","دين","ركود","ناتج","عملة","أسهم",
];

const SPORTS_KEYWORDS = [
  "goal","match","score","league","transfer","injured","coach","manager","football","soccer","cup","tournament",
  "هدف","مباراة","نتيجة","دوري","انتقال","مصاب","مدرب","كرة","كأس","بطولة","منافسة",
];

const CONFLICT_KEYWORDS = [
  "war","attack","bomb","missile","military","troops","casualties","killed","wounded","strike","airstrike","invasion",
  "حرب","هجوم","قنبلة","صاروخ","عسكري","قوات","ضحايا","قتل","جرح","ضربة","غارة","غزو",
];

function normalize(text) {
  return (text || "").toLowerCase();
}

function extractRegions(text) {
  const t = normalize(text);
  return REGION_MAP.filter(r => r.keys.some(k => t.includes(k))).map(r => r.region);
}

function extractOrganizations(text) {
  const t = normalize(text);
  return ORG_PATTERNS.filter(o => t.includes(normalize(o)));
}

function extractClubs(text) {
  const t = normalize(text);
  const uae = UAE_CLUBS.filter(c => t.includes(normalize(c)));
  const global = GLOBAL_CLUBS.filter(c => t.includes(normalize(c)));
  return { uae, global };
}

function extractKeywords(text) {
  const t = normalize(text);
  const all = [...new Set([...STRATEGIC_KEYWORDS, ...ECONOMIC_KEYWORDS, ...SPORTS_KEYWORDS, ...CONFLICT_KEYWORDS])];
  return all.filter(k => t.includes(normalize(k))).slice(0, 12);
}

function scoreSentiment(text) {
  const t = normalize(text);
  const pos = POSITIVE_SENTIMENT.filter(w => t.includes(normalize(w))).length;
  const neg = NEGATIVE_SENTIMENT.filter(w => t.includes(normalize(w))).length;
  if (neg > pos) return "negative";
  if (pos > neg) return "positive";
  return "neutral";
}

function scoreStrategicImpact(text) {
  const t = normalize(text);
  return Math.min(10, STRATEGIC_KEYWORDS.filter(k => t.includes(normalize(k))).length * 2);
}

function scoreEconomicImpact(text) {
  const t = normalize(text);
  return Math.min(10, ECONOMIC_KEYWORDS.filter(k => t.includes(normalize(k))).length * 2);
}

function scoreSportsImpact(text) {
  const t = normalize(text);
  const clubHits = [...UAE_CLUBS, ...GLOBAL_CLUBS].filter(c => t.includes(normalize(c))).length;
  const keyHits = SPORTS_KEYWORDS.filter(k => t.includes(normalize(k))).length;
  return Math.min(10, clubHits * 2 + keyHits);
}

function deriveSignals(text) {
  const t = normalize(text);
  const signals = [];
  if (CONFLICT_KEYWORDS.filter(k => t.includes(normalize(k))).length >= 2) signals.push("conflict_escalation");
  if (ECONOMIC_KEYWORDS.filter(k => t.includes(normalize(k))).length >= 2) signals.push("economic_pressure");
  if (SPORTS_KEYWORDS.filter(k => t.includes(normalize(k))).length >= 2) signals.push("sports_activity");
  if (t.includes("transfer") || t.includes("انتقال"))   signals.push("transfer_market");
  if (t.includes("sanction") || t.includes("عقوبات"))   signals.push("sanctions_pressure");
  if (t.includes("ceasefire") || t.includes("هدنة"))    signals.push("peace_signal");
  if (t.includes("election") || t.includes("انتخاب"))   signals.push("political_transition");
  if (t.includes("oil") || t.includes("نفط"))           signals.push("energy_signal");
  return signals;
}

/**
 * Main export: extract structured intelligence from an article object.
 * Returns a plain serializable object — safe for JSON/localStorage.
 */
export function extractIntelligence(article) {
  const text = `${article.title || ""} ${article.summary || ""}`;
  const regions = extractRegions(text);
  const orgs = extractOrganizations(text);
  const clubs = extractClubs(text);
  const keywords = extractKeywords(text);
  const sentiment = scoreSentiment(text);
  const strategicImpact = scoreStrategicImpact(text);
  const economicImpact = scoreEconomicImpact(text);
  const sportsImpact = scoreSportsImpact(text);
  const derivedSignals = deriveSignals(text);

  const evidenceCount = regions.length + orgs.length + clubs.uae.length + clubs.global.length + keywords.length;
  const confidenceScore = Math.min(90, 25 + evidenceCount * 4);

  return {
    id: article.id || `intel-${Date.now()}-${Math.random()}`,
    title: article.title || "",
    summary: article.summary || "",
    source: article.source || "",
    category: article.category || "general",
    competition: article.competition || null,
    urgency: article.urgency || "low",
    timestamp: article.time || new Date().toISOString(),
    regions,
    organizations: orgs,
    uaeClubs: clubs.uae,
    globalClubs: clubs.global,
    keywords,
    sentiment,
    strategicImpact,
    economicImpact,
    sportsImpact,
    confidenceScore,
    derivedSignals,
  };
}
