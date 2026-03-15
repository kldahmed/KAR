module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "ANTHROPIC_API_KEY is missing"
      });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const {
      title = "",
      summary = "",
      source = "",
      time = "",
      category = ""
    } = body;

    if (!String(title).trim()) {
      return res.status(400).json({
        ok: false,
        error: "title is required"
      });
    }

    const cleanTitle = cleanText(title);
    const cleanSummary = cleanText(summary);
    const cleanSource = cleanText(source);
    const cleanTime = cleanText(time);
    const cleanCategory = cleanText(category);

    const heuristic = buildHeuristicAnalysis({
      title: cleanTitle,
      summary: cleanSummary,
      source: cleanSource,
      time: cleanTime,
      category: cleanCategory
    });

    const prompt = `
أنت محلل استخباري استراتيجي محترف متخصص في الشرق الأوسط.
مهمتك تحليل خبر واحد تحليلاً عميقاً ومهنيًا بصيغة JSON فقط.
يجب أن يكون التحليل عملياً ومباشراً ومفيداً لغرفة عمليات إعلامية/استخبارية.

الخبر:
العنوان: ${cleanTitle}
الملخص: ${cleanSummary}
المصدر: ${cleanSource}
الوقت: ${cleanTime}
التصنيف الحالي: ${cleanCategory}

التعليمات:
1) استنتج نوع الخبر الأساسي.
2) استنتج نوع الحدث بدقة.
3) استخرج الأطراف الفاعلة المذكورة أو الضمنية.
4) استخرج المواقع الجغرافية المذكورة أو المرجحة.
5) أعط:
   - risk_score من 0 إلى 100
   - confidence من 0 إلى 100
   - escalation_score من 0 إلى 100
   - regional_war_score من 0 إلى 100
6) حدد نطاق التأثير: local أو regional أو global
7) حدد الحساسية الزمنية: immediate أو short_term أو medium_term
8) اكتب:
   - ai_summary_ar: ملخص عربي محترف وقصير
   - why_important_ar: لماذا الخبر مهم
   - next_scenario_ar: السيناريو المرجح التالي
   - narrative_ar: وصف سردي استخباري قصير
   - operational_recommendation_ar: توصية تشغيلية مختصرة للمراقبة
9) استخرج كلمات مفتاحية مهمة
10) إذا كان الخبر ضعيف القيمة أو غامضًا فاخفض confidence
11) إذا كان الخبر يتحدث عن ضربات، صواريخ، مسيرات، اعتراضات، هرمز، البحر الأحمر، إسرائيل، إيران، لبنان، غزة، سوريا، العراق، اليمن، فارفع حساسية التحليل بشكل مناسب
12) أعد JSON فقط، بدون Markdown وبدون أي نص خارج JSON

أعد النتيجة بهذا الشكل فقط:
{
  "type": "military | political | economic | diplomatic | security | humanitarian | mixed",
  "event_type": "airstrike | missile | drone | interception | clashes | military_movement | statement | sanctions | diplomacy | maritime | explosion | humanitarian | cyber | general",
  "category": "military | politics | economy | regional | all",
  "actors": ["..."],
  "locations": ["..."],
  "risk_score": 0,
  "confidence": 0,
  "escalation_score": 0,
  "regional_war_score": 0,
  "impact": "local | regional | global",
  "time_sensitivity": "immediate | short_term | medium_term",
  "ai_summary_ar": "...",
  "why_important_ar": "...",
  "next_scenario_ar": "...",
  "narrative_ar": "...",
  "operational_recommendation_ar": "...",
  "keywords": ["...", "...", "..."]
}
`.trim();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 1200,
        temperature: 0.15,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    const raw = await anthropicRes.text();
    let parsed = null;

    try {
      parsed = JSON.parse(raw);
    } catch (_) {}

    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({
        ok: false,
        error: parsed?.error?.message || "Anthropic request failed",
        fallback: heuristic
      });
    }

    const textBlock = parsed?.content?.find((b) => b.type === "text");
    const text = textBlock?.text?.trim() || "";

    let json = null;

    try {
      json = JSON.parse(text);
    } catch (_) {
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          json = JSON.parse(text.slice(firstBrace, lastBrace + 1));
        } catch (_) {}
      }
    }

    if (!json || typeof json !== "object") {
      return res.status(200).json({
        ok: true,
        analysis: heuristic,
        source: "heuristic_fallback"
      });
    }

    const aiAnalysis = normalizeAnalysis(json);
    const merged = mergeAnalysis(aiAnalysis, heuristic);

    return res.status(200).json({
      ok: true,
      analysis: merged,
      source: "claude_plus_heuristics"
    });
  } catch (error) {
    return res.status(200).json({
      ok: true,
      analysis: buildHeuristicAnalysis({
        title: req?.body?.title || "",
        summary: req?.body?.summary || "",
        source: req?.body?.source || "",
        time: req?.body?.time || "",
        category: req?.body?.category || ""
      }),
      source: "heuristic_fallback",
      warning:
        error?.name === "AbortError"
          ? "AI request timeout"
          : (error?.message || "Internal server fallback")
    });
  }
};

