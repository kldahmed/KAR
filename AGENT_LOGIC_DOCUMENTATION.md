# نظام الوكيل الذكي KAR — دليل الهندسة الشامل

## 📋 نظرة عامة

الوكيل الذكي في KAR هو نظام معقد مكون من **6 وكلاء متخصصين** يعملون معًا لتحليل البيانات وتوليد التوقعات والتعلم من التغذية الراجعة.

---

## 🔄 سير العمل الكلي

```
المصادر      جمع البيانات    التخزين       التحليل      التنبؤ      التقييم
  ↓             ↓              ↓           ↓             ↓           ↓
[أخبار] → [ingestionAgent] → [memoryAgent] → [patternAgent] → [forecastAgent] → [feedbackAgent]
[X Feed]                         ↓                               ↓
[رياضة]                      (LocalStorage)                   [scoringAgent]
[أسواق]         ↑
[إشارات]     [Server Sync]
[إقليمي]     (_agent-store.js)
```

---

## 1️⃣ جمع البيانات - Ingestion Agent

**الملف**: `src/lib/agent/ingestionAgent.js`

### المصادر المدعومة (**6 مصادر**)

```javascript
// sourceType values:
"news"       // أخبار عامة (الأخبار, وكالات)
"xsignal"    // إشارات من منصة X (تويتر سابقًا)
"sports"     // أخبار رياضية (كرة قدم, انتقالات)
"standings"  // ترتيبات دوري (جداول الفرق)
"market"     // بيانات اقتصادية (نفط, أسهم, تضخم)
"regional"   // أحداث إقليمية (الشرق الأوسط, توترات)
```

### خطوات معالجة البيانات

```javascript
/**
 * المرحلة 1: استخراج البيانات الخام + التصنيف التلقائي
 */

// 1. تصنيف المقالة إلى فئة (category)
// Rules:
conflict  ← "war", "attack", "missile", "military", "قوات", "حرب"
politics  ← "election", "president", "minister", "sanctions", "انتخاب"
economy   ← "inflation", "market", "oil", "bank", "stock", "تضخم"
sports    ← "goal", "match", "football", "transfer", "كرة", "انتقال"
energy    ← "opec", "oil", "gas", "barrel", "نفط", "طاقة"
regional  ← "middle east", "gaza", "iran", "الشرق الأوسط", "غزة"

// 2. تحديد المنطقة الجغرافية (region) - من 7 مناطق
const regions = ["UAE", "Middle East", "Europe", "Americas", "Asia", "Africa", "Global"];

// 3. استخراج الكيانات (entities) - 40+ كيان محدد مسبقًا
const KNOWN_ENTITIES = [
  "Trump", "Putin", "Netanyahu", "Xi Jinping", // زعماء سياسيون
  "NATO", "OPEC", "UN", "IMF", // منظمات دولية
  "Real Madrid", "Barcelona", "Al Ain", // أندية رياضية
  // ... 30+ كيان آخر
];

// 4. استخراج الكلمات المفتاحية (keywords) - 35+ كلمة إشارة
const SIGNAL_WORDS = [
  "nuclear", "missile", "sanctions", "war", "ceasefire",
  "inflation", "recession", "strike", "election",
  "نووي", "صاروخ", "عقوبات", "حرب", "تضخم" // + نسخة عربية
];

// 5. حساب الأولوية (urgency)
function computeUrgency(text) {
  if (text includes ["breaking", "urgent", "war", "attack", "عاجل", "حرب"])
    return "high";
  if (text includes ["crisis", "sanction", "election"])
    return "medium";
  return "low";
}

// 6. حساب الصلة (relevance)
relevanceScore = Math.min(100,
  entities.length × 8 +        // +8 لكل كيان (max 40)
  keywords.length × 5 +        // +5 لكل كلمة (max 30)
  (category !== "general" ? 20 : 5) +  // تصنيف محدد: +20
  urgencyScore                 // high=10, medium=5, low=0
);
```

### معادلة الثقة الأولية

```javascript
confidence = Math.min(90,
  20 +                    // قاعدة أساسية
  entities.length × 5 +   // +5 لكل كيان محدد (max 40)
  keywords.length × 3 +   // +3 لكل كلمة إشارة (max 30)
  regions.length × 5      // +5 لكل منطقة جغرافية (max 35)
);
// **النطاق النهائي: 20-90**
```

### البيانات المخزنة لكل عنصر (AgentItem)

