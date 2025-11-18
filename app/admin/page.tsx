"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Plus, Users, Loader2 } from "lucide-react"
import Link from "next/link"
import { fetchCourses, fetchLessonsByCourse, type Course, type Lesson } from "@/lib/lms"

export default function AdminPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)

  // Load data on mount
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const fetchedCourses = await fetchCourses()
      setCourses(fetchedCourses)
      
      // Load lessons for all courses
      const lessonsPromises = fetchedCourses.map(course => fetchLessonsByCourse(course.id))
      const lessonsArrays = await Promise.all(lessonsPromises)
      const flatLessons = lessonsArrays.flat()
      setAllLessons(flatLessons)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Admin dashboard
  return (
    <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage courses, lessons, and educational content</p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/courses">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Manage Courses</p>
                    <p className="text-2xl font-bold">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : courses.length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/admin/courses/new">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Create New</p>
                    <p className="text-2xl font-bold">+</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-accent" />
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/admin/identity">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Identity</p>
                    <p className="text-2xl font-bold">👥</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-chart-3" />
                  </div>
                </div>
              </Card>
            </Link>

            <Card className="p-6 bg-muted/50">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Lessons</p>
                <p className="text-2xl font-bold">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : allLessons.length}
                </p>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Updates</CardTitle>
              <CardDescription>Latest content modifications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-muted-foreground">Loading recent activity...</span>
                </div>
              ) : allLessons.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No lessons created yet</p>
                  <Link href="/admin/courses/new" className="mt-4 inline-block">
                    <Button className="cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Course
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {allLessons
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .slice(0, 3)
                    .map((lesson) => {
                      const course = courses.find(c => c.id === lesson.courseId)
                      return (
                        <div key={lesson.id} className="flex items-center justify-between py-3 border-b border-border">
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {course?.title} • Modified {new Date(lesson.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Link href={`/admin/courses/${lesson.courseId}/lessons/${lesson.id}`}>
                            <Button variant="outline" size="sm" className="cursor-pointer bg-transparent">
                              Edit
                            </Button>
                          </Link>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
  )
}
