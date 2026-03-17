/**
 * Sports Channels Registry — Official Arabic sports broadcast channels.
 * Only official sources, official embeds, and public broadcast feeds.
 *
 * Each channel has:
 *   canEmbed  — true if an in-page iframe is legally available
 *   embedUrl  — direct embeddable URL (YouTube embed, official iframe, etc.)
 *   sourceType — "youtube" | "iframe" | "website"
 *   streamUrl — official stream / live page URL (for fallback buttons)
 *   officialUrl — network homepage
 */

const SPORTS_CHANNELS = [
  // ─── UAE ────────────────────────────────────────────────────────────────────
  {
    id: "dubai-sports",
    nameAr: "دبي الرياضية",
    nameEn: "Dubai Sports",
    country: "الإمارات",
    countryEn: "UAE",
    countryCode: "AE",
    flag: "🇦🇪",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/8/8d/Dubai_Sports_Channel_logo.png/200px-Dubai_Sports_Channel_logo.png",
    canEmbed: true,
    sourceType: "youtube",
    // Dubai Sports official YouTube channel live embed
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCxKuatEGEFL6fMXsFG-MiNA&autoplay=1",
    streamUrl: "https://www.youtube.com/@DubaiSportsChannel/streams",
    officialUrl: "https://www.dubaisports.ae",
    priority: 1,
    leagues: ["UAE Pro League", "UAE Cup"],
    currentProgram: null,
  },
  {
    id: "abu-dhabi-sports",
    nameAr: "أبوظبي الرياضية",
    nameEn: "Abu Dhabi Sports",
    country: "الإمارات",
    countryEn: "UAE",
    countryCode: "AE",
    flag: "🇦🇪",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Abu_Dhabi_Sports_logo.png/200px-Abu_Dhabi_Sports_logo.png",
    canEmbed: true,
    sourceType: "youtube",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCzIUPGnqEMYGwjZ2LgMiTeg&autoplay=1",
    streamUrl: "https://www.youtube.com/@AbuDhabiSportsTV/streams",
    officialUrl: "https://www.admedia.ae",
    priority: 1,
    leagues: ["UAE Pro League", "Gulf League"],
    currentProgram: null,
  },
  {
    id: "sharjah-sports",
    nameAr: "الشارقة الرياضية",
    nameEn: "Sharjah Sports",
    country: "الإمارات",
    countryEn: "UAE",
    countryCode: "AE",
    flag: "🇦🇪",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Sharjah_Sports_logo.png/200px-Sharjah_Sports_logo.png",
    canEmbed: true,
    sourceType: "youtube",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCkmMi0ov3rGPMwXqYPWfuNg&autoplay=1",
    streamUrl: "https://www.youtube.com/@SharjahTV/streams",
    officialUrl: "https://www.sharjahtv.ae",
    priority: 2,
    leagues: ["UAE Pro League"],
    currentProgram: null,
  },

  // ─── Saudi Arabia ───────────────────────────────────────────────────────────
  {
    id: "ssc-sports",
    nameAr: "SSC الرياضية",
    nameEn: "SSC Sports",
    country: "السعودية",
    countryEn: "Saudi Arabia",
    countryCode: "SA",
    flag: "🇸🇦",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/Saudi_Sports_Company_logo.svg/200px-Saudi_Sports_Company_logo.svg.png",
    canEmbed: false,
    sourceType: "website",
    embedUrl: null,
    streamUrl: "https://ssc.sa/live",
    officialUrl: "https://ssc.sa",
    priority: 1,
    leagues: ["Saudi Pro League", "King Cup"],
    currentProgram: null,
  },

  // ─── Qatar ──────────────────────────────────────────────────────────────────
  {
    id: "bein-sports",
    nameAr: "beIN Sports العربية",
    nameEn: "beIN Sports Arabic",
    country: "قطر",
    countryEn: "Qatar",
    countryCode: "QA",
    flag: "🇶🇦",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/BeIN_Sports_logo_%282017%29.svg/200px-BeIN_Sports_logo_%282017%29.svg.png",
    canEmbed: false,
    sourceType: "website",
    embedUrl: null,
    streamUrl: "https://www.bein.com/en/live/",
    officialUrl: "https://www.bein.com",
    priority: 1,
    leagues: ["Champions League", "Ligue 1", "La Liga", "Serie A", "Qatar Stars League"],
    currentProgram: null,
  },
  {
    id: "al-kass-sports",
    nameAr: "الكأس الرياضية",
    nameEn: "Al Kass Sports",
    country: "قطر",
    countryEn: "Qatar",
    countryCode: "QA",
    flag: "🇶🇦",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/Al_Kass_logo.png/200px-Al_Kass_logo.png",
    canEmbed: true,
    sourceType: "youtube",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCz03VHpOnBxCn3IiJnx3VEQ&autoplay=1",
    streamUrl: "https://www.youtube.com/@alkaboratv/streams",
    officialUrl: "https://www.alkass.net",
    priority: 2,
    leagues: ["Qatar Stars League", "AFC Champions League"],
    currentProgram: null,
  },

  // ─── Regional ───────────────────────────────────────────────────────────────
  {
    id: "oman-sports",
    nameAr: "عمان الرياضية",
    nameEn: "Oman Sports",
    country: "عُمان",
    countryEn: "Oman",
    countryCode: "OM",
    flag: "🇴🇲",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d1/Oman_TV_Sport_logo.png/200px-Oman_TV_Sport_logo.png",
    canEmbed: true,
    sourceType: "youtube",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCa23FnJwxr36RL2NyvGLudQ&autoplay=1",
    streamUrl: "https://www.youtube.com/@OmanTVLive/streams",
    officialUrl: "https://www.omantv.om",
    priority: 3,
    leagues: ["Oman Professional League"],
    currentProgram: null,
  },
  {
    id: "kuwait-sports",
    nameAr: "الكويت الرياضية",
    nameEn: "Kuwait Sports",
    country: "الكويت",
    countryEn: "Kuwait",
    countryCode: "KW",
    flag: "🇰🇼",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/56/KTV_Sport_logo.png/200px-KTV_Sport_logo.png",
    canEmbed: false,
    sourceType: "website",
    embedUrl: null,
    streamUrl: "https://www.media.gov.kw/live",
    officialUrl: "https://www.media.gov.kw",
    priority: 3,
    leagues: ["Kuwait Premier League"],
    currentProgram: null,
  },
  {
    id: "bahrain-sports",
    nameAr: "البحرين الرياضية",
    nameEn: "Bahrain Sports",
    country: "البحرين",
    countryEn: "Bahrain",
    countryCode: "BH",
    flag: "🇧🇭",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d2/Bahrain_TV_Sport_logo.png/200px-Bahrain_TV_Sport_logo.png",
    canEmbed: false,
    sourceType: "website",
    embedUrl: null,
    streamUrl: "https://www.btv.bh/live",
    officialUrl: "https://www.btv.bh",
    priority: 3,
    leagues: ["Bahrain Premier League"],
    currentProgram: null,
  },
  {
    id: "iraq-sports",
    nameAr: "العراقية الرياضية",
    nameEn: "Iraq Sports",
    country: "العراق",
    countryEn: "Iraq",
    countryCode: "IQ",
    flag: "🇮🇶",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/6/62/Al_Iraqiya_Sport_logo.png/200px-Al_Iraqiya_Sport_logo.png",
    canEmbed: true,
    sourceType: "youtube",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCJDz5HrifxFKGGDPPF3vTag&autoplay=1",
    streamUrl: "https://www.youtube.com/@IraqiMediaNet/streams",
    officialUrl: "https://www.imn.iq",
    priority: 3,
    leagues: ["Iraqi Premier League"],
    currentProgram: null,
  },
  {
    id: "jordan-sports",
    nameAr: "الأردنية الرياضية",
    nameEn: "Jordan Sports",
    country: "الأردن",
    countryEn: "Jordan",
    countryCode: "JO",
    flag: "🇯🇴",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/Jordan_TV_Sport_logo.png/200px-Jordan_TV_Sport_logo.png",
    canEmbed: false,
    sourceType: "website",
    embedUrl: null,
    streamUrl: "https://www.jrtv.jo/live",
    officialUrl: "https://www.jrtv.jo",
    priority: 3,
    leagues: ["Jordan Pro League"],
    currentProgram: null,
  },

  // ─── North Africa ───────────────────────────────────────────────────────────
  {
    id: "arryadia-morocco",
    nameAr: "الرياضية المغربية",
    nameEn: "Arryadia",
    country: "المغرب",
    countryEn: "Morocco",
    countryCode: "MA",
    flag: "🇲🇦",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Logo_Arryadia.svg/200px-Logo_Arryadia.svg.png",
    canEmbed: true,
    sourceType: "youtube",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UC0gFMd1_cMOaXbPD7shGWYQ&autoplay=1",
    streamUrl: "https://www.youtube.com/@SNRTLIVE/streams",
    officialUrl: "https://www.snrt.ma",
    priority: 2,
    leagues: ["Botola Pro", "CAF"],
    currentProgram: null,
  },
  {
    id: "on-time-sports",
    nameAr: "أون تايم سبورتس",
    nameEn: "ON Time Sports",
    country: "مصر",
    countryEn: "Egypt",
    countryCode: "EG",
    flag: "🇪🇬",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/On_Time_Sports_logo.png/200px-On_Time_Sports_logo.png",
    canEmbed: false,
    sourceType: "website",
    embedUrl: null,
    streamUrl: "https://watch.ontimesports.com",
    officialUrl: "https://www.ontimesports.com",
    priority: 2,
    leagues: ["Egyptian Premier League", "CAF Champions League"],
    currentProgram: null,
  },
  {
    id: "algeria-tv-sports",
    nameAr: "التلفزيون الجزائري الرياضي",
    nameEn: "Algeria TV Sports",
    country: "الجزائر",
    countryEn: "Algeria",
    countryCode: "DZ",
    flag: "🇩🇿",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/ENTV_Logo.svg/200px-ENTV_Logo.svg.png",
    canEmbed: true,
    sourceType: "youtube",
    embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCwkBmME2-7TOl8cp0V1LGDA&autoplay=1",
    streamUrl: "https://www.youtube.com/@ENABORATV/streams",
    officialUrl: "https://www.entv.dz",
    priority: 3,
    leagues: ["Algerian Ligue 1"],
    currentProgram: null,
  },
  {
    id: "tunisia-watania",
    nameAr: "الوطنية الرياضية",
    nameEn: "Tunisia Watania Sports",
    country: "تونس",
    countryEn: "Tunisia",
    countryCode: "TN",
    flag: "🇹🇳",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Watania_2_logo.svg/200px-Watania_2_logo.svg.png",
    canEmbed: false,
    sourceType: "website",
    embedUrl: null,
    streamUrl: "https://www.watania.tn/live",
    officialUrl: "https://www.watania.tn",
    priority: 3,
    leagues: ["Tunisian Ligue 1", "CAF"],
    currentProgram: null,
  },
];

