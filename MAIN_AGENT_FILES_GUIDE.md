# الملفات الرئيسية للوكيل الذكي — دليل سريع

## 📌 الملفات الاثنان الأساسيان

### 1️⃣ **patternAgent.js** ← نواة اكتشاف الأنماط
**المسار**: `src/lib/agent/patternAgent.js`

**الوظيفة الأساسية**: اكتشاف 6 أنواع أنماط من البيانات المجمعة

**يحتوي على**:
- ✅ اكتشاف اتجاهات الإشارات (rising/falling/stable)
- ✅ اكتشاف ضغط الأقاليم
- ✅ اكتشاف زخم الرياضة + سوق الانتقالات
- ✅ اكتشاف التصعيد الجيوسياسي
- ✅ اكتشاف حساسية السوق
- ✅ اكتشاف تجمعات الكيانات (Entity Clustering)
- ✅ معادلة قوة النمط الكلية (0-100)

**الإخراج**: `analyzePatterns()` → جميع الأنماط مع قوتها ومعلومات قيمة

**المقدار**: ~280 سطر

---

### 2️⃣ **forecastAgent.js** ← نواة الربط والثقة والتنبؤ
**المسار**: `src/lib/agent/forecastAgent.js`

**الوظيفة الأساسية**: ربط الأنماط والأحداث وحساب جاهزية التنبؤ

**يحتوي على**:
- ✅ استخراج أقوى الإشارات (strongest signals)
- ✅ استخراج الكيانات المرتبطة (linked entities)
- ✅ حساب تسارع الإشارة (signal acceleration)
- ✅ اكتشاف التناقضات بين الإشارات (contradiction level)
- ✅ حساب التشابه التاريخي (historical similarity)
- ✅ حساب اتجاه الثقة (confidence trend)
- ✅ معادلة جاهزية التنبؤ (0-100)

**الإخراج**: `generateForecastSupport()` → حزمة شاملة للتنبؤ

**المقدار**: ~240 سطر

---

## 🔄 كيف يعملان معًا؟

```
النسق الزمني للمعالجة:
═════════════════════════════════════════════

t=0 → ingestionAgent: جمع + تطبيع
      ↓
t=0.1 → memoryAgent: تخزين محلي (localStorage)
        ↓
t=1 → patternAgent.analyzePatterns():
      ┌─────────────────────────────────┐
      │ 6 محركات اكتشاف متسلسلة:      │
      │ 1. Signal Trends              │
      │ 2. Regional Pressure          │
      │ 3. Sports Momentum            │
      │ 4. Geopolitical Escalation    │
      │ 5. Market Sensitivity         │
      │ 6. Entity Clusters            │
      │ ───────────────────────────    │
      │ Output: Pattern Report (0-100) │
      └─────────────────────────────────┘
      ↓
t=1.5 → forecastAgent.generateForecastSupport():
        ┌──────────────────────────────────┐
        │ 6 مراحل ربط وحساب:            │
        │ 1. Extract Strongest Signals   │
        │ 2. Extract Linked Entities     │
        │ 3. Compute Acceleration        │
        │ 4. Detect Contradictions       │
        │ 5. Historical Similarity       │
        │ 6. Confidence Trend            │
        │ ──────────────────────────      │
        │ Output: Forecast Support pkg   │
        │ (readiness: 0-100)             │
        └──────────────────────────────────┘
      ↓
t=2 → scoringAgent: علامة التعلم (0-100)
      ↓
t=2.5 → feedbackAgent: ضبط الثقة (weight: 0.1-2.0)
        ↓
t=3 → API response: توقع موثق
```

---

## 📊 مقارنة سريعة

| الجانب | patternAgent | forecastAgent |
|--------|------------|--------------|
| **المدخلات** | items من الذاكرة | items + patterns |
| **الإطار الزمني** | 24h + 72h | 24h + 7d |
| **المخرجات** | 6 أنواع أنماط | حزمة توقع شاملة |
| **المعادلات الرئيسية** | قوة النمط (0-100) | جاهزية التوقع (0-100) |
| **الثقة** | ضمنية في الأنماط | صريحة (trend + historical) |
| **الربط** | تجمعات الكيانات | علاقات معقدة |
| **استخدام** | تغذية patternAgent | تغذية scoringAgent |

---

## 🎯 كيفية استخدامهما في التطبيق

### مثال عملي: الكشف عن أزمة

