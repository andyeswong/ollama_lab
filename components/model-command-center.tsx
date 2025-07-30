"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { OllamaModel } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Info, Power, Copy, Trash2, List, Download } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  loadModel,
  unloadModel,
  listRunningModels,
  copyModel,
  deleteModel,
  showModelInfo,
  pullModel,
} from "@/lib/model-operations"

interface ModelCommandCenterProps {
  serverUrl: string
  isConnected: boolean
  selectedModel: OllamaModel | null
  onSelectModel: (model: OllamaModel | null) => void
}

interface PullProgress {
  status: string
  progress?: {
    total: number
    completed: number
  }
}

export function ModelCommandCenter({ serverUrl, isConnected, selectedModel, onSelectModel }: ModelCommandCenterProps) {
  const [destinationModel, setDestinationModel] = useState<string>("")
  const [modelInfo, setModelInfo] = useState<any>(null)
  const [pullProgress, setPullProgress] = useState<PullProgress>()
  const { toast } = useToast()

  const {
    data: runningModels = [],
    isLoading,
    error,
    refetch: refetchRunningModels
  } = useQuery({
    queryKey: ["command-center-models", serverUrl],
    queryFn: async ({ queryKey }) => {
      const [_, url] = queryKey
      const response = await listRunningModels(url as string)
      if (!response.success) throw new Error(response.message)
      return response.data || []
    },
    enabled: isConnected,
    refetchInterval: 5000 // Refresh every 5 seconds
  })

  const handleLoadModel = async () => {
    if (!selectedModel?.name) return
    const response = await loadModel(serverUrl, selectedModel.name)
    toast({
      title: response.success ? "Success" : "Error",
      description: response.message,
      variant: response.success ? "default" : "destructive",
    })
    if (response.success) {
      refetchRunningModels()
    }
  }

  const handleUnloadModel = async (modelName: string) => {
    const response = await unloadModel(serverUrl, modelName)
    toast({
      title: response.success ? "Success" : "Error",
      description: response.message,
      variant: response.success ? "default" : "destructive",
    })
    if (response.success) {
      refetchRunningModels()
    }
  }

  const handleCopyModel = async () => {
    if (!selectedModel || !destinationModel) {
      toast({
        title: "Error",
        description: "Please enter both source and destination model names",
        variant: "destructive",
      })
      return
    }

    const response = await copyModel(serverUrl, selectedModel.name, destinationModel)
    toast({
      title: response.success ? "Success" : "Error",
      description: response.message,
      variant: response.success ? "default" : "destructive",
    })
  }

  const handleDeleteModel = async () => {
    if (!selectedModel?.name) return
    const response = await deleteModel(serverUrl, selectedModel.name)
    toast({
      title: response.success ? "Success" : "Error",
      description: response.message,
      variant: response.success ? "default" : "destructive",
    })
  }

  const handleShowInfo = async () => {
    if (!selectedModel?.name) return
    const response = await showModelInfo(serverUrl, selectedModel.name)
    if (response.success) {
      setModelInfo(response.data)
    } else {
      toast({
        title: "Error",
        description: response.message,
        variant: "destructive",
      })
    }
  }

  const handlePullModel = async () => {
    if (!selectedModel?.name) return
    setPullProgress(undefined)

    try {
      const response = await pullModel(
        serverUrl, 
        selectedModel.name,
        (status: string, progress?: { total: number; completed: number }) => {
          setPullProgress({ status, progress })
        }
      )

      if (!response.success) throw new Error(response.message)

      toast({
        title: "Success",
        description: response.message,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to pull model",
        variant: "destructive"
      })
    } finally {
      setPullProgress(undefined)
    }
  }

  const renderPullProgress = () => {
    if (!pullProgress) return null

    let progressText = pullProgress.status
    if (pullProgress.progress) {
      const percent = Math.round((pullProgress.progress.completed / pullProgress.progress.total) * 100)
      progressText += ` (${percent}%)`
    }

    return (
      <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span>{progressText}</span>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <Alert>
        <AlertTitle>Not Connected</AlertTitle>
        <AlertDescription>Connect to an Ollama server to manage models</AlertDescription>
      </Alert>
    )
  }

  return (
    <Tabs defaultValue="models" className="w-full h-full">
      <TabsList>
        <TabsTrigger value="models">Running Models</TabsTrigger>
        <TabsTrigger value="operations">Model Operations</TabsTrigger>
        <TabsTrigger value="pull">Pull Models</TabsTrigger>
        <TabsTrigger value="info">Model Info</TabsTrigger>
      </TabsList>

      <TabsContent value="models" className="h-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <List className="h-5 w-5" />
              <span>Running Models</span>
            </CardTitle>
            <CardDescription>View and manage running models</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error instanceof Error ? error.message : "Failed to fetch models"}</AlertDescription>
              </Alert>
            ) : runningModels.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No models currently running
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runningModels.map((model: any) => (
                    <TableRow key={model.name}>
                      <TableCell>{model.name}</TableCell>
                      <TableCell>{(model.size / (1024 * 1024 * 1024)).toFixed(2)} GB</TableCell>
                      <TableCell>{new Date(model.expires_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUnloadModel(model.name)}
                          title="Unload Model"
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="operations">
        <Card>
          <CardHeader>
            <CardTitle>{selectedModel ? `${selectedModel.name} Operations` : 'Model Operations'}</CardTitle>
            <CardDescription>Load, copy, or delete the selected model</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex space-x-2">
              <Button 
                onClick={handleLoadModel} 
                className="flex-1"
                disabled={!selectedModel}
              >
                <Power className="h-4 w-4 mr-2" />
                Load Model
              </Button>
              <Button 
                onClick={handleDeleteModel} 
                variant="outline" 
                className="flex-1"
                disabled={!selectedModel}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Model
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Copy Model</label>
              <div className="space-y-2">
                <Input
                  value={destinationModel}
                  onChange={(e) => setDestinationModel(e.target.value)}
                  placeholder="Enter destination name"
                />
                <Button onClick={handleCopyModel} className="w-full">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Model
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pull">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>{selectedModel ? `Pull ${selectedModel.name}` : 'Pull Models'}</span>
            </CardTitle>
            <CardDescription>Download models from the Ollama library</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Model Name</label>
                <Input
                  value={selectedModel?.name || ""}
                  onChange={(e) => onSelectModel({ name: e.target.value } as OllamaModel)}
                  placeholder="Enter model name (e.g. llama2:13b)"
                />
              </div>
              <div className="grid gap-2">
                <Button 
                  onClick={() => handlePullModel()} 
                  disabled={!selectedModel?.name}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Pull Model
                </Button>
                {renderPullProgress()}
                <p className="text-sm text-muted-foreground">
                  Enter the model name from the Ollama library. You can find available models at{" "}
                  <a 
                    href="https://ollama.ai/library" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                  >
                    ollama.ai/library
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="info">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>{selectedModel ? `${selectedModel.name} Information` : 'Model Information'}</span>
            </CardTitle>
            <CardDescription>View detailed information about the selected model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={handleShowInfo} 
                className="w-full"
                disabled={!selectedModel}
              >
                Show Model Info
              </Button>

              {modelInfo && (
                <ScrollArea className="h-[500px] border rounded-md p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Details</h3>
                      <pre className="text-sm">{JSON.stringify(modelInfo.details, null, 2)}</pre>
                    </div>
                    {modelInfo.parameters && (
                      <div>
                        <h3 className="text-lg font-semibold">Parameters</h3>
                        <pre className="text-sm">{modelInfo.parameters}</pre>
                      </div>
                    )}
                    {modelInfo.template && (
                      <div>
                        <h3 className="text-lg font-semibold">Template</h3>
                        <pre className="text-sm">{modelInfo.template}</pre>
                      </div>
                    )}
                    {modelInfo.model_info && (
                      <div>
                        <h3 className="text-lg font-semibold">Model Info</h3>
                        <pre className="text-sm">{JSON.stringify(modelInfo.model_info, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
