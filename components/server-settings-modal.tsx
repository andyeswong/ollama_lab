"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Server, CheckCircle, XCircle, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ServerSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serverUrl: string
  onServerUrlChange: (url: string) => void
  isConnected: boolean
  onConnectionChange: (connected: boolean) => void
}

export function ServerSettingsModal({
  open,
  onOpenChange,
  serverUrl,
  onServerUrlChange,
  isConnected,
  onConnectionChange,
}: ServerSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connected" | "error">(
    isConnected ? "connected" : "disconnected",
  )
  const [serverInfo, setServerInfo] = useState<any>(null)
  const { toast } = useToast()

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ollama/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverUrl }),
      })

      if (response.ok) {
        const data = await response.json()
        setConnectionStatus("connected")
        setServerInfo(data)
        onConnectionChange(true)
        toast({
          title: "Connection successful",
          description: "Successfully connected to Ollama server",
        })
      } else {
        throw new Error("Connection failed")
      }
    } catch (error) {
      setConnectionStatus("error")
      setServerInfo(null)
      onConnectionChange(false)
      toast({
        title: "Connection failed",
        description: "Could not connect to Ollama server",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = () => {
    setConnectionStatus("disconnected")
    setServerInfo(null)
    onConnectionChange(false)
    toast({
      title: "Disconnected",
      description: "Disconnected from Ollama server",
    })
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <Badge variant="default" className="bg-green-500">
            <Wifi className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive">
            <WifiOff className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <WifiOff className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        )
    }
  }

  const presetServers = [
    { name: "Local Default", url: "http://localhost:11434" },
    { name: "Local Alt Port", url: "http://localhost:11435" },
    { name: "Docker Default", url: "http://127.0.0.1:11434" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Server Settings</span>
          </DialogTitle>
          <DialogDescription>Configure your connection to the Ollama server</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <p className="font-medium">Connection Status</p>
                <p className="text-sm text-muted-foreground">
                  {connectionStatus === "connected" ? "Ready to use Ollama services" : "Not connected to server"}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {/* Server URL Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="server-url" className="text-sm font-medium">
                Server URL
              </label>
              <Input
                id="server-url"
                value={serverUrl}
                onChange={(e) => onServerUrlChange(e.target.value)}
                placeholder="http://localhost:11434"
                disabled={isLoading}
              />
            </div>

            {/* Preset Servers */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Presets</label>
              <div className="grid grid-cols-1 gap-2">
                {presetServers.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto p-3 bg-transparent"
                    onClick={() => onServerUrlChange(preset.url)}
                    disabled={isLoading}
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-muted-foreground">{preset.url}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Connection Actions */}
          <div className="flex space-x-2">
            <Button onClick={testConnection} disabled={isLoading || !serverUrl} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Testing..." : "Test Connection"}
            </Button>

            {connectionStatus === "connected" && (
              <Button variant="outline" onClick={disconnect}>
                Disconnect
              </Button>
            )}
          </div>

          {/* Server Information */}
          {serverInfo && connectionStatus === "connected" && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Server Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Version:</span>
                    <p className="font-mono">{serverInfo.version || "Unknown"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="text-green-600">Online</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Connection Tips */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Connection Tips</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Make sure Ollama is running on your system</li>
              <li>• Default port is 11434 for local installations</li>
              <li>• Check firewall settings if connecting remotely</li>
              <li>• Use 127.0.0.1 instead of localhost if needed</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
