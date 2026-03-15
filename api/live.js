export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const channels = [
    {
      id: "aljazeera-mubasher",
      name: "الجزيرة مباشر",
      flag: "🇶🇦",
      mode: "external",
      externalUrl: "https://www.youtube.com/@AlJazeeraMubasher/live",
      youtubeId: "",
      title: "البث المباشر - الجزيرة مباشر"
    },
    {
      id: "alarabiya",
      name: "العربية",
      flag: "🇸🇦",
      mode: "external",
      externalUrl: "https://www.youtube.com/@AlArabiya/live",
      youtubeId: "",
      title: "البث المباشر - العربية"
    },
    {
      id: "alhadath",
      name: "الحدث",
      flag: "🇸🇦",
      mode: "external",
      externalUrl: "https://www.youtube.com/@AlHadath/live",
      youtubeId: "",
      title: "البث المباشر - الحدث"
    },
    {
      id: "skynewsarabia",
      name: "سكاي نيوز عربية",
      flag: "🇦🇪",
      mode: "external",
      externalUrl: "https://www.youtube.com/@skynewsarabia/live",
      youtubeId: "",
      title: "البث المباشر - سكاي نيوز عربية"
    },
    {
      id: "france24-ar",
      name: "فرانس 24 عربي",
      flag: "🇫🇷",
      mode: "external",
      externalUrl: "https://www.youtube.com/@FRANCE24Arabic/live",
      youtubeId: "",
      title: "البث المباشر - فرانس 24 عربي"
    },
    {
      id: "alaraby-tv",
      name: "التلفزيون العربي",
      flag: "🇶🇦",
      mode: "external",
      externalUrl: "https://www.youtube.com/@AlarabyTV/live",
      youtubeId: "",
      title: "البث المباشر - التلفزيون العربي"
    },
    {
      id: "bbc-arabic",
      name: "بي بي سي عربي",
      flag: "🇬🇧",
      mode: "external",
      externalUrl: "https://www.youtube.com/@BBCNewsArabic/live",
      youtubeId: "",
      title: "البث المباشر - بي بي سي عربي"
    },
    {
      id: "almayadeen",
      name: "الميادين",
      flag: "🇱🇧",
      mode: "external",
      externalUrl: "https://www.youtube.com/@AlMayadeenNews/live",
      youtubeId: "",
      title: "البث المباشر - الميادين"
    },
    {
      id: "alghad",
      name: "الغد",
      flag: "🇪🇬",
      mode: "external",
      externalUrl: "https://www.youtube.com/@AlGhadTV/live",
      youtubeId: "",
      title: "البث المباشر - الغد"
    },
    {
      id: "trt-arabi",
      name: "TRT عربي",
      flag: "🇹🇷",
      mode: "external",
      externalUrl: "https://www.youtube.com/@TRTarabi/live",
      youtubeId: "",
      title: "البث المباشر - TRT عربي"
    },
    {
      id: "cnbc-arabia",
      name: "CNBC عربية",
      flag: "🇦🇪",
      mode: "external",
      externalUrl: "https://www.youtube.com/@cnbcarabia/live",
      youtubeId: "",
      title: "البث المباشر - CNBC عربية"
    },
    {
      id: "syria-ikhbariyah",
      name: "الإخبارية السورية",
      flag: "🇸🇾",
      mode: "external",
      externalUrl: "https://www.youtube.com/@SyrianArabTV/live",
      youtubeId: "",
      title: "البث المباشر - الإخبارية السورية"
    },
    {
      id: "jordan-tv",
      name: "التلفزيون الأردني",
      flag: "🇯🇴",
      mode: "external",
      externalUrl: "https://www.youtube.com/@JordanTV/live",
      youtubeId: "",
      title: "البث المباشر - التلفزيون الأردني"
    },
    {
      id: "asharq-news",
      name: "الشرق للأخبار",
      flag: "🇸🇦",
      mode: "external",
      externalUrl: "https://www.youtube.com/@AsharqNews/live",
      youtubeId: "",
      title: "البث المباشر - الشرق للأخبار"
    },
    {
      id: "aljadeed",
      name: "الجديد",
      flag: "🇱🇧",
      mode: "external",
      externalUrl: "https://www.youtube.com/@aljadeednews/live",
      youtubeId: "",
      title: "البث المباشر - الجديد"
    },
    {
      id: "syria-tv",
      name: "تلفزيون سوريا",
      flag: "🇸🇾",
      mode: "external",
      externalUrl: "https://www.youtube.com/@syrialive/live",
      youtubeId: "",
      title: "البث المباشر - تلفزيون سوريا"
    },
    {
      id: "alrasheed",
      name: "الرشيد",
      flag: "🇮🇶",
      mode: "external",
      externalUrl: "https://www.youtube.com/@alrasheedmedia/live",
      youtubeId: "",
      title: "البث المباشر - الرشيد"
    },
    {
      id: "dijlah",
      name: "دجلة",
      flag: "🇮🇶",
      mode: "external",
      externalUrl: "https://www.youtube.com/@DijlahTV/live",
      youtubeId: "",
      title: "البث المباشر - دجلة"
    }
  ];

  return res.status(200).json({
    channels,
    source: "arabic-live-external-stable"
  });
}