```javascript
{
  id: string,                    // معرف فريد
  sourceType: string,            // أحد المصادر الـ 6
  title: string,                 // العنوان الأصلي
  text: string,                  // الملخص أو النص الكامل
  summary: string,               // ملخص 120 حرف
  category: string,              // من 6 فئات
  region: string[],              // قد تكون عدة مناطق
  entities: string[],            // كيانات محددة [Trump, NATO, ...]
  keywords: string[],            // إشارات مستخرجة [war, sanctions, ...]
  urgency: "high"|"medium"|"low",
  relevanceScore: number,        // 0-100
  confidence: number,            // 20-90
  eventType: string,             // "kinetic_event"|"economic_shock"|"political_shift"|...
  impactVector: string,          // "immediate_operational"|"market_and_policy"|...
  timestamp: string,             // Dubai time (UTC+4)
  source: string,                // اسم المصدر الأساسي
}
```

---

## 2️⃣ الذاكرة والتخزين - Memory Agent

**الملف**: `src/lib/agent/memoryAgent.js`

### البنية الداخلية

```javascript
// التخزين المحلي (browser localStorage)
const AGENT_STORE_KEY = "kar_agent_items_v1";
const AGENT_MEMORY_KEY = "kar_agent_memory_v1";
const MAX_ITEMS = 1000;  // دوري (حلقي) - حفظ آخر 1000 عنصر

// هيكل الذاكرة الكامل
{
  // 1. معدّل البيانات
  items: AgentItem[],           // آخر 1000 عنصر مخزن
  
  // 2. خريطة الكيانات (Entity Frequency Map)
  trackedEntities: {
    "Trump": 47,                // ظهر 47 مرة
    "NATO": 23,
    "Gaza": 89,
    // ...
  },
  
  // 3. خريطة المصادر (Source Diversity)
  sourceMap: {
    "CNN": 120,                 // من CNN نحصل على 120 عنصر
    "Al Jazeera": 95,
    "X Feed": 200,
    // ...
  },
  
  // 4. عد الإشارات (Signal Frequency)
  signalCounts: {
    "war": 34,                  // كلمة "حرب" ظهرت 34 مرة
    "missile": 28,
    "sanctions": 41,
    // ...
  },
  
  // 5. سجل التنبؤات (Forecast History)
  forecastHistory: [{
    id: "forecast_123",
    category: "conflict",
    probability: 75,
    confidence: 68,
    timestamp: "2026-03-22T10:15:00+04:00",
    outcome: null  // or "success"/"failure"
  }],
  
  // 6. الإحصائيات
  stats: {
    lastFeedAt: string,         // آخر تحديث
    totalIngested: number,      // عدد العناصر المدخلة كليًا (مدى الحياة)
  }
}
```

### معادلات الذاكرة

```javascript
// حساب عمق الذاكرة (Memory Depth)
const memoryDepth = {
  totalMemoryItems: items.length,                           // ≤ 1000
  trackedEntities: Object.keys(trackedEntities).length,    // ≈ 40-80
  activePatterns: count(signalCounts where count ≥ 3),     // ≈ 20-40
  linkedEvents: count(pairs sharing ≥2 entities),          // ≈ 50-150
  repeatedSignals: count(signalCounts where count > 1),    // ≈ 30-60
  sourceDiversity: Object.keys(sourceMap).length,          // ≈ 6-15
  
  forecastResolved: count(forecasts with outcome),          // ≈ 10-50
  forecastAccuracy: (successes / resolved) × 100,          // النسبة المئوية
  
  topEntities: [...top 8 entities by frequency],           // الكيانات الأكثر ظهورًا
  topSources: [...top 6 sources by item count],            // المصادر الأكثر تغذية
  topSignals: [...top 8 signals by frequency],             // الإشارات الأكثر تكرارًا
};
```

---

## 3️⃣ اكتشاف الأنماط - Pattern Agent

**الملف**: `src/lib/agent/patternAgent.js`

### الأطر الزمنية

```javascript
const RECENT_WINDOW_MS = 24 * 3600 * 1000;   // آخر 24 ساعة
const OLDER_WINDOW_MS = 72 * 3600 * 1000;    // 24-72 ساعة
```

### 6 أنواع من اكتشاف الأنماط

#### 1️⃣ اتجاهات الإشارات (Signal Trends)

```javascript
function detectSignalTrends(recent, older) {
  // استخراج كل الكلمات المفتاحية من آخر 24 ساعة و72 ساعة
  // ثم حساب النسبة:
  
  const recentFreq = count("war" in recent items);  // 6 مرات
  const olderFreq = count("war" in older items);    // 2 مرات
  
  const ratio = recentFreq / olderFreq = 6/2 = 3.0
  
  // تصنيف الاتجاه:
  if (ratio >= 1.5) → "rising"      // ✅ صاعد
  if (ratio <= 0.5) → "falling"      // ❌ هابط
  else → "stable"                    // ➡️ مستقر
  
  // النتيجة:
  return {
    rising: [  // الإشارات الصاعدة
      { key: "war", recentCount: 6, olderCount: 2, direction: "rising" },
      { key: "missile", recentCount: 5, olderCount: 1, direction: "rising" },
    ],
    falling: [ // الإشارات الهابطة
      { key: "ceasefire", recentCount: 1, olderCount: 4, direction: "falling" },
    ],
    stable: 15  // عدد الإشارات المستقرة
  }
}
```

