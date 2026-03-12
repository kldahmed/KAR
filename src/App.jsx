import { useState, useEffect, useCallback, useRef, memo } from "react";

// CONFIG
const API_KEY = "YOUR_ANTHROPIC_API_KEY";
const AUTO_REFRESH_MINUTES = 10;

const TABS = [
  { id: "news",   label: "الاخبار",  icon: "📰" },
  { id: "videos", label: "فيديوهات", icon: "🎬" },
  { id: "live",   label: "بث مباشر", icon: "📡" },
];

const CATEGORIES = [
  { id: "all",    label: "الكل",     emoji: "🌐" },
  { id: "iran",   label: "ايران",    emoji: "🇮🇷" },
  { id: "gulf",   label: "الخليج",   emoji: "🇦🇪" },
  { id: "usa",    label: "امريكا",   emoji: "🇺🇸" },
  { id: "israel", label: "اسرائيل",  emoji: "🇮🇱" },
];

const CAT_COLORS = {
  iran:   { accent: "#c0392b", glow: "rgba(192,57,43,.4)",  light: "#e74c3c", bg: "#140606" },
  gulf:   { accent: "#00732f", glow: "rgba(0,115,47,.4)",   light: "#00c44f", bg: "#031408" },
  usa:    { accent: "#2471a3", glow: "rgba(36,113,163,.4)", light: "#3498db", bg: "#060c14" },
  israel: { accent: "#7d3c98", glow: "rgba(125,60,152,.4)", light: "#9b59b6", bg: "#0a0612" },
  all:    { accent: "#c8960c", glow: "rgba(200,150,12,.4)", light: "#f0b429", bg: "#0d0b04" },
};

const URGENCY_MAP = {
  high:   { label: "عاجل",   color: "#e74c3c", pulse: true  },
  medium: { label: "مهم",    color: "#f39c12", pulse: false },
  low:    { label: "متابعة", color: "#7f8c8d", pulse: false },
};

const CAT_UNSPLASH = {
  iran:   ["photo-1597852074816-d57796d60ea6","photo-1564419320461-6870880221ad","photo-1576086213369-97a306d36557"],
  gulf:   ["photo-1512632578888-169bbbc64f33","photo-1555448248-2571daf6344b","photo-1512453979798-5ea266f8880c"],
  usa:    ["photo-1515187029135-18ee286d815b","photo-1501594907352-04cda38ebc29","photo-1473091534298-04dcbce3278c"],
  israel: ["photo-1544967082-d9d25d867d66","photo-1582555172866-f73bb12a2ab3","photo-1570957392122-7768e3cfc3d6"],
};

const LIVE_CHANNELS = [
  { id: "aljazeera_ar", name: "الجزيرة",           flag: "🇶🇦", color: "#c8960c", desc: "قناة الجزيرة",       youtubeId: "B0Bzmln-Z2Y" },
  { id: "alarabiya",    name: "العربية",            flag: "🇸🇦", color: "#1a6abf", desc: "قناة العربية",       youtubeId: "oMoiMq9FnQs" },
  { id: "aljazeera_en", name: "Al Jazeera English", flag: "🌐",  color: "#c8960c", desc: "Al Jazeera English", youtubeId: "h3MuIUNCCLI" },
  { id: "france24_ar",  name: "فرانس 24",           flag: "🇫🇷", color: "#c0392b", desc: "فرانس 24 عربي",      youtubeId: "vLjFSJFaHRk" },
  { id: "bbc_arabic",   name: "BBC عربي",           flag: "🇬🇧", color: "#cc0000", desc: "بي بي سي عربي",      youtubeId: "8qoLDMH8pnk" },
  { id: "sky_news_ar",  name: "سكاي نيوز",          flag: "🇦🇪", color: "#0066cc", desc: "سكاي نيوز عربية",    youtubeId: "HHpTBCGQpgk" },
];

