"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ChevronRight, Clock, CheckCircle, PlayCircle, ArrowLeft, Menu, X } from "lucide-react"
import Link from "next/link"
import { fetchCourses, fetchLessonsByCourse, type Course, type Lesson } from "@/lib/lms"

export default function LearnPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch courses on mount
  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true)
      const fetchedCourses = await fetchCourses()
      setCourses(fetchedCourses)
      if (fetchedCourses.length > 0) {
        setSelectedCourseId(fetchedCourses[0].id)
      }
      setLoading(false)
    }
    loadCourses()
  }, [])

  // Fetch lessons when course changes
  useEffect(() => {
    if (selectedCourseId) {
      const loadLessons = async () => {
        const fetchedLessons = await fetchLessonsByCourse(selectedCourseId)
        setLessons(fetchedLessons.sort((a, b) => a.order - b.order))
      }
      loadLessons()
    }
  }, [selectedCourseId])

  const currentCourse = courses.find((c) => c.id === selectedCourseId)
  const completedLessons = lessons.filter((l) => l.status === "published").length
  const progress = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">M</span>
                </div>
                <span className="font-semibold text-lg">MarkovLearn</span>
              </Link>
              <div className="hidden md:block text-muted-foreground">/</div>
              <div className="hidden md:block">
                <Badge variant="secondary">Learn</Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              <div className="hidden md:flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Progress: {Math.round(progress)}%</span>
                <Progress value={progress} className="w-24" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
          fixed md:static inset-y-0 left-0 z-40 w-80 bg-card border-r border-border transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        >
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            <div>
              <h2 className="text-lg font-semibold mb-2">Learning Path</h2>
              <p className="text-sm text-muted-foreground">Master Markov chains through structured lessons</p>
            </div>

            <div className="space-y-4">
              {courses.map((course) => (
                <Card
                  key={course.id}
                  className={`cursor-pointer transition-colors ${
                    selectedCourseId === course.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    setSelectedCourseId(course.id)
                    setSidebarOpen(false)
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{course.title}</CardTitle>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription className="text-sm">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{course.lessons} lessons</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="pt-4 border-t border-border">
              <Link href="/resources">
                <Button variant="outline" className="w-full bg-transparent cursor-pointer">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View All Resources
                </Button>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Course Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{currentCourse?.title}</Badge>
                <span className="text-sm text-muted-foreground">{lessons.length} lessons</span>
              </div>
              <h1 className="text-3xl font-bold">{currentCourse?.title}</h1>
              <p className="text-lg text-muted-foreground">{currentCourse?.description}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="w-32" />
                  <span className="text-sm font-medium">{Math.round(progress)}% complete</span>
                </div>
              </div>
            </div>

            {/* Lessons Grid */}
            <div className="grid gap-4">
              {lessons.length > 0 ? (
                lessons.map((lesson, index) => (
                  <Card
                    key={lesson.id}
                    className={`hover:shadow-md transition-shadow ${
                      lesson.status === "published" ? "bg-primary/5 border-primary/20" : ""
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            ${lesson.status === "published" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                          `}
                          >
                            {lesson.status === "published" ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <span className="font-medium">{index + 1}</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{lesson.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>~15 min</span>
                              </div>
                              {lesson.status === "published" && (
                                <Badge variant="secondary" className="text-xs">
                                  Published
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Link href={`/learn/${lesson.id}`}>
                          <Button
                            variant={lesson.status === "published" ? "outline" : "default"}
                            size="sm"
                            className="cursor-pointer"
                          >
                            {lesson.status === "published" ? (
                              <>
                                <BookOpen className="mr-2 h-4 w-4" />
                                Review
                              </>
                            ) : (
                              <>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Start
                              </>
                            )}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No lessons available for this course yet.</p>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