#### 2️⃣ ضغط منطقة جغرافية (Regional Pressure)

```javascript
function detectRegionalPressure(recent) {
  // عد ظهور كل منطقة
  const regionCounts = {
    "Middle East": 12,
    "Gaza": 18,
    "Europe": 5
  };
  
  // تصنيف الضغط:
  const pressure = 
    count >= 5 ? "high"     // 🔴 ضغط مرتفع
    count >= 3 ? "medium"   // 🟡 ضغط معتدل
    : "low";                // 🟢 ضغط منخفض
  
  return [{
    region: "Gaza",
    count: 18,
    pressure: "high",
    label: "ضغط مرتفع"
  }];
}
```

#### 3️⃣ زخم الرياضة (Sports Momentum)

```javascript
function detectSportsMomentum(recent, older) {
  const rSports = count(recent items with category="sports");   // 8 أخبار
  const oSports = count(older items with category="sports");    // 4 أخبار
  
  const momentum = 
    rSports > oSports × 1.3 ? "rising"
    rSports < oSports × 0.7 ? "falling"
    : "stable";
  
  // حرارة سوق الانتقالات
  const transferHeat = count(items with "transfer" keyword);    // 3 أخبار
  const transferLabel = 
    transferHeat >= 3 ? "سوق انتقالات ساخن"
    : "سوق انتقالات عادي";
  
  return {
    momentum: "rising",
    momentumLabel: "تصاعد نشاط رياضي",
    transferHeat: 3,
    transferHeatLabel: "سوق انتقالات ساخن",
    titleRacePressure: "Real Madrid (7 إشارات)",
    sportsItemsRecent: 8
  };
}
```

#### 4️⃣ التصعيد الجيوسياسي (Geopolitical Escalation)

```javascript
const escalationKeywords = [
  "war", "attack", "missile", "military", "troops", "bomb", "airstrike",
  "حرب", "هجوم", "صاروخ", "عسكري", "قوات", "قنبلة", "غارة"
];

function detectGeopoliticalEscalation(recent) {
  const escalationItems = count(items with escalationKeywords);  // 7 أخبار
  
  const level = 
    count >= 5 ? "high"      // 🔴 تصعيد مرتفع
    count >= 3 ? "medium"    // 🟡 تصعيد معتدل
    : "low";                 // 🟢 هدوء نسبي
  
  return {
    level: "high",
    label: "تصعيد جيوسياسي مرتفع",
    color: "#ef4444",
    count: 7
  };
}
```

#### 5️⃣ حساسية السوق (Market Sensitivity)

```javascript
const marketKeywords = [
  "oil", "inflation", "recession", "bank", "stock", "dollar", "debt", "trade",
  "نفط", "تضخم", "ركود", "بنك", "أسهم", "دولار", "دين", "تجارة"
];

function detectMarketSensitivity(recent) {
  const marketItems = count(items with marketKeywords);  // 6 أخبار
  
  const sensitivity =
    count >= 5 ? "high"      // ⚠️ حساسية مرتفعة
    count >= 2 ? "medium"    // 🟡 حساسية معتدلة
    : "low";                 // 🟢 حساسية منخفضة
  
  return {
    sensitivity: "high",
    label: "حساسية سوقية مرتفعة",
    count: 6,
    color: "#f59e0b"
  };
}
```

#### 6️⃣ تجمعات الكيانات (Entity Clusters)

```javascript
function detectEntityClusters(recent) {
  // البحث عن أزواج كيانات تظهر معًا بتكرار
  // مثل: (Trump ↔ Russia) يظهر 5 مرات
  //      (Gaza ↔ Israel) يظهر 8 مرات
  
  const coMatrix = {};
  for each item in recent:
    for each pair of entities in item:
      coMatrix["Trump↔Russia"] = 5;
      coMatrix["Gaza↔Israel"] = 8;
  
  // الفلترة والترتيب:
  filter pairs appearing ≥ 2 times
  sort by frequency descending
  take top 6
  
  return [{
    entityA: "Gaza",
    entityB: "Israel",
    coCount: 8,
    strength: count >= 4 ? "قوي" : "معتدل"  // "قوي"
  }];
}
```

### معادلة قوة النمط الكلية

