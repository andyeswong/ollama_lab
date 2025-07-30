import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { serverUrl, model, prompt } = await request.json()

    if (!serverUrl || !model || !prompt) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const startTime = Date.now()

    const response = await fetch(`${serverUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 512,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const endTime = Date.now()
    const responseTime = endTime - startTime

    // Calculate tokens per second (rough estimation)
    const tokenCount = data.response?.split(/\s+/).length || 0
    const tokensPerSecond = tokenCount > 0 ? tokenCount / (responseTime / 1000) : 0

    return NextResponse.json({
      response: data.response || "No response generated",
      model: data.model,
      tokenCount,
      tokensPerSecond: Math.round(tokensPerSecond),
      responseTime,
      created_at: data.created_at,
      done: data.done,
    })
  } catch (error) {
    console.error("Benchmark request failed:", error)
    return NextResponse.json({ error: "Failed to run benchmark" }, { status: 500 })
  }
}
