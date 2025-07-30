import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { serverUrl } = await request.json()

    if (!serverUrl) {
      return NextResponse.json({ error: "Server URL is required" }, { status: 400 })
    }

    const response = await fetch(`${serverUrl}/api/version`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Also test if we can fetch tags to ensure full functionality
    const tagsResponse = await fetch(`${serverUrl}/api/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    })

    const modelsCount = tagsResponse.ok ? (await tagsResponse.json()).models?.length || 0 : 0

    return NextResponse.json({
      success: true,
      version: data.version || "unknown",
      modelsCount,
      serverUrl,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Connection test failed:", error)
    return NextResponse.json(
      {
        error: "Failed to connect to Ollama server",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