```javascript
const patternStrength = Math.min(100,
  signalTrends.rising.length × 8 +      // +8 لكل إشارة صاعدة
  clusters.length × 6 +                  // +6 لكل تجمع كيانات
  (geopolitical.level === "high" ? 20 : 
   geopolitical.level === "medium" ? 10 : 0) +
  (market.sensitivity === "high" ? 15 : 
   market.sensitivity === "medium" ? 8 : 0) +
  sports.transferHeat × 4 +              // +4 لكل خبر انتقالات
  recent.length × 0.5                    // +0.5 لكل عنصر حديث
);
```

### تصنيف قوة النمط

```javascript
patternStrength >= 70 ? "أنماط قوية ونشطة"    // 🟢 خضراء
patternStrength >= 40 ? "أنماط معتدلة"        // 🟡 صفراء
: "أنماط ضعيفة"                               // 🔴 حمراء
```

---

## 4️⃣ ربط الأحداث والعلاقات - Forecast Agent

**الملف**: `src/lib/agent/forecastAgent.js`

### المرحلة 1: استخراج أقوى الإشارات

```javascript
function extractStrongestSignals(recent) {
  // عد تكرار كل كلمة مفتاحية
  const freq = {
    "war": 6,
    "missile": 5,
    "sanctions": 4,
    "ceasefire": 2
  };
  
  // الترتيب والتصنيف:
  return [
    { signal: "war", count: 6, strength: "high" },     // ≥5
    { signal: "missile", count: 5, strength: "high" },
    { signal: "sanctions", count: 4, strength: "medium" }, // ≥3
    { signal: "ceasefire", count: 2, strength: "low" }  // <3
  ].slice(0, 8);  // أقوى 8 إشارات
}
```

### المرحلة 2: استخراج الكيانات المرتبطة

```javascript
function extractLinkedEntities(recent) {
  // عد ظهور كل كيان
  const freq = {
    "Trump": 15,
    "NATO": 12,
    "Russia": 11,
    "Ukraine": 10,
    "Gaza": 18
  };
  
  // أعلى 6 كيانات
  return [
    { entity: "Gaza", count: 18 },
    { entity: "Trump", count: 15 },
    { entity: "NATO", count: 12 },
    { entity: "Russia", count: 11 },
    { entity: "Ukraine", count: 10 },
    { entity: "Putin", count: 9 }
  ];
}
```

### المرحلة 3: تسارع الإشارة (Signal Acceleration)

```javascript
function computeSignalAcceleration(items) {
  // مقارنة آخر 12 ساعة مع 12 ساعة سابقة
  const last12h = count(items from last 12 hours);   // 25 عنصر
  const prev12h = count(items from 12-24h ago);      // 10 عناصر
  
  const accel = ((last12h - prev12h) / prev12h) × 100
             = ((25 - 10) / 10) × 100
             = 150%  // ارتفاع 150%
  
  return {
    value: 150,
    last12h: 25,
    prev12h: 10,
    direction: accel > 20% ? "accelerating" : 
               accel < -20% ? "decelerating" : 
               "stable",
    label: "تسارع في الإشارات"  // ✅
  };
}
```

### المرحلة 4: مستوى التناقضات (Contradiction Level)

```javascript
const OPPOSING_PAIRS = [
  ["war", "ceasefire"],
  ["attack", "peace"],
  ["inflation", "growth"],
  // ... و نسخ عربية
];

function computeContradictionLevel(recent) {
  let contradictions = 0;
  
  for each pair [a, b] in OPPOSING_PAIRS:
    if (a appears in recent) AND (b appears in recent):
      contradictions++  // وجدنا تناقضًا
  
  // مثال: "war" و "ceasefire" كلاهما ظهر
  // → contradictions = 1
  
  const level =
    contradictions >= 3 ? "high"      // 🔴 تناقضات عالية
    contradictions >= 1 ? "medium"    // 🟡 تناقضات معتدلة
    : "low";                          // 🟢 إشارات متسقة
  
  return {
    level: "medium",
    count: 1,
    label: "تناقضات معتدلة",
    color: "#f59e0b"
  };
}
```

### المرحلة 5: التشابه التاريخي (Historical Similarity)

```javascript
function computeHistoricalSimilarity(recent, weekItems) {
  // مقارنة فئات الأسبوع الحالي مع فئات الأسبوع الماضي
  const recentCats = new Set(recent.map(i => i.category));
  // {"war", "economy", "politics"}
  
  const weekCats = new Set(weekItems.map(i => i.category));
  // {"war", "economy", "sports", "politics"}
  
  // التقاطع
  const intersection = count(cats in both) = 3
  const union = max(recentCats.size, weekCats.size) = 4
  
  const similarity = (intersection / union) × 100
                  = (3 / 4) × 100
                  = 75%  // تشابه عالٍ مع نمط سابق
  
  return {
    score: 75,
    label: similarity >= 70 ? "تشابه تاريخي عالٍ" :
           similarity >= 40 ? "تشابه تاريخي معتدل" :
           "نمط جديد / غير مسبوق"
  };
}
```

