export default async function handler(req, res) {

  try {

    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/search?" +
      new URLSearchParams({
        part: "snippet",
        q: "Middle East live news",
        type: "video",
        eventType: "live",
        maxResults: "10",
        order: "viewCount",
        key: process.env.YOUTUBE_API_KEY
      })
    );

    const data = await response.json();

    const channels = (data.items || []).map((item, i) => ({
      id: item.id.videoId || `live-${i}`,
      name: item.snippet.channelTitle,
      flag: "📡",
      youtubeId: item.id.videoId,
      title: item.snippet.title
    }));

    res.status(200).json({
      channels,
      live: true,
      source: "YouTube Live"
    });

  } catch (error) {

    res.status(500).json({
      error: "Failed to fetch live feeds"
    });

  }

}
