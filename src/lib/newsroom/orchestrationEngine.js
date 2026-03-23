const SOURCE_TRUST = {
  Reuters: 0.95,
  AP: 0.95,
  BBC: 0.92,
  "Al Jazeera": 0.9,
  "Sky News": 0.85,
  "Gulf News": 0.82,
  default: 0.68,
};

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function safeSourceTrust(source = "") {
  const sourceText = String(source || "");
  const matched = Object.entries(SOURCE_TRUST).find(([key]) => key !== "default" && sourceText.includes(key));
  return matched ? matched[1] : SOURCE_TRUST.default;
}

function computeRecencyScore(time) {
  const timestamp = new Date(time || 0).getTime();
  if (!Number.isFinite(timestamp)) return 0.2;
  const ageMinutes = Math.max(0, (Date.now() - timestamp) / 60000);
  if (ageMinutes <= 10) return 1;
  if (ageMinutes <= 30) return 0.92;
  if (ageMinutes <= 120) return 0.8;
  if (ageMinutes <= 360) return 0.62;
  if (ageMinutes <= 720) return 0.45;
  return 0.28;
}

function computeRegionalRelevance(story = {}, { language = "ar" } = {}) {
  const text = `${story?.title || ""} ${story?.summary || ""}`.toLowerCase();
  const gulfHits = ["uae", "dubai", "abu dhabi", "saudi", "gulf", "الإمارات", "دبي", "أبوظبي", "السعودية", "الخليج"]
    .filter((token) => text.includes(token)).length;
  const worldHits = ["un", "nato", "oil", "china", "usa", "روسيا", "أوروبا", "الصين", "أمريكا"]
    .filter((token) => text.includes(token)).length;
  const base = gulfHits > 0 ? 0.75 : worldHits > 0 ? 0.58 : 0.44;
  return clamp(language === "ar" ? base + 0.08 : base);
}

function strategicImportance(story = {}) {
  const text = `${story?.title || ""} ${story?.summary || ""}`.toLowerCase();
  const hits = ["war", "attack", "sanctions", "election", "inflation", "market", "حرب", "هجوم", "عقوبات", "انتخابات", "تضخم", "أسواق"]
    .filter((token) => text.includes(token)).length;
  return clamp(0.3 + hits * 0.12);
}

function engagementPrediction(story = {}, userProfile = null) {
  const titleLength = String(story?.title || "").length;
  const conciseBonus = titleLength >= 24 && titleLength <= 88 ? 0.14 : 0.04;
  const preferenceBoost = userProfile?.topCategories?.includes(story?.category) ? 0.12 : 0;
  const urgencyBoost = story?.editorialImportance === "urgent" ? 0.18 : story?.editorialImportance === "important" ? 0.1 : 0.04;
  return clamp(0.34 + conciseBonus + preferenceBoost + urgencyBoost);
}

function noveltyScore(story = {}) {
  const clusterSize = Number(story?.clusterSize || 1);
  if (clusterSize <= 1) return 0.86;
  if (clusterSize <= 2) return 0.72;
  if (clusterSize <= 4) return 0.55;
  return 0.42;
}

function editorialUrgency(story = {}) {
  if (story?.editorialImportance === "urgent") return 1;
  if (story?.editorialImportance === "important") return 0.76;
  if (story?.editorialImportance === "follow_up") return 0.56;
  return 0.35;
}

function buildScore(story, { language = "ar", userProfile = null } = {}) {
  const recency = computeRecencyScore(story?.time || story?.published_at);
  const sourceTrust = safeSourceTrust(story?.source || "");
  const multiSourceConfirmation = clamp((Number(story?.clusterSize || 1) - 1) / 5);
  const regional = computeRegionalRelevance(story, { language });
  const strategic = strategicImportance(story);
  const engagement = engagementPrediction(story, userProfile);
  const novelty = noveltyScore(story);
  const duplicationPenalty = clamp((Number(story?.clusterSize || 1) - 1) * 0.08, 0, 0.45);
  const editorial = editorialUrgency(story);

  const weighted = (recency * 0.18)
    + (sourceTrust * 0.16)
    + (multiSourceConfirmation * 0.13)
    + (regional * 0.1)
    + (strategic * 0.14)
    + (engagement * 0.1)
    + (novelty * 0.08)
    + (editorial * 0.16)
    - (duplicationPenalty * 0.1);

  return {
    finalScore: Number((clamp(weighted, 0, 1) * 100).toFixed(2)),
    breakdown: {
      recencyScore: Number((recency * 100).toFixed(1)),
      sourceTrustScore: Number((sourceTrust * 100).toFixed(1)),
      multiSourceConfirmationScore: Number((multiSourceConfirmation * 100).toFixed(1)),
      regionalRelevanceScore: Number((regional * 100).toFixed(1)),
      strategicImportanceScore: Number((strategic * 100).toFixed(1)),
      engagementPredictionScore: Number((engagement * 100).toFixed(1)),
      noveltyScore: Number((novelty * 100).toFixed(1)),
      duplicationPenalty: Number((duplicationPenalty * 100).toFixed(1)),
      editorialUrgencyScore: Number((editorial * 100).toFixed(1)),
    },
  };
}

function reasonFromBreakdown(story, breakdown, language = "ar") {
  const reasons = [];
  if (breakdown.recencyScore >= 80) reasons.push(language === "ar" ? "تحديث حديث جدًا" : "Very recent update");
  if (breakdown.sourceTrustScore >= 85) reasons.push(language === "ar" ? "مصدر موثوق" : "Trusted source");
  if (breakdown.multiSourceConfirmationScore >= 35) reasons.push(language === "ar" ? "تأكيد متعدد المصادر" : "Multi-source confirmation");
  if (breakdown.strategicImportanceScore >= 65) reasons.push(language === "ar" ? "أثر استراتيجي مرتفع" : "High strategic impact");
  if (story?.editorialVerificationRequired) reasons.push(language === "ar" ? "يحتاج تحققًا إضافيًا" : "Needs verification");
  return reasons.slice(0, 3);
}

export function orchestrateNewsroom(stories = [], options = {}) {
  const language = options?.language || "ar";
  const userProfile = options?.userProfile || null;

  const scored = stories
    .map((story) => {
      const scoredStory = buildScore(story, { language, userProfile });
      return {
        ...story,
        orchestrationScore: scoredStory.finalScore,
        scoreBreakdown: scoredStory.breakdown,
        whyThisMatters: reasonFromBreakdown(story, scoredStory.breakdown, language),
      };
    })
    .sort((a, b) => Number(b.orchestrationScore || 0) - Number(a.orchestrationScore || 0));

  const hero = scored[0] || null;
  const breaking = scored.filter((story) => story.editorialImportance === "urgent" || story.orchestrationScore >= 83).slice(0, 12);
  const homepage = scored.slice(0, 24);
  const secondary = scored.slice(24, 80);

  const decisionLog = scored.slice(0, 20).map((story, index) => ({
    rank: index + 1,
    id: story.id || story.clusterId || story.title,
    title: story.title,
    score: story.orchestrationScore,
    reasons: story.whyThisMatters,
    updatedAt: story.time || story.published_at || new Date().toISOString(),
  }));

  return {
    hero,
    breaking,
    homepage,
    secondary,
    decisionLog,
    metrics: {
      totalStories: stories.length,
      breakingStories: breaking.length,
      averageScore: scored.length > 0
        ? Number((scored.reduce((sum, story) => sum + Number(story.orchestrationScore || 0), 0) / scored.length).toFixed(2))
        : 0,
    },
  };
}
