"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/mode-toggle"
import { ServerSettingsModal } from "@/components/server-settings-modal"
import {
  Calculator,
  MessageCircle,
  FileText,
  BarChart3,
  Activity,
  Github,
  Settings,
  ChevronLeft,
  ChevronRight,
  Command,
} from "lucide-react"

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  serverUrl: string
  onServerUrlChange: (url: string) => void
  isConnected: boolean
  onConnectionChange: (connected: boolean) => void
}

const navigationItems = [
  {
    id: "command",
    label: "Command Center",
    icon: Command,
    description: "Manage models and operations",
  },
  {
    id: "vram",
    label: "VRAM Calculator",
    icon: Calculator,
    description: "Calculate VRAM requirements",
  },
  {
    id: "chat",
    label: "Model Chat",
    icon: MessageCircle,
    description: "Interactive model testing",
  },
  {
    id: "prompts",
    label: "System Prompts",
    icon: FileText,
    description: "Manage prompt templates",
  },
  {
    id: "benchmark",
    label: "Benchmark",
    icon: BarChart3,
    description: "Performance testing",
  },
  {
    id: "stress",
    label: "Stress Test",
    icon: Activity,
    description: "Multi-model load testing",
  },
]

export function Sidebar({
  activeView,
  onViewChange,
  serverUrl,
  onServerUrlChange,
  isConnected,
  onConnectionChange,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showServerSettings, setShowServerSettings] = useState(false)

  return (
    <>
      <div className={`bg-card border-r flex flex-col transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <Calculator className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="font-bold text-lg">Ollama Lab</h1>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-muted-foreground">AI Model Toolkit</p>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                  </div>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={isCollapsed ? "w-full" : ""}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        {!isCollapsed && (
          <div className="px-4 py-2 border-b bg-muted/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Server Status</span>
              <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            {isConnected && <p className="text-xs text-muted-foreground mt-1 truncate">{serverUrl}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start h-auto p-3 ${isCollapsed ? "px-2" : ""}`}
                  onClick={() => onViewChange(item.id)}
                >
                  <Icon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"} flex-shrink-0`} />
                  {!isCollapsed && (
                    <div className="text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  )}
                </Button>
              )
            })}
          </nav>
        </div>

        <Separator />

        {/* Footer */}
        <div className="p-4 space-y-2">
          {!isCollapsed && (
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Version 1.0.0</span>
              <Badge variant="outline" className="text-xs">
                Beta
              </Badge>
            </div>
          )}

          <div className={`flex ${isCollapsed ? "flex-col space-y-2" : "space-x-2"}`}>
            <Button variant="ghost" size="sm" asChild className={isCollapsed ? "w-full" : "flex-1"}>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">GitHub</span>}
              </a>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={isCollapsed ? "w-full" : "flex-1"}
              onClick={() => setShowServerSettings(true)}
            >
              <Settings className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Settings</span>}
            </Button>
          </div>

          <div className={`flex ${isCollapsed ? "justify-center" : "justify-end"}`}>
            <ModeToggle />
          </div>
        </div>
      </div>

      <ServerSettingsModal
        open={showServerSettings}
        onOpenChange={setShowServerSettings}
        serverUrl={serverUrl}
        onServerUrlChange={onServerUrlChange}
        isConnected={isConnected}
        onConnectionChange={onConnectionChange}
      />
    </>
  )
}