### المرحلة 6: اتجاه الثقة (Confidence Trend)

```javascript
function computeConfidenceTrend(recent, all) {
  const recentAvg = average(recent items' confidence);  // 72
  const allAvg = average(all items' confidence);        // 65
  
  const trend =
    recentAvg > allAvg + 5 ? "improving"    // ✅ تحسُّن
    recentAvg < allAvg - 5 ? "degrading"    // ❌ تراجع
    : "stable";                              // ➡️ مستقر
  
  return {
    recentAvg: 72,
    allAvg: 65,
    trend: "improving",
    label: "الثقة في تحسن",
    color: "#22c55e"
  };
}
```

### معادلة جاهزية التوقع (Forecast Readiness)

```javascript
const forecastReadiness = Math.min(100,
  Math.min(30, strongestSignals.length × 4) +        // أقوى 8 إشارات: 0-32
  Math.min(20, linkedEntities.length × 3) +          // أقوى 6 كيانات: 0-18
  (historicalSimilarity.score × 0.2) +               // تشابه: 0-20
  (contradiction.level === "low" ? 15 :
   contradiction.level === "medium" ? 8 : 2) +       // التناقضات: 2-15
  (acceleration.direction === "accelerating" ? 10 : 5) +  // التسارع: 5-10
  Math.min(5, clusters.length)                        // التجمعات: 0-5
);
```

### تصنيفات جاهزية التوقع

```javascript
readiness >= 70 ? "جاهز للتوقع"            // 🟢 أخضر
readiness >= 40 ? "استعداد معتدل"          // 🟡 أصفر
: "بيانات غير كافية للتوقع"               // 🔴 أحمر
```

---

## 5️⃣ معادلات الثقة الشاملة

### معادلة الثقة المرحلة الأولى (Ingestion)

```javascript
// في ingestionAgent.js
confidence = Math.min(90,
  20 +                    // قاعدة
  entities.length × 5 +   // كل كيان: +5
  keywords.length × 3 +   // كل كلمة: +3
  regions.length × 5      // كل منطقة: +5
);
// **النطاق: 20-90**
```

### معادلة الثقة المتقدمة (Forecast) 

```javascript
// في _agent-store.js
confidenceScore = Math.max(20,
  Math.min(95,
    (forecastAccuracy × 0.35) +         // دقة التنبؤ السابقة: 35%
    Math.min(35, topSignal.count × 4) + // أقوى إشارة: 35%
    (hasStrongLink ? 15 : 5) +          // وجود ربط قوي: 15%
    (hasTopRegion ? 8 : 0)              // أهمية المنطقة: 8%
  )
);
```

### معادلة الثقة المركبة (Reasoning Chain)

```javascript
// من reasoning chain في الخادم
compositeConfidence = round(
  (forecastReadiness.score × 0.55) +    // جاهزية التوقع: 55%
  (confidenceTrend.recentAvg × 0.35) +  // اتجاه الثقة: 35%
  (memoryDepth.forecastAccuracy × 0.1) // دقة السجل: 10%
);
```

---

## 6️⃣ معايير التقييم والأداء - Scoring Agent

**الملف**: `src/lib/agent/scoringAgent.js`

### معادلة العلامة الكلية (Agent Learning Score)

```javascript
// المكونات الـ 8 (نقاط من 100)

const score = Math.min(100,
  // 1. حجم البيانات: 0-20 نقطة
  // logarithmic growth, saturates at 500 items
  min(20, log10(totalItems) × 8) +
  
  // 2. تنوع المصادر: 0-15 نقطة
  min(15, sourceDiversity × 2) +
  
  // 3. الكيانات المرصودة: 0-15 نقطة
  // logarithmic: 10 entities = 7 pts, 100 entities = 10 pts, 1000+ = 15 pts
  min(15, log10(trackedEntities) × 7) +
  
  // 4. الأنماط النشطة: 0-15 نقطة
  min(15, activePatterns × 2) +
  
  // 5. الأحداث المرتبطة: 0-10 نقاط
  min(10, log10(linkedEvents + 1) × 5) +
  
  // 6. الإشارات المتكررة: 0-10 نقاط
  min(10, repeatedSignals) +
  
  // 7. دقة التنبؤات: 0-10 نقاط
  // only if ≥3 resolved forecasts
  (forecastResolved >= 3 ? 
    min(10, forecastAccuracy / 10) : 0) +
  
  // 8. التغطية متعددة المجالات: 0-5 نقاط
  min(5, distinctCategories)
);
```

### معادلات كل مكون

