export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { category = "all" } = req.query;

    const allVideos = [
      {
        id: "1",
        youtubeId: "gCNeDWCI0vo",
        title: "Al Jazeera English - Live",
        channel: "Al Jazeera English",
        category: "all"
      },
      {
        id: "2",
        youtubeId: "Ap-UM1O9RBU",
        title: "France 24 English - Live",
        channel: "France 24 English",
        category: "all"
      },
      {
        id: "3",
        youtubeId: "gCNeDWCI0vo",
        title: "متابعة مباشرة للتطورات الإقليمية",
        channel: "Al Jazeera English",
        category: "regional"
      },
      {
        id: "4",
        youtubeId: "Ap-UM1O9RBU",
        title: "تحليل سياسي مباشر",
        channel: "France 24 English",
        category: "politics"
      },
      {
        id: "5",
        youtubeId: "gCNeDWCI0vo",
        title: "قراءة عسكرية للمشهد الحالي",
        channel: "Al Jazeera English",
        category: "military"
      },
      {
        id: "6",
        youtubeId: "Ap-UM1O9RBU",
        title: "تغطية اقتصادية مباشرة",
        channel: "France 24 English",
        category: "economy"
      }
    ];

    const videos =
      category === "all"
        ? allVideos
        : allVideos.filter(
            (item) => item.category === category || item.category === "all"
          );

    return res.status(200).json({ videos, live: false, source: "Static YouTube channels" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch videos" });
  }
}
