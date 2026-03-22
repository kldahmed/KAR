# 📐 قائمة مرجعية سريعة: جميع معادلات الوكيل الذكي

## 🔴 معادلات INGESTION (جمع البيانات)

### 1. الثقة الأولية (Initial Confidence)
```
confidence = min(90,
  20 +                    // قاعدة ثابتة
  entities.length × 5 +   // +5 لكل كيان (max 40)
  keywords.length × 3 +   // +3 لكل كلمة (max 30)
  regions.length × 5      // +5 لكل منطقة (max 35)
)
```
**النطاق**: 20-90  
**مثال**: 2 كيانات + 2 كلمات + 1 منطقة = 20 + 10 + 6 + 5 = 41

### 2. درجة الصلة (Relevance Score)
```
relevance = min(100,
  entities.length × 8 +        // +8 لكل كيان (max 40)
  keywords.length × 5 +        // +5 لكل كلمة (max 30)
  (category ≠ "general" ? 20 : 5) +  // تصنيف واضح: +20
  urgency_score                // high=10, medium=5, low=0
)
```
**النطاق**: 5-100  
**مثال**: 2 كيانات + 2 كلمات + تصنيف واضح + high urgency = 16 + 10 + 20 + 10 = 56

---

## 🟡 معادلات PATTERN DETECTION (اكتشاف الأنماط)

### 1. اتجاه الإشارة (Signal Trend Direction)
```
ratio = recentCount / max(olderCount, 1)

direction = 
  ratio >= 1.5  ? "rising"   // صاعد
  ratio <= 0.5  ? "falling"  // هابط
  : "stable"                 // مستقر
```

### 2. ضغط الإقليم (Regional Pressure)
```
pressure = 
  count >= 5  ? "high"      // ضغط مرتفع
  count >= 3  ? "medium"    // ضغط معتدل
  : "low"                   // ضغط منخفض
```

### 3. التصعيد الجيوسياسي (Geopolitical Escalation)
```
escalationLevel = 
  count >= 5  ? "high"      // تصعيد مرتفع
  count >= 3  ? "medium"    // تصعيد معتدل
  : "low"                   // هدوء نسبي
```

**الكلمات المفتاحية**:  
"war", "attack", "missile", "military", "troops", "bomb", "airstrike"  
"حرب", "هجوم", "صاروخ", "عسكري", "قوات", "قنبلة", "غارة"

### 4. حساسية السوق (Market Sensitivity)
```
sensitivity = 
  count >= 5  ? "high"      // حساسية مرتفعة
  count >= 2  ? "medium"    // حساسية معتدلة
  : "low"                   // حساسية منخفضة
```

**الكلمات المفتاحية**:  
"oil", "inflation", "market", "bank", "stock", "dollar", "debt"  
"نفط", "تضخم", "سوق", "بنك", "أسهم", "دولار", "دين"

### 5. تجمعات الكيانات (Entity Clusters)
```
pair_count >= 2  → "معتدل" (moderate)
pair_count >= 4  → "قوي"   (strong)
```
**الطريقة**: حساب عدد المرات التي يظهر فيها كل زوج كيانات معًا  
**الناتج**: أقوى 6 أزواج فقط

### 6. قوة النمط الكلية (Pattern Strength)
```
patternStrength = min(100,
  signalTrends.rising.length × 8 +
  clusters.length × 6 +
  (geopolitical.level === "high" ? 20 : 
   geopolitical.level === "medium" ? 10 : 0) +
  (market.sensitivity === "high" ? 15 : 
   market.sensitivity === "medium" ? 8 : 0) +
  sports.transferHeat × 4 +
  recent.length × 0.5
)
```
**النطاق**: 0-100  
**التصنيف**:
- ≥70: أنماط قوية ونشطة 🟢
- ≥40: أنماط معتدلة 🟡
- <40: أنماط ضعيفة 🔴

---

## 🔵 معادلات FORECAST AGENT (التنبؤ والربط)

### 1. استخراج أقوى الإشارات (Strongest Signals)
```
// عد تكرار كل كلمة مفتاحية
freq[keyword] = count(items contain this keyword)

// الترتيب والترشيح
strength = 
  count >= 5  ? "high"    // إشارة قوية
  count >= 3  ? "medium"  // إشارة معتدلة
  : "low"                 // إشارة ضعيفة

// النتيجة: أقوى 8 إشارات
```

### 2. استخراج الكيانات المرتبطة (Linked Entities)
```
// عد ظهور كل كيان
entityFreq[entity] = count(items contain this entity)

// النتيجة: أعلى 6 كيانات
```