const DEMO_NEWS = [
  { title: "مناورات عسكرية ايرانية في مضيق هرمز", summary: "اجرت ايران مناورات عسكرية واسعة النطاق في مضيق هرمز تضمنت محاكاة لاغلاق المضيق امام الملاحة الدولية.", category: "iran", urgency: "high", time: "منذ 2 ساعة" },
  { title: "القمة الخليجية تبحث التصعيد الاقليمي", summary: "انعقدت قمة طارئة لدول مجلس التعاون الخليجي لبحث التطورات الامنية المتصاعدة في المنطقة.", category: "gulf", urgency: "high", time: "منذ 3 ساعات" },
  { title: "الاسطول الامريكي يعزز وجوده في الخليج", summary: "ارسلت الولايات المتحدة تعزيزات بحرية اضافية الى منطقة الخليج العربي ردا على التوترات المتصاعدة.", category: "usa", urgency: "medium", time: "منذ 5 ساعات" },
  { title: "اسرائيل تكشف عن منظومة دفاعية جديدة", summary: "كشفت اسرائيل عن منظومة دفاعية متطورة مصممة لاعتراض الصواريخ الباليستية الايرانية.", category: "israel", urgency: "medium", time: "منذ 6 ساعات" },
  { title: "ايران ترفع مستوى تخصيب اليورانيوم", summary: "اعلنت ايران عن رفع مستوى تخصيب اليورانيوم في منشاة نطنز مما اثار قلقا دوليا.", category: "iran", urgency: "high", time: "منذ 8 ساعات" },
  { title: "الرياض وطهران تستانفان المحادثات", summary: "استانفت المملكة العربية السعودية وايران جولة جديدة من المحادثات الدبلوماسية بوساطة صينية.", category: "gulf", urgency: "low", time: "منذ 10 ساعات" },
];

const DEMO_VIDEOS = [
  { title: "التوترات الايرانية الامريكية في الخليج", description: "تقرير شامل عن اخر التطورات العسكرية", youtubeId: "dQw4w9WgXcQ", category: "iran", duration: "8:24" },
  { title: "القدرات العسكرية الاسرائيلية", description: "تحليل معمق للقوة العسكرية الاسرائيلية", youtubeId: "dQw4w9WgXcQ", category: "israel", duration: "12:10" },
  { title: "دول الخليج واستراتيجية الامن", description: "كيف تتعامل دول الخليج مع التهديدات", youtubeId: "dQw4w9WgXcQ", category: "gulf", duration: "6:45" },
  { title: "الوجود العسكري الامريكي في الشرق الاوسط", description: "تقرير عن القواعد والاساطيل الامريكية", youtubeId: "dQw4w9WgXcQ", category: "usa", duration: "9:30" },
  { title: "البرنامج النووي الايراني: اخر المستجدات", description: "تحديث عن الملف النووي الايراني", youtubeId: "dQw4w9WgXcQ", category: "iran", duration: "15:20" },
  { title: "مناطق التوتر في الشرق الاوسط 2025", description: "خريطة التوترات في المنطقة", youtubeId: "dQw4w9WgXcQ", category: "all", duration: "11:05" },
];

const NEWS_PROMPTS = {
  all:    "اخر 6 اخبار عاجلة عن ايران والخليج وامريكا واسرائيل. JSON فقط يبدا بـ [: [{\"title\":\"...\",\"summary\":\"جملتين...\",\"category\":\"iran\",\"urgency\":\"high\",\"time\":\"منذ X ساعة\"}]",
  iran:   "اخر 6 اخبار عن ايران. JSON فقط يبدا بـ [: [{\"title\":\"...\",\"summary\":\"...\",\"category\":\"iran\",\"urgency\":\"high|medium|low\",\"time\":\"منذ X ساعة\"}]",
  gulf:   "اخر 6 اخبار عن الخليج. JSON فقط يبدا بـ [: [{\"title\":\"...\",\"summary\":\"...\",\"category\":\"gulf\",\"urgency\":\"high|medium|low\",\"time\":\"منذ X ساعة\"}]",
  usa:    "اخر 6 اخبار عن امريكا في الشرق الاوسط. JSON فقط يبدا بـ [: [{\"title\":\"...\",\"summary\":\"...\",\"category\":\"usa\",\"urgency\":\"high|medium|low\",\"time\":\"منذ X ساعة\"}]",
  israel: "اخر 6 اخبار عن اسرائيل. JSON فقط يبدا بـ [: [{\"title\":\"...\",\"summary\":\"...\",\"category\":\"israel\",\"urgency\":\"high|medium|low\",\"time\":\"منذ X ساعة\"}]",
};

const VIDEO_PROMPTS = {
  all:    "6 فيديوهات يوتيوب حقيقية عن الشرق الاوسط 2024-2025. JSON فقط يبدا بـ [: [{\"title\":\"...\",\"description\":\"...\",\"youtubeId\":\"REAL_ID\",\"category\":\"iran\",\"duration\":\"X:XX\"}]",
  iran:   "6 فيديوهات يوتيوب حقيقية عن ايران 2025. JSON: [{\"title\":\"...\",\"description\":\"...\",\"youtubeId\":\"ID\",\"category\":\"iran\",\"duration\":\"X:XX\"}]",
  gulf:   "6 فيديوهات يوتيوب حقيقية عن الخليج 2025. JSON: [{\"title\":\"...\",\"description\":\"...\",\"youtubeId\":\"ID\",\"category\":\"gulf\",\"duration\":\"X:XX\"}]",
  usa:    "6 فيديوهات يوتيوب حقيقية عن امريكا والشرق الاوسط 2025. JSON: [{\"title\":\"...\",\"description\":\"...\",\"youtubeId\":\"ID\",\"category\":\"usa\",\"duration\":\"X:XX\"}]",
  israel: "6 فيديوهات يوتيوب حقيقية عن اسرائيل 2025. JSON: [{\"title\":\"...\",\"description\":\"...\",\"youtubeId\":\"ID\",\"category\":\"israel\",\"duration\":\"X:XX\"}]",
};

