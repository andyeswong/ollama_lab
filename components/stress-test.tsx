"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiModelSelector } from "@/components/multi-model-selector"
import {
  Activity,
  Play,
  Square,
  Download,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"
import type { OllamaModel } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { formatBytes } from "@/lib/utils"

interface StressTestResult {
  modelName: string
  status: "running" | "completed" | "failed" | "pending"
  startTime: number
  endTime?: number
  responseTime: number
  tokensPerSecond: number
  tokenCount: number
  response: string
  error?: string
  memoryUsage?: number
  cpuUsage?: number
}

interface StressTestConfig {
  prompt: string
  iterations: number
  concurrentRequests: number
  temperature: number
  maxTokens: number
  timeout: number
}

interface StressTestProps {
  serverUrl: string
  isConnected: boolean
}

const DEFAULT_STRESS_PROMPTS = [
  "Write a detailed explanation of quantum computing in simple terms.",
  "Create a comprehensive business plan for a sustainable energy startup.",
  "Explain the process of photosynthesis and its importance to life on Earth.",
  "Write a short story about time travel with a surprising twist ending.",
  "Describe the key differences between machine learning and artificial intelligence.",
]

export function StressTest({ serverUrl, isConnected }: StressTestProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [config, setConfig] = useState<StressTestConfig>({
    prompt: DEFAULT_STRESS_PROMPTS[0],
    iterations: 5,
    concurrentRequests: 2,
    temperature: 0.7,
    maxTokens: 512,
    timeout: 30000,
  })
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<Record<string, StressTestResult[]>>({})
  const [currentIteration, setCurrentIteration] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)
  const { toast } = useToast()

  const {
    data: models,
    isLoading: modelsLoading,
    error: modelsError,
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

  const toggleModelSelection = (modelName: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(modelName)) {
        return prev.filter((m) => m !== modelName)
      } else if (prev.length < 4) {
        return [...prev, modelName]
      } else {
        toast({
          title: "Maximum models reached",
          description: "You can select up to 4 models for stress testing",
          variant: "destructive",
        })
        return prev
      }
    })
  }

  const runStressTest = async () => {
    if (selectedModels.length === 0) {
      toast({
        title: "No models selected",
        description: "Please select at least one model to test",
        variant: "destructive",
      })
      return
    }

    setIsRunning(true)
    setResults({})
    setCurrentIteration(0)
    setOverallProgress(0)

    // Initialize results structure
    const initialResults: Record<string, StressTestResult[]> = {}
    selectedModels.forEach((model) => {
      initialResults[model] = []
    })
    setResults(initialResults)

    try {
      for (let iteration = 1; iteration <= config.iterations; iteration++) {
        setCurrentIteration(iteration)

        // Run concurrent requests for all selected models
        const promises = selectedModels.map(async (modelName) => {
          const iterationResults: StressTestResult[] = []

          for (let concurrent = 0; concurrent < config.concurrentRequests; concurrent++) {
            const result: StressTestResult = {
              modelName,
              status: "running",
              startTime: Date.now(),
              responseTime: 0,
              tokensPerSecond: 0,
              tokenCount: 0,
              response: "",
            }

            // Update results immediately to show running status
            setResults((prev) => ({
              ...prev,
              [modelName]: [...(prev[modelName] || []), result],
            }))

            try {
              const response = await fetch("/api/ollama/stress-test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  serverUrl,
                  model: modelName,
                  prompt: config.prompt,
                  temperature: config.temperature,
                  maxTokens: config.maxTokens,
                  timeout: config.timeout,
                }),
              })

              if (!response.ok) throw new Error(`HTTP ${response.status}`)

              const data = await response.json()
              const endTime = Date.now()

              const completedResult: StressTestResult = {
                ...result,
                status: "completed",
                endTime,
                responseTime: endTime - result.startTime,
                tokensPerSecond: data.tokensPerSecond || 0,
                tokenCount: data.tokenCount || 0,
                response: data.response || "",
                memoryUsage: data.memoryUsage,
                cpuUsage: data.cpuUsage,
              }

              iterationResults.push(completedResult)
            } catch (error) {
              const failedResult: StressTestResult = {
                ...result,
                status: "failed",
                endTime: Date.now(),
                responseTime: Date.now() - result.startTime,
                error: error instanceof Error ? error.message : "Unknown error",
              }

              iterationResults.push(failedResult)
            }
          }

          return { modelName, results: iterationResults }
        })

        // Wait for all concurrent requests to complete
        const iterationResults = await Promise.all(promises)

        // Update results
        setResults((prev) => {
          const newResults = { ...prev }
          iterationResults.forEach(({ modelName, results: modelResults }) => {
            // Replace the running results with completed ones
            const existingResults = newResults[modelName] || []
            const runningCount = existingResults.filter((r) => r.status === "running").length
            const completedResults = existingResults.filter((r) => r.status !== "running")
            newResults[modelName] = [...completedResults, ...modelResults]
          })
          return newResults
        })

        // Update progress
        const progress = (iteration / config.iterations) * 100
        setOverallProgress(progress)
      }

      toast({
        title: "Stress test completed",
        description: `Successfully tested ${selectedModels.length} models with ${config.iterations} iterations each`,
      })
    } catch (error) {
      toast({
        title: "Stress test failed",
        description: "An error occurred during stress testing",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const stopStressTest = () => {
    setIsRunning(false)
    toast({
      title: "Stress test stopped",
      description: "Test execution has been cancelled",
    })
  }

  const exportResults = () => {
    const summary = generateSummary()
    const exportData = {
      config,
      selectedModels,
      results,
      summary,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `stress-test-results-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateSummary = () => {
    const summary: Record<string, any> = {}

    selectedModels.forEach((model) => {
      const modelResults = results[model] || []
      const completedResults = modelResults.filter((r) => r.status === "completed")
      const failedResults = modelResults.filter((r) => r.status === "failed")

      if (completedResults.length > 0) {
        summary[model] = {
          totalRequests: modelResults.length,
          completedRequests: completedResults.length,
          failedRequests: failedResults.length,
          successRate: (completedResults.length / modelResults.length) * 100,
          averageResponseTime: completedResults.reduce((acc, r) => acc + r.responseTime, 0) / completedResults.length,
          averageTokensPerSecond:
            completedResults.reduce((acc, r) => acc + r.tokensPerSecond, 0) / completedResults.length,
          minResponseTime: Math.min(...completedResults.map((r) => r.responseTime)),
          maxResponseTime: Math.max(...completedResults.map((r) => r.responseTime)),
          totalTokens: completedResults.reduce((acc, r) => acc + r.tokenCount, 0),
        }
      }
    })

    return summary
  }

  const summary = generateSummary()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6 h-full">
        {/* Configuration Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Stress Test Configuration</span>
              </CardTitle>
              <CardDescription>Configure your stress test parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Test Prompt</label>
                <Textarea
                  value={config.prompt}
                  onChange={(e) => setConfig((prev) => ({ ...prev, prompt: e.target.value }))}
                  rows={4}
                  placeholder="Enter your test prompt..."
                />
                <Select
                  value={config.prompt}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, prompt: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Or select a preset prompt" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_STRESS_PROMPTS.map((prompt, index) => (
                      <SelectItem key={index} value={prompt}>
                        {prompt.substring(0, 50)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Iterations</label>
                  <Input
                    type="number"
                    value={config.iterations}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, iterations: Math.max(1, Number.parseInt(e.target.value) || 1) }))
                    }
                    min={1}
                    max={20}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Concurrent Requests</label>
                  <Input
                    type="number"
                    value={config.concurrentRequests}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        concurrentRequests: Math.max(1, Number.parseInt(e.target.value) || 1),
                      }))
                    }
                    min={1}
                    max={5}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Temperature</label>
                  <Select
                    value={config.temperature.toString()}
                    onValueChange={(v) => setConfig((prev) => ({ ...prev, temperature: Number.parseFloat(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0.0</SelectItem>
                      <SelectItem value="0.3">0.3</SelectItem>
                      <SelectItem value="0.7">0.7</SelectItem>
                      <SelectItem value="1.0">1.0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Tokens</label>
                  <Select
                    value={config.maxTokens.toString()}
                    onValueChange={(v) => setConfig((prev) => ({ ...prev, maxTokens: Number.parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="256">256</SelectItem>
                      <SelectItem value="512">512</SelectItem>
                      <SelectItem value="1024">1024</SelectItem>
                      <SelectItem value="2048">2048</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Timeout (ms)</label>
                <Input
                  type="number"
                  value={config.timeout}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, timeout: Math.max(5000, Number.parseInt(e.target.value) || 5000) }))
                  }
                  min={5000}
                  max={120000}
                  step={5000}
                />
              </div>
            </CardContent>
          </Card>

          <MultiModelSelector
            serverUrl={serverUrl}
            isConnected={isConnected}
            selectedModels={selectedModels}
            onModelSelect={toggleModelSelection}
            maxSelections={4}
          />
        </div>

        {/* Control Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Control</CardTitle>
              <CardDescription>Start, stop, and monitor your stress test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} />
                {isRunning && (
                  <p className="text-sm text-muted-foreground">
                    Iteration {currentIteration} of {config.iterations}
                  </p>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={runStressTest}
                  disabled={isRunning || selectedModels.length === 0 || !isConnected}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isRunning ? "Running..." : "Start Test"}
                </Button>
                {isRunning && (
                  <Button variant="outline" onClick={stopStressTest}>
                    <Square className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {Object.keys(results).length > 0 && (
                <Button variant="outline" onClick={exportResults} className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export Results
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Live Metrics */}
          {Object.keys(summary).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Live Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedModels.map((model) => {
                    const modelSummary = summary[model]
                    if (!modelSummary) return null

                    return (
                      <div key={model} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{model}</span>
                          <Badge
                            variant={modelSummary.successRate === 100 ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {Math.round(modelSummary.successRate)}% Success
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{Math.round(modelSummary.averageResponseTime)}ms</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Zap className="h-3 w-3" />
                            <span>{Math.round(modelSummary.averageTokensPerSecond)} t/s</span>
                          </div>
                        </div>
                        <Progress value={(modelSummary.completedRequests / modelSummary.totalRequests) * 100} />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Results Summary</CardTitle>
              <CardDescription>Detailed performance comparison</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(summary).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No results yet. Run a stress test to see performance metrics.
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-6">
                    {selectedModels.map((model) => {
                      const modelSummary = summary[model]
                      const modelResults = results[model] || []

                      if (!modelSummary) return null

                      return (
                        <div key={model} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{model}</h4>
                            <div className="flex items-center space-x-2">
                              {modelSummary.successRate === 100 ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : modelSummary.successRate > 50 ? (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <Badge variant="outline">{Math.round(modelSummary.successRate)}% Success</Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Avg Response Time:</span>
                                <span>{Math.round(modelSummary.averageResponseTime)}ms</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Min Response Time:</span>
                                <span>{Math.round(modelSummary.minResponseTime)}ms</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Max Response Time:</span>
                                <span>{Math.round(modelSummary.maxResponseTime)}ms</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Avg Tokens/sec:</span>
                                <span>{Math.round(modelSummary.averageTokensPerSecond)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Tokens:</span>
                                <span>{modelSummary.totalTokens.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Requests:</span>
                                <span>
                                  {modelSummary.completedRequests}/{modelSummary.totalRequests}
                                </span>
                              </div>
                            </div>
                          </div>

                          <Separator />
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
