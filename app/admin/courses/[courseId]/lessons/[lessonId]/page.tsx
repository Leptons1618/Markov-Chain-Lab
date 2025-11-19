"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, Eye, Copy, Loader2, Upload } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { fetchLesson, type Lesson } from "@/lib/lms"

export default function LessonEditorPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const lessonId = params.lessonId as string

  const [lessonData, setLessonData] = useState<Lesson | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [importingMarkdown, setImportingMarkdown] = useState(false)
  const markdownFileInputRef = useRef<HTMLInputElement>(null)

  // Fetch lesson data
  useEffect(() => {
    const loadLesson = async () => {
      setLoading(true)
      try {
        const lesson = await fetchLesson(lessonId)
        if (lesson) {
          setLessonData(lesson)
        } else {
          setError("Lesson not found")
        }
      } catch (error) {
        console.error("Failed to load lesson:", error)
        setError("Failed to load lesson")
      } finally {
        setLoading(false)
      }
    }
    
    if (lessonId) {
      loadLesson()
    }
  }, [lessonId])

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !lessonData) return

    const timer = setTimeout(() => {
      handleAutoSave()
    }, 2000)

    return () => clearTimeout(timer)
  }, [lessonData, autoSaveEnabled])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!lessonData) return
    
    const { name, value } = e.target
    setLessonData((prev) => ({
      ...prev!,
      [name]: value,
    }))
  }

  const handleImportMarkdown = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !lessonData) return

    setImportingMarkdown(true)
    try {
      const fileContent = await file.text()
      setLessonData((prev) => ({
        ...prev!,
        content: fileContent,
      }))
      alert("Markdown content imported successfully!")
    } catch (error) {
      console.error("Import error:", error)
      alert("Failed to import markdown file")
    } finally {
      setImportingMarkdown(false)
      if (markdownFileInputRef.current) {
        markdownFileInputRef.current.value = ""
      }
    }
  }

  const handleAutoSave = async () => {
    if (!lessonData) return
    
    setSaveStatus("saving")
    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: lessonData.title,
          description: lessonData.description,
          content: lessonData.content,
        }),
      })

      if (response.ok) {
        setSaveStatus("saved")
        setTimeout(() => setSaveStatus("idle"), 2000)
      }
    } catch (error) {
      console.error("Auto-save failed:", error)
      setSaveStatus("idle")
    }
  }

  const handleSave = async () => {
    if (!lessonData) return
    
    setIsSaving(true)
    setSaveStatus("saving")
    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: lessonData.title,
          description: lessonData.description,
          content: lessonData.content,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setLessonData(result.data)
        setSaveStatus("saved")
        setTimeout(() => setSaveStatus("idle"), 2000)
      } else {
        setError(result.error || "Failed to save lesson")
      }
    } catch (error) {
      console.error("Failed to save lesson:", error)
      setError("Failed to save lesson. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!lessonData) return
    
    const newStatus = lessonData.status === "published" ? "draft" : "published"
    
    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setLessonData(result.data)
      } else {
        setError(result.error || "Failed to update lesson status")
      }
    } catch (error) {
      console.error("Failed to update lesson status:", error)
      setError("Failed to update lesson status. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold break-words">Edit Lesson</h1>
            <p className="text-muted-foreground mt-1 break-words">{lessonData?.title || 'Loading...'}</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {saveStatus === "saving" && <span className="text-sm text-muted-foreground hidden sm:inline">Saving...</span>}
            {saveStatus === "saved" && <span className="text-sm text-green-600 hidden sm:inline">Saved</span>}
            <Button onClick={handleSave} disabled={isSaving} className="cursor-pointer" size="sm">
              <Save className="h-4 w-4 sm:mr-2" />
              {isSaving ? <span className="hidden sm:inline">Saving...</span> : <span className="hidden sm:inline">Save</span>}
            </Button>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading lesson...</span>
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-destructive">{error}</p>
            <Link href={`/admin/courses/${courseId}`} className="mt-4 inline-block">
              <Button variant="outline" className="cursor-pointer bg-transparent">
                Back to Course
              </Button>
            </Link>
          </Card>
        ) : lessonData ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Editor */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lesson Information</CardTitle>
                  <CardDescription>Edit basic lesson details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Lesson Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={lessonData.title}
                      onChange={handleChange}
                      disabled={isSaving}
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
                      disabled={isSaving}
                      className="cursor-text"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Lesson Content</CardTitle>
                      <CardDescription>Write your lesson content in Markdown format</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        ref={markdownFileInputRef}
                        type="file"
                        accept=".md,.markdown,.txt"
                        onChange={handleImportMarkdown}
                        disabled={importingMarkdown || isSaving}
                        className="hidden"
                        id="markdown-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => markdownFileInputRef.current?.click()}
                        disabled={importingMarkdown || isSaving}
                        className="cursor-pointer"
                      >
                        {importingMarkdown ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Import Markdown
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    name="content"
                    value={lessonData.content}
                    onChange={handleChange}
                    rows={20}
                    placeholder="Write your lesson content here..."
                    disabled={isSaving}
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
                      onClick={handleStatusToggle}
                      disabled={isSaving}
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
                      disabled={isSaving}
                      className="cursor-pointer"
                    />
                    <Label htmlFor="autosave" className="cursor-pointer">
                      Enable auto-save
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {autoSaveEnabled ? "Changes are automatically saved every 2 seconds" : "Auto-save is disabled"}
                  </p>
                  {saveStatus === "saving" && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </p>
                  )}
                  {saveStatus === "saved" && (
                    <p className="text-xs text-green-600">Saved</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href={`/learn/${lessonId}`}>
                    <Button variant="outline" className="w-full cursor-pointer bg-transparent justify-start">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Lesson
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full cursor-pointer bg-transparent justify-start"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/learn/${lessonId}`)
                      alert("Link copied to clipboard!")
                    }}
                  >
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
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">{new Date(lessonData.createdAt).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
    </div>
  )
}
