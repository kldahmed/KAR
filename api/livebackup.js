export default function handler(req, res) {

  const channels = [

    {
      id: "aj",
      name: "Al Jazeera English",
      flag: "🌍",
      youtubeId: "gCNeDWCI0vo"
    },

    {
      id: "fr24",
      name: "France 24",
      flag: "🇫🇷",
      youtubeId: "Ap-UM1O9RBU"
    },

    {
      id: "dw",
      name: "DW News",
      flag: "🇩🇪",
      youtubeId: "Niq9D7p4Qzw"
    },

    {
      id: "trt",
      name: "TRT World",
      flag: "🇹🇷",
      youtubeId: "w-Ma8oQLmSM"
    }

  ];

  res.status(200).json({ channels });

}
