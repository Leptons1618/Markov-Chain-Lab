"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Edit, Trash2, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { fetchCourse, fetchLessonsByCourse, type Course, type Lesson } from "@/lib/lms"

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params.courseId as string

  const [isEditing, setIsEditing] = useState(false)
  const [courseData, setCourseData] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Fetch course and lessons data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [course, courseLessons] = await Promise.all([
          fetchCourse(courseId),
          fetchLessonsByCourse(courseId)
        ])
        
        if (course) {
          setCourseData(course)
        } else {
          setError("Course not found")
        }
        
        setLessons(courseLessons.sort((a, b) => a.order - b.order))
      } catch (error) {
        console.error("Failed to load course data:", error)
        setError("Failed to load course data")
      } finally {
        setLoading(false)
      }
    }
    
    if (courseId) {
      loadData()
    }
  }, [courseId])

  const handleCourseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!courseData) return
    
    const { name, value } = e.target
    setCourseData((prev) => ({
      ...prev!,
      [name]: value,
    }))
  }

  const handleSaveCourse = async () => {
    if (!courseData) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: courseData.title,
          description: courseData.description,
          slug: courseData.slug,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setIsEditing(false)
        setCourseData(result.data)
      } else {
        setError(result.error || "Failed to update course")
      }
    } catch (error) {
      console.error("Failed to update course:", error)
      setError("Failed to update course. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/lessons/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setLessons(lessons.filter((l) => l.id !== id))
      } else {
        const error = await response.json()
        alert(`Failed to delete lesson: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to delete lesson:", error)
      alert("Failed to delete lesson. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">M</span>
                </div>
                <span className="font-semibold text-lg">Admin</span>
              </Link>
              <nav className="hidden md:flex items-center gap-2">
                <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Dashboard
                </Link>
                <span className="text-muted-foreground">/</span>
                <Link href="/admin/courses" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Courses
                </Link>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground font-medium text-sm">
                  {courseData?.title || 'Course Details'}
                </span>
              </nav>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="cursor-pointer">
                View Site
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading course...</span>
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-destructive">{error}</p>
            <Link href="/admin/courses" className="mt-4 inline-block">
              <Button variant="outline" className="cursor-pointer bg-transparent">
                Back to Courses
              </Button>
            </Link>
          </Card>
        ) : courseData ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Details */}
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Course Details</CardTitle>
                    <CardDescription>Edit course information</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={saving}
                    className="cursor-pointer bg-transparent"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                  
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="title">Course Title</Label>
                        <Input
                          id="title"
                          name="title"
                          value={courseData.title}
                          onChange={handleCourseChange}
                          disabled={saving}
                          className="cursor-text"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={courseData.description}
                          onChange={handleCourseChange}
                          rows={4}
                          disabled={saving}
                          className="cursor-text"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slug">URL Slug</Label>
                        <Input
                          id="slug"
                          name="slug"
                          value={courseData.slug}
                          onChange={handleCourseChange}
                          disabled={saving}
                          className="cursor-text"
                        />
                      </div>
                      <Button onClick={handleSaveCourse} disabled={saving} className="cursor-pointer">
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Title</p>
                        <p className="text-lg font-semibold">{courseData.title}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Description</p>
                        <p className="text-foreground">{courseData.description}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">URL Slug</p>
                        <p className="text-foreground font-mono text-sm">{courseData.slug}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <Badge variant={courseData.status === "published" ? "default" : "secondary"}>
                          {courseData.status}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

            {/* Lessons */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Lessons</CardTitle>
                  <CardDescription>Manage course lessons</CardDescription>
                </div>
                <Link href={`/admin/courses/${courseId}/lessons/new`}>
                  <Button size="sm" className="cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    New Lesson
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {lessons.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No lessons yet</p>
                    <Link href={`/admin/courses/${courseId}/lessons/new`}>
                      <Button className="cursor-pointer">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Lesson
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{lesson.title}</p>
                            <Badge variant={lesson.status === "published" ? "default" : "secondary"}>
                              {lesson.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{lesson.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Order: {lesson.order} • Created {new Date(lesson.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/admin/courses/${courseId}/lessons/${lesson.id}`}>
                            <Button variant="outline" size="sm" className="cursor-pointer bg-transparent">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="cursor-pointer bg-transparent text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Lessons</p>
                  <p className="text-2xl font-bold">{lessons.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold">{lessons.filter((l) => l.status === "published").length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Draft</p>
                  <p className="text-2xl font-bold">{lessons.filter((l) => l.status === "draft").length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{new Date(courseData.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/learn/${courseData.slug}`}>
                  <Button variant="outline" className="w-full cursor-pointer bg-transparent justify-start">
                    Preview Course
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full cursor-pointer bg-transparent justify-start"
                  onClick={() => {
                    // TODO: Implement publish/unpublish functionality
                    alert("Publish functionality coming soon!")
                  }}
                >
                  {courseData.status === "published" ? "Unpublish Course" : "Publish Course"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full cursor-pointer bg-transparent justify-start text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this course? This will also delete all lessons.")) {
                      // TODO: Implement course deletion
                      alert("Course deletion coming soon!")
                    }
                  }}
                >
                  Delete Course
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        ) : null}
      </div>
    </div>
  )
}
