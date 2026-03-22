# 📑 فهرس ملفات الوكيل الذكي - دليل الملفات والموارد

## 🎯 الملفات الأساسية التي تم إعدادها

### 1. **AGENT_LOGIC_DOCUMENTATION.md** ← الدليل الشامل الكامل
- ✅ شرح تفصيلي لكل مكون في النظام
- ✅ معادلات كاملة مع أمثلة
- ✅ تسلسل العملية من البداية للنهاية
- ✅ جميع المصادر والمعايير
- 📖 **اقرأ هذا أولاً** للفهم الشامل

### 2. **MAIN_AGENT_FILES_GUIDE.md** ← دليل الملفات الرئيسية الاثنان
- ✅ شرح مركز على `patternAgent.js` و `forecastAgent.js`
- ✅ كيفية عملهما معًا
- ✅ أين يتم استدعاؤهما في التطبيق
- 📖 **اقرأ هذا** للانطلاق السريع

### 3. **MATH_EQUATIONS_REFERENCE.md** ← قائمة المرجعية السريعة
- ✅ جميع المعادلات في مكان واحد
- ✅ نطاقات وحدود واضحة
- ✅ أمثلة عددية فوراً
- 📖 **استخدم هذا كمرجع أثناء التطوير**

### 4. **AGENT_EXAMPLE_WALKTHROUGH.js** ← مثال عملي كامل
- ✅ 7 خطوات معالجة من البداية للنهاية
- ✅ بيانات وهمية واقعية (7 عناصر عن أزمة)
- ✅ يمكن تشغيلها مباشرة (node.js)
- ✅ كل خطوة مع شرح و output
- 📖 **شغّل هذا لفهم عملي فوري**

---

## 🗺️ خريطة الملفات الفعلية في المشروع

### الطبقة الأولى: جمع البيانات
```
src/lib/agent/
└─ ingestionAgent.js
   ├─ تصنيف تلقائي (6 فئات)
   ├─ استخراج كيانات (40+ محدودة)
   ├─ استخراج إشارات (35+ كلمات)
   ├─ حساب ثقة أولية (20-90)
   └─ إخراج: AgentItem المعايير
```

### الطبقة الثانية: التخزين والذاكرة
```
src/lib/agent/
└─ memoryAgent.js
   ├─ تخزين محلي (localStorage)
   ├─ مزامنة خادم (server sync)
   ├─ خريطة الكيانات (entity frequency)
   ├─ عد الإشارات (signal counts)
   ├─ سجل التنبؤات (forecast history)
   └─ إخراج: memoryDepth (14 مقياس)
```

### الطبقة الثالثة: اكتشاف الأنماط ⭐
```
src/lib/agent/
└─ patternAgent.js  ← MAIN FILE #1
   ├─ 1. Signal Trends (صاعد/هابط/مستقر)
   ├─ 2. Regional Pressure (high/medium/low)
   ├─ 3. Sports Momentum (+ transfer heat)
   ├─ 4. Geopolitical Escalation (5+ = high)
   ├─ 5. Market Sensitivity (5+ = high)
   ├─ 6. Entity Clusters (pairs ≥2x)
   └─ إخراج: analyzePatterns() → pattern report (0-100)
```

### الطبقة الرابعة: ربط وتنبؤ ⭐
```
src/lib/agent/
└─ forecastAgent.js  ← MAIN FILE #2
   ├─ 1. Strongest Signals (top 8)
   ├─ 2. Linked Entities (top 6)
   ├─ 3. Signal Acceleration (%)
   ├─ 4. Contradiction Level (pairs)
   ├─ 5. Historical Similarity (%)
   ├─ 6. Confidence Trend (improving/degrading/stable)
   └─ إخراج: generateForecastSupport() → forecast pkg (0-100)
```

### الطبقة الخامسة: التقييم
```
src/lib/agent/
├─ scoringAgent.js
│  ├─ 8 مكونات للعلامة
│  ├─ حجم البيانات (0-20 pts)
│  ├─ تنوع المصادر (0-15 pts)
│  ├─ الكيانات (0-15 pts)
│  ├─ الأنماط (0-15 pts)
│  ├─ الروابط (0-10 pts)
│  ├─ الإشارات (0-10 pts)
│  ├─ التنبؤات (0-10 pts)
│  └─ التنوع (0-5 pts)
│     → TOTAL: 0-100 learning score
│
└─ feedbackAgent.js
   ├─ تسجيل التنبؤات
   ├─ وزن الإشارات (0.1-2.0)
   ├─ معدلات الدقة
   └─ ضبط تلقائي
```

