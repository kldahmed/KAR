export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing YOUTUBE_API_KEY" });
    }

    const searches = [
      "Al Jazeera Arabic live",
      "Al Arabiya live",
      "Sky News Arabia live",
      "France 24 Arabic live",
      "TRT عربي live",
      "RT Arabic live"
    ];

    const results = await Promise.all(
      searches.map(async (query, i) => {
        const url =
          "https://www.googleapis.com/youtube/v3/search?" +
          new URLSearchParams({
            part: "snippet",
            q: query,
            type: "video",
            eventType: "live",
            maxResults: "1",
            order: "relevance",
            videoEmbeddable: "true",
            key: apiKey
          }).toString();

        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();
        const item = Array.isArray(data.items) ? data.items[0] : null;
        if (!item?.id?.videoId) return null;

        return {
          id: item.id.videoId || `live-${i}`,
          name: item.snippet.channelTitle || query,
          flag: "📡",
          youtubeId: item.id.videoId,
          title: item.snippet.title || "Live"
        };
      })
    );

    const channels = results.filter(
      (item) => item && /^[a-zA-Z0-9_-]{11}$/.test(item.youtubeId)
    );

    return res.status(200).json({
      channels,
      live: true,
      source: "YouTube Live Search"
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch live feeds"
    });
  }
}
