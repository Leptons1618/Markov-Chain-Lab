"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Plus, Users, Loader2, HelpCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import { fetchCourses, fetchLessonsByCourse, type Course, type Lesson } from "@/lib/lms"

export default function AdminPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [practiceQuestionsCount, setPracticeQuestionsCount] = useState<number | null>(null)
  const [examplesCount, setExamplesCount] = useState<number | null>(null)
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

      // Load practice questions count
      try {
        const questionsResponse = await fetch("/api/admin/practice-questions")
        const questionsData = await questionsResponse.json()
        if (questionsData.success) {
          setPracticeQuestionsCount(questionsData.data?.length || 0)
        }
      } catch (error) {
        console.error("Failed to load practice questions count:", error)
        setPracticeQuestionsCount(0)
      }

      // Load examples count
      try {
        const examplesResponse = await fetch("/api/admin/examples")
        const examplesData = await examplesResponse.json()
        if (examplesData.success) {
          setExamplesCount(examplesData.data?.length || 0)
        }
      } catch (error) {
        console.error("Failed to load examples count:", error)
        setExamplesCount(0)
      }
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
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
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

            <Link href="/admin/practice-questions">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Practice Questions</p>
                    <p className="text-2xl font-bold">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : practiceQuestionsCount ?? 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                    <HelpCircle className="h-5 w-5 text-chart-4" />
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/admin/examples">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Examples</p>
                    <p className="text-2xl font-bold">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : examplesCount ?? 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-chart-2" />
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
              ) : (() => {
                // Filter lessons updated in the last 3 days
                const threeDaysAgo = new Date()
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
                
                const recentLessons = allLessons
                  .filter(lesson => {
                    const updatedDate = new Date(lesson.updatedAt)
                    return updatedDate >= threeDaysAgo
                  })
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                
                if (recentLessons.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No content updated in the last 3 days</p>
                    </div>
                  )
                }
                
                return (
                  <div className="space-y-4">
                    {recentLessons.map((lesson) => {
                      const course = courses.find(c => c.id === lesson.courseId)
                      const updatedDate = new Date(lesson.updatedAt)
                      const formattedDate = updatedDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                      const formattedTime = updatedDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })
                      
                      return (
                        <div key={lesson.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{lesson.title}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <p className="text-sm text-muted-foreground">
                                {course?.title}
                              </p>
                              <span className="text-muted-foreground">•</span>
                              <p className="text-sm text-muted-foreground">
                                Updated {formattedDate} at {formattedTime}
                              </p>
                            </div>
                          </div>
                          <Link href={`/admin/courses/${lesson.courseId}/lessons/${lesson.id}`} className="ml-4 shrink-0">
                            <Button variant="outline" size="sm" className="cursor-pointer bg-transparent">
                              Edit
                            </Button>
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
  )
}
