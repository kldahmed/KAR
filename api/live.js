export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const channels = [

      {
        id: "aj",
        name: "Al Jazeera English",
        flag: "🌍",
        youtubeId: "gCNeDWCI0vo",
        title: "Al Jazeera English Live"
      },

      {
        id: "aj_ar",
        name: "Al Jazeera Arabic",
        flag: "🇶🇦",
        youtubeId: "bNyUyrR0PHo",
        title: "Al Jazeera Arabic Live"
      },

      {
        id: "alarabiya",
        name: "Al Arabiya",
        flag: "🇸🇦",
        youtubeId: "i5hT3fG6Gq8",
        title: "Al Arabiya Live"
      },

      {
        id: "sky_ar",
        name: "Sky News Arabia",
        flag: "🇦🇪",
        youtubeId: "8ZJ_S0Cq9hI",
        title: "Sky News Arabia Live"
      },

      {
        id: "fr24_ar",
        name: "France 24 Arabic",
        flag: "🇫🇷",
        youtubeId: "iS6Z8rB8f6A",
        title: "France 24 Arabic Live"
      },

      {
        id: "rt_ar",
        name: "RT Arabic",
        flag: "🇷🇺",
        youtubeId: "Z8J2dP6E8Lk",
        title: "RT Arabic Live"
      }

    ];

    return res.status(200).json({
      channels,
      live: true
    });

  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch live channels"
    });
  }
}
