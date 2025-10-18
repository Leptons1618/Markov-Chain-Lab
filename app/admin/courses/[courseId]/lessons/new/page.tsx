"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Creating lesson:", formData)
    router.push(`/admin/courses/${courseId}`)
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Create New Lesson</CardTitle>
            <CardDescription>Add a new lesson to this course</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Lesson Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Understanding Transition Matrices"
                  value={formData.title}
                  onChange={handleChange}
                  required
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
                  className="cursor-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Write your lesson content in Markdown format..."
                  value={formData.content}
                  onChange={handleChange}
                  rows={10}
                  required
                  className="font-mono text-sm cursor-text"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="cursor-pointer">
                  <Save className="h-4 w-4 mr-2" />
                  Create Lesson
                </Button>
                <Link href={`/admin/courses/${courseId}`}>
                  <Button variant="outline" className="cursor-pointer bg-transparent">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
