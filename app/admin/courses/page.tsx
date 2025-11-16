"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, Loader2 } from "lucide-react"
import Link from "next/link"
import { fetchCourses, type Course } from "@/lib/lms"

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Fetch courses on mount
  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true)
      try {
        const fetchedCourses = await fetchCourses()
        setCourses(fetchedCourses)
      } catch (error) {
        console.error("Failed to load courses:", error)
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [])

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/courses/${id}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        setCourses(courses.filter((c) => c.id !== id))
      } else {
        const error = await response.json()
        alert(`Failed to delete course: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to delete course:", error)
      alert("Failed to delete course. Please try again.")
    } finally {
      setDeleting(null)
    }
  }

  return (
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
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading courses...</span>
              </div>
            ) : filteredCourses.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm ? "No courses match your search." : "No courses found. Create your first course to get started."}
                </p>
                {!searchTerm && (
                  <Link href="/admin/courses/new" className="mt-4 inline-block">
                    <Button className="cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Course
                    </Button>
                  </Link>
                )}
              </Card>
            ) : (
              filteredCourses.map((course) => (
                <Card key={course.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{course.title}</h3>
                        <Badge variant={course.status === "published" ? "default" : "secondary"}>{course.status}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{course.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {course.lessons} lessons • Created {new Date(course.createdAt).toLocaleDateString()}
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
                        disabled={deleting === course.id}
                        className="cursor-pointer bg-transparent text-destructive hover:text-destructive"
                      >
                        {deleting === course.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
    </div>
  )
}
