import "@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

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
        messages: [
          {
            role: "user",
            content: "Analyze this restaurant reel URL and extract info: " + url + ". You MUST respond with ONLY a raw JSON object, no explanations, no markdown, no backticks. The JSON must have these exact fields: name, type, location, categories (array from: pizza,sushi,japanese,korean,thai,chinese,mexican,italian,greek,burgers,fastfood,healthy,dessert,breakfast,soup,seafood,steakhouse,vegan), description. If you cannot determine a field use a reasonable guess. Never refuse, always return valid JSON.",
          },
        ],
      }),
    })

    const data = await response.json()
    const text = data.content?.map((b: any) => b.text || "").join("") || ""
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found in response")
    
    const result = JSON.parse(jsonMatch[0])

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