/**
 * Map match teams to likely broadcasting channels.
 */
const MATCH_CHANNEL_MAP = {
  "UAE Pro League":       ["dubai-sports", "abu-dhabi-sports", "sharjah-sports"],
  "UAE Cup":              ["dubai-sports", "abu-dhabi-sports"],
  "Saudi Pro League":     ["ssc-sports"],
  "King Cup":             ["ssc-sports"],
  "Champions League":     ["bein-sports"],
  "La Liga":              ["bein-sports"],
  "Serie A":              ["bein-sports"],
  "Ligue 1":              ["bein-sports"],
  "Qatar Stars League":   ["al-kass-sports", "bein-sports"],
  "AFC Champions League": ["al-kass-sports", "bein-sports"],
  "Egyptian Premier League": ["on-time-sports"],
  "CAF Champions League": ["on-time-sports", "bein-sports"],
  "CAF":                  ["arryadia-morocco", "on-time-sports", "bein-sports"],
  "Botola Pro":           ["arryadia-morocco"],
  "Algerian Ligue 1":     ["algeria-tv-sports"],
  "Tunisian Ligue 1":     ["tunisia-watania"],
  "Oman Professional League": ["oman-sports"],
  "Kuwait Premier League":    ["kuwait-sports"],
  "Bahrain Premier League":   ["bahrain-sports"],
  "Iraqi Premier League":     ["iraq-sports"],
  "Jordan Pro League":        ["jordan-sports"],
  "Gulf League":              ["abu-dhabi-sports", "dubai-sports", "ssc-sports"],
};

