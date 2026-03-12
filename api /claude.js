export default async function handler(req, res) {

  // health check
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      route: "/api/claude",
      hasKey: !!process.env.ANTHROPIC_API_KEY
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: "ANTHROPIC_API_KEY missing"
      });
    }

    const { prompt } = req.body || {};

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 1500,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    return res.status(200).json(data);

  } catch (error) {

    return res.status(500).json({
      error: error.message
    });

  }

}
