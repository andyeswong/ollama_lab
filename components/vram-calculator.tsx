"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calculator, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { OllamaModel, CalculationResult, Precision } from "@/lib/types"
import { calculateVRAM } from "@/lib/vram-calculator"

interface VramCalculatorProps {
  selectedModel: OllamaModel | null
  onCalculationResult: (result: CalculationResult | null) => void
}

export function VramCalculator({ selectedModel, onCalculationResult }: VramCalculatorProps) {
  const [contextLength, setContextLength] = useState([4096])
  const [precision, setPrecision] = useState<Precision>("fp16")
  const [batchSize, setBatchSize] = useState(1)
  const [frameworkOverhead, setFrameworkOverhead] = useState(1024) // MB

  useEffect(() => {
    if (selectedModel) {
      const result = calculateVRAM({
        model: selectedModel,
        contextLength: contextLength[0],
        precision,
        batchSize,
        frameworkOverhead,
      })
      onCalculationResult(result)
    } else {
      onCalculationResult(null)
    }
  }, [selectedModel, contextLength, precision, batchSize, frameworkOverhead, onCalculationResult])

  if (!selectedModel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>VRAM Calculator</span>
          </CardTitle>
          <CardDescription>Select a model to start calculating VRAM requirements</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">No model selected</CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>VRAM Calculator</span>
          </CardTitle>
          <CardDescription>Configure parameters for {selectedModel.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label>Context Length: {contextLength[0].toLocaleString()} tokens</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximum number of tokens the model can process at once</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Slider
              value={contextLength}
              onValueChange={setContextLength}
              max={131072}
              min={1024}
              step={1024}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1K</span>
              <span>128K</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label>Precision</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Model precision affects VRAM usage and quality</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={precision} onValueChange={(value: Precision) => setPrecision(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fp32">FP32 (2x multiplier)</SelectItem>
                <SelectItem value="fp16">FP16 (1x multiplier) - Default</SelectItem>
                <SelectItem value="int8">INT8 (0.5x multiplier)</SelectItem>
                <SelectItem value="int4">INT4 (0.25x multiplier)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label>Batch Size</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of sequences processed simultaneously</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Math.max(1, Number.parseInt(e.target.value) || 1))}
              min={1}
              max={32}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label>Framework Overhead (MB)</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Additional VRAM used by the framework and system</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              value={frameworkOverhead}
              onChange={(e) => setFrameworkOverhead(Math.max(0, Number.parseInt(e.target.value) || 0))}
              min={0}
              max={4096}
            />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
