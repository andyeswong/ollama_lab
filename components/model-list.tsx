"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Search, Database } from "lucide-react"
import type { OllamaModel } from "@/lib/types"
import { formatBytes, formatDate } from "@/lib/utils"

interface ModelListProps {
  serverUrl: string
  isConnected: boolean
  selectedModel: OllamaModel | null
  onModelSelect: (model: OllamaModel) => void
}

export function ModelList({ serverUrl, isConnected, selectedModel, onModelSelect }: ModelListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const {
    data: models,
    isLoading,
    error,
    refetch,
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
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const filteredModels =
    models?.filter((model: OllamaModel) => model.name.toLowerCase().includes(searchTerm.toLowerCase())) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Available Models</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={!isConnected || isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
        <CardDescription>Select a model to calculate VRAM requirements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              {!isConnected ? "Connect to server to view models" : "Failed to load models"}
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No models match your search" : "No models available"}
            </div>
          ) : (
            filteredModels.map((model: OllamaModel) => (
              <div
                key={model.name}
                className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                  selectedModel?.name === model.name ? "bg-accent border-primary" : ""
                }`}
                onClick={() => onModelSelect(model)}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">{model.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {model.details?.family && (
                        <Badge variant="outline" className="mr-2">
                          {model.details.family}
                        </Badge>
                      )}
                      {formatBytes(model.size)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDate(model.modified_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