```javascript
// 1. البيانات الخام تدخل النظام
ingestItem({
  title: "روسيا تزيد قواتها بالقرب من أوكرانيا",
  category: "conflict",
  entities: ["Russia", "Ukraine"],
  keywords: ["military", "troops"],
  region: "Europe",
  timestamp: "2026-03-22T10:00:00",
});

// 2. تحليل الأنماط
const patterns = analyzePatterns();
// Output:
// {
//   signalTrends: { rising: [{key: "military", recentCount: 8, olderCount: 2}] },
//   geopolitical: { level: "high", count: 7, label: "تصعيد جيوسياسي مرتفع" },
//   patternStrength: 72,
// }

// 3. توليد دعم التنبؤ
const forecast = generateForecastSupport();
// Output:
// {
//   strongestSignals: [
//     { signal: "military", count: 8, strength: "high" },
//     { signal: "troops", count: 6, strength: "high" }
//   ],
//   linkedEntities: [
//     { entity: "Russia", count: 15 },
//     { entity: "Ukraine", count: 14 }
//   ],
//   geopolitical: { level: "high", count: 7 },
//   forecastReadiness: 78,  // جاهز للتوقع
//   confidenceTrend: {
//     recentAvg: 74,
//     allAvg: 65,
//     trend: "improving",
//     label: "الثقة في تحسن"
//   }
// }

// 4. حساب العلامة
const score = computeAgentScore();
// Output: { score: 65, label: "وكيل متطور — نمط قوي" }

// 5. ضبط التغذية الراجعة
feedbackAgent.recordPrediction(
  "forecast_001",
  "conflict",
  78,  // جاهزية 78% → احتمال 78%
  ["military", "troops", "escalation"]
);

// ... بعد 24 ساعة ...
feedbackAgent.markOutcome("forecast_001", "success");
// → يزيد ثقة الإشارات المرتبطة
```

---

## 💡 أهم المعادلات في كل ملف

### **patternAgent.js**

```javascript
// 1. تحديد الاتجاه
const ratio = recentFreq / olderFreq;
direction = ratio >= 1.5 ? "rising" : ratio <= 0.5 ? "falling" : "stable"

// 2. قوة النمط النهائية
patternStrength = min(100,
  signalTrends.rising.length × 8 +
  clusters.length × 6 +
  (geopolitical.level === "high" ? 20 : 0) +
  (market.sensitivity === "high" ? 15 : 0)
)
```

### **forecastAgent.js**

```javascript
// 1. تسارع الإشارة
acceleration = ((last12h - prev12h) / prev12h) × 100

// 2. مستوى التناقض
contradictions = count(opposite signal pairs both present)

// 3. جاهزية التنبؤ
readiness = min(100,
  min(30, signals.length × 4) +
  min(20, entities.length × 3) +
  (similarity.score × 0.2) +
  (contradiction.level === "low" ? 15 : 8)
)
```

---

## 🔍 حيث يتم استدعاء هذه الملفات

```javascript
// src/lib/useAgentIntelligence.js (الخطاف الرئيسي)
import { analyzePatterns } from "./agent/patternAgent";
import { generateForecastSupport } from "./agent/forecastAgent";

export function useAgentIntelligence() {
  const patterns = analyzePatterns();        // ← patternAgent
  const forecast = generateForecastSupport(); // ← forecastAgent
  const score = computeAgentScore();
  const feedback = feedbackAgent.getStats();
  
  // يتم دمج جميع النتائج في metrics واحد
  const metrics = {
    ...score,
    ...patterns,     // إدراج جميع الأنماط
    ...forecast,     // إدراج دعم التنبؤ
    ...feedback,     // إدراج إحصائيات الأداء
  };
  
  return metrics;
}
```

---

## 📈 عمق البيانات (Memory Depth) = التسلسل الهرمي

```
memoryAgent.getMemoryDepth() ← يجمع من:
├─ patternAgent (أنماط نشطة)
├─ forecastAgent (سجل التنبؤات)
├─ ingestionAgent (إحصائيات المصادر)
└─ feedbackAgent (دقة التوقعات السابقة)
   ↓
يتم تمريره إلى:
├─ scoringAgent (حساب العلامة)
├─ AgentDashboard (عرض البيانات)
└─ API responses (الخادم)
```

---

## ✨ الخلاصة

| الملف | الدور | المفتاح |
|------|------|---------|
| **patternAgent.js** | اكتشاف الأنماط | 6 أنواع، قوة 0-100 |
| **forecastAgent.js** | ربط + تنبؤ | جاهزية 0-100، ثقة معقدة |

**النتيجة**: نظام ذكي متعدد المستويات يبني توقعات معتمدة على تحليل حقيقي للبيانات.

---

**الملفات الداعمة** (للمرجع):
- `memoryAgent.js` - التخزين
- `ingestionAgent.js` - جمع البيانات
- `scoringAgent.js` - العلامات
- `feedbackAgent.js` - التغذية الراجعة
- `_agent-store.js` - الخادم

---

**تاريخ الإعداد**: 2026-03-22  
**الإصدار**: 1.0 - سريع وموجز
