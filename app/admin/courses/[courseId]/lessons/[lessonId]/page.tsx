"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Eye, Copy } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface LessonContent {
  title: string
  description: string
  content: string
  status: "published" | "draft"
}

export default function LessonEditorPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const lessonId = params.lessonId as string

  const [lessonData, setLessonData] = useState<LessonContent>({
    title: "What is a Markov Chain?",
    description: "Understanding the fundamental concept of Markov chains",
    content: `# Markov Chains Explained

A Markov chain is a stochastic model describing a sequence of possible events in which the probability of each event depends only on the state attained in the previous event.

## Key Properties

1. **Memoryless Property**: The future state depends only on the current state, not on the sequence of events that preceded it.
2. **State Space**: The set of all possible states the system can be in.
3. **Transition Probabilities**: The probability of moving from one state to another.

## Mathematical Definition

A Markov chain is defined by:
- A finite set of states S = {s₁, s₂, ..., sₙ}
- A transition matrix P where P(i,j) represents the probability of transitioning from state i to state j
- An initial state distribution

## Example: Weather Model

Consider a simple weather model with two states:
- Sunny (S)
- Rainy (R)

The transition probabilities might be:
- P(S→S) = 0.7 (70% chance sunny day follows sunny day)
- P(S→R) = 0.3 (30% chance rainy day follows sunny day)
- P(R→S) = 0.4 (40% chance sunny day follows rainy day)
- P(R→R) = 0.6 (60% chance rainy day follows rainy day)`,
    status: "published",
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled) return

    const timer = setTimeout(() => {
      handleAutoSave()
    }, 2000)

    return () => clearTimeout(timer)
  }, [lessonData, autoSaveEnabled])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setLessonData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAutoSave = async () => {
    setSaveStatus("saving")
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    setSaveStatus("saved")
    setTimeout(() => setSaveStatus("idle"), 2000)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus("saving")
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaveStatus("saved")
    setIsSaving(false)
    setTimeout(() => setSaveStatus("idle"), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href={`/admin/courses/${courseId}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-semibold">Back to Course</span>
            </Link>
            <div className="flex items-center gap-4">
              {saveStatus === "saving" && <span className="text-sm text-muted-foreground">Saving...</span>}
              {saveStatus === "saved" && <span className="text-sm text-green-600">Saved</span>}
              <Button onClick={handleSave} disabled={isSaving} className="cursor-pointer">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lesson Information</CardTitle>
                <CardDescription>Edit basic lesson details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Lesson Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={lessonData.title}
                    onChange={handleChange}
                    className="cursor-text"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={lessonData.description}
                    onChange={handleChange}
                    rows={2}
                    className="cursor-text"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lesson Content</CardTitle>
                <CardDescription>Write your lesson content in Markdown format</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  name="content"
                  value={lessonData.content}
                  onChange={handleChange}
                  rows={20}
                  placeholder="Write your lesson content here..."
                  className="font-mono text-sm cursor-text"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                  <Badge variant={lessonData.status === "published" ? "default" : "secondary"}>
                    {lessonData.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer bg-transparent justify-start"
                    onClick={() =>
                      setLessonData((prev) => ({
                        ...prev,
                        status: prev.status === "published" ? "draft" : "published",
                      }))
                    }
                  >
                    {lessonData.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Auto-save</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autosave"
                    checked={autoSaveEnabled}
                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <Label htmlFor="autosave" className="cursor-pointer">
                    Enable auto-save
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {autoSaveEnabled ? "Changes are automatically saved every 2 seconds" : "Auto-save is disabled"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full cursor-pointer bg-transparent justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Lesson
                </Button>
                <Button variant="outline" className="w-full cursor-pointer bg-transparent justify-start">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Content Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Words</p>
                  <p className="text-2xl font-bold">{lessonData.content.split(/\s+/).length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Characters</p>
                  <p className="text-2xl font-bold">{lessonData.content.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
