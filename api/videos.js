export default async function handler(req, res) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing YOUTUBE_API_KEY"
      });
    }

    const query = "Middle East news";

    const url =
      "https://www.googleapis.com/youtube/v3/search?" +
      new URLSearchParams({
        part: "snippet",
        q: query,
        type: "video",
        maxResults: "8",
        order: "date",
        videoEmbeddable: "true",
        key: apiKey
      });

    const response = await fetch(url);
    const data = await response.json();

    const videos = (data.items || []).map((item, i) => ({
      id: item.id.videoId || `v-${i}`,
      youtubeId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle
    }));

    res.status(200).json({ videos });

  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch live videos"
    });
  }
}
