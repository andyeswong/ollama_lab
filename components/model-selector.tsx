"use client"

import { useQuery } from "@tanstack/react-query"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { OllamaModel } from "@/lib/types"
import { formatBytes } from "@/lib/utils"

interface ModelSelectorProps {
  serverUrl: string
  isConnected: boolean
  selectedModel: OllamaModel | null
  onModelSelect: (model: OllamaModel | null) => void
  className?: string
}

export function ModelSelector({ 
  serverUrl, 
  isConnected, 
  selectedModel, 
  onModelSelect,
  className = "" 
}: ModelSelectorProps) {
  const {
    data: models,
    isLoading,
    error
  } = useQuery({
    queryKey: ["models", serverUrl],
    queryFn: async () => {
      const response = await fetch("/api/ollama/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverUrl }),
      })
      if (!response.ok) throw new Error("Failed to fetch models")
      return response.json()
    },
    enabled: isConnected,
  })

  if (!isConnected) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Connect to server first" />
        </SelectTrigger>
      </Select>
    )
  }

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading models...</span>
          </div>
        </SelectTrigger>
      </Select>
    )
  }

  if (error || !models) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Failed to load models" />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select
      value={selectedModel?.name}
      onValueChange={(value) => {
        const model = models.find((m: OllamaModel) => m.name === value)
        onModelSelect(model || null)
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {models.map((model: OllamaModel) => (
          <SelectItem key={model.name} value={model.name}>
            <div className="flex items-center justify-between space-x-4">
              <span>{model.name}</span>
              <span className="text-muted-foreground text-sm">{formatBytes(model.size)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
