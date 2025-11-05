"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Plus, Settings, LogOut, Loader2 } from "lucide-react"
import Link from "next/link"
import { fetchCourses, fetchLessonsByCourse, type Course, type Lesson } from "@/lib/lms"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Check session on mount
  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin-authenticated')
    if (isAuth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData()
    }
  }, [isAuthenticated])

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAuthenticating(true)
    setError("")

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok && data.authenticated) {
        setIsAuthenticated(true)
        sessionStorage.setItem('admin-authenticated', 'true')
        setPassword("") // Clear password from memory
      } else {
        setError(data.error || 'Invalid password')
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setError('Authentication failed. Please try again.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin-authenticated')
    setPassword("")
    setCourses([])
    setAllLessons([])
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">M</span>
              </div>
              <span className="font-semibold text-lg">MarkovLearn Admin</span>
            </div>
            <CardDescription>Content Management System</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cursor-text"
                  disabled={isAuthenticating}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full cursor-pointer" disabled={isAuthenticating}>
                {isAuthenticating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Login to Dashboard'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
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
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/admin" className="text-foreground font-medium transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin/courses" className="text-muted-foreground hover:text-foreground transition-colors">
                  Courses
                </Link>
                <Link href="/admin/content-sync" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sync
                </Link>
                <Link href="/admin/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="cursor-pointer">
                  View Site
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="cursor-pointer bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Content Management Dashboard</h1>
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

            <Link href="/admin/settings">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Settings</p>
                    <p className="text-2xl font-bold">⚙</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-chart-3" />
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
      </div>
    </div>
  )
}