function cleanText(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function safeText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  return v || fallback;
}

function safeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .slice(0, 12);
}

function safeScore(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function safeEnum(value, allowed = [], fallback = "") {
  const v = typeof value === "string" ? value.trim() : "";
  return allowed.includes(v) ? v : fallback;
}

function normalizeAnalysis(json = {}) {
  return {
    type: safeEnum(
      json.type,
      ["military", "political", "economic", "diplomatic", "security", "humanitarian", "mixed"],
      "mixed"
    ),
    event_type: safeEnum(
      json.event_type,
      [
        "airstrike",
        "missile",
        "drone",
        "interception",
        "clashes",
        "military_movement",
        "statement",
        "sanctions",
        "diplomacy",
        "maritime",
        "explosion",
        "humanitarian",
        "cyber",
        "general"
      ],
      "general"
    ),
    category: safeEnum(
      json.category,
      ["military", "politics", "economy", "regional", "all"],
      "all"
    ),
    actors: safeStringArray(json.actors),
    locations: safeStringArray(json.locations),
    risk_score: safeScore(json.risk_score, 0),
    confidence: safeScore(json.confidence, 0),
    escalation_score: safeScore(json.escalation_score, 0),
    regional_war_score: safeScore(json.regional_war_score, 0),
    impact: safeEnum(json.impact, ["local", "regional", "global"], "regional"),
    time_sensitivity: safeEnum(
      json.time_sensitivity,
      ["immediate", "short_term", "medium_term"],
      "short_term"
    ),
    ai_summary_ar: safeText(json.ai_summary_ar, "لا يوجد ملخص تحليلي."),
    why_important_ar: safeText(json.why_important_ar, "لا توجد أهمية محددة."),
    next_scenario_ar: safeText(json.next_scenario_ar, "لا يوجد سيناريو مرجح واضح."),
    narrative_ar: safeText(json.narrative_ar, "لا توجد رواية تحليلية واضحة."),
    operational_recommendation_ar: safeText(
      json.operational_recommendation_ar,
      "استمرار المراقبة وجمع التأكيدات من مصادر إضافية."
    ),
    keywords: safeStringArray(json.keywords).slice(0, 8)
  };
}

function mergeAnalysis(ai, heuristic) {
  return {
    type: ai.type || heuristic.type,
    event_type: ai.event_type || heuristic.event_type,
    category: ai.category || heuristic.category,
    actors: ai.actors.length ? ai.actors : heuristic.actors,
    locations: ai.locations.length ? ai.locations : heuristic.locations,
    risk_score: Math.round((ai.risk_score + heuristic.risk_score) / 2),
    confidence: Math.round((ai.confidence + heuristic.confidence) / 2),
    escalation_score: Math.round((ai.escalation_score + heuristic.escalation_score) / 2),
    regional_war_score: Math.round((ai.regional_war_score + heuristic.regional_war_score) / 2),
    impact: ai.impact || heuristic.impact,
    time_sensitivity: ai.time_sensitivity || heuristic.time_sensitivity,
    ai_summary_ar: ai.ai_summary_ar || heuristic.ai_summary_ar,
    why_important_ar: ai.why_important_ar || heuristic.why_important_ar,
    next_scenario_ar: ai.next_scenario_ar || heuristic.next_scenario_ar,
    narrative_ar: ai.narrative_ar || heuristic.narrative_ar,
    operational_recommendation_ar:
      ai.operational_recommendation_ar || heuristic.operational_recommendation_ar,
    keywords: ai.keywords.length ? ai.keywords : heuristic.keywords
  };
}

function buildHeuristicAnalysis(input = {}) {
  const title = cleanText(input.title);
  const summary = cleanText(input.summary);
  const source = cleanText(input.source);
  const category = cleanText(input.category);
  const text = `${title} ${summary}`.toLowerCase();

  const actors = extractActors(text);
  const locations = extractLocations(text);

  const event_type = detectEventType(text);
  const type = detectType(text);
  const normalizedCategory = detectCategory(text, category);

  let risk_score = 22;
  let escalation_score = 18;
  let regional_war_score = 14;
  let confidence = 58;
  let impact = "local";
  let time_sensitivity = "short_term";

  if (/هجوم|attack|strike|raid|قصف|غارة/.test(text)) {
    risk_score += 20;
    escalation_score += 18;
    regional_war_score += 12;
    time_sensitivity = "immediate";
  }

  if (/صاروخ|صواريخ|missile|rocket/.test(text)) {
    risk_score += 18;
    escalation_score += 14;
    regional_war_score += 14;
    time_sensitivity = "immediate";
  }

  if (/مسيرة|طائرة مسيرة|drone|uav/.test(text)) {
    risk_score += 14;
    escalation_score += 12;
    regional_war_score += 10;
    time_sensitivity = "immediate";
  }

  if (/اعتراض|intercept|دفاع جوي|air defense/.test(text)) {
    risk_score += 10;
    escalation_score += 8;
  }

  if (/إيران|ايران|iran/.test(text) && /إسرائيل|اسرائيل|israel/.test(text)) {
    risk_score += 18;
    escalation_score += 20;
    regional_war_score += 24;
    impact = "regional";
  }

  if (/لبنان|lebanon|غزة|gaza|سوريا|syria|العراق|iraq|اليمن|yemen/.test(text)) {
    regional_war_score += 10;
    impact = "regional";
  }

  if (/مضيق هرمز|هرمز|strait of hormuz|البحر الأحمر|red sea|shipping|maritime|ملاحة|ناقلات|شحن/.test(text)) {
    risk_score += 14;
    escalation_score += 12;
    regional_war_score += 18;
    impact = "global";
  }

  if (/نفط|oil|gas|طاقة|energy|أسواق|market/.test(text)) {
    risk_score += 8;
    impact = impact === "global" ? "global" : "regional";
  }

  if (/بيان|statement|تصريحات|warn|warning|تحذير/.test(text)) {
    confidence += 4;
  }

  if (/reports|unconfirmed|alleged|claims|يُقال|أنباء|غير مؤكد/.test(text)) {
    confidence -= 12;
  }

  if (source) {
    confidence += sourceWeight(source);
  }

  risk_score = clamp(risk_score);
  escalation_score = clamp(escalation_score);
  regional_war_score = clamp(regional_war_score);
  confidence = clamp(confidence);

  const ai_summary_ar = buildArabicSummary(title, summary, locations, event_type);
  const why_important_ar = buildImportanceText(event_type, impact, regional_war_score);
  const next_scenario_ar = buildScenarioText(event_type, escalation_score, regional_war_score);
  const narrative_ar = buildNarrativeText(type, event_type, actors, locations);
  const operational_recommendation_ar = buildRecommendationText(
    confidence,
    escalation_score,
    regional_war_score
  );

  return {
    type,
    event_type,
    category: normalizedCategory,
    actors,
    locations,
    risk_score,
    confidence,
    escalation_score,
    regional_war_score,
    impact,
    time_sensitivity,
    ai_summary_ar,
    why_important_ar,
    next_scenario_ar,
    narrative_ar,
    operational_recommendation_ar,
    keywords: extractKeywords(text)
  };
}

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function sourceWeight(source = "") {
  const s = String(source || "").toLowerCase();

  if (/reuters|رويترز/.test(s)) return 16;
  if (/bbc|بي بي سي/.test(s)) return 14;
  if (/france ?24|فرنس ?24/.test(s)) return 13;
  if (/aljazeera|الجزيرة/.test(s)) return 13;
  if (/alarabiya|العربية/.test(s)) return 13;
  if (/sky ?news|سكاي نيوز/.test(s)) return 12;
  if (/cnn/.test(s)) return 10;
  if (/asharq|الشرق/.test(s)) return 10;
  if (/osinttechnical/.test(s)) return 15;
  if (/auroraintel/.test(s)) return 14;
  if (/intelsky/.test(s)) return 14;
  if (/sentdefender/.test(s)) return 13;

  return 8;
}

function detectType(text = "") {
  if (/قصف|غارة|صاروخ|مسيرة|هجوم|اشتباكات|اعتراض|drone|missile|attack|raid|intercept/.test(text)) {
    return "military";
  }
  if (/عقوبات|sanctions|نفط|gas|oil|energy|market|اقتصاد|أسواق|طاقة/.test(text)) {
    return "economic";
  }
  if (/دبلوماسية|مفاوضات|وساطة|diplomatic|talks|negotiation/.test(text)) {
    return "diplomatic";
  }
  if (/حكومة|وزير|رئيس|برلمان|statement|تصريحات|politic|سياسة/.test(text)) {
    return "political";
  }
  if (/لاجئين|مساعدات|ضحايا|جرحى|humanitarian/.test(text)) {
    return "humanitarian";
  }
  if (/أمن|security|اعتقال|تهديد أمني|cyber|اختراق/.test(text)) {
    return "security";
  }
  return "mixed";
}

function detectEventType(text = "") {
  if (/اعتراض|intercept|air defense|دفاع جوي/.test(text)) return "interception";
  if (/مسيرة|طائرة مسيرة|drone|uav/.test(text)) return "drone";
  if (/صاروخ|صواريخ|missile|rocket/.test(text)) return "missile";
  if (/قصف|غارة|airstrike|raid|strike/.test(text)) return "airstrike";
  if (/اشتباكات|clashes|firefight/.test(text)) return "clashes";
  if (/تحرك|deployment|mobilization|تعزيزات/.test(text)) return "military_movement";
  if (/بيان|statement|تصريحات/.test(text)) return "statement";
  if (/عقوبات|sanctions/.test(text)) return "sanctions";
  if (/دبلوماسية|مفاوضات|وساطة|diplomacy|talks/.test(text)) return "diplomacy";
  if (/ملاحة|شحن|سفن|ناقلات|shipping|maritime|naval/.test(text)) return "maritime";
  if (/انفجار|explosion|blast/.test(text)) return "explosion";
  if (/إغاثة|مساعدات|نزوح|humanitarian|casualties/.test(text)) return "humanitarian";
  if (/اختراق|cyber|hack/.test(text)) return "cyber";
  return "general";
}

function detectCategory(text = "", currentCategory = "") {
  if (["military", "politics", "economy", "regional", "all"].includes(currentCategory)) {
    return currentCategory;
  }
  if (/نفط|oil|energy|gas|market|اقتصاد|أسواق|طاقة/.test(text)) return "economy";
  if (/حكومة|وزير|رئيس|مفاوضات|بيان|politic|diplomatic|سياسة/.test(text)) return "politics";
  if (/قصف|غارة|صاروخ|مسيرة|هجوم|اعتراض|drone|missile|attack|raid|intercept/.test(text)) {
    return "military";
  }
  if (/الشرق الأوسط|middle east|إيران|إسرائيل|لبنان|غزة|سوريا|العراق|اليمن/.test(text)) {
    return "regional";
  }
  return "all";
}

function extractActors(text = "") {
  const rules = [
    { label: "إيران", re: /إيران|ايران|iran/i },
    { label: "إسرائيل", re: /إسرائيل|اسرائيل|israel/i },
    { label: "الولايات المتحدة", re: /الولايات المتحدة|أمريكا|امريكا|usa|u\.s\.|united states/i },
    { label: "بريطانيا", re: /بريطانيا|المملكة المتحدة|uk|britain/i },
    { label: "حزب الله", re: /حزب الله|hezbollah/i },
    { label: "الحوثيون", re: /الحوثي|الحوثيون|houthis/i },
    { label: "حماس", re: /حماس|hamas/i },
    { label: "الجيش الإسرائيلي", re: /الجيش الإسرائيلي|idf|israeli army/i },
    { label: "الحرس الثوري", re: /الحرس الثوري|irgc/i },
    { label: "القوات الأمريكية", re: /القوات الأمريكية|us forces|american forces/i },
    { label: "سوريا", re: /سوريا|syria/i },
    { label: "العراق", re: /العراق|iraq/i },
    { label: "لبنان", re: /لبنان|lebanon/i },
    { label: "اليمن", re: /اليمن|yemen/i }
  ];

  const result = [];
  for (const rule of rules) {
    if (rule.re.test(text)) result.push(rule.label);
  }
  return [...new Set(result)].slice(0, 8);
}

function extractLocations(text = "") {
  const rules = [
    { label: "إيران", re: /إيران|ايران|iran/i },
    { label: "إسرائيل", re: /إسرائيل|اسرائيل|israel/i },
    { label: "غزة", re: /غزة|gaza/i },
    { label: "لبنان", re: /لبنان|lebanon/i },
    { label: "سوريا", re: /سوريا|syria/i },
    { label: "العراق", re: /العراق|iraq/i },
    { label: "اليمن", re: /اليمن|yemen/i },
    { label: "البحر الأحمر", re: /البحر الأحمر|red sea/i },
    { label: "مضيق هرمز", re: /مضيق هرمز|هرمز|strait of hormuz/i },
    { label: "الخليج", re: /الخليج|gulf/i },
    { label: "جنوب لبنان", re: /جنوب لبنان|southern lebanon/i },
    { label: "دمشق", re: /دمشق|damascus/i },
    { label: "بيروت", re: /بيروت|beirut/i },
    { label: "بغداد", re: /بغداد|baghdad/i },
    { label: "طهران", re: /طهران|tehran/i },
    { label: "تل أبيب", re: /تل أبيب|تل ابيب|tel aviv/i }
  ];

  const result = [];
  for (const rule of rules) {
    if (rule.re.test(text)) result.push(rule.label);
  }
  return [...new Set(result)].slice(0, 8);
}

function extractKeywords(text = "") {
  const pool = [
    "غارات",
    "قصف",
    "صاروخ",
    "صواريخ",
    "مسيرة",
    "اعتراض",
    "هجوم",
    "اشتباكات",
    "ملاحة",
    "هرمز",
    "البحر الأحمر",
    "إيران",
    "إسرائيل",
    "غزة",
    "لبنان",
    "سوريا",
    "العراق",
    "اليمن",
    "نفط",
    "طاقة",
    "عقوبات",
    "دبلوماسية",
    "تحرك عسكري"
  ];

  return pool.filter((word) => text.includes(word.toLowerCase())).slice(0, 8);
}

function buildArabicSummary(title, summary, locations, eventType) {
  const place = locations[0] ? ` في ${locations[0]}` : "";
  const map = {
    airstrike: "رصد ضربات جوية",
    missile: "رصد نشاط صاروخي",
    drone: "رصد نشاط مرتبط بالمسيّرات",
    interception: "رصد عمليات اعتراض ودفاع جوي",
    clashes: "رصد اشتباكات ميدانية",
    military_movement: "رصد تحركات عسكرية",
    statement: "رصد تصريح أو موقف رسمي",
    sanctions: "رصد تطور مرتبط بالعقوبات",
    diplomacy: "رصد تحرك دبلوماسي",
    maritime: "رصد تطور بحري أو ملاحي",
    explosion: "رصد انفجار أو تفجير",
    humanitarian: "رصد تطور إنساني",
    cyber: "رصد نشاط سيبراني",
    general: "رصد تطور إخباري مهم"
  };

  const prefix = map[eventType] || "رصد تطور مهم";
  const base = summary || title;

  return `${prefix}${place}. ${base}`.trim();
}

function buildImportanceText(eventType, impact, regionalWarScore) {
  if (impact === "global") {
    return "الخبر مهم لأنه قد يؤثر في الملاحة أو الطاقة أو الأسواق الدولية ويتجاوز الأثر المحلي.";
  }
  if (regionalWarScore >= 70) {
    return "الخبر مهم لأنه يرفع احتمالات اتساع التصعيد وتحوله إلى مواجهة إقليمية أوسع.";
  }
  if (["airstrike", "missile", "drone", "interception", "clashes"].includes(eventType)) {
    return "الخبر مهم لأنه يرتبط مباشرة بالمشهد العسكري وقد يقود إلى ردود متبادلة سريعة.";
  }
  if (eventType === "maritime") {
    return "الخبر مهم لأنه يمس مسارات الملاحة والتجارة وقد ينعكس سريعاً على المشهد الإقليمي.";
  }
  return "الخبر مهم لأنه يضيف مؤشراً جديداً إلى مسار التصعيد أو التهدئة في المنطقة.";
}

function buildScenarioText(eventType, escalationScore, regionalWarScore) {
  if (regionalWarScore >= 75) {
    return "السيناريو المرجح هو استمرار التصعيد المتدرج مع احتمال انتقاله إلى جبهة إضافية أو رد إقليمي أوسع.";
  }
  if (escalationScore >= 70) {
    return "السيناريو المرجح هو رد محدود أو خطوة مقابلة خلال فترة قصيرة مع رفع الجاهزية العسكرية.";
  }
  if (eventType === "statement" || eventType === "diplomacy") {
    return "السيناريو المرجح هو متابعة المسار السياسي مع بقاء احتمالات التصعيد الميداني تحت المراقبة.";
  }
  return "السيناريو المرجح هو استمرار التوتر مع الحاجة إلى تأكيدات إضافية قبل تقدير أي تحول كبير.";
}

function buildNarrativeText(type, eventType, actors, locations) {
  const actorText = actors.length ? actors.slice(0, 2).join(" / ") : "أطراف غير محددة";
  const locationText = locations.length ? locations[0] : "منطقة غير محددة";

  return `الحدث يحمل طابعًا ${type} ويُفهم ضمن سياق ${eventType} مع ارتباط مباشر بـ ${actorText} في/حول ${locationText}.`;
}

function buildRecommendationText(confidence, escalationScore, regionalWarScore) {
  if (confidence < 50) {
    return "يوصى بعدم رفع مستوى الإنذار قبل الحصول على تأكيد من مصادر إضافية موثوقة.";
  }
  if (regionalWarScore >= 75) {
    return "يوصى بالمراقبة الفورية للجبهات المرتبطة وربط الخبر بتطورات الملاحة والطاقة والردود العسكرية.";
  }
  if (escalationScore >= 65) {
    return "يوصى بمتابعة الردود الرسمية والعسكرية خلال الساعات القليلة القادمة.";
  }
  return "يوصى باستمرار المراقبة وتجميع الإشارات المرتبطة قبل ترقية مستوى الحدث.";
}
