async function callAPI(prompt, useWebSearch = true, retries = 2) {
  for (let i = 0; i <= retries; i += 1) {
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          useWebSearch,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 405) {
          console.warn("Ignoring API health-check 405");
          return null;
        }

        throw new Error(
          data?.error ||
          data?.details?.error?.message ||
          `HTTP ${res.status}`
        );
      }

      if (data?.json) {
        return data.json;
      }

      if (typeof data?.text === "string") {
        return extractJSON(data.text);
      }

      throw new Error("Invalid API response");
    } catch (e) {
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }

  return null;
}
