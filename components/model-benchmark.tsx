"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BarChart3, Play, Square, Download, Clock, Zap, Target } from "lucide-react"
import type { OllamaModel } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface BenchmarkResult {
  id: string
  modelName: string
  testName: string
  prompt: string
  response: string
  tokensPerSecond: number
  responseTime: number
  tokenCount: number
  timestamp: Date
}

interface BenchmarkTest {
  id: string
  name: string
  description: string
  prompt: string
  category: string
}

const BENCHMARK_TESTS: BenchmarkTest[] = [
  {
    id: "1",
    name: "Simple Q&A",
    description: "Basic question answering capability",
    prompt: "What is the capital of France?",
    category: "Knowledge",
  },
  {
    id: "2",
    name: "Code Generation",
    description: "Generate a simple Python function",
    prompt: "Write a Python function to calculate the factorial of a number.",
    category: "Programming",
  },
  {
    id: "3",
    name: "Creative Writing",
    description: "Generate creative content",
    prompt: "Write a short story about a robot learning to paint.",
    category: "Creative",
  },
  {
    id: "4",
    name: "Math Problem",
    description: "Solve a mathematical problem",
    prompt: "If a train travels 120 km in 2 hours, what is its average speed? Show your work.",
    category: "Math",
  },
  {
    id: "5",
    name: "Reasoning",
    description: "Logical reasoning test",
    prompt: "All birds can fly. Penguins are birds. Can penguins fly? Explain your reasoning.",
    category: "Logic",
  },
]

interface ModelBenchmarkProps {
  serverUrl: string
  isConnected: boolean
  selectedModel: OllamaModel | null
}

export function ModelBenchmark({ serverUrl, isConnected, selectedModel }: ModelBenchmarkProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<BenchmarkResult[]>([])
  const { toast } = useToast()

  const runBenchmark = async () => {
    if (!selectedModel || !isConnected) return

    setIsRunning(true)
    setProgress(0)
    setResults([])

    try {
      for (let i = 0; i < BENCHMARK_TESTS.length; i++) {
        const test = BENCHMARK_TESTS[i]
        setCurrentTest(test.name)

        const startTime = Date.now()

        const response = await fetch("/api/ollama/benchmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serverUrl,
            model: selectedModel.name,
            prompt: test.prompt,
          }),
        })

        if (!response.ok) throw new Error(`Failed to run test: ${test.name}`)

        const data = await response.json()
        const endTime = Date.now()
        const responseTime = endTime - startTime

        const result: BenchmarkResult = {
          id: Date.now().toString() + i,
          modelName: selectedModel.name,
          testName: test.name,
          prompt: test.prompt,
          response: data.response,
          tokensPerSecond: data.tokensPerSecond || 0,
          responseTime,
          tokenCount: data.tokenCount || 0,
          timestamp: new Date(),
        }

        setResults((prev) => [...prev, result])
        setProgress(((i + 1) / BENCHMARK_TESTS.length) * 100)
      }

      toast({
        title: "Benchmark completed",
        description: `Successfully tested ${BENCHMARK_TESTS.length} scenarios`,
      })
    } catch (error) {
      toast({
        title: "Benchmark failed",
        description: "An error occurred during benchmarking",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
      setCurrentTest(null)
    }
  }

  const stopBenchmark = () => {
    setIsRunning(false)
    setCurrentTest(null)
  }

  const exportResults = () => {
    const data = {
      model: selectedModel?.name,
      results,
      summary: {
        totalTests: results.length,
        averageResponseTime: results.reduce((acc, r) => acc + r.responseTime, 0) / results.length,
        averageTokensPerSecond: results.reduce((acc, r) => acc + r.tokensPerSecond, 0) / results.length,
      },
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `benchmark-${selectedModel?.name || "unknown"}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const averageResponseTime =
    results.length > 0 ? results.reduce((acc, r) => acc + r.responseTime, 0) / results.length : 0

  const averageTokensPerSecond =
    results.length > 0 ? results.reduce((acc, r) => acc + r.tokensPerSecond, 0) / results.length : 0

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      <div className="col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Benchmark Control</span>
            </CardTitle>
            <CardDescription>
              {selectedModel ? `Test ${selectedModel.name}` : "Select a model to benchmark"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedModel || !isConnected ? (
              <div className="text-center py-8 text-muted-foreground">
                {!isConnected ? "Connect to server first" : "Select a model to benchmark"}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                  {currentTest && <p className="text-sm text-muted-foreground">Running: {currentTest}</p>}
                </div>

                <div className="flex space-x-2">
                  <Button onClick={runBenchmark} disabled={isRunning} className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    {isRunning ? "Running..." : "Start Benchmark"}
                  </Button>
                  {isRunning && (
                    <Button variant="outline" onClick={stopBenchmark}>
                      <Square className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {results.length > 0 && (
                  <Button variant="outline" onClick={exportResults} className="w-full bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Avg Response</span>
                  </div>
                  <div className="text-2xl font-bold">{Math.round(averageResponseTime)}ms</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>Tokens/sec</span>
                  </div>
                  <div className="text-2xl font-bold">{Math.round(averageTokensPerSecond)}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tests Completed:</span>
                  <span>
                    {results.length}/{BENCHMARK_TESTS.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Model:</span>
                  <span>{selectedModel?.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Benchmark Results</CardTitle>
            <CardDescription>Detailed results for each test scenario</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No benchmark results yet. Run a benchmark to see results here.
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-6">
                  {results.map((result) => (
                    <div key={result.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{result.testName}</Badge>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{result.responseTime}ms</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Zap className="h-3 w-3" />
                              <span>{result.tokensPerSecond} t/s</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Target className="h-3 w-3" />
                              <span>{result.tokenCount} tokens</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Prompt:</p>
                          <p className="text-sm bg-muted p-2 rounded">{result.prompt}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Response:</p>
                          <div className="text-sm bg-muted p-3 rounded max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap">{result.response}</pre>
                          </div>
                        </div>
                      </div>

                      <Separator />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
