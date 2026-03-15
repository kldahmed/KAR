const LIVE_QUERIES = [
  { id: "aljazeera", name: "Al Jazeera Live", flag: "🌍", query: "Al Jazeera English live" },
  { id: "france24", name: "France 24 Live", flag: "🇫🇷", query: "France 24 English live" },
  { id: "skynews", name: "Sky News Live", flag: "🇬🇧", query: "Sky News live" }
];

async function searchLiveVideo(query, apiKey) {
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    eventType: "live",
    videoEmbeddable: "true",
    maxResults: "1",
    order: "relevance",
    key: apiKey
  });

  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`YouTube live search failed: ${res.status}`);
  }

  const data = await res.json();
  const item = Array.isArray(data.items) ? data.items[0] : null;

  if (!item?.id?.videoId) return null;

  return {
    youtubeId: item.id.videoId,
    title: item.snippet?.title || query
  };
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

    const results = await Promise.all(
      LIVE_QUERIES.map(async (item) => {
        try {
          const live = await searchLiveVideo(item.query, apiKey);
          if (!live) return null;

          return {
            id: item.id,
            name: item.name,
            flag: item.flag,
            youtubeId: live.youtubeId,
            title: live.title
          };
        } catch {
          return null;
        }
      })
    );

    const channels = results.filter(Boolean);

    res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=300");

    return res.status(200).json({ channels, live: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch live channels" });
  }
}