### الطبقة السادسة: التخزين والخادم
```
api/
├─ _agent-store.js
│  ├─ تخزين عام (2000 عنصر)
│  ├─ بناء رسم بياني الكيانات
│  ├─ بناء reasoning chain
│  └─ حساب دقة التدقيق
│
├─ agent-state.js
├─ agent-ingest.js
├─ agent-feedback.js
└─ agent-strength-audit.js
```

### الخطاف الرئيسي (React Hook)
```
src/lib/
└─ useAgentIntelligence.js
   ├─ يستدعي جميع الوكلاء
   ├─ يجمع النتائج
   ├─ يحسب حالة الوكيل (6 أنواع)
   └─ يرجع metrics شامل
```

### المكونات الواجهة (UI Components)
```
src/components/
├─ AgentDashboard.jsx          ← لوحة القيادة الرئيسية
├─ AgentCoreInterpreter.jsx    ← تفسير النتائج
├─ AgentInterpretationPanel.jsx
├─ ReasoningChainPanel.jsx     ← سلسلة التفكير
├─ PatternStrengthPanel.jsx    ← قوة الأنماط
├─ MemoryPanel.jsx             ← حالة الذاكرة
├─ ForecastConfidencePanel.jsx ← ثقة التنبؤات
└─ ... (15+ مكون آخر)
```

---

## 🔗 خريطة العلاقات بين الملفات

```
ingestionAgent.js (جمع)
    ↓
    ↓ (تحزيم AgentItem)
    ↓
memoryAgent.js (تخزين محلي)
    ↓↑
    ↓ (مزامنة)  _agent-store.js (تخزين خادم)
    ↓
patternAgent.js ⭐ (الأنماط)
    ↓
    ├─→ analyzePatterns()
    │       ↓
    │   [6 كواشف متسلسلة]
    │       ↓
    │   patternStrength (0-100)
    │
    └─→ forecastAgent.js ⭐ (التنبؤ)
            ↓
            ├─→ generateForecastSupport()
            │       ↓
            │   [6 مراحل ربط]
            │       ↓
            │   forecastReadiness (0-100)
            │
            └─→ scoringAgent.js (العلامة)
                    ↓
                    ├─→ computeAgentScore()
                    │       ↓
                    │   [8 مكونات]
                    │       ↓
                    │   learningScore (0-100)
                    │
                    └─→ feedbackAgent.js (التغذية)
                            ↓
                            └─→ markOutcome()
                                    ↓
                                    [ضبط الأوزان]
                                    ↓
                            weight ∈ [0.1, 2.0]

                                    ↓
┌───────────────────────────────────────────┐
│   useAgentIntelligence.js (خطاف React)    │
│   ← يجمع كل النتائج في metrics واحد      │
│   ← يحسب حالة الوكيل (6 أنواع)           │
│   ← يرجع البيانات للـ UI                 │
└───────────────────────────────────────────┘
        ↓
        ↓ (يتم عرضها في)
        ↓
AgentDashboard.jsx (وجهة المستخدم)
```

---

## 📊 جدول الملفات مع الوصول السريع

| الملف | الحجم | الوظيفة | الأفضلية |
|------|-------|--------|----------|
| **patternAgent.js** | ~280 سطر | اكتشاف 6 أنماط | ⭐⭐⭐ |
| **forecastAgent.js** | ~240 سطر | ربط + توقع | ⭐⭐⭐ |
| ingestionAgent.js | ~250 سطر | جمع + تطبيع | ⭐⭐ |
| memoryAgent.js | ~350 سطر | التخزين | ⭐⭐ |
| scoringAgent.js | ~120 سطر | العلامات | ⭐⭐ |
| feedbackAgent.js | ~100 سطر | التغذية الراجعة | ⭐ |
| _agent-store.js | ~400 سطر | خادم | ⭐ |
| useAgentIntelligence.js | ~150 سطر | React hook | ⭐⭐⭐ |

---

## 🔍 كيفية البحث عن أشياء محددة

### أين أجد الثقة (Confidence)؟
```
✅ ingestionAgent.js    → confidence أولية (20-90)
✅ forecastAgent.js     → confidence trend (improving/degrading)
✅ _agent-store.js      → confidence مركبة (20-95)
✅ Reasoning Chain      → confidence_composite (final)
```

### أين أجد معادلات الأنماط؟
```
✅ patternAgent.js      → 6 كواشف رئيسية
✅ MATH_EQUATIONS_REFERENCE.md → صيغ مختصرة
✅ AGENT_LOGIC_DOCUMENTATION.md → شرح مفصل
```

