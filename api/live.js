export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const channels = [
    // UAE
    { id: "skynewsarabia", name: "سكاي نيوز عربية", country: "الإمارات", countryCode: "AE", flag: "🇦🇪", genre: "news", mode: "embed", youtubeId: "U--OjmpjF5o", title: "سكاي نيوز عربية مباشر" },
    { id: "cnbc-arabia", name: "CNBC عربية", country: "الإمارات", countryCode: "AE", flag: "🇦🇪", genre: "business", mode: "embed", youtubeId: "pQSTFsOtrH0", title: "CNBC عربية مباشر" },
    { id: "dubai-tv", name: "تلفزيون دبي", country: "الإمارات", countryCode: "AE", flag: "🇦🇪", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@DubaiTV/streams", youtubeId: "", title: "تلفزيون دبي مباشر" },
    { id: "dubai-one", name: "Dubai One", country: "الإمارات", countryCode: "AE", flag: "🇦🇪", genre: "general", mode: "external", externalUrl: "https://www.dmi.ae/live", youtubeId: "", title: "Dubai One Live" },
    { id: "ad-tv", name: "أبوظبي TV", country: "الإمارات", countryCode: "AE", flag: "🇦🇪", genre: "general", mode: "external", externalUrl: "https://www.adtv.ae", youtubeId: "", title: "أبوظبي TV مباشر" },
    { id: "dubai-sports-live", name: "دبي الرياضية", country: "الإمارات", countryCode: "AE", flag: "🇦🇪", genre: "sports", mode: "external", externalUrl: "https://www.youtube.com/@DubaiSportsChannel/streams", youtubeId: "", title: "دبي الرياضية مباشر" },

    // Saudi Arabia
    { id: "alarabiya", name: "العربية", country: "السعودية", countryCode: "SA", flag: "🇸🇦", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@AlArabiya/streams", youtubeId: "", title: "العربية مباشر" },
    { id: "alhadath", name: "الحدث", country: "السعودية", countryCode: "SA", flag: "🇸🇦", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@AlHadath/streams", youtubeId: "", title: "الحدث مباشر" },
    { id: "asharq-news", name: "الشرق للأخبار", country: "السعودية", countryCode: "SA", flag: "🇸🇦", genre: "news", mode: "embed", youtubeId: "f6VpkfV7m4Y", title: "الشرق للأخبار مباشر" },
    { id: "saudi-news", name: "الإخبارية السعودية", country: "السعودية", countryCode: "SA", flag: "🇸🇦", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@alekhbariyatv/streams", youtubeId: "", title: "الإخبارية السعودية مباشر" },
    { id: "saudi-quran", name: "السعودية قرآن", country: "السعودية", countryCode: "SA", flag: "🇸🇦", genre: "religion", mode: "external", externalUrl: "https://www.youtube.com/@QuranTVSaudi/streams", youtubeId: "", title: "قناة القرآن الكريم مباشر" },
    { id: "ssc-sports-live", name: "SSC الرياضية", country: "السعودية", countryCode: "SA", flag: "🇸🇦", genre: "sports", mode: "external", externalUrl: "https://ssc.sa/live", youtubeId: "", title: "SSC مباشر" },

    // Qatar
    { id: "aljazeera", name: "الجزيرة", country: "قطر", countryCode: "QA", flag: "🇶🇦", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@AljazeeraArabic/streams", youtubeId: "", title: "الجزيرة مباشر" },
    { id: "aljazeera-mubasher", name: "الجزيرة مباشر", country: "قطر", countryCode: "QA", flag: "🇶🇦", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@aljazeeramubasher/streams", youtubeId: "", title: "الجزيرة مباشر Live" },
    { id: "alaraby-news", name: "العربي أخبار", country: "قطر", countryCode: "QA", flag: "🇶🇦", genre: "news", mode: "embed", youtubeId: "e2RgSa1Wt5o", title: "العربي أخبار مباشر" },
    { id: "alrayyan", name: "الريان", country: "قطر", countryCode: "QA", flag: "🇶🇦", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@AlrayyanTV/streams", youtubeId: "", title: "الريان مباشر" },
    { id: "alkass", name: "الكأس الرياضية", country: "قطر", countryCode: "QA", flag: "🇶🇦", genre: "sports", mode: "external", externalUrl: "https://www.youtube.com/@alkaboratv/streams", youtubeId: "", title: "الكأس مباشر" },

    // Egypt
    { id: "alghad", name: "الغد", country: "مصر", countryCode: "EG", flag: "🇪🇬", genre: "news", mode: "embed", youtubeId: "4N5jTVWB7vA", title: "الغد مباشر" },
    { id: "extra-news", name: "إكسترا نيوز", country: "مصر", countryCode: "EG", flag: "🇪🇬", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@ExtraNewsEgypt/streams", youtubeId: "", title: "إكسترا نيوز مباشر" },
    { id: "on-tv", name: "ON", country: "مصر", countryCode: "EG", flag: "🇪🇬", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@ONTVEGY/streams", youtubeId: "", title: "ON مباشر" },
    { id: "dmc", name: "dmc", country: "مصر", countryCode: "EG", flag: "🇪🇬", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@dmcegypt/streams", youtubeId: "", title: "dmc مباشر" },
    { id: "cbc-eg", name: "CBC", country: "مصر", countryCode: "EG", flag: "🇪🇬", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@cbcegypt/streams", youtubeId: "", title: "CBC مباشر" },
    { id: "ontime-sports-live", name: "أون تايم سبورتس", country: "مصر", countryCode: "EG", flag: "🇪🇬", genre: "sports", mode: "external", externalUrl: "https://watch.ontimesports.com", youtubeId: "", title: "أون تايم سبورتس مباشر" },

    // Lebanon
    { id: "almayadeen", name: "الميادين", country: "لبنان", countryCode: "LB", flag: "🇱🇧", genre: "news", mode: "embed", youtubeId: "jLlb3ryS-HM", title: "الميادين مباشر" },
    { id: "aljadeed", name: "الجديد", country: "لبنان", countryCode: "LB", flag: "🇱🇧", genre: "news", mode: "embed", youtubeId: "Pg2paSZ1byM", title: "الجديد مباشر" },
    { id: "lbc", name: "LBCI", country: "لبنان", countryCode: "LB", flag: "🇱🇧", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@LBCI/streams", youtubeId: "", title: "LBCI مباشر" },
    { id: "mtv-lebanon", name: "MTV Lebanon", country: "لبنان", countryCode: "LB", flag: "🇱🇧", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@MTVLebanon/streams", youtubeId: "", title: "MTV Lebanon مباشر" },
    { id: "nbn-lebanon", name: "NBN", country: "لبنان", countryCode: "LB", flag: "🇱🇧", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@NBNLebanon/streams", youtubeId: "", title: "NBN مباشر" },

    // Iraq
    { id: "alrasheed", name: "الرشيد", country: "العراق", countryCode: "IQ", flag: "🇮🇶", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@alrasheedmedia/live", youtubeId: "", title: "الرشيد مباشر" },
    { id: "dijlah", name: "دجلة", country: "العراق", countryCode: "IQ", flag: "🇮🇶", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@DijlahTV/live", youtubeId: "", title: "دجلة مباشر" },
    { id: "aliraqiya", name: "العراقية الإخبارية", country: "العراق", countryCode: "IQ", flag: "🇮🇶", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@IraqiMediaNet/streams", youtubeId: "", title: "العراقية مباشر" },
    { id: "utv-iraq", name: "UTV العراق", country: "العراق", countryCode: "IQ", flag: "🇮🇶", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@UTVIraq/streams", youtubeId: "", title: "UTV مباشر" },
    { id: "sharqiya", name: "الشرقية", country: "العراق", countryCode: "IQ", flag: "🇮🇶", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@AlsharqiyaNews/streams", youtubeId: "", title: "الشرقية مباشر" },

    // Jordan
    { id: "almamlaka", name: "المملكة", country: "الأردن", countryCode: "JO", flag: "🇯🇴", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@AlMamlakaTV/streams", youtubeId: "", title: "المملكة مباشر" },
    { id: "roya", name: "رؤيا", country: "الأردن", countryCode: "JO", flag: "🇯🇴", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@RoyaTV/streams", youtubeId: "", title: "رؤيا مباشر" },
    { id: "jordan-tv", name: "التلفزيون الأردني", country: "الأردن", countryCode: "JO", flag: "🇯🇴", genre: "general", mode: "external", externalUrl: "https://www.jrtv.gov.jo/stream", youtubeId: "", title: "التلفزيون الأردني مباشر" },

    // Kuwait
    { id: "kuwait-tv", name: "تلفزيون الكويت", country: "الكويت", countryCode: "KW", flag: "🇰🇼", genre: "general", mode: "external", externalUrl: "https://www.media.gov.kw/live", youtubeId: "", title: "تلفزيون الكويت مباشر" },
    { id: "kuwait-news", name: "الكويت الإخبارية", country: "الكويت", countryCode: "KW", flag: "🇰🇼", genre: "news", mode: "external", externalUrl: "https://www.media.gov.kw/live", youtubeId: "", title: "الكويت الإخبارية مباشر" },
    { id: "atv-kuwait", name: "ATV الكويت", country: "الكويت", countryCode: "KW", flag: "🇰🇼", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@atvkuwait/streams", youtubeId: "", title: "ATV الكويت مباشر" },

    // Bahrain
    { id: "bahrain-tv", name: "تلفزيون البحرين", country: "البحرين", countryCode: "BH", flag: "🇧🇭", genre: "general", mode: "external", externalUrl: "https://www.bahrain.bh/wps/portal/MediaCenter_ar", youtubeId: "", title: "تلفزيون البحرين مباشر" },
    { id: "bahrain-sports-live", name: "البحرين الرياضية", country: "البحرين", countryCode: "BH", flag: "🇧🇭", genre: "sports", mode: "external", externalUrl: "https://www.btv.bh/live", youtubeId: "", title: "البحرين الرياضية مباشر" },

    // Oman
    { id: "oman-tv", name: "تلفزيون عمان", country: "عُمان", countryCode: "OM", flag: "🇴🇲", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@OmanTVLive/streams", youtubeId: "", title: "تلفزيون عمان مباشر" },
    { id: "oman-sports-live", name: "عمان الرياضية", country: "عُمان", countryCode: "OM", flag: "🇴🇲", genre: "sports", mode: "external", externalUrl: "https://www.youtube.com/@OmanTVLive/streams", youtubeId: "", title: "عمان الرياضية مباشر" },

    // Morocco
    { id: "aloula", name: "الأولى المغربية", country: "المغرب", countryCode: "MA", flag: "🇲🇦", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@SNRTnews/streams", youtubeId: "", title: "الأولى مباشر" },
    { id: "2m-maroc", name: "2M", country: "المغرب", countryCode: "MA", flag: "🇲🇦", genre: "general", mode: "external", externalUrl: "https://www.2m.ma/ar/live", youtubeId: "", title: "2M مباشر" },
    { id: "arryadia", name: "الرياضية المغربية", country: "المغرب", countryCode: "MA", flag: "🇲🇦", genre: "sports", mode: "external", externalUrl: "https://www.youtube.com/@SNRTLIVE/streams", youtubeId: "", title: "الرياضية المغربية مباشر" },

    // Algeria
    { id: "entv", name: "ENTV الجزائر", country: "الجزائر", countryCode: "DZ", flag: "🇩🇿", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@ENTVAlgerie/streams", youtubeId: "", title: "ENTV مباشر" },
    { id: "echorouk", name: "الشروق نيوز", country: "الجزائر", countryCode: "DZ", flag: "🇩🇿", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@EchoroukNewsTV/streams", youtubeId: "", title: "الشروق مباشر" },
    { id: "ennahar", name: "النهار الجزائرية", country: "الجزائر", countryCode: "DZ", flag: "🇩🇿", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@EnnaharTv-Official/streams", youtubeId: "", title: "النهار مباشر" },

    // Tunisia
    { id: "watania1", name: "الوطنية 1", country: "تونس", countryCode: "TN", flag: "🇹🇳", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@WataniaReplay/streams", youtubeId: "", title: "الوطنية 1 مباشر" },
    { id: "attessia", name: "التاسعة", country: "تونس", countryCode: "TN", flag: "🇹🇳", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@AttessiaTV/streams", youtubeId: "", title: "التاسعة مباشر" },
    { id: "hannibal", name: "حنبعل", country: "تونس", countryCode: "TN", flag: "🇹🇳", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@HannibalTV/streams", youtubeId: "", title: "حنبعل مباشر" },

    // Syria
    { id: "syria-tv", name: "تلفزيون سوريا", country: "سوريا", countryCode: "SY", flag: "🇸🇾", genre: "news", mode: "embed", youtubeId: "ZN0aK3V0ds0", title: "تلفزيون سوريا مباشر" },
    { id: "sama-tv", name: "سما", country: "سوريا", countryCode: "SY", flag: "🇸🇾", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@SamaTVOfficial/streams", youtubeId: "", title: "سما مباشر" },

    // Palestine
    { id: "palestine-tv", name: "فلسطين الرسمية", country: "فلسطين", countryCode: "PS", flag: "🇵🇸", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@PalestineTV/streams", youtubeId: "", title: "فلسطين الرسمية مباشر" },
    { id: "palestine-today", name: "فلسطين اليوم", country: "فلسطين", countryCode: "PS", flag: "🇵🇸", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@PalTodayTV/streams", youtubeId: "", title: "فلسطين اليوم مباشر" },

    // Libya
    { id: "libya-ahrar", name: "ليبيا الأحرار", country: "ليبيا", countryCode: "LY", flag: "🇱🇾", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@LibyaAhrarTV/streams", youtubeId: "", title: "ليبيا الأحرار مباشر" },
    { id: "wasat-libya", name: "ليبيا الوسط", country: "ليبيا", countryCode: "LY", flag: "🇱🇾", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@LibyaAlwasatTV/streams", youtubeId: "", title: "ليبيا الوسط مباشر" },

    // Sudan
    { id: "sudan-tv", name: "تلفزيون السودان", country: "السودان", countryCode: "SD", flag: "🇸🇩", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@SudanTVofficial/streams", youtubeId: "", title: "تلفزيون السودان مباشر" },

    // Yemen
    { id: "yemen-shabab", name: "يمن شباب", country: "اليمن", countryCode: "YE", flag: "🇾🇪", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@YemenShababTV/streams", youtubeId: "", title: "يمن شباب مباشر" },
    { id: "yemen-today", name: "اليمن اليوم", country: "اليمن", countryCode: "YE", flag: "🇾🇪", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@YemenToday/streams", youtubeId: "", title: "اليمن اليوم مباشر" },

    // Mauritania
    { id: "almouritaniya", name: "الموريتانية", country: "موريتانيا", countryCode: "MR", flag: "🇲🇷", genre: "general", mode: "external", externalUrl: "https://www.youtube.com/@AlMouritaniyaTV/streams", youtubeId: "", title: "الموريتانية مباشر" },

    // International Arabic channels
    { id: "france24-ar", name: "فرانس 24 عربي", country: "دولي", countryCode: "INT", flag: "🌍", genre: "news", mode: "embed", youtubeId: "3ursYA8HMeo", title: "فرانس 24 عربي مباشر" },
    { id: "bbc-arabic", name: "BBC عربي", country: "دولي", countryCode: "INT", flag: "🌍", genre: "news", mode: "embed", youtubeId: "O1pGmVtj2Y8", title: "BBC عربي مباشر" },
    { id: "trt-arabi", name: "TRT عربي", country: "دولي", countryCode: "INT", flag: "🌍", genre: "news", mode: "embed", youtubeId: "0YBF1h2oFcM", title: "TRT عربي مباشر" },
    { id: "rt-arabic", name: "RT Arabic", country: "دولي", countryCode: "INT", flag: "🌍", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@RTarabic/streams", youtubeId: "", title: "RT Arabic Live" },
    { id: "dw-arabic", name: "DW عربية", country: "دولي", countryCode: "INT", flag: "🌍", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@dw_arabic/streams", youtubeId: "", title: "DW عربية مباشر" },
    { id: "cgtn-arabic", name: "CGTN Arabic", country: "دولي", countryCode: "INT", flag: "🌍", genre: "news", mode: "external", externalUrl: "https://www.youtube.com/@cgtnarabic/streams", youtubeId: "", title: "CGTN Arabic Live" }
  ];

  const countries = channels.reduce((acc, ch) => {
    const key = ch.countryCode || "OTHER";
    const current = acc[key] || { country: ch.country || "غير مصنف", countryCode: key, flag: ch.flag || "🌍", count: 0 };
    current.count += 1;
    acc[key] = current;
    return acc;
  }, {});

  return res.status(200).json({
    channels,
    source: "arabic-live-channels",
    stats: {
      totalChannels: channels.length,
      totalCountries: Object.keys(countries).length,
      countries: Object.values(countries).sort((a, b) => b.count - a.count),
    },
  });
}
