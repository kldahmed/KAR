module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "ANTHROPIC_API_KEY is missing"
      });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const { title, summary } = body;

    if (!title) {
      return res.status(400).json({
        ok: false,
        error: "title is required"
      });
    }

    const prompt = `
حلل الخبر التالي وأعد JSON فقط دون شرح:

العنوان: ${title}
الملخص: ${summary || ""}

أعد النتيجة بهذا الشكل فقط:
{
  "type":"military أو political أو economic أو diplomatic",
  "risk_score":0,
  "prediction":"...",
  "impact":"local أو regional أو global"
}
`.trim();

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const raw = await anthropicRes.text();
    let parsed = null;

    try {
      parsed = JSON.parse(raw);
    } catch (_) {}

    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({
        ok: false,
        error: parsed?.error?.message || "Anthropic request failed"
      });
    }

    const textBlock = parsed?.content?.find((b) => b.type === "text");
    const text = textBlock?.text?.trim() || "";

    let json = null;

    try {
      json = JSON.parse(text);
    } catch (_) {
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          json = JSON.parse(text.slice(firstBrace, lastBrace + 1));
        } catch (_) {}
      }
    }

    if (!json) {
      return res.status(500).json({
        ok: false,
        error: "Claude did not return valid JSON"
      });
    }

    return res.status(200).json({
      ok: true,
      analysis: json
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Internal server error"
    });
  }
};