### أين أجد التنبؤات (Forecasts)؟
```
✅ forecastAgent.js     → generateForecastSupport()
✅ memoryAgent.js       → recordForecastSnapshot()
✅ feedbackAgent.js     → recordPrediction() + markOutcome()
✅ _agent-store.js      → buildReasoningChain()
```

### أين أجد المصادر (Sources)؟
```
✅ ingestionAgent.js    → 6 مصادر محددة
✅ memoryAgent.js       → sourceMap (خريطة المصادر)
✅ AGENT_LOGIC_DOCUMENTATION.md → قائمة كاملة
```

---

## ⚡ البدء السريع (Quick Start)

### خطوة 1: افهم الفكرة الأساسية (5 دقائق)
```
اقرأ: MAIN_AGENT_FILES_GUIDE.md
```

### خطوة 2: شاهد مثال عملي (10 دقائق)
```
شغّل: AGENT_EXAMPLE_WALKTHROUGH.js
node AGENT_EXAMPLE_WALKTHROUGH.js
```

### خطوة 3: ادرس التفاصيل الكاملة (30 دقيقة)
```
اقرأ: AGENT_LOGIC_DOCUMENTATION.md
```

### خطوة 4: ابحث عن معادلة محددة (2 دقيقة)
```
استخدم: MATH_EQUATIONS_REFERENCE.md (Ctrl+F)
```

### خطوة 5: ادرس الكود الفعلي
```
افتح الملفات الفعلية في VSCode:
- src/lib/agent/patternAgent.js
- src/lib/agent/forecastAgent.js
```

---

## 🎓 منحنى التعلم الموصى به

```
اليوم 1:
├─ اقرأ: MAIN_AGENT_FILES_GUIDE.md (فهم سريع)
├─ شغّل: AGENT_EXAMPLE_WALKTHROUGH.js (تطبيق عملي)
└─ افهم: السير الزمني للمعالجة

اليوم 2:
├─ اقرأ: AGENT_LOGIC_DOCUMENTATION.md (شامل)
├─ ركز على: patternAgent.js و forecastAgent.js
└─ افهم: كل معادلة على حدة

اليوم 3:
├─ اقرأ: MATH_EQUATIONS_REFERENCE.md (مرجع)
├─ ادرس: الملفات الفعلية
└─ تجربة: تعديل بعض المعادلات

اليوم 4+:
├─ استخدم: MATH_EQUATIONS_REFERENCE.md كمرجع أثناء التطوير
├─ عدّل: الملفات الفعلية حسب الحاجة
└─ اختبر: التغييرات بأمثلة
```

---

## ✅ قائمة التحقق من الفهم

قبل البدء بالتطوير، تأكد من فهمك لـ:

- [ ] عدد المصادر: 6
- [ ] فئات البيانات: 6
- [ ] عدد الأنماط المكتشفة: 6
- [ ] نطاق الثقة الأولية: 20-90
- [ ] نطاق قوة النمط: 0-100
- [ ] نطاق جاهزية التوقع: 0-100
- [ ] نطاق العلامة الكلية: 0-100
- [ ] نطاق وزن الإشارة: 0.1-2.0
- [ ] كيفية عمل التسارع: نسبة 12h الأخيرة / 12h السابقة
- [ ] معادلة ضبط الوزن: +0.1 على النجاح، -0.15 على الفشل

---

## 🆘 الدعم والمساعدة

### إذا اردت معرفة...
| السؤال | الملف |
|--------|--------|
| كيف يعمل النظام ككل؟ | MAIN_AGENT_FILES_GUIDE.md |
| ما المعادلات المحددة؟ | MATH_EQUATIONS_REFERENCE.md |
| شرح شامل لكل شيء؟ | AGENT_LOGIC_DOCUMENTATION.md |
| مثال عملي يعمل؟ | AGENT_EXAMPLE_WALKTHROUGH.js |
| الكود الفعلي؟ | src/lib/agent/*.js |

---

## 📝 ملاحظات مهمة

```
1. ✅ جميع المعادلات بدون تضخيم صناعي
2. ✅ كل النتائج بناءً على بيانات حقيقية فقط
3. ✅ النطاقات محدودة (saturate) لتجنب الانفجار
4. ✅ الأوزان تتحسن/تتراجع تدريجيًا (0.1 خطوة)
5. ✅ يعطي كل المكونات وقتًا لتطور متدرج
```

---

**تاريخ الإعداد**: 2026-03-22  
**آخر تحديث**: اليوم  
**الإصدار**: 1.0 - النسخة الأولى الشاملة
