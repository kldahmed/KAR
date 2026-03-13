module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      route: "/api/claude",
      hasKey: !!process.env.ANTHROPIC_API_KEY,
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
      method: req.method,
    });
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "ANTHROPIC_API_KEY is missing on Vercel",
      });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const { prompt, useWebSearch } = body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Missing prompt",
      });
    }

    const isTension =
      prompt.includes("مستوى التوتر") ||
      prompt.includes('"iran":{"level"') ||
      prompt.includes('"gulf":{"level"');

    const isVideos =
      prompt.includes("فيديوهات يوتيوب") ||
      prompt.includes('"youtubeId"') ||
      prompt.includes('"duration"');

    const expectedType = isTension ? "object" : "array";

    const strictPrompt = `
أنت محرك API فقط.
ممنوع أي شرح.
ممنوع أي مقدمة أو خاتمة.
ممنوع markdown.
ممنوع code block.
أعد JSON صالح فقط لا غير.

نوع الخرج المطلوب: ${expectedType}

${
  isTension
    ? `
إذا كان المطلوب توتر:
أعد Object فقط بهذا الشكل:
{"iran":{"level":85,"trend":"up","events":47},"israel":{"level":78,"trend":"up","events":38},"usa":{"level":62,"trend":"same","events":24},"gulf":{"level":45,"trend":"down","events":18}}
`
    : ""
}

${
  isVideos
    ? `
إذا كان المطلوب فيديوهات:
أعد Array فقط.
كل عنصر يجب أن يحتوي:
"title", "description", "youtubeId", "category", "duration"
`
    : `
إذا كان المطلوب أخبار:
أعد Array فقط.
كل عنصر يجب أن يحتوي:
"title", "summary", "category", "urgency", "time"
`
}

مهم:
- لا تكتب كلمة JSON
- لا تكتب \`\`\`
- لا تكتب أي نص خارج البنية المطلوبة
- أعد البنية النهائية فقط

الطلب:
${prompt}
    `.trim();

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 1800,
        messages: [
          {
            role: "user",
            content: strictPrompt,
          },
        ],
      }),
    });

    const rawResponseText = await anthropicRes.text();

    let parsedResponse = null;
    try {
      parsedResponse = JSON.parse(rawResponseText);
    } catch (_) {}

    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({
        ok: false,
        error: parsedResponse?.error?.message || "Anthropic request failed",
        details: parsedResponse || rawResponseText,
      });
    }

    let text = "";
    if (Array.isArray(parsedResponse?.content)) {
      const textBlock = parsedResponse.content.find((b) => b.type === "text");
      text = textBlock?.text?.trim() || "";
    }

    if (!text) {
      return res.status(500).json({
        ok: false,
        error: "Claude returned empty text",
      });
    }

    let json = null;

    try {
      json = JSON.parse(text);
    } catch (_) {
      const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fenced?.[1]) {
        try {
          json = JSON.parse(fenced[1].trim());
        } catch (_) {}
      }

      if (!json) {
        const firstBracket = text.indexOf("[");
        const lastBracket = text.lastIndexOf("]");
        if (
          firstBracket !== -1 &&
          lastBracket !== -1 &&
          lastBracket > firstBracket
        ) {
          try {
            json = JSON.parse(text.slice(firstBracket, lastBracket + 1));
          } catch (_) {}
        }
      }

      if (!json) {
        const firstBrace = text.indexOf("{");
        const lastBrace = text.lastIndexOf("}");
        if (
          firstBrace !== -1 &&
          lastBrace !== -1 &&
          lastBrace > firstBrace
        ) {
          try {
            json = JSON.parse(text.slice(firstBrace, lastBrace + 1));
          } catch (_) {}
        }
      }
    }

    if (!json) {
      return res.status(500).json({
        ok: false,
        error: "Claude did not return valid JSON",
        rawText: text,
      });
    }

    if (expectedType === "array" && !Array.isArray(json)) {
      const candidate =
        json.items || json.articles || json.data || json.results || null;

      if (Array.isArray(candidate)) {
        json = candidate;
      } else {
        return res.status(500).json({
          ok: false,
          error: "Claude returned JSON but not an array",
          rawText: text,
          parsedType: typeof json,
          parsedValue: json,
        });
      }
    }

    if (
      expectedType === "object" &&
      (typeof json !== "object" || Array.isArray(json) || !json)
    ) {
      return res.status(500).json({
        ok: false,
        error: "Claude returned JSON but not an object",
        rawText: text,
        parsedType: Array.isArray(json) ? "array" : typeof json,
        parsedValue: json,
      });
    }

    return res.status(200).json({
      ok: true,
      json,
      text: JSON.stringify(json),
      expectedType,
      usedWebSearch: !!useWebSearch,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Internal server error",
    });
  }
};
