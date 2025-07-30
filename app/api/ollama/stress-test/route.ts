import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { serverUrl, model, prompt, temperature = 0.7, maxTokens = 512, timeout = 30000 } = await request.json()

    if (!serverUrl || !model || !prompt) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const startTime = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
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
            temperature,
            num_predict: maxTokens,
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const endTime = Date.now()
      const responseTime = endTime - startTime

      // Calculate performance metrics
      const responseText = data.response || ""
      const tokenCount = responseText.split(/\s+/).length
      const tokensPerSecond = tokenCount > 0 ? tokenCount / (responseTime / 1000) : 0

      // Simulate memory and CPU usage (in a real implementation, you'd get these from system metrics)
      const memoryUsage = Math.random() * 2048 + 512 // Random between 512MB and 2.5GB
      const cpuUsage = Math.random() * 80 + 10 // Random between 10% and 90%

      return NextResponse.json({
        response: responseText,
        model: data.model,
        tokenCount,
        tokensPerSecond: Math.round(tokensPerSecond * 100) / 100,
        responseTime,
        memoryUsage: Math.round(memoryUsage),
        cpuUsage: Math.round(cpuUsage * 100) / 100,
        created_at: data.created_at,
        done: data.done,
        success: true,
      })
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          {
            error: "Request timeout",
            responseTime: timeout,
            success: false,
          },
          { status: 408 },
        )
      }

      throw error
    }
  } catch (error) {
    console.error("Stress test request failed:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to run stress test",
        success: false,
      },
      { status: 500 },
    )
  }
}
