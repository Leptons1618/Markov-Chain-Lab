"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, Loader2, Upload, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"

export default function NewLessonPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [importingMarkdown, setImportingMarkdown] = useState(false)
  const markdownFileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError("") // Clear error when user starts typing
  }

  const handleImportMarkdown = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportingMarkdown(true)
    try {
      const fileContent = await file.text()
      setFormData((prev) => ({
        ...prev,
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

  // Check if all required fields are filled
  const isFormValid = formData.title.trim() !== "" && 
                      formData.description.trim() !== "" && 
                      formData.content.trim() !== ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          courseId,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        router.push(`/admin/courses/${courseId}`)
      } else {
        setError(result.error || "Failed to create lesson")
      }
    } catch (error) {
      console.error("Failed to create lesson:", error)
      setError("Failed to create lesson. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create New Lesson</CardTitle>
            <CardDescription>Add a new lesson to this course</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="e.g., Understanding Transition Matrices"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="cursor-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of what students will learn..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  required
                  disabled={isSubmitting}
                  className="cursor-text"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Content</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={markdownFileInputRef}
                      type="file"
                      accept=".md,.markdown,.txt"
                      onChange={handleImportMarkdown}
                      disabled={importingMarkdown || isSubmitting}
                      className="hidden"
                      id="markdown-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => markdownFileInputRef.current?.click()}
                      disabled={importingMarkdown || isSubmitting}
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
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Write your lesson content in Markdown format..."
                  value={formData.content}
                  onChange={handleChange}
                  rows={24}
                  required
                  disabled={isSubmitting}
                  className="font-mono text-sm cursor-text min-h-[600px]"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting || !isFormValid} className="cursor-pointer">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Lesson
                    </>
                  )}
                </Button>
                <Link href={`/admin/courses/${courseId}`}>
                  <Button variant="outline" disabled={isSubmitting} className="cursor-pointer bg-transparent">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  )
}
