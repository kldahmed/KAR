export default async function handler(req, res) {

  try {

    const news = [
      {
        title: "خبر تجريبي",
        urgency: "medium",
        summary: "تم تحميل الأخبار بنجاح"
      }
    ];

    res.status(200).json({
      news,
      updated: new Date().toISOString()
    });

  } catch (error) {

    res.status(500).json({
      error: "Failed to fetch news"
    });

  }

}
