"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import { ModelList } from "@/components/model-list"
import { VramCalculator } from "@/components/vram-calculator"
import { ResultsDisplay } from "@/components/results-display"
import { Toaster } from "@/components/ui/toaster"
import { ChatInterface } from "@/components/chat-interface"
import { SystemPromptManager } from "@/components/system-prompt-manager"
import { ModelBenchmark } from "@/components/model-benchmark"
import { StressTest } from "@/components/stress-test"
import { Sidebar } from "@/components/sidebar"
import { ModelSelector } from "@/components/model-selector"
import { ModelManager } from "@/components/model-manager"
import { ModelCommandCenter } from "@/components/model-command-center"
import type { OllamaModel, CalculationResult } from "@/lib/types"

const queryClient = new QueryClient()

export default function Home() {
  const [serverUrl, setServerUrl] = useState("http://localhost:11434")
  const [isConnected, setIsConnected] = useState(false)
  const [selectedModel, setSelectedModel] = useState<OllamaModel | null>(null)
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null)
  const [activeView, setActiveView] = useState("vram")

  const renderContent = () => {
    switch (activeView) {
      case "vram":
        return (
          <div className="h-full space-y-6">
            <VramCalculator selectedModel={selectedModel} onCalculationResult={setCalculationResult} />
            <ResultsDisplay result={calculationResult} selectedModel={selectedModel} />
          </div>
        )
      case "chat":
        return (
          <ChatInterface
            serverUrl={serverUrl}
            isConnected={isConnected}
            selectedModel={selectedModel}
            onModelSelect={setSelectedModel}
          />
        )
      case "prompts":
        return <SystemPromptManager />
      case "benchmark":
        return <ModelBenchmark serverUrl={serverUrl} isConnected={isConnected} selectedModel={selectedModel} />
      case "stress":
        return <StressTest serverUrl={serverUrl} isConnected={isConnected} />
      case "command":
        return (
          <ModelCommandCenter 
            serverUrl={serverUrl} 
            isConnected={isConnected}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />
        )
      default:
        return null
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen bg-background">
          <Sidebar
            activeView={activeView}
            onViewChange={setActiveView}
            serverUrl={serverUrl}
            onServerUrlChange={setServerUrl}
            isConnected={isConnected}
            onConnectionChange={setIsConnected}
          />
          <div className="flex-1 flex flex-col">
            <div className="border-b bg-muted/40">
              <div className="container mx-auto py-3 flex items-center justify-between">
                <div className="flex items-center gap-4 mx-auto">
                  <ModelSelector 
                    serverUrl={serverUrl}
                    isConnected={isConnected}
                    selectedModel={selectedModel}
                    onModelSelect={setSelectedModel}
                    className="min-w-[400px]"
                  />
                  <ModelManager selectedModel={selectedModel?.name || null} />
                </div>
              </div>
            </div>
            <main className="flex-1 p-8 overflow-auto">{renderContent()}</main>
          </div>
          <Toaster />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
