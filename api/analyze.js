export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `A user shared this social media reel URL: ${url}

Analyze this restaurant and extract info. Respond ONLY with valid JSON, no markdown:
{
  "name": "Restaurant name",
  "type": "Cuisine description (e.g. Italian · Pizza)",
  "location": "City, Country",
  "categories": ["array of ALL matching IDs from: pizza,sushi,japanese,korean,thai,chinese,mexican,italian,greek,burgers,fastfood,healthy,dessert,breakfast,soup,seafood,steakhouse,vegan"],
  "description": "One exciting sentence about this place"
}
A Neapolitan pizza spot gets ["pizza","italian"]. A ramen shop gets ["japanese","soup"]. Pick ALL that apply.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.map((b) => b.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to analyze reel", details: error.message });
  }
}