```javascript
// 1. Volume Score (حجم البيانات)
volumeScore = Math.min(20, Math.round(Math.log10(max(1, totalItems)) × 8));

// مثال:
// 1 item:      log10(1) × 8 = 0
// 10 items:    log10(10) × 8 = 8 pts
// 100 items:   log10(100) × 8 = 16 pts
// 500+ items:  log10(500) × 8 = 20 pts (saturated)

// 2. Source Score (التنوع)
sourceScore = Math.min(15, sourceDiversity × 2);

// مثال:
// 5 sources: 5 × 2 = 10 pts
// 7+ sources: 15 pts (saturated)

// 3. Entity Score (الكيانات)
entityScore = Math.min(15, Math.round(Math.log10(max(1, trackedEntities)) × 7));

// مثال:
// 10 entities: log10(10) × 7 = 7 pts
// 100 entities: log10(100) × 7 = 14 pts
// 1000+ entities: 15 pts (saturated)

// 4. Pattern Score (الأنماط)
patternScore = Math.min(15, activePatterns × 2);

// مثال:
// 5 active patterns: 5 × 2 = 10 pts
// 7+ patterns: 15 pts (saturated)

// 5. Linked Score (الروابط)
linkedScore = Math.min(10, Math.round(Math.log10(max(1, linkedEvents + 1)) × 5));

// مثال:
// 1-9 linked events: max 5 pts
// 100+ linked events: 10 pts

// 6. Signal Score (الإشارات)
signalScore = Math.min(10, repeatedSignals);

// تحديد مباشر: كم إشارة تكررت أكثر من مرة

// 7. Feedback Score (التنبؤات)
if (forecastResolved >= 3):
  feedbackScore = Math.min(10, Math.round(forecastAccuracy / 10));
else:
  feedbackScore = 0;

// مثال:
// 70% accuracy with 3+ resolved: 70/10 = 7 pts
// 100% accuracy: 10 pts

// 8. Cross-Domain Score (المجالات المتعددة)
crossDomain = Math.min(5, distinctCategories);

// مثال:
// 3 categories (conflict, economy, sports): 3 pts
// 5+ categories: 5 pts (saturated)
```

### تصنيفات نضج الوكيل (Maturity Index)

```javascript
score >= 80 → "وكيل ناضج — تحليل متقدم"         // 🟢 أخضر (#22c55e)
score >= 60 → "وكيل متطور — نمط قوي"            // 🔵 أزرق (#38bdf8)
score >= 40 → "وكيل نشط — بناء الذاكرة"         // 🟡 أصفر (#f59e0b)
score >= 20 → "وكيل ناشئ — تغذية مبدئية"        // 🟠 برتقالي (#f97316)
score <  20 → "وكيل جديد — في انتظار البيانات"  // 🔴 أحمر (#ef4444)
```

---

## 7️⃣ معالجة التغذية الراجعة - Feedback Agent

**الملف**: `src/lib/agent/feedbackAgent.js`

### دورة تغذية الأداء

```javascript
// الخطوة 1: تسجيل التنبؤ
feedbackAgent.recordPrediction(
  id: "forecast_2026_03_22_001",
  category: "conflict",
  probability: 75,  // احتمالية 75%
  signals: ["war", "missile", "military"]  // الإشارات المحركة
);

// الخطوة 2: انتظار النتيجة (24-48 ساعة)

// الخطوة 3: تسجيل النتيجة
feedbackAgent.markOutcome(
  forecastId: "forecast_2026_03_22_001",
  outcome: "success"  // أو "failure"
);
```

### معادلة ضبط الثقة (Pattern Reliability)

```javascript
// إذا نجح التنبؤ (outcome = "success"):
for each signal in prediction:
  signal.weight = Math.min(2.0, signal.weight + 0.1);
  signal.successes++;

// مثال:
// "war" signal:
// - weight: 1.0 → 1.1 (ارتفاع الثقة بـ 10%)
// - successes: 5 → 6

// الحد الأقصى للعلاقة: 2.0 (ضعف الثقة الأصلية)

// إذا فشل التنبؤ (outcome = "failure"):
for each signal in prediction:
  signal.weight = Math.max(0.1, signal.weight - 0.15);
  signal.failures++;

// مثال:
// "war" signal:
// - weight: 1.0 → 0.85 (انخفاض الثقة بـ 15%)
// - failures: 2 → 3

// الحد الأدنى للعلاقة: 0.1 (عُشر الثقة الأصلية)
```

### معدلات الأداء المتراكمة

```javascript
// المعدلات الكلية
const stats = {
  forecastResolved: 47,           // 47 تنبؤ حصلنا على نتيجة لها
  forecastSuccesses: 32,          // نجح منها 32
  forecastFailures: 15,           // فشل منها 15
  forecastAccuracy: (32/47) × 100 = 68%, // دقة 68%
  
  falseSignalRate: (15/47) × 100 = 32%,   // معدل الإشارات الخاطئة
  confirmedSignalRate: (32/47) × 100 = 68% // معدل الإشارات المؤكدة
};
```