### 3. تسارع الإشارة (Signal Acceleration)
```
acceleration_percent = 
  ((last_12h - prev_12h) / max(prev_12h, 1)) × 100

direction = 
  acceleration > 20%   ? "accelerating"  // تسارع
  acceleration < -20%  ? "decelerating"  // تباطؤ
  : "stable"                              // مستقر
```
**مثال**: 25 في آخر 12h ، 10 في 12-24h = (25-10)/10 × 100 = 150%

### 4. مستوى التناقضات (Contradiction Level)
```
contradictions = 0
for each pair [a, b] in opposite_pairs:
  if (a in recent) AND (b in recent):
    contradictions++

level = 
  contradictions >= 3  ? "high"     // تناقضات عالية
  contradictions >= 1  ? "medium"   // تناقضات معتدلة
  : "low"                           // إشارات متسقة
```

**الأزواج المعارضة**:
- "war" ↔ "ceasefire"
- "attack" ↔ "peace"
- "inflation" ↔ "growth"
- "حرب" ↔ "هدنة"
- "هجوم" ↔ "سلام"
- "تضخم" ↔ "نمو"

### 5. التشابه التاريخي (Historical Similarity)
```
recentCategories = unique(category of recent items)
weekCategories = unique(category of week items)

intersection = count(categories in both)
union = max(len(recentCategories), len(weekCategories))

similarity_percent = (intersection / union) × 100

label = 
  similarity >= 70  ? "تشابه تاريخي عالٍ"
  similarity >= 40  ? "تشابه تاريخي معتدل"
  : "نمط جديد / غير مسبوق"
```

### 6. اتجاه الثقة (Confidence Trend)
```
recentAvg = average(confidence of recent items)
allAvg = average(confidence of all items)

trend = 
  recentAvg > allAvg + 5   ? "improving"   // تحسُّن
  recentAvg < allAvg - 5   ? "degrading"   // تراجع
  : "stable"                                // مستقر
```

### 7. جاهزية التنبؤ (Forecast Readiness)
```
readiness = min(100,
  min(30, strongestSignals.length × 4) +     // 0-32
  min(20, linkedEntities.length × 3) +       // 0-20
  (historicalSimilarity.score × 0.2) +       // 0-20
  (contradiction.level === "low" ? 15 : 
   contradiction.level === "medium" ? 8 : 2) +  // 2-15
  (acceleration.direction === "accelerating" ? 10 : 5) +  // 5-10
  min(5, clusters.length)                    // 0-5
)
```
**النطاق**: 0-100  
**التصنيف**:
- ≥70: جاهز للتوقع ✅
- ≥40: استعداد معتدل ⚠️
- <40: بيانات غير كافية ❌

---

## 💚 معادلات SCORING (تقييم الأداء)

### 1. علامة التعلم الكلية (Learning Score)
```
score = min(100,
  volumeScore +
  sourceScore +
  entityScore +
  patternScore +
  linkedScore +
  signalScore +
  feedbackScore +
  crossDomainScore
)
```

### 2. مكونات العلامة (Score Breakdown)

#### Volume Score (حجم البيانات: 0-20)
```
volumeScore = min(20, log10(max(1, totalItems)) × 8)

// أمثلة:
1 item:       log10(1) × 8 = 0
10 items:     log10(10) × 8 = 8 pts
100 items:    log10(100) × 8 = 16 pts
500+ items:   log10(500) × 8 ≈ 20 pts (saturated)
```

#### Source Score (تنوع المصادر: 0-15)
```
sourceScore = min(15, sourceDiversity × 2)

// أمثلة:
3 sources: 6 pts
7+ sources: 15 pts (saturated)
```

#### Entity Score (الكيانات المتتبعة: 0-15)
```
entityScore = min(15, log10(max(1, trackedEntities)) × 7)

// أمثلة:
10 entities:  log10(10) × 7 = 7 pts
100 entities: log10(100) × 7 = 14 pts
1000+ entities: 15 pts (saturated)
```

#### Pattern Score (الأنماط النشطة: 0-15)
```
patternScore = min(15, activePatterns × 2)

// أمثلة:
5 patterns: 10 pts
7+ patterns: 15 pts (saturated)
```

#### Linked Score (الربط بين الأحداث: 0-10)
```
linkedScore = min(10, log10(max(1, linkedEvents + 1)) × 5)

// أمثلة:
1-9 linked: 0-5 pts
100+ linked: 10 pts (saturated)
```

#### Signal Score (الإشارات المتكررة: 0-10)
```
signalScore = min(10, repeatedSignals)

// مباشر: عدد الإشارات التي تكررت > مرة واحدة
```

