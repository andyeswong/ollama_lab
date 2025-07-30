"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileText, Plus, Edit, Trash2, Copy, Download, Upload, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SystemPrompt {
  id: string
  name: string
  description: string
  content: string
  category: string
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
}

const DEFAULT_PROMPTS: SystemPrompt[] = [
  {
    id: "1",
    name: "Helpful Assistant",
    description: "A general-purpose helpful assistant",
    content:
      "You are a helpful, harmless, and honest assistant. Provide accurate and useful information while being respectful and professional.",
    category: "General",
    isFavorite: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Code Reviewer",
    description: "Expert code reviewer and programming assistant",
    content:
      "You are an expert software engineer and code reviewer. Analyze code for bugs, performance issues, security vulnerabilities, and best practices. Provide constructive feedback and suggestions for improvement.",
    category: "Programming",
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Creative Writer",
    description: "Creative writing and storytelling assistant",
    content:
      "You are a creative writing assistant with expertise in storytelling, character development, and narrative structure. Help users craft engaging stories, develop characters, and improve their writing style.",
    category: "Creative",
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    name: "Research Assistant",
    description: "Academic and research-focused assistant",
    content:
      "You are a research assistant with expertise in academic writing, data analysis, and scientific methodology. Help users with research questions, literature reviews, and academic writing while maintaining scholarly standards.",
    category: "Academic",
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export function SystemPromptManager() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPrompt | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const { toast } = useToast()

  useEffect(() => {
    // Load prompts from localStorage or use defaults
    const savedPrompts = localStorage.getItem("systemPrompts")
    if (savedPrompts) {
      try {
        const parsed = JSON.parse(savedPrompts).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }))
        setPrompts(parsed)
      } catch {
        setPrompts(DEFAULT_PROMPTS)
      }
    } else {
      setPrompts(DEFAULT_PROMPTS)
    }
  }, [])

  useEffect(() => {
    // Save prompts to localStorage
    localStorage.setItem("systemPrompts", JSON.stringify(prompts))
  }, [prompts])

  const categories = ["All", ...Array.from(new Set(prompts.map((p) => p.category)))]

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch =
      prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || prompt.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const createPrompt = () => {
    const newPrompt: SystemPrompt = {
      id: Date.now().toString(),
      name: "New Prompt",
      description: "Description for new prompt",
      content: "",
      category: "General",
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setPrompts((prev) => [...prev, newPrompt])
    setSelectedPrompt(newPrompt)
    setIsEditing(true)
  }

  const updatePrompt = (updatedPrompt: SystemPrompt) => {
    setPrompts((prev) => prev.map((p) => (p.id === updatedPrompt.id ? { ...updatedPrompt, updatedAt: new Date() } : p)))
    setSelectedPrompt(updatedPrompt)
    setIsEditing(false)
    toast({
      title: "Prompt updated",
      description: "System prompt has been saved successfully",
    })
  }

  const deletePrompt = (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id))
    if (selectedPrompt?.id === id) {
      setSelectedPrompt(null)
    }
    toast({
      title: "Prompt deleted",
      description: "System prompt has been removed",
    })
  }

  const toggleFavorite = (id: string) => {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p)))
  }

  const copyPrompt = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: "Copied",
      description: "Prompt copied to clipboard",
    })
  }

  const exportPrompts = () => {
    const data = {
      prompts,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `system-prompts-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importPrompts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.prompts && Array.isArray(data.prompts)) {
          const importedPrompts = data.prompts.map((p: any) => ({
            ...p,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date(p.createdAt || Date.now()),
            updatedAt: new Date(p.updatedAt || Date.now()),
          }))
          setPrompts((prev) => [...prev, ...importedPrompts])
          toast({
            title: "Import successful",
            description: `Imported ${importedPrompts.length} prompts`,
          })
        }
      } catch {
        toast({
          title: "Import failed",
          description: "Invalid file format",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      <div className="col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>System Prompts</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={exportPrompts}>
                  <Download className="h-4 w-4" />
                </Button>
                <label>
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4" />
                    </span>
                  </Button>
                  <input type="file" accept=".json" onChange={importPrompts} className="hidden" />
                </label>
                <Button size="sm" onClick={createPrompt}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            <CardDescription>Manage your system prompt templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Search prompts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                      selectedPrompt?.id === prompt.id ? "bg-accent border-primary" : ""
                    }`}
                    onClick={() => setSelectedPrompt(prompt)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{prompt.name}</span>
                          {prompt.isFavorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{prompt.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {prompt.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-2">
        {selectedPrompt ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedPrompt.name}</span>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => toggleFavorite(selectedPrompt.id)}>
                    <Star className={`h-4 w-4 ${selectedPrompt.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => copyPrompt(selectedPrompt.content)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Prompt</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete "{selectedPrompt.name}"? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline">Cancel</Button>
                        <Button variant="destructive" onClick={() => deletePrompt(selectedPrompt.id)}>
                          Delete
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardTitle>
              <CardDescription>{selectedPrompt.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <PromptEditor prompt={selectedPrompt} onSave={updatePrompt} onCancel={() => setIsEditing(false)} />
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm font-mono">{selectedPrompt.content}</pre>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Category: {selectedPrompt.category}</span>
                    <span>Updated: {selectedPrompt.updatedAt.toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
              Select a prompt to view or edit
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

interface PromptEditorProps {
  prompt: SystemPrompt
  onSave: (prompt: SystemPrompt) => void
  onCancel: () => void
}

function PromptEditor({ prompt, onSave, onCancel }: PromptEditorProps) {
  const [name, setName] = useState(prompt.name)
  const [description, setDescription] = useState(prompt.description)
  const [content, setContent] = useState(prompt.content)
  const [category, setCategory] = useState(prompt.category)

  const handleSave = () => {
    onSave({
      ...prompt,
      name,
      description,
      content,
      category,
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Content</label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} className="font-mono" />
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  )
}