---

## 8️⃣ التخزين من جانب الخادم - Agent Store

**الملف**: `api/_agent-store.js`

### البنية المركزية

```javascript
const GLOBAL_AGENT_STORE = {
  items: AgentItem[],              // آخر 2000 عنصر مخزن
  feedback: FeedbackRecord[],       // آخر 1000 سجل تغذية راجعة
  
  patternReliability: {
    "war": { weight: 1.5, successes: 12, failures: 3 },
    "missile": { weight: 1.2, successes: 8, failures: 2 },
    // ... وزن الثقة لكل إشارة
  },
  
  stats: {
    totalIngested: 5847,            // إجمالي العناصر المدخلة (مدى الحياة)
    lastFeedAt: "2026-03-22T14:30:00+04:00",
    apiFailures: 3                  // عدد مرات فشل API
  }
};
```

### معادلة بناء رسم بياني علاقات الكيانات

```javascript
function buildEntityLinkGraph(items) {
  // من آخر 400 عنصر
  const pairCounts = new Map();
  
  for each item in items.slice(-400):
    for each pair of entities (a, b) in item:
      const key = [a, b].sort().join("|#|");
      pairCounts[key]++;
  
  // مثال:
  // "Gaza|#|Israel": 28 مرة معًا
  // "Trump|#|Russia": 15 مرة معًا
  // "NATO|#|Ukraine": 22 مرة معًا
  
  // الترتيب والاختيار أقوى 24 رابط
  return [
    { from: "Gaza", to: "Israel", weight: 28 },
    { from: "NATO", to: "Ukraine", weight: 22 },
    { from: "Trump", to: "Russia", weight: 15 },
    // ...
  ].slice(0, 24);
}
```

### معادلة بناء Reasoning Chain

```javascript
function buildReasoningChain(items, meta) {
  const topSignal = most_frequent_keyword;        // "war" (34x)
  const topRegion = most_frequent_region;         // "Middle East" (45x)
  const strongestLink = top_entity_pair;          // Gaza ↔ Israel (28x)
  
  const confidence = Math.max(20, Math.min(95,
    (forecastAccuracy × 0.35) +        // 70% × 0.35 = 24.5
    Math.min(35, topSignal.count × 4) +// min(35, 34×4) = 35
    (strongestLink ? 15 : 5) +         // 15
    (topRegion ? 8 : 0)                // 8
  )); // = 82.5 → 83
  
  return {
    event_detected: "Dominant signal 'war' repeated 34 times",
    linked_signals: "Entity linkage: Gaza ↔ Israel (28x)",
    regional_context: "Middle East (45 signal items)",
    confidence: 83,
    label_ar: "تسلسل منطقي قوي"
  };
}
```

### معادلة تدقيق الوكيل (Audit)

```javascript
function computeAgentAuditFromSnapshot(snapshot) {
  const resolution = snapshot.reasoningChain.confidence;  // 0-100
  
  // 1. دقة التصنيف
  classification_accuracy = min(100, 20 + 
    count(categorized items) × 0.5 +    // تصنيف صحيح
    count(linked events) × 0.8
  );
  
  // 2. اكتشاف الأنماط
  pattern_detection = min(100, 30 + 
    count(active patterns) × 3 +
    (geopolitical.level === "high" ? 15 : 10) +
    (market.sensitivity === "high" ? 15 : 10)
  );
  
  // 3. معدل التنبؤات الموفقة
  forecast_hit_rate = forecastAccuracy;  // % مباشر
  
  // 4. جودة الذاكرة
  memory_quality = min(100, 20 + 
    trackedEntities × 1 +
    linkedEvents × 0.5 +
    activePatterns × 1.5
  );
  
  // 5. المرونة (Resilience)
  resilience = 100 - (apiFailures × 5);  // بدون فشل: 100
  
  // 6. جودة التفكير
  reasoning_quality = min(100, 20 +
    relationGraph.length × 2 +           // عدد الروابط
    reasoningSignals × 12 +              // الإشارات المدرجة
    resolution × 0.25                    // ثقة التسلسل
  );
  
  return {
    classification_accuracy,
    pattern_detection,
    forecast_hit_rate,
    memory_quality,
    resilience,
    reasoning_quality
  };
}
```

---

## 📊 خلاصة دورة المعالجة الكاملة

