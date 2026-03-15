export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing YOUTUBE_API_KEY"
      });
    }

    const { category = "all" } = req.query;

    const queryMap = {
      all: "Middle East news",
      regional: "Middle East regional news",
      politics: "Middle East politics news",
      military: "Middle East military news",
      economy: "Middle East economy news"
    };

    const query = queryMap[category] || queryMap.all;

    const url =
      "https://www.googleapis.com/youtube/v3/search?" +
      new URLSearchParams({
        part: "snippet",
        q: query,
        type: "video",
        maxResults: "8",
        order: "date",
        videoEmbeddable: "true",
        regionCode: "AE",
        relevanceLanguage: "ar",
        key: apiKey
      }).toString();

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({
        error: "YouTube API request failed",
        details: errorText
      });
    }

    const data = await response.json();

    const videos = (Array.isArray(data.items) ? data.items : [])
      .map((item, i) => ({
        id: item?.id?.videoId || `v-${i}`,
        youtubeId: item?.id?.videoId || "",
        title: item?.snippet?.title || "بدون عنوان",
        channel: item?.snippet?.channelTitle || "YouTube"
      }))
      .filter((video) => /^[a-zA-Z0-9_-]{11}$/.test(video.youtubeId));

    return res.status(200).json({ videos });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch live videos"
    });
  }
}
