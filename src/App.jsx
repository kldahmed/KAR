import { useState, useEffect, useCallback, useRef, memo } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────────
// ⚠️ ضع مفتاح Anthropic API هنا
const API_KEY = "sk-ant-api03-XXXX...مفتاحك...";
const AUTO_REFRESH_MINUTES = 10;

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "news",   label: "الأخبار",  icon: "📰" },
  { id: "videos", label: "فيديوهات", icon: "🎬" },
  { id: "live",   label: "بث مباشر", icon: "📡" },
];

const CATEGORIES = [
  { id: "all",    label: "الكل",     emoji: "🌐" },
  { id: "iran",   label: "إيران",    emoji: "🇮🇷" },
  { id: "gulf",   label: "الخليج",   emoji: "🇸🇦" },
  { id: "usa",    label: "أمريكا",   emoji: "🇺🇸" },
  { id: "israel", label: "إسرائيل",  emoji: "🇮🇱" },
];

const CAT_COLORS = {
  iran:   { accent:"#c0392b", glow:"rgba(192,57,43,.4)",   light:"#e74c3c", bg:"#140606" },
  gulf:   { accent:"#16a085", glow:"rgba(22,160,133,.4)",  light:"#1abc9c", bg:"#061410" },
  usa:    { accent:"#2471a3", glow:"rgba(36,113,163,.4)",  light:"#3498db", bg:"#060c14" },
  israel: { accent:"#7d3c98", glow:"rgba(125,60,152,.4)",  light:"#9b59b6", bg:"#0a0612" },
  all:    { accent:"#c0392b", glow:"rgba(192,57,43,.4)",   light:"#e74c3c", bg:"#0d0d0d" },
};

const URGENCY_MAP = {
  high:   { label:"🔴 عاجل",   color:"#e74c3c", pulse:true  },
  medium: { label:"🟡 مهم",    color:"#f39c12", pulse:false },
  low:    { label:"⚪ متابعة", color:"#7f8c8d", pulse:false },
};

const CAT_UNSPLASH = {
  iran:   ["photo-1597852074816-d57796d60ea6","photo-1564419320461-6870880221ad","photo-1576086213369-97a306d36557"],
  gulf:   ["photo-1512632578888-169bbbc64f33","photo-1555448248-2571daf6344b","photo-1469041797191-50ace28483c3"],
  usa:    ["photo-1515187029135-18ee286d815b","photo-1501594907352-04cda38ebc29","photo-1473091534298-04dcbce3278c"],
  israel: ["photo-1544967082-d9d25d867d66","photo-1582555172866-f73bb12a2ab3","photo-1570957392122-7768e3cfc3d6"],
};

const LIVE_CHANNELS = [
  { id:"aljazeera_ar", name:"الجزيرة",           flag:"🇶🇦", color:"#c8960c", desc:"قناة الجزيرة الإخبارية",  youtubeId:"B0Bzmln-Z2Y" },
  { id:"alarabiya",    name:"العربية",            flag:"🇸🇦", color:"#1a6abf", desc:"قناة العربية الإخبارية",  youtubeId:"oMoiMq9FnQs" },
  { id:"aljazeera_en", name:"Al Jazeera English", flag:"🌐",  color:"#c8960c", desc:"Al Jazeera English Live", youtubeId:"h3MuIUNCCLI" },
  { id:"france24_ar",  name:"فرانس 24 عربي",     flag:"🇫🇷", color:"#c0392b", desc:"فرانس 24 عربي",          youtubeId:"vLjFSJFaHRk" },
  { id:"bbc_arabic",   name:"BBC عربي",           flag:"🇬🇧", color:"#cc0000", desc:"بي بي سي عربي",          youtubeId:"8qoLDMH8pnk" },
  { id:"sky_news_ar",  name:"سكاي نيوز عربية",   flag:"🇦🇪", color:"#0066cc", desc:"سكاي نيوز عربية",        youtubeId:"HHpTBCGQpgk" },
];

// ─── DEMO DATA (shown when no API key) ─────────────────────────────────────────
const DEMO_NEWS = [
  { title:"مناورات عسكرية إيرانية في مضيق هرمز", summary:"أجرت إيران مناورات عسكرية واسعة النطاق في مضيق هرمز تضمنت محاكاة لإغلاق المضيق أمام الملاحة الدولية.", category:"iran", urgency:"high", time:"منذ 2 ساعة", imageKeyword:"military" },
  { title:"القمة الخليجية تبحث التصعيد الإيراني", summary:"انعقدت قمة طارئة لدول مجلس التعاون الخليجي لبحث التطورات الأمنية المتصاعدة في المنطقة.", category:"gulf", urgency:"high", time:"منذ 3 ساعات", imageKeyword:"summit" },
  { title:"الأسطول الأمريكي الخامس يعزز وجوده في الخليج", summary:"أرسلت الولايات المتحدة تعزيزات بحرية إضافية إلى منطقة الخليج العربي ردًا على التوترات المتصاعدة.", category:"usa", urgency:"medium", time:"منذ 5 ساعات", imageKeyword:"navy" },
  { title:"إسرائيل تكشف عن منظومة دفاعية جديدة", summary:"كشفت إسرائيل عن منظومة دفاعية متطورة مصممة لاعتراض الصواريخ الباليستية الإيرانية بعيدة المدى.", category:"israel", urgency:"medium", time:"منذ 6 ساعات", imageKeyword:"defense" },
  { title:"إيران تعلن رفع مستوى تخصيب اليورانيوم", summary:"أعلنت إيران عن رفع مستوى تخصيب اليورانيوم في منشأة نطنز مما أثار قلقًا دوليًا واسعًا.", category:"iran", urgency:"high", time:"منذ 8 ساعات", imageKeyword:"nuclear" },
  { title:"الرياض وطهران تستأنفان المحادثات الدبلوماسية", summary:"استأنفت المملكة العربية السعودية وإيران جولة جديدة من المحادثات الدبلوماسية بوساطة صينية.", category:"gulf", urgency:"low", time:"منذ 10 ساعات", imageKeyword:"diplomacy" },
];

