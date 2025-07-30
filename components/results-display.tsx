"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BarChart3, Copy, Download, CpuIcon as Gpu } from "lucide-react"
import type { CalculationResult, OllamaModel } from "@/lib/types"
import { formatBytes } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ResultsDisplayProps {
  result: CalculationResult | null
  selectedModel: OllamaModel | null
}

export function ResultsDisplay({ result, selectedModel }: ResultsDisplayProps) {
  const { toast } = useToast()

  if (!result || !selectedModel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Results</span>
          </CardTitle>
          <CardDescription>VRAM calculation results will appear here</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">No calculation results</CardContent>
      </Card>
    )
  }

  const getVramColor = (vramGB: number) => {
    if (vramGB < 8) return "text-green-600"
    if (vramGB < 16) return "text-yellow-600"
    if (vramGB < 24) return "text-orange-600"
    return "text-red-600"
  }

  const getVramBadge = (vramGB: number) => {
    if (vramGB < 8) return <Badge className="bg-green-500">Consumer GPU</Badge>
    if (vramGB < 16) return <Badge className="bg-yellow-500">Mid-range GPU</Badge>
    if (vramGB < 24) return <Badge className="bg-orange-500">High-end GPU</Badge>
    return <Badge className="bg-red-500">Enterprise GPU</Badge>
  }

  const getGpuRecommendations = (vramGB: number) => {
    if (vramGB < 8) return ["RTX 4060", "RTX 3070", "RX 6700 XT"]
    if (vramGB < 16) return ["RTX 4070 Ti", "RTX 3080", "RX 6800 XT"]
    if (vramGB < 24) return ["RTX 4080", "RTX 3090", "RTX 4090"]
    return ["RTX 4090", "A100", "H100", "Multiple GPUs"]
  }

  const copyResults = () => {
    const text = `VRAM Calculation Results for ${selectedModel.name}
Base Model: ${formatBytes(result.baseModelVram * 1024 * 1024)}
Context Buffer: ${formatBytes(result.contextBuffer * 1024 * 1024)}
Framework Overhead: ${formatBytes(result.frameworkOverhead * 1024 * 1024)}
Total VRAM: ${formatBytes(result.totalVram * 1024 * 1024)}
GPU Category: ${result.totalVram < 8 ? "Consumer" : result.totalVram < 16 ? "Mid-range" : result.totalVram < 24 ? "High-end" : "Enterprise"}`

    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Results copied to clipboard",
    })
  }

  const exportToJson = () => {
    const data = {
      model: selectedModel.name,
      timestamp: new Date().toISOString(),
      calculation: result,
      recommendations: getGpuRecommendations(result.totalVram),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vram-calculation-${selectedModel.name.replace(/[^a-z0-9]/gi, "-")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalVramGB = result.totalVram
  const progressValue = Math.min((totalVramGB / 32) * 100, 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Results</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={copyResults}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportToJson}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>VRAM requirements for {selectedModel.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total VRAM Required</span>
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-bold ${getVramColor(totalVramGB)}`}>
                {formatBytes(totalVramGB * 1024 * 1024 * 1024)}
              </span>
              {getVramBadge(totalVramGB)}
            </div>
          </div>

          <Progress value={progressValue} className="h-2" />

          <div className="text-xs text-muted-foreground text-center">0GB ← → 32GB+</div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="font-medium">Breakdown</h4>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Base Model</span>
              <span>{formatBytes(result.baseModelVram * 1024 * 1024)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Context Buffer</span>
              <span>{formatBytes(result.contextBuffer * 1024 * 1024)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Framework Overhead</span>
              <span>{formatBytes(result.frameworkOverhead * 1024 * 1024)}</span>
            </div>

            <Separator />

            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatBytes(result.totalVram * 1024 * 1024)}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="font-medium flex items-center space-x-2">
            <Gpu className="h-4 w-4" />
            <span>GPU Recommendations</span>
          </h4>

          <div className="flex flex-wrap gap-2">
            {getGpuRecommendations(totalVramGB).map((gpu) => (
              <Badge key={gpu} variant="outline">
                {gpu}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
