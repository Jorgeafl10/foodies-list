import "@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const PROMPT = `A user shared this social media reel URL: URL_PLACEHOLDER

Analyze this restaurant and extract info. Respond ONLY with valid JSON, no markdown:
{
  "name": "Restaurant name",
  "type": "Cuisine description (e.g. Italian or Pizza)",
  "location": "City, Country",
  "categories": ["array of ALL matching IDs from: pizza,sushi,japanese,korean,thai,chinese,mexican,italian,greek,burgers,fastfood,healthy,dessert,breakfast,soup,seafood,steakhouse,vegan"],
  "description": "One exciting sentence about this place"
}
A Neapolitan pizza spot gets pizza and italian. A ramen shop gets japanese and soup. Pick ALL that apply.`

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    const prompt = PROMPT.replace("URL_PLACEHOLDER", url)

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.map((b: any) => b.text || "").join("") || ""
    const clean = text.replace(/```json|```/g, "").trim()
    const result = JSON.parse(clean)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})