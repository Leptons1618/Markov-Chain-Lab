"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Course {
  id: string
  title: string
  description: string
  lessons: number
  status: "published" | "draft"
  lastModified: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: "foundations",
      title: "Foundations",
      description: "Basic probability and mathematical concepts",
      lessons: 4,
      status: "published",
      lastModified: "2 hours ago",
    },
    {
      id: "chains",
      title: "Markov Chain Basics",
      description: "Introduction to Markov chains and state transitions",
      lessons: 5,
      status: "published",
      lastModified: "1 day ago",
    },
    {
      id: "advanced",
      title: "Advanced Topics",
      description: "Hidden Markov Models and advanced concepts",
      lessons: 4,
      status: "draft",
      lastModified: "3 days ago",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
      setCourses(courses.filter((c) => c.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-semibold">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Title and Actions */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Manage Courses</h1>
              <p className="text-muted-foreground">Create, edit, and organize your course content</p>
            </div>
            <Link href="/admin/courses/new">
              <Button className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="flex gap-4">
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md cursor-text"
            />
          </div>

          {/* Courses List */}
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{course.title}</h3>
                      <Badge variant={course.status === "published" ? "default" : "secondary"}>{course.status}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">{course.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.lessons} lessons • Modified {course.lastModified}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/courses/${course.id}`}>
                      <Button variant="outline" size="sm" className="cursor-pointer bg-transparent">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(course.id)}
                      className="cursor-pointer bg-transparent text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