function getImg(catId, seed) {
  var arr = CAT_UNSPLASH[catId] || CAT_UNSPLASH.iran;
  return "https://images.unsplash.com/" + arr[seed % arr.length] + "?w=600&q=75&auto=format&fit=crop";
}

function extractJSON(text) {
  var m1 = text.match(/(\[[\s\S]*\])/);
  if (m1) { try { return JSON.parse(m1[1]); } catch(e) {} }
  var m2 = text.match(/\[[\s\S]+\]/);
  if (m2) { try { return JSON.parse(m2[0]); } catch(e) {} }
  throw new Error("no json");
}

async function callClaude(prompt, retries) {
  if (retries === undefined) retries = 2;
  if (!API_KEY || API_KEY === "YOUR_ANTHROPIC_API_KEY") throw new Error("NO_API_KEY");
  for (var i = 0; i <= retries; i++) {
    try {
      var res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-calls": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var data = await res.json();
      var txt = "";
      if (data.content) {
        for (var b = 0; b < data.content.length; b++) {
          if (data.content[b].type === "text") { txt = data.content[b].text; break; }
        }
      }
      return extractJSON(txt);
    } catch(e) {
      if (e.message === "NO_API_KEY") throw e;
      if (i === retries) throw e;
      await new Promise(function(r) { setTimeout(r, 1000 * (i + 1)); });
    }
  }
}

function FalconSVG(props) {
  var s = props.size || 36;
  var c = props.color || "#c8960c";
  return (
    <svg width={s} height={s} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="28" rx="11" ry="14" fill={c}/>
      <path d="M29 32 Q16 50 8 70 Q26 57 40 59 Q54 57 72 70 Q64 50 51 32" fill={c} opacity="0.88"/>
      <path d="M40 44 L40 68" stroke={c} strokeWidth="2.5" opacity="0.6"/>
      <circle cx="35" cy="23" r="2.5" fill="#0a0800"/>
      <path d="M40 17 Q44 11 47 15" stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M8 70 Q26 62 40 64 Q54 62 72 70" stroke={c} strokeWidth="1.2" fill="none" opacity="0.4"/>
    </svg>
  );
}

function UAEBar() {
  return (
    <div style={{ display: "flex", height: "3px", width: "100%", overflow: "hidden", borderRadius: "1px" }}>
      <div style={{ flex: 1, background: "#00732f" }} />
      <div style={{ flex: 1, background: "#ffffff22" }} />
      <div style={{ flex: 1, background: "#111" }} />
      <div style={{ width: "22%", background: "#c0392b" }} />
    </div>
  );
}

const NewsCard = memo(function NewsCard(props) {
  var item = props.item;
  var index = props.index;
  var s1 = useState(false); var open = s1[0]; var setOpen = s1[1];
  var s2 = useState(false); var imgErr = s2[0]; var setImgErr = s2[1];
  var col = CAT_COLORS[item.category] || CAT_COLORS.all;
  var urg = URGENCY_MAP[item.urgency] || URGENCY_MAP.medium;
  var cat = CATEGORIES.find(function(c) { return c.id === item.category; });
  return (
    <div onClick={function() { setOpen(function(v) { return !v; }); }} style={{
      background: "linear-gradient(155deg," + col.bg + " 0%,#060606 100%)",
      border: "1px solid " + (open ? col.accent + "cc" : "rgba(255,255,255,.07)"),
      borderRadius: "14px", overflow: "hidden", cursor: "pointer",
      transition: "all .25s", position: "relative",
      boxShadow: open ? "0 0 30px " + col.glow : "0 2px 14px rgba(0,0,0,.7)",
    }}>
      {!imgErr && (
        <div style={{ position: "relative", height: "148px", overflow: "hidden" }}>
          <img src={getImg(item.category, index)} alt="" onError={function() { setImgErr(true); }}
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(.58) saturate(.65)" }} loading="lazy" />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,rgba(0,0,0,.05) 25%," + col.bg + " 100%)" }} />
          <div style={{ position: "absolute", top: 10, right: 10, background: urg.color + "ee", color: "#fff", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", gap: "5px" }}>
            {urg.pulse && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "pulse 1s infinite" }} />}
            {urg.label}
          </div>
          {cat && <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,.78)", color: col.light, borderRadius: "20px", padding: "3px 9px", fontSize: "11px" }}>{cat.emoji} {cat.label}</div>}
        </div>
      )}
      <div style={{ padding: "12px 15px 10px" }}>
        <div style={{ color: "#2e2e2e", fontSize: "10px", marginBottom: "5px", textAlign: "right", fontFamily: "monospace" }}>{item.time}</div>
        <h3 style={{ color: "#ede9e1", fontSize: "14px", fontWeight: "700", lineHeight: "1.7", margin: 0, direction: "rtl", textAlign: "right" }}>{item.title}</h3>
        {open && (
          <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.9", margin: "10px 0 0", direction: "rtl", textAlign: "right", borderTop: "1px solid " + col.accent + "33", paddingTop: "10px" }}>
            {item.summary}
          </p>
        )}
        <div style={{ color: "#1e1e1e", fontSize: "10px", textAlign: "center", marginTop: "8px" }}>{open ? "▲" : "▼ التفاصيل"}</div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: "linear-gradient(180deg," + col.accent + ",transparent)" }} />
    </div>
  );
});

