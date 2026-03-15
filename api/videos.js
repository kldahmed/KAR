export default async function handler(req, res) {
  const videos = [
    {
      id: "1",
      youtubeId: "aqz-KE-bpKQ",
      title: "Al Jazeera English - Live",
      channel: "Al Jazeera"
    },
    {
      id: "2",
      youtubeId: "gCNeDWCI0vo",
      title: "France 24 English - Live",
      channel: "France 24"
    },
    {
      id: "3",
      youtubeId: "9Auq9mYxFEE",
      title: "Sky News Live",
      channel: "Sky News"
    },
    {
      id: "4",
      youtubeId: "Ap-UM1O9RBU",
      title: "Global News Live",
      channel: "Global News"
    }
  ];

  res.status(200).json({ videos });
}
