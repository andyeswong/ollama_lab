import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { serverUrl } = await request.json()

    if (!serverUrl) {
      return NextResponse.json({ error: "Server URL is required" }, { status: 400 })
    }

    const response = await fetch(`${serverUrl}/api/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Transform the response to match our expected format
    const models =
      data.models?.map((model: any) => ({
        name: model.name,
        size: model.size,
        modified_at: model.modified_at,
        digest: model.digest,
        details: model.details || {},
      })) || []

    return NextResponse.json(models)
  } catch (error) {
    console.error("Failed to fetch models:", error)
    return NextResponse.json({ error: "Failed to fetch models from Ollama server" }, { status: 500 })
  }
}