export function getAllChannels() {
  return SPORTS_CHANNELS;
}

export function getChannelById(id) {
  return SPORTS_CHANNELS.find(ch => ch.id === id) || null;
}

export function getChannelsByCountry(countryCode) {
  return SPORTS_CHANNELS.filter(ch => ch.countryCode === countryCode);
}

/** Return first channel that supports in-page embed */
export function getFirstEmbeddable() {
  return SPORTS_CHANNELS.find(ch => ch.canEmbed && ch.embedUrl) || null;
}

export function suggestChannelsForMatch(league) {
  const channelIds = MATCH_CHANNEL_MAP[league] || [];
  return channelIds.map(id => getChannelById(id)).filter(Boolean);
}

/**
 * Sort channels: embeddable+live first, then live-only, then embeddable, then priority.
 */
export function sortChannels(channels, liveIds = []) {
  const liveSet = new Set(liveIds);
  return [...channels].sort((a, b) => {
    // embeddable live channels first
    const aScore = (liveSet.has(a.id) ? 0 : 2) + (a.canEmbed ? 0 : 1);
    const bScore = (liveSet.has(b.id) ? 0 : 2) + (b.canEmbed ? 0 : 1);
    if (aScore !== bScore) return aScore - bScore;
    return (a.priority || 5) - (b.priority || 5);
  });
}

export { SPORTS_CHANNELS, MATCH_CHANNEL_MAP };
