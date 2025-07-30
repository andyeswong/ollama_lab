"use client"

import { useQuery } from "@tanstack/react-query"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import type { OllamaModel } from "@/lib/types"
import { formatBytes } from "@/lib/utils"

interface MultiModelSelectorProps {
  serverUrl: string
  isConnected: boolean
  selectedModels: string[]
  onModelSelect: (modelName: string) => void
  maxSelections?: number
  className?: string
}

export function MultiModelSelector({ 
  serverUrl, 
  isConnected, 
  selectedModels,
  onModelSelect,
  maxSelections = 4,
  className = "" 
}: MultiModelSelectorProps) {
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Model Selection ({selectedModels.length}/{maxSelections})</CardTitle>
        <CardDescription>Select up to {maxSelections} models for concurrent testing</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading models...</span>
          </div>
        ) : error || !models ? (
          <div className="text-center py-4 text-muted-foreground">
            {!isConnected ? "Connect to server to view models" : "Failed to load models"}
          </div>
        ) : (
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {models.map((model: OllamaModel) => (
                <div key={model.name} className="flex items-center space-x-2">
                  <Checkbox
                    id={model.name}
                    checked={selectedModels.includes(model.name)}
                    onCheckedChange={() => onModelSelect(model.name)}
                    disabled={!selectedModels.includes(model.name) && selectedModels.length >= maxSelections}
                  />
                  <label htmlFor={model.name} className="flex-1 text-sm cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span>{model.name}</span>
                      <span className="text-muted-foreground">{formatBytes(model.size)}</span>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