const VideoCard = memo(function VideoCard(props) {
  var item = props.item;
  var index = props.index;
  var s1 = useState(false); var playing = s1[0]; var setPlaying = s1[1];
  var col = CAT_COLORS[item.category] || CAT_COLORS.all;
  var cat = CATEGORIES.find(function(c) { return c.id === item.category; });
  return (
    <div style={{
      background: "#0d0d0d", border: "1px solid " + (playing ? col.accent + "99" : "rgba(255,255,255,.07)"),
      borderRadius: "14px", overflow: "hidden",
      boxShadow: playing ? "0 0 28px " + col.glow : "0 2px 12px rgba(0,0,0,.5)",
      transition: "border-color .25s, box-shadow .25s",
    }}>
      {playing ? (
        <div style={{ position: "relative", paddingBottom: "56.25%", background: "#000" }}>
          <iframe style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            src={"https://www.youtube.com/embed/" + item.youtubeId + "?autoplay=1&rel=0&modestbranding=1"}
            title={item.title} allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
        </div>
      ) : (
        <div onClick={function() { setPlaying(true); }} style={{ position: "relative", cursor: "pointer" }}>
          <img src={"https://img.youtube.com/vi/" + item.youtubeId + "/mqdefault.jpg"} alt={item.title}
            style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block", filter: "brightness(.72)" }} loading="lazy"
            onError={function(e) { e.target.src = getImg(item.category, index); }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(220,0,0,.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(220,0,0,.5)" }}>
              <span style={{ color: "#fff", fontSize: "19px", marginRight: "-2px" }}>&#9654;</span>
            </div>
          </div>
          {item.duration && <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,.85)", color: "#fff", borderRadius: "4px", padding: "2px 7px", fontSize: "11px", fontWeight: "700" }}>{item.duration}</div>}
          {cat && <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.75)", color: col.light, borderRadius: "20px", padding: "2px 9px", fontSize: "11px" }}>{cat.emoji} {cat.label}</div>}
        </div>
      )}
      <div style={{ padding: "11px 14px 10px" }}>
        <h3 style={{ color: "#eee", fontSize: "13px", fontWeight: "600", lineHeight: "1.6", margin: 0, direction: "rtl", textAlign: "right" }}>{item.title}</h3>
        {item.description && <p style={{ color: "#444", fontSize: "12px", margin: "5px 0 0", direction: "rtl", textAlign: "right" }}>{item.description}</p>}
        {playing && <button onClick={function() { setPlaying(false); }} style={{ marginTop: "8px", background: "#1a1a1a", border: "1px solid #333", color: "#888", borderRadius: "6px", padding: "4px 12px", cursor: "pointer", fontSize: "12px", width: "100%", fontFamily: "inherit" }}>X اغلاق</button>}
      </div>
    </div>
  );
});

function ChannelCard(props) {
  var ch = props.ch; var active = props.active; var onSelect = props.onSelect;
  return (
    <div onClick={function() { onSelect(ch); }} style={{
      background: active ? ch.color + "22" : "#0f0f0f",
      border: "1px solid " + (active ? ch.color + "88" : "rgba(255,255,255,.07)"),
      borderRadius: "12px", padding: "11px 13px", cursor: "pointer",
      display: "flex", alignItems: "center", gap: "10px", transition: "all .2s",
      boxShadow: active ? "0 0 14px " + ch.color + "44" : "none",
    }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: ch.color + "22", border: "2px solid " + ch.color + "55", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px", flexShrink: 0, position: "relative" }}>
        {ch.flag}
        {active && <span style={{ position: "absolute", top: -3, right: -3, width: 9, height: 9, borderRadius: "50%", background: "#e74c3c", border: "2px solid #080808", animation: "pulse 1s infinite" }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: active ? "#fff" : "#bbb", fontWeight: "700", fontSize: "12.5px" }}>{ch.name}</div>
        <div style={{ color: "#2e2e2e", fontSize: "11px", marginTop: "1px" }}>{ch.desc}</div>
      </div>
      <div style={{ background: active ? "#e74c3c" : "#1a1a1a", color: active ? "#fff" : "#2e2e2e", borderRadius: "6px", padding: "4px 9px", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>
        {active ? "LIVE" : "▶"}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="news-grid">
      {[0,1,2,3,4,5].map(function(i) {
        return (
          <div key={i} style={{ background: "#0f0f0f", borderRadius: "14px", overflow: "hidden", opacity: 0.45 + i * 0.04 }}>
            <div style={{ height: "148px", background: "#161616" }} />
            <div style={{ padding: "13px 15px" }}>
              <div style={{ height: "9px", width: "48px", background: "#1c1c1c", borderRadius: "4px", marginBottom: "9px" }} />
              <div style={{ height: "13px", background: "#191919", borderRadius: "4px", marginBottom: "6px" }} />
              <div style={{ height: "13px", width: "68%", background: "#181818", borderRadius: "4px" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NoApiKeyBanner() {
  return (
    <div style={{ background: "linear-gradient(135deg,#100c00,#0a0a0a)", border: "1px solid #c8960c33", borderRadius: "14px", padding: "20px", marginBottom: "18px", direction: "rtl", textAlign: "right" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <FalconSVG size={24} color="#c8960c" />
        <span style={{ color: "#c8960c", fontWeight: "800", fontSize: "14px" }}>مطلوب: مفتاح API للاخبار الحقيقية</span>
      </div>
      <div style={{ color: "#666", fontSize: "12.5px", lineHeight: "2" }}>
        1. افتح <span style={{ color: "#3498db" }}>console.anthropic.com</span> وانشئ API key
        <br/>2. افتح <span style={{ color: "#e74c3c" }}>src/App.jsx</span> في GitHub
        <br/>3. غير: <span style={{ color: "#2ecc71", fontFamily: "monospace", fontSize: "11px" }}>const API_KEY = "sk-ant-..."</span>
      </div>
      <div style={{ marginTop: "10px", color: "#333", fontSize: "11px" }}>العرض ادناه: بيانات نموذجية توضيحية</div>
    </div>
  );
}

export default function Dashboard() {
  var s; 
  s = useState("news"); var tab = s[0]; var setTab = s[1];
  s = useState("all"); var cat = s[0]; var setCat = s[1];
  s = useState([]); var news = s[0]; var setNews = s[1];
  s = useState([]); var videos = s[0]; var setVideos = s[1];
  s = useState(false); var loadN = s[0]; var setLoadN = s[1];
  s = useState(false); var loadV = s[0]; var setLoadV = s[1];
  s = useState(null); var errN = s[0]; var setErrN = s[1];
  s = useState(null); var errV = s[0]; var setErrV = s[1];
  s = useState(LIVE_CHANNELS[0]); var liveCh = s[0]; var setLiveCh = s[1];
  s = useState("WAR UPDATE BY K.A.R — متابعة مستمرة للاحداث الاقليمية"); var ticker = s[0]; var setTicker = s[1];
  s = useState(null); var updated = s[0]; var setUpdated = s[1];
  s = useState(false); var noKey = s[0]; var setNoKey = s[1];
  s = useState(AUTO_REFRESH_MINUTES * 60); var nextRefresh = s[0]; var setNextRefresh = s[1];
  s = useState(""); var clockTime = s[0]; var setClockTime = s[1];

  var nCache = useRef({});
  var vCache = useRef({});

  useEffect(function() {
    function tick() {
      setClockTime(new Date().toLocaleTimeString("ar-AE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
    tick();
    var t = setInterval(tick, 1000);
    return function() { clearInterval(t); };
  }, []);

  var fetchNews = useCallback(function(c, force) {
    if (!force && nCache.current[c]) { setNews(nCache.current[c]); return; }
    setLoadN(true); setErrN(null); setNoKey(false);
    callClaude(NEWS_PROMPTS[c]).then(function(items) {
      nCache.current[c] = items;
      setNews(items);
      setUpdated(new Date().toLocaleTimeString("ar-AE"));
      setTicker(items.map(function(i) { return "🔴 " + i.title; }).join("   |   "));
      setNextRefresh(AUTO_REFRESH_MINUTES * 60);
    }).catch(function(e) {
      if (e.message === "NO_API_KEY") {
        setNoKey(true); setNews(DEMO_NEWS);
        setTicker(DEMO_NEWS.map(function(i) { return "📌 " + i.title; }).join("   |   "));
      } else { setErrN("تعذر تحميل الاخبار"); }
    }).finally(function() { setLoadN(false); });
  }, []);

  var fetchVideos = useCallback(function(c, force) {
    if (!force && vCache.current[c]) { setVideos(vCache.current[c]); return; }
    setLoadV(true); setErrV(null);
    callClaude(VIDEO_PROMPTS[c]).then(function(items) {
      vCache.current[c] = items; setVideos(items);
    }).catch(function(e) {
      if (e.message === "NO_API_KEY") setVideos(DEMO_VIDEOS);
      else setErrV("تعذر تحميل الفيديوهات");
    }).finally(function() { setLoadV(false); });
  }, []);

  useEffect(function() {
    var t = setInterval(function() {
      setNextRefresh(function(p) {
        if (p <= 1) { nCache.current = {}; fetchNews(cat, true); return AUTO_REFRESH_MINUTES * 60; }
        return p - 1;
      });
    }, 1000);
    return function() { clearInterval(t); };
  }, [cat, fetchNews]);

  useEffect(function() { fetchNews(cat); }, [cat, fetchNews]);
  useEffect(function() { if (tab === "videos") fetchVideos(cat); }, [tab, cat, fetchVideos]);

  function changeCat(id) { if (id === cat) return; nCache.current = {}; vCache.current = {}; setCat(id); }
  function refresh() { nCache.current = {}; vCache.current = {}; fetchNews(cat, true); if (tab === "videos") fetchVideos(cat, true); setNextRefresh(AUTO_REFRESH_MINUTES * 60); }
  function fmtCountdown(n) { return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0"); }

  var gold = "#c8960c";
  var goldL = "#f0b429";
  var green = "#00732f";

  return (
    <div style={{ minHeight: "100vh", background: "#060606", color: "#e4e0d8", direction: "rtl", fontFamily: "'Cairo','Noto Sans Arabic',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.15}}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes glow{0%,100%{text-shadow:0 0 18px rgba(200,150,12,.45)}50%{text-shadow:0 0 38px rgba(200,150,12,.85)}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        .news-grid,.vid-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(272px,1fr));gap:15px}
        @media(max-width:620px){.news-grid,.vid-grid{grid-template-columns:1fr!important}.live-layout{grid-template-columns:1fr!important}.hdr{flex-direction:column!important}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#c8960c33}
      `}</style>

      {/* UAE flag stripe top */}
      <div style={{ height: "4px", display: "flex" }}>
        <div style={{ width: "22%", background: "#c0392b" }} />
        <div style={{ flex: 1, background: "#00732f" }} />
        <div style={{ flex: 1, background: "#fff2" }} />
        <div style={{ flex: 1, background: "#000" }} />
      </div>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(180deg,#0c0900 0%,#060606 100%)", borderBottom: "1px solid " + gold + "2a", padding: "14px 20px 0" }}>
        <div className="hdr" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", gap: "12px", flexWrap: "wrap" }}>

          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ animation: "float 3.5s ease-in-out infinite" }}>
              <FalconSVG size={44} color={gold} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "19px", fontWeight: "900", color: goldL, animation: "glow 3s infinite", letterSpacing: "2px" }}>WAR UPDATE</span>
                <span style={{ color: "#444", fontSize: "12px" }}>by</span>
                <span style={{ color: gold, fontSize: "17px", fontWeight: "900", letterSpacing: "4px" }}>K.A.R</span>
                <span style={{ fontSize: "13px" }}>🇦🇪</span>
              </div>
              <div style={{ marginTop: "5px", marginBottom: "4px" }}>
                <UAEBar />
              </div>
              <div style={{ color: "#252525", fontSize: "9px", letterSpacing: "2px" }}>MIDDLE EAST INTELLIGENCE DASHBOARD</div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ background: "#0d0a01", border: "1px solid " + gold + "25", borderRadius: "8px", padding: "5px 11px", minWidth: "80px", textAlign: "center" }}>
              <div style={{ color: "#2a2a2a", fontSize: "9px", letterSpacing: "1px", marginBottom: "2px" }}>UAE TIME</div>
              <div style={{ color: gold, fontSize: "12px", fontFamily: "monospace", fontWeight: "700" }}>{clockTime}</div>
            </div>
            <div style={{ background: "#0d0a01", border: "1px solid " + green + "33", borderRadius: "8px", padding: "5px 11px", minWidth: "80px", textAlign: "center" }}>
              <div style={{ color: "#2a2a2a", fontSize: "9px", letterSpacing: "1px", marginBottom: "2px" }}>REFRESH IN</div>
              <div style={{ color: green, fontSize: "12px", fontFamily: "monospace", fontWeight: "700" }}>{fmtCountdown(nextRefresh)}</div>
            </div>
            <button onClick={refresh} disabled={loadN || loadV} style={{ background: "rgba(200,150,12,.1)", border: "1px solid " + gold + "44", color: gold, borderRadius: "9px", padding: "8px 15px", cursor: "pointer", fontSize: "13px", fontWeight: "700", fontFamily: "inherit", transition: "all .2s", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ display: "inline-block", animation: (loadN || loadV) ? "spin 1s linear infinite" : "none", fontSize: "14px" }}>⟳</span>
              {(loadN || loadV) ? "..." : "تحديث"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "3px" }}>
          {TABS.map(function(t) {
            var active = tab === t.id;
            return (
              <button key={t.id} onClick={function() { setTab(t.id); }} style={{ background: active ? "rgba(200,150,12,.16)" : "transparent", border: "1px solid " + (active ? gold + "77" : "rgba(255,255,255,.05)"), color: active ? goldL : "#333", borderRadius: "8px 8px 0 0", padding: "8px 16px", cursor: "pointer", fontSize: "13px", fontWeight: active ? "700" : "400", fontFamily: "inherit", transition: "all .2s", display: "flex", alignItems: "center", gap: "6px" }}>
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>

        {/* Categories */}
        {tab !== "live" && (
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", padding: "8px 0 0" }}>
            {CATEGORIES.map(function(c) {
              var active = cat === c.id;
              return (
                <button key={c.id} onClick={function() { changeCat(c.id); }} style={{ background: active ? CAT_COLORS[c.id].accent + "25" : "rgba(255,255,255,.025)", border: "1px solid " + (active ? CAT_COLORS[c.id].accent + "77" : "rgba(255,255,255,.06)"), color: active ? CAT_COLORS[c.id].light : "#333", borderRadius: "6px", padding: "5px 12px", cursor: "pointer", fontSize: "12px", fontWeight: active ? "700" : "400", fontFamily: "inherit", transition: "all .2s" }}>
                  {c.emoji} {c.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* TICKER */}
      <div style={{ background: "#07060000", borderBottom: "1px solid " + gold + "15", padding: "6px 0", overflow: "hidden", background: "#070500" }}>
        <div style={{ whiteSpace: "nowrap", animation: "ticker 65s linear infinite", display: "inline-block" }}>
          <span style={{ color: gold, fontSize: "11.5px", padding: "0 40px", letterSpacing: "0.3px" }}>{ticker}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ticker}</span>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: "18px 20px 50px" }}>

        {/* NEWS TAB */}
        {tab === "news" && (
          <div>
            {noKey && <NoApiKeyBanner />}
            {loadN && <Skeleton />}
            {errN && !loadN && (
              <div style={{ textAlign: "center", color: "#e74c3c", padding: "40px 20px" }}>
                ⚠️ {errN}<br/>
                <button onClick={function() { fetchNews(cat, true); }} style={{ marginTop: "14px", background: "rgba(200,150,12,.1)", border: "1px solid " + gold + "44", color: gold, borderRadius: "8px", padding: "8px 18px", cursor: "pointer", fontFamily: "inherit", fontSize: "13px" }}>
                  اعادة المحاولة
                </button>
              </div>
            )}
            {!loadN && news.length > 0 && (
              <div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "15px", flexWrap: "wrap", alignItems: "center" }}>
                  {["high","medium","low"].map(function(u) {
                    var n = news.filter(function(x) { return x.urgency === u; }).length;
                    if (!n) return null;
                    return (
                      <div key={u} style={{ background: URGENCY_MAP[u].color + "16", border: "1px solid " + URGENCY_MAP[u].color + "30", borderRadius: "8px", padding: "4px 11px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: URGENCY_MAP[u].color, animation: u === "high" ? "pulse 1s infinite" : "none" }} />
                        <span style={{ color: URGENCY_MAP[u].color, fontSize: "12px", fontWeight: "700" }}>{n} {URGENCY_MAP[u].label}</span>
                      </div>
                    );
                  })}
                  <span style={{ color: "#1a1a1a", fontSize: "11px", marginRight: "auto" }}>{news.length} خبر {updated ? "— " + updated : ""}</span>
                </div>
                <div className="news-grid">
                  {news.map(function(item, i) { return <NewsCard key={i} item={item} index={i} />; })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIDEOS TAB */}
        {tab === "videos" && (
          <div>
            {loadV && <Skeleton />}
            {errV && !loadV && (
              <div style={{ textAlign: "center", color: "#e74c3c", padding: "40px 20px" }}>
                ⚠️ {errV}<br/>
                <button onClick={function() { fetchVideos(cat, true); }} style={{ marginTop: "14px", background: "rgba(200,150,12,.1)", border: "1px solid " + gold + "44", color: gold, borderRadius: "8px", padding: "8px 18px", cursor: "pointer", fontFamily: "inherit", fontSize: "13px" }}>
                  اعادة المحاولة
                </button>
              </div>
            )}
            {!loadV && videos.length > 0 && (
              <div className="vid-grid">
                {videos.map(function(v, i) { return <VideoCard key={i} item={v} index={i} />; })}
              </div>
            )}
            {!loadV && !errV && videos.length === 0 && (
              <div style={{ textAlign: "center", color: "#1e1e1e", padding: "60px 20px", fontSize: "14px" }}>اضغط تحديث لتحميل الفيديوهات</div>
            )}
          </div>
        )}

        {/* LIVE TAB */}
        {tab === "live" && (
          <div className="live-layout" style={{ display: "grid", gridTemplateColumns: "1fr 285px", gap: "15px", alignItems: "start" }}>
            <div style={{ background: "#0a0800", borderRadius: "16px", overflow: "hidden", border: "1px solid " + gold + "2a" }}>
              <div style={{ padding: "10px 14px", background: "#0d0b00", borderBottom: "1px solid " + gold + "1a", display: "flex", alignItems: "center", gap: "9px", flexWrap: "wrap" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#e74c3c", display: "inline-block", animation: "pulse 1s infinite" }} />
                <span style={{ color: "#e74c3c", fontWeight: "900", fontSize: "11px", letterSpacing: "2px" }}>LIVE</span>
                <span style={{ color: "#555", fontSize: "12px" }}>{liveCh.flag} {liveCh.name}</span>
                <a href={"https://www.youtube.com/watch?v=" + liveCh.youtubeId} target="_blank" rel="noopener noreferrer"
                  style={{ marginRight: "auto", background: "#cc0000dd", color: "#fff", borderRadius: "6px", padding: "5px 11px", fontSize: "11px", fontWeight: "700", textDecoration: "none" }}>
                  ▶ YouTube
                </a>
              </div>
              <div style={{ position: "relative", paddingBottom: "56.25%", background: "#000" }}>
                <iframe key={liveCh.id}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                  src={"https://www.youtube.com/embed/" + liveCh.youtubeId + "?autoplay=1&rel=0&modestbranding=1"}
                  title={liveCh.name} allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
              </div>
              <div style={{ padding: "9px 14px", background: "#080600", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ color: "#222", fontSize: "11px" }}>لا يعمل البث داخل الموقع؟</span>
                <a href={"https://www.youtube.com/watch?v=" + liveCh.youtubeId} target="_blank" rel="noopener noreferrer"
                  style={{ background: "rgba(204,0,0,.12)", border: "1px solid rgba(204,0,0,.35)", color: "#ff4444", borderRadius: "6px", padding: "5px 13px", fontSize: "11.5px", fontWeight: "700", textDecoration: "none" }}>
                  شاهد على YouTube
                </a>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              <div style={{ color: gold + "55", fontSize: "9px", marginBottom: "4px", fontWeight: "700", letterSpacing: "2.5px" }}>LIVE CHANNELS</div>
              {LIVE_CHANNELS.map(function(ch) { return <ChannelCard key={ch.id} ch={ch} active={liveCh.id === ch.id} onSelect={setLiveCh} />; })}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: "1px solid " + gold + "15", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <FalconSVG size={16} color={gold + "55"} />
          <span style={{ color: "#1a1a1a", fontSize: "10px", letterSpacing: "1.5px" }}>WAR UPDATE BY K.A.R 🇦🇪</span>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ color: "#161616", fontSize: "10px" }}>للاغراض الاخبارية فقط</span>
          <div style={{ display: "flex", height: "10px", width: "30px", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ width: "22%", background: "#c0392b" }} />
            <div style={{ flex: 1, background: "#00732f" }} />
            <div style={{ flex: 1, background: "#fff2" }} />
            <div style={{ flex: 1, background: "#111" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