const DEMO_VIDEOS = [
  { title:"التوترات الإيرانية الأمريكية في الخليج", description:"تقرير شامل عن آخر التطورات العسكرية", youtubeId:"dQw4w9WgXcQ", category:"iran", duration:"8:24" },
  { title:"القدرات العسكرية الإسرائيلية في مواجهة إيران", description:"تحليل معمق للقوة العسكرية الإسرائيلية", youtubeId:"dQw4w9WgXcQ", category:"israel", duration:"12:10" },
  { title:"دول الخليج واستراتيجية الأمن الإقليمي", description:"كيف تتعامل دول الخليج مع التهديدات", youtubeId:"dQw4w9WgXcQ", category:"gulf", duration:"6:45" },
  { title:"الوجود العسكري الأمريكي في الشرق الأوسط", description:"تقرير عن القواعد والأساطيل الأمريكية", youtubeId:"dQw4w9WgXcQ", category:"usa", duration:"9:30" },
  { title:"البرنامج النووي الإيراني: آخر المستجدات", description:"تحديث عن الملف النووي الإيراني", youtubeId:"dQw4w9WgXcQ", category:"iran", duration:"15:20" },
  { title:"مناطق التوتر في الشرق الأوسط 2025", description:"خريطة التوترات في المنطقة", youtubeId:"dQw4w9WgXcQ", category:"all", duration:"11:05" },
];

// ─── API ────────────────────────────────────────────────────────────────────────
const NEWS_PROMPTS = {
  all:    `آخر 6 أخبار عاجلة عن التوترات بين إيران ودول الخليج وأمريكا وإسرائيل. أجب بـ JSON فقط بدون أي نص أو markdown، المصفوفة تبدأ بـ [ مباشرة: [{"title":"...","summary":"جملتين على الأقل...","category":"iran","urgency":"high","time":"منذ X ساعة","imageKeyword":"english"}]`,
  iran:   `آخر 6 أخبار عن إيران في سياق التوترات الإقليمية. JSON فقط يبدأ بـ [: [{"title":"...","summary":"...","category":"iran","urgency":"high|medium|low","time":"منذ X ساعة","imageKeyword":"english"}]`,
  gulf:   `آخر 6 أخبار عن دول الخليج في سياق التوترات مع إيران. JSON فقط يبدأ بـ [: [{"title":"...","summary":"...","category":"gulf","urgency":"high|medium|low","time":"منذ X ساعة","imageKeyword":"english"}]`,
  usa:    `آخر 6 أخبار عن أمريكا في الشرق الأوسط. JSON فقط يبدأ بـ [: [{"title":"...","summary":"...","category":"usa","urgency":"high|medium|low","time":"منذ X ساعة","imageKeyword":"english"}]`,
  israel: `آخر 6 أخبار عن إسرائيل وإيران. JSON فقط يبدأ بـ [: [{"title":"...","summary":"...","category":"israel","urgency":"high|medium|low","time":"منذ X ساعة","imageKeyword":"english"}]`,
};

const VIDEO_PROMPTS = {
  all:    `أعطني 6 مقاطع يوتيوب حقيقية (بمعرفات صحيحة 11 حرف) عن الصراعات في الشرق الأوسط 2024-2025. JSON فقط يبدأ بـ [: [{"title":"...","description":"...","youtubeId":"REAL_11CHAR_ID","category":"iran|gulf|usa|israel","duration":"X:XX"}]`,
  iran:   `6 فيديوهات يوتيوب حقيقية عن إيران 2024-2025. JSON فقط: [{"title":"...","description":"...","youtubeId":"REAL_ID","category":"iran","duration":"X:XX"}]`,
  gulf:   `6 فيديوهات يوتيوب حقيقية عن الخليج 2024-2025. JSON فقط: [{"title":"...","description":"...","youtubeId":"REAL_ID","category":"gulf","duration":"X:XX"}]`,
  usa:    `6 فيديوهات يوتيوب حقيقية عن أمريكا والشرق الأوسط 2024-2025. JSON فقط: [{"title":"...","description":"...","youtubeId":"REAL_ID","category":"usa","duration":"X:XX"}]`,
  israel: `6 فيديوهات يوتيوب حقيقية عن إسرائيل وإيران 2024-2025. JSON فقط: [{"title":"...","description":"...","youtubeId":"REAL_ID","category":"israel","duration":"X:XX"}]`,
};

function getImg(catId, seed) {
  const arr = CAT_UNSPLASH[catId] || CAT_UNSPLASH.iran;
  return `https://images.unsplash.com/${arr[seed % arr.length]}?w=600&q=75&auto=format&fit=crop`;
}

// FIX: better JSON extraction — greedy match + multi-attempt parsing
function extractJSON(text) {
  // Try to find JSON array
  const attempts = [
    text.match(/(\[[\s\S]*\])/),        // greedy - full array
text.match(/(\[[\s\S]*?\])(?=\s*$)/m), // to end of string
    text.match(/\[[\s\S]+\]/),           // any array
