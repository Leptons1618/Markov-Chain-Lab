"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Edit, Trash2, Save } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface Lesson {
  id: string
  title: string
  description: string
  order: number
  status: "published" | "draft"
}

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params.courseId as string

  const [isEditing, setIsEditing] = useState(false)
  const [courseData, setCourseData] = useState({
    title: "Markov Chain Basics",
    description: "Introduction to Markov chains and state transitions",
    slug: "markov-chain-basics",
  })

  const [lessons, setLessons] = useState<Lesson[]>([
    {
      id: "1",
      title: "What is a Markov Chain?",
      description: "Understanding the fundamental concept",
      order: 1,
      status: "published",
    },
    {
      id: "2",
      title: "State Transitions",
      description: "How states change over time",
      order: 2,
      status: "published",
    },
    {
      id: "3",
      title: "Transition Matrices",
      description: "Mathematical representation",
      order: 3,
      status: "draft",
    },
  ])

  const handleCourseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCourseData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveCourse = () => {
    console.log("Saving course:", courseData)
    setIsEditing(false)
  }

  const handleDeleteLesson = (id: string) => {
    if (confirm("Are you sure you want to delete this lesson?")) {
      setLessons(lessons.filter((l) => l.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/admin/courses" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-semibold">Back to Courses</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                  className="cursor-pointer bg-transparent"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title">Course Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={courseData.title}
                        onChange={handleCourseChange}
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
                        className="cursor-text"
                      />
                    </div>
                    <Button onClick={handleSaveCourse} className="cursor-pointer">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full cursor-pointer bg-transparent justify-start">
                  Preview Course
                </Button>
                <Button variant="outline" className="w-full cursor-pointer bg-transparent justify-start">
                  Publish Course
                </Button>
                <Button
                  variant="outline"
                  className="w-full cursor-pointer bg-transparent justify-start text-destructive hover:text-destructive"
                >
                  Delete Course
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
