function mapCategoryToQuery(category) {
  switch (category) {
    case "regional":
      return "Middle East live news";
    case "politics":
      return "Middle East politics live";
    case "military":
      return "Middle East war live analysis";
    case "economy":
      return "Middle East economy live news";
    default:
      return "Middle East live news";
  }
}

async function youtubeSearch(query, apiKey) {
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    eventType: "live",
    videoEmbeddable: "true",
    maxResults: "8",
    order: "date",
    regionCode: "AE",
    relevanceLanguage: "ar",
    key: apiKey
  });

  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`YouTube search failed: ${res.status}`);
  }

  const data = await res.json();

  return (Array.isArray(data.items) ? data.items : [])
    .map((item, index) => ({
      id: item.id?.videoId || `video-${index}`,
      youtubeId: item.id?.videoId || "",
      title: item.snippet?.title || "بث مباشر",
      channel: item.snippet?.channelTitle || "YouTube",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString()
    }))
    .filter((v) => /^[a-zA-Z0-9_-]{11}$/.test(v.youtubeId));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing YOUTUBE_API_KEY" });
    }

    const { category = "all" } = req.query;
    const query = mapCategoryToQuery(category);

    const videos = await youtubeSearch(query, apiKey);

    res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=300");

    return res.status(200).json({ videos, live: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch live videos" });
  }
}