```
📥 المدخلات
├─ أخبار (6 فئات × 7 مناطق = ~42 مصدر محتمل)
├─ إشارات X (posts + mentions)
├─ رياضة (أندية، مباريات، انتقالات)
├─ أسواق (أسعار، مؤشرات اقتصادية)
├─ توترات إقليمية (عسكرية، سياسية)
└─ توقعات (استراتيجية، تحليل)

↓ [معالجة 6 ساعات]

🧠 الوكيل
├─ 1. Ingestion: تطبيع + استخراج (entities, keywords)
├─ 2. Memory: تخزين محلي + مزامنة خادم
├─ 3. Patterns: 6 أنواع اكتشاف (signals, regions, sports, geo, market, clusters)
├─ 4. Forecast: ربط + جاهزية (readiness = 0-100)
├─ 5. Scoring: علامة التعلم (score = 0-100)
└─ 6. Feedback: ضبط الثقة (weight = 0.1-2.0)

↓

📤 المخرجات
├─ توقعات (24-72 ساعة زمن النافذة)
├─ مستويات ثقة (20-95 نطاق)
├─ أنماط نشطة (≤6 رئيسية)
├─ كيانات مرتبطة (≤6 أزواج)
├─ إشارات مسرعة (%)
└─ معايير أداء (0-100 في 8 فئات)
```

---

## 🎯 خريطة الملفات الرئيسية

```
src/lib/agent/
├─ ingestionAgent.js     ← جمع البيانات من 6 مصادر (confidence: 20-90)
├─ memoryAgent.js        ← التخزين المحلي (1000 max items)
├─ patternAgent.js       ← اكتشاف 6 أنواع أنماط (strength: 0-100)
├─ forecastAgent.js      ← ربط + جاهزية التوقع (readiness: 0-100)
├─ scoringAgent.js       ← علامة التعلم الشاملة (score: 0-100)
├─ feedbackAgent.js      ← معالجة التغذية الراجعة (weight: 0.1-2.0)
└─ benchmarkDataset.js   ← بيانات معايير الاختبار

src/lib/
└─ useAgentIntelligence.js ← خطاف React الرئيسي (استدعاء كل الوكلاء)

api/
└─ _agent-store.js       ← التخزين من جانب الخادم + الاستماعة
```

---

## 🔢 الأرقام الرئيسية

| المقياس | القيمة | النطاق |
|---------|--------|--------|
| حد التخزين (محلي) | 1,000 | 0-1,000 عنصر |
| حد التخزين (خادم) | 2,000 | 0-2,000 عنصر |
| نطاق الثقة الأولي | 20-90 | نقطة |
| نطاق الثقة المركب | 20-95 | نقطة |
| نطاق قوة النمط | 0-100 | نقطة |
| نطاق جاهزية التوقع | 0-100 | نقطة |
| نطاق العلامة الكلية | 0-100 | نقطة |
| نطاق وزن الإشارة | 0.1-2.0 | معاملل |
| الإطار الزمني الحديث | 24 س | ساعة |
| الإطار الزمني الأقدم | 72 س | ساعة |
| الكيانات المعروفة | 40+ | كيان |
| كلمات الإشارة | 35+ | كلمة |
| القطاعات الجغرافية | 7 | مناطق |
| الفئات المدعومة | 6+ | فئات |
| أزواج الإشارات المعارضة | 6+ | أزواج |

---

## ✅ الخلاصة: كيف يعمل الوكيل

```
🎯 الهدف: فهم شامل لكيفية عمل الوكيل

1️⃣ جمع البيانات كم مصدر؟
   → 6 مصادر رئيسية (أخبار، X، رياضة، أسواق، إقليمي، توقعات)
   → كل عنصر يُصنف إلى 6 فئات و 7 مناطق جغرافية

2️⃣ اكتشاف الأنماط كيف؟
   → 6 محركات اكتشاف متسلسة:
     a) اتجاهات الإشارات (rising/falling/stable)
     b) ضغط الأقاليم (high/medium/low)
     c) زخم الرياضة (momentum + transfer heat)
     d) التصعيد الجيوسياسي (5+ items = high)
     e) حساسية السوق (5+ items = high)
     f) تجمعات الكيانات (pairs appearing ≥2x)

3️⃣ الاستنتاج والتحليل بأي آلية؟
   → Reasoning Chain من 4 مكونات:
     a) أقوى إشارة + تكرارها
     b) أقوى رابط كيان + وزنه
     c) إطार جغرافي + أهميته
     d) مستوى الثقة الكلي (20-95)

4️⃣ الثقة والخطأ بأي معايير؟
   → 3 معادلات ثقة متراكمة:
     a) أولية (ingestion): 20-90
     b) متقدمة (forecast): مركب من 4 عوامل
     c) مركبة (reasoning): 55% readiness + 35% trend + 10% history
   
   → معالجة الخطأ:
     - نجاح: +0.1 إلى weight (max 2.0)
     - فشل: -0.15 من weight (min 0.1)
```

---

**تم إعداد هذا الدليل**: 2026-03-22  
**الإصدار**: 1.0  
**الحالة**: توثيق شامل نهائي
