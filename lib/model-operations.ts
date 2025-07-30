import { OllamaModel } from "./types"

type StreamCallback = (status: string, progress?: {total: number, completed: number}) => void

interface CommandCenterResponse {
  success: boolean
  message: string
  data?: any
}

export async function loadModel(serverUrl: string, modelName: string): Promise<CommandCenterResponse> {
  try {
    const response = await fetch(`${serverUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        prompt: "", // Empty prompt just loads the model
      }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    return {
      success: true,
      message: `Model ${modelName} loaded successfully`,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to load model: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function pullModel(
  serverUrl: string, 
  modelName: string, 
  onProgress?: StreamCallback
): Promise<CommandCenterResponse> {
  try {
    const response = await fetch(`${serverUrl}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: modelName,
        stream: true,
      }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")

    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value)
      const lines = text.split("\n").filter(line => line.trim())
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line)
          
          if (data.status) {
            onProgress?.(data.status)
            
            if (data.total && data.completed) {
              onProgress?.(data.status, {
                total: data.total,
                completed: data.completed
              })
            }
          }
        } catch (e) {
          // Ignore parse errors for incomplete lines
        }
      }
    }

    return {
      success: true,
      message: `Model ${modelName} pulled successfully`,
    }
  } catch (error) {
    return {
      success: false, 
      message: `Failed to pull model: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function unloadModel(serverUrl: string, modelName: string): Promise<CommandCenterResponse> {
  try {
    const response = await fetch(`${serverUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        prompt: "",
        keep_alive: 0, // Setting keep_alive to 0 unloads the model
      }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    return {
      success: true,
      message: `Model ${modelName} unloaded successfully`,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to unload model: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function listRunningModels(serverUrl: string): Promise<CommandCenterResponse> {
  try {
    const response = await fetch(`${serverUrl}/api/ps`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const data = await response.json()
    return {
      success: true,
      message: "Running models retrieved successfully",
      data: data.models,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to get running models: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function copyModel(serverUrl: string, source: string, destination: string): Promise<CommandCenterResponse> {
  try {
    const response = await fetch(`${serverUrl}/api/copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        destination,
      }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    return {
      success: true,
      message: `Model ${source} copied to ${destination} successfully`,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to copy model: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function deleteModel(serverUrl: string, modelName: string): Promise<CommandCenterResponse> {
  try {
    const response = await fetch(`${serverUrl}/api/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
      }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    return {
      success: true,
      message: `Model ${modelName} deleted successfully`,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to delete model: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function showModelInfo(serverUrl: string, modelName: string): Promise<CommandCenterResponse> {
  try {
    const response = await fetch(`${serverUrl}/api/show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        verbose: true,
      }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const data = await response.json()
    return {
      success: true,
      message: "Model information retrieved successfully",
      data,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to get model info: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
