"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Server, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ServerConnectionProps {
  serverUrl: string
  onServerUrlChange: (url: string) => void
  isConnected: boolean
  onConnectionChange: (connected: boolean) => void
}

export function ServerConnection({
  serverUrl,
  onServerUrlChange,
  isConnected,
  onConnectionChange,
}: ServerConnectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connected" | "error">("disconnected")
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
        setConnectionStatus("connected")
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

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <Badge variant="default" className="bg-green-500">
            Connected
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Disconnected</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Server className="h-5 w-5" />
          <span>Server Connection</span>
        </CardTitle>
        <CardDescription>Connect to your Ollama server to fetch available models</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          {getStatusBadge()}
        </div>

        <div className="space-y-2">
          <label htmlFor="server-url" className="text-sm font-medium">
            Server URL
          </label>
          <Input
            id="server-url"
            value={serverUrl}
            onChange={(e) => onServerUrlChange(e.target.value)}
            placeholder="http://localhost:11434"
          />
        </div>

        <Button onClick={testConnection} disabled={isLoading || !serverUrl} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Test Connection
        </Button>
      </CardContent>
    </Card>
  )
}
