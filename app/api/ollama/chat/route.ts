import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { serverUrl, model, messages, temperature = 0.7, max_tokens = 2048 } = await request.json()

    if (!serverUrl || !model || !messages) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const response = await fetch(`${serverUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature,
          num_predict: max_tokens,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      response: data.message?.content || "No response generated",
      model: data.model,
      created_at: data.created_at,
      done: data.done,
    })
  } catch (error) {
    console.error("Chat request failed:", error)
    return NextResponse.json({ error: "Failed to send chat message" }, { status: 500 })
  }
}
