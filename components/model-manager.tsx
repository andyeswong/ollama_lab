"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Power } from "lucide-react"
import { Button } from "./ui/button"
import { unloadModel, listRunningModels } from "@/lib/model-operations"
import { useToast } from "@/hooks/use-toast"

interface ModelManagerProps {
  selectedModel: string | null
  className?: string
}

export function ModelManager({ selectedModel, className = "" }: ModelManagerProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: runningModels = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ["running-models"],
    queryFn: async () => {
      const response = await listRunningModels("http://localhost:11434")
      if (!response.success) throw new Error(response.message)
      return response.data || []
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  })

  const handleUnloadModel = async () => {
    if (!selectedModel) return

    try {
      const response = await unloadModel("http://localhost:11434", selectedModel)
      if (!response.success) throw new Error(response.message)
      
      toast({
        title: "Model unloaded",
        description: `Successfully unloaded ${selectedModel}`
      })
      queryClient.invalidateQueries({ queryKey: ["running-models"] })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unload model",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  if (error || !runningModels) return null

  // Get info about running model if available
  const runningModel = selectedModel && runningModels.find(
    (m: any) => m.name === selectedModel || m.model === selectedModel
  )

  if (!runningModel) return null

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-muted-foreground">
        <span>Model loaded ({Math.round(runningModel.size_vram / (1024 * 1024))}MB VRAM)</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleUnloadModel}
        className={className}
      >
        <Power className="h-4 w-4 mr-2" />
        Unload
      </Button>
    </div>
  )
}
