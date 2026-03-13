export default async function handler(req, res) {

  // اختبار سريع
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "Claude API working",
      hasKey: !!process.env.ANTHROPIC_API_KEY
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing ANTHROPIC_API_KEY"
      });
    }

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
