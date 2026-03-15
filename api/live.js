export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({
    channels: [
      {
        id: "aj-en",
        name: "Al Jazeera English",
        flag: "🌍",
        youtubeId: "gCNeDWCI0vo",
        title: "Al Jazeera English Live"
      },
      {
        id: "fr24-en",
        name: "France 24 English",
        flag: "🇫🇷",
        youtubeId: "Ap-UM1O9RBU",
        title: "France 24 English Live"
      }
    ]
  });
}
