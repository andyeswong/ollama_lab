"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Send, Trash2, Copy, Download, Settings, Loader2 } from "lucide-react"
import type { OllamaModel } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  model?: string
}

interface ChatInterfaceProps {
  serverUrl: string
  isConnected: boolean
  selectedModel: OllamaModel | null
  onModelSelect: (model: OllamaModel) => void
}

export function ChatInterface({ serverUrl, isConnected, selectedModel, onModelSelect }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState("")
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2048)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !selectedModel || !isConnected) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ollama/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverUrl,
          model: selectedModel.name,
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: input.trim() },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      })

      if (!response.ok) throw new Error("Failed to send message")

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        model: selectedModel.name,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message to model",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const exportChat = () => {
    const chatData = {
      model: selectedModel?.name,
      systemPrompt,
      temperature,
      maxTokens,
      messages,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chat-${selectedModel?.name || "unknown"}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    })
  }

  return (
    <div className="grid grid-cols-4 gap-6 h-full">
      <div className="col-span-3">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Model Chat</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={exportChat} disabled={messages.length === 0}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={clearChat} disabled={messages.length === 0}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              {selectedModel ? `Chatting with ${selectedModel.name}` : "Select a model to start chatting"}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col space-y-4">
            <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {systemPrompt && (
                  <div className="p-3 bg-muted rounded-lg">
                    <Badge variant="secondary" className="mb-2">
                      System
                    </Badge>
                    <p className="text-sm">{systemPrompt}</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={message.role === "user" ? "default" : "secondary"}>
                          {message.role === "user" ? "You" : message.model || "Assistant"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.timestamp.toISOString())}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyMessage(message.content)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center space-x-2 p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            <Separator />

            <div className="space-y-2">
              <Textarea
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                rows={3}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</span>
                <Button onClick={sendMessage} disabled={!input.trim() || !selectedModel || !isConnected || isLoading}>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Temperature</label>
              <Select value={temperature.toString()} onValueChange={(v) => setTemperature(Number.parseFloat(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0.0 (Deterministic)</SelectItem>
                  <SelectItem value="0.3">0.3 (Focused)</SelectItem>
                  <SelectItem value="0.7">0.7 (Balanced)</SelectItem>
                  <SelectItem value="1.0">1.0 (Creative)</SelectItem>
                  <SelectItem value="1.5">1.5 (Very Creative)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Tokens</label>
              <Select value={maxTokens.toString()} onValueChange={(v) => setMaxTokens(Number.parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="512">512</SelectItem>
                  <SelectItem value="1024">1024</SelectItem>
                  <SelectItem value="2048">2048</SelectItem>
                  <SelectItem value="4096">4096</SelectItem>
                  <SelectItem value="8192">8192</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">System Prompt</label>
              <Textarea
                placeholder="Enter system prompt..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chat Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Messages:</span>
              <span>{messages.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>User:</span>
              <span>{messages.filter((m) => m.role === "user").length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Assistant:</span>
              <span>{messages.filter((m) => m.role === "assistant").length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