#### Feedback Score (دقة التنبؤات: 0-10)
```
if (forecastResolved >= 3):
  feedbackScore = min(10, round(forecastAccuracy / 10))
else:
  feedbackScore = 0

// أمثلة:
50% accuracy: 5 pts
70% accuracy: 7 pts
100% accuracy: 10 pts
```

#### Cross-Domain Score (المجالات المتعددة: 0-5)
```
crossDomainScore = min(5, distinctCategories)

// أمثلة:
3 categories: 3 pts
5+ categories: 5 pts (saturated)
```

### 3. تصنيفات نضج الوكيل (Maturity Index)

```
score >= 80  → "وكيل ناضج — تحليل متقدم"      🟢 أخضر
score >= 60  → "وكيل متطور — نمط قوي"         🔵 أزرق
score >= 40  → "وكيل نشط — بناء الذاكرة"      🟡 أصفر
score >= 20  → "وكيل ناشئ — تغذية مبدئية"     🟠 برتقالي
score <  20  → "وكيل جديد — في انتظار البيانات" 🔴 أحمر
```

---

## 💜 معادلات FEEDBACK (التغذية الراجعة)

### 1. ضبط وزن الإشارة (Pattern Weight Adjustment)

**عند النجاح (outcome = "success")**:
```
weight = min(2.0, weight + 0.1)
successes++
```
**الحد الأقصى**: 2.0 (ضعف الثقة الأصلية)  
**الزيادة**: +0.1 لكل نجاح

**عند الفشل (outcome = "failure")**:
```
weight = max(0.1, weight - 0.15)
failures++
```
**الحد الأدنى**: 0.1 (عُشر الثقة الأصلية)  
**الانخفاض**: -0.15 لكل فشل

### 2. معدل الدقة (Accuracy Rate)
```
accuracy = (successes / resolved) × 100

// حيث:
resolved = successes + failures
```

### 3. معدل الإشارات الخاطئة (False Signal Rate)
```
falseSignalRate = (failures / resolved) × 100
```

---

## 🔐 معادلات CONFIDENCE (الثقة المركبة)

### 1. الثقة الأولية (Ingestion)
```
confidence_ingestion = min(90,
  20 + entities×5 + keywords×3 + regions×5
)
```
**النطاق**: 20-90

### 2. الثقة المتقدمة (Forecast)
```
confidence_forecast = max(20, min(95,
  (forecastAccuracy × 0.35) +
  min(35, topSignal.count × 4) +
  (hasStrongLink ? 15 : 5) +
  (hasTopRegion ? 8 : 0)
))
```
**النطاق**: 20-95

### 3. الثقة المركبة (Composite - Reasoning Chain)
```
confidence_composite = round(
  (forecastReadiness × 0.55) +    // 55%
  (confidenceTrend.recentAvg × 0.35) +  // 35%
  (memoryDepth.forecastAccuracy × 0.1)  // 10%
)
```
**الأوزان**: 
- جاهزية التوقع: 55% (most important)
- اتجاه الثقة: 35%
- دقة السجل: 10%

---

## 📊 جدول المقارنة السريعة

| المعادلة | الحد الأدنى | الحد الأقصى | الوحدة |
|---------|-----------|-----------|--------|
| Confidence (Ingestion) | 20 | 90 | نقطة |
| Relevant Score | 5 | 100 | نقطة |
| Pattern Strength | 0 | 100 | نقطة |
| Forecast Readiness | 0 | 100 | نقطة |
| Learning Score | 0 | 100 | نقطة |
| Weight (Pattern) | 0.1 | 2.0 | معامل |
| Signal Acceleration | - | - | نسبة مئوية |
| Contradictions | 0 | ∞ | عدد |

---

## 🎯 الملخص

```
┌─────────────────────────────────────────────────────────────┐
│         سير المعادلات من البداية إلى النهاية              │
├─────────────────────────────────────────────────────────────┤
│ 1️⃣  Ingestion: confidence (20-90)                        │
│ 2️⃣  Pattern: patternStrength (0-100)                     │
│ 3️⃣  Forecast: forecastReadiness (0-100)                  │
│ 4️⃣  Scoring: learningScore (0-100)                       │
│ 5️⃣  Feedback: weight adjustment (0.1-2.0)               │
│ 6️⃣  Composite: confidence_composite (20-95)             │
└─────────────────────────────────────────────────────────────┘
```

**كل معادلة مصممة لـ**:
- ✅ تجنب الانفجار (التشبع saturate)
- ✅ عدم الإفراط في التضخيم
- ✅ الاستجابة السريعة للتغييرات
- ✅ الاستقرار طويل المدى

---

**تاريخ الإعداد**: 2026-03-22  
**الحالة**: مرجع شامل ودقيق
