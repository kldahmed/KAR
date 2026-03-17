/**
 * Sports Channels Registry — Official Arabic sports broadcast channels.
 * Only official sources, official embeds, and public broadcast feeds.
 */

const SPORTS_CHANNELS = [
  // ─── UAE ────────────────────────────────────────────────────────────────────
  {
    id: "dubai-sports",
    name: "دبي الرياضية",
    nameEn: "Dubai Sports",
    country: "الإمارات",
    countryEn: "UAE",
    countryCode: "AE",
    flag: "🇦🇪",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/8/8d/Dubai_Sports_Channel_logo.png/200px-Dubai_Sports_Channel_logo.png",
    type: "official",
    streamType: "youtube",
    streamUrl: "https://www.youtube.com/results?search_query=Dubai+Sports+TV+live",
    websiteUrl: "https://www.dubaisports.ae",
    priority: 1,
    leagues: ["UAE Pro League", "UAE Cup"],
    tags: ["uae", "football", "live"],
  },
  {
    id: "abu-dhabi-sports",
    name: "أبوظبي الرياضية",
    nameEn: "Abu Dhabi Sports",
    country: "الإمارات",
    countryEn: "UAE",
    countryCode: "AE",
    flag: "🇦🇪",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Abu_Dhabi_Sports_logo.png/200px-Abu_Dhabi_Sports_logo.png",
    type: "official",
    streamType: "youtube",
    streamUrl: "https://www.youtube.com/results?search_query=Abu+Dhabi+Sports+live",
    websiteUrl: "https://www.admedia.ae",
    priority: 1,
    leagues: ["UAE Pro League", "Gulf League"],
    tags: ["uae", "football", "live"],
  },
  {
    id: "sharjah-sports",
    name: "الشارقة الرياضية",
    nameEn: "Sharjah Sports",
    country: "الإمارات",
    countryEn: "UAE",
    countryCode: "AE",
    flag: "🇦🇪",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Sharjah_Sports_logo.png/200px-Sharjah_Sports_logo.png",
    type: "official",
    streamType: "website",
    streamUrl: "https://www.sharjahtv.ae/live",
    websiteUrl: "https://www.sharjahtv.ae",
    priority: 2,
    leagues: ["UAE Pro League"],
    tags: ["uae", "football"],
  },

  // ─── Saudi Arabia ───────────────────────────────────────────────────────────
  {
    id: "ssc-sports",
    name: "SSC الرياضية",
    nameEn: "SSC Sports",
    country: "السعودية",
    countryEn: "Saudi Arabia",
    countryCode: "SA",
    flag: "🇸🇦",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/Saudi_Sports_Company_logo.svg/200px-Saudi_Sports_Company_logo.svg.png",
    type: "official",
    streamType: "website",
    streamUrl: "https://ssc.sa/live",
    websiteUrl: "https://ssc.sa",
    priority: 1,
    leagues: ["Saudi Pro League", "King Cup"],
    tags: ["saudi", "football", "live"],
  },

  // ─── Qatar ──────────────────────────────────────────────────────────────────
  {
    id: "bein-sports",
    name: "beIN Sports العربية",
    nameEn: "beIN Sports Arabic",
    country: "قطر",
    countryEn: "Qatar",
    countryCode: "QA",
    flag: "🇶🇦",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/BeIN_Sports_logo_%282017%29.svg/200px-BeIN_Sports_logo_%282017%29.svg.png",
    type: "official",
    streamType: "website",
    streamUrl: "https://www.bein.com/en/live/",
    websiteUrl: "https://www.bein.com",
    priority: 1,
    leagues: ["Champions League", "Ligue 1", "La Liga", "Serie A", "Qatar Stars League"],
    tags: ["qatar", "football", "premium", "live"],
  },
  {
    id: "al-kass-sports",
    name: "الكأس الرياضية",
    nameEn: "Al Kass Sports",
    country: "قطر",
    countryEn: "Qatar",
    countryCode: "QA",
    flag: "🇶🇦",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/Al_Kass_logo.png/200px-Al_Kass_logo.png",
    type: "official",
    streamType: "youtube",
    streamUrl: "https://www.youtube.com/@alkaboratv/streams",
    websiteUrl: "https://www.alkass.net",
    priority: 2,
    leagues: ["Qatar Stars League", "AFC Champions League"],
    tags: ["qatar", "football", "live"],
  },

  // ─── Regional ───────────────────────────────────────────────────────────────
  {
    id: "oman-sports",
    name: "عمان الرياضية",
    nameEn: "Oman Sports",
    country: "عُمان",
    countryEn: "Oman",
    countryCode: "OM",
    flag: "🇴🇲",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d1/Oman_TV_Sport_logo.png/200px-Oman_TV_Sport_logo.png",
    type: "official",
    streamType: "website",
    streamUrl: "https://www.omantv.om/live",
    websiteUrl: "https://www.omantv.om",
    priority: 3,
    leagues: ["Oman Professional League"],
    tags: ["oman", "football"],
  },
  {
    id: "kuwait-sports",
    name: "الكويت الرياضية",
    nameEn: "Kuwait Sports",
    country: "الكويت",
    countryEn: "Kuwait",
    countryCode: "KW",
    flag: "🇰🇼",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/56/KTV_Sport_logo.png/200px-KTV_Sport_logo.png",
    type: "official",
    streamType: "website",
    streamUrl: "https://www.media.gov.kw/live",
    websiteUrl: "https://www.media.gov.kw",
    priority: 3,
    leagues: ["Kuwait Premier League"],
    tags: ["kuwait", "football"],
  },
  {
    id: "bahrain-sports",
    name: "البحرين الرياضية",
    nameEn: "Bahrain Sports",
    country: "البحرين",
    countryEn: "Bahrain",
    countryCode: "BH",
    flag: "🇧🇭",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d2/Bahrain_TV_Sport_logo.png/200px-Bahrain_TV_Sport_logo.png",
    type: "official",
    streamType: "website",
    streamUrl: "https://www.btv.bh/live",
    websiteUrl: "https://www.btv.bh",
    priority: 3,
    leagues: ["Bahrain Premier League"],
    tags: ["bahrain", "football"],
  },
  {
    id: "iraq-sports",
    name: "العراقية الرياضية",
    nameEn: "Iraq Sports",
    country: "العراق",
    countryEn: "Iraq",
    countryCode: "IQ",
    flag: "🇮🇶",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/6/62/Al_Iraqiya_Sport_logo.png/200px-Al_Iraqiya_Sport_logo.png",
    type: "official",
    streamType: "youtube",
    streamUrl: "https://www.youtube.com/results?search_query=Iraqiya+Sports+live",
    websiteUrl: "https://www.imn.iq",
    priority: 3,
    leagues: ["Iraqi Premier League"],
    tags: ["iraq", "football"],
  },
  {
    id: "jordan-sports",
    name: "الأردنية الرياضية",
    nameEn: "Jordan Sports",
    country: "الأردن",
    countryEn: "Jordan",
    countryCode: "JO",
    flag: "🇯🇴",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/Jordan_TV_Sport_logo.png/200px-Jordan_TV_Sport_logo.png",
    type: "official",
    streamType: "website",
    streamUrl: "https://www.jrtv.jo/live",
    websiteUrl: "https://www.jrtv.jo",
    priority: 3,
    leagues: ["Jordan Pro League"],
    tags: ["jordan", "football"],
  },

  // ─── North Africa ───────────────────────────────────────────────────────────
  {
    id: "arryadia-morocco",
    name: "الرياضية المغربية",
    nameEn: "Arryadia",
    country: "المغرب",
    countryEn: "Morocco",
    countryCode: "MA",
    flag: "🇲🇦",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Logo_Arryadia.svg/200px-Logo_Arryadia.svg.png",
    type: "official",
    streamType: "youtube",
    streamUrl: "https://www.youtube.com/@arraboratv/streams",
    websiteUrl: "https://www.snrt.ma",
    priority: 2,
    leagues: ["Botola Pro", "CAF"],
    tags: ["morocco", "football", "live"],
  },
  {
    id: "on-time-sports",
    name: "أون تايم سبورتس",
    nameEn: "ON Time Sports",
    country: "مصر",
    countryEn: "Egypt",
    countryCode: "EG",
    flag: "🇪🇬",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/On_Time_Sports_logo.png/200px-On_Time_Sports_logo.png",
    type: "official",
    streamType: "website",
    streamUrl: "https://watch.ontimesports.com",
    websiteUrl: "https://www.ontimesports.com",
    priority: 2,
    leagues: ["Egyptian Premier League", "CAF Champions League"],
    tags: ["egypt", "football", "live"],
  },
  {
    id: "algeria-tv-sports",
    name: "التلفزيون الجزائري الرياضي",
    nameEn: "Algeria TV Sports",
    country: "الجزائر",
    countryEn: "Algeria",
    countryCode: "DZ",
    flag: "🇩🇿",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/ENTV_Logo.svg/200px-ENTV_Logo.svg.png",
    type: "official",
    streamType: "youtube",
    streamUrl: "https://www.youtube.com/results?search_query=ENTV+Sport+live",
    websiteUrl: "https://www.entv.dz",
    priority: 3,
    leagues: ["Algerian Ligue 1"],
    tags: ["algeria", "football"],
  },
  {
    id: "tunisia-watania",
    name: "الوطنية الرياضية",
    nameEn: "Tunisia Watania Sports",
    country: "تونس",
    countryEn: "Tunisia",
    countryCode: "TN",
    flag: "🇹🇳",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Watania_2_logo.svg/200px-Watania_2_logo.svg.png",
    type: "official",
    streamType: "website",
    streamUrl: "https://www.watania.tn/live",
    websiteUrl: "https://www.watania.tn",
    priority: 3,
    leagues: ["Tunisian Ligue 1", "CAF"],
    tags: ["tunisia", "football"],
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

/**
 * Given teams playing, suggest channels that likely broadcast the match.
 */
export function suggestChannelsForMatch(league) {
  const channelIds = MATCH_CHANNEL_MAP[league] || [];
  return channelIds.map(id => getChannelById(id)).filter(Boolean);
}

/**
 * Sort channels: live first, then by priority, then by country relevance (ME first).
 */
export function sortChannels(channels, liveIds = []) {
  const liveSet = new Set(liveIds);
  return [...channels].sort((a, b) => {
    const aLive = liveSet.has(a.id) ? 0 : 1;
    const bLive = liveSet.has(b.id) ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    return (a.priority || 5) - (b.priority || 5);
  });
}

export { SPORTS_CHANNELS, MATCH_CHANNEL_MAP };
