"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ChevronRight, Clock, CheckCircle, PlayCircle, Menu, X } from "lucide-react"
import Link from "next/link"
import { fetchCourses, fetchLessonsByCourse, type Course, type Lesson } from "@/lib/lms"
import { MainNav } from "@/components/main-nav"
import { estimateLessonTime, formatEstimatedTime } from "@/lib/utils"
import { getRewardStats } from "@/lib/rewards"
import { RewardsDisplay } from "@/components/rewards-display"
import { useAuth } from "@/components/auth/auth-provider"
import { syncProgressToSupabase } from "@/lib/progress-sync"

// Progress tracking types
interface LessonProgress {
  completed: boolean
  lastAccessedAt?: string
}

interface ProgressData {
  [lessonId: string]: LessonProgress
}

export default function LearnPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<ProgressData>({})
  // Prefetched lessons per course to compute progress instantly and avoid flicker when switching
  const [courseLessonsMap, setCourseLessonsMap] = useState<Record<string, Lesson[]>>({})
  const { user, isGuest } = useAuth()

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('markov-learn-progress')
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress))
      } catch (e) {
        console.error('Failed to parse progress data', e)
      }
    }
  }, [])

  // Save progress to localStorage and sync to Supabase when authenticated
  useEffect(() => {
    if (Object.keys(progress).length > 0) {
      localStorage.setItem('markov-learn-progress', JSON.stringify(progress))
      
      // Sync to Supabase if authenticated (not guest mode)
      if (user && !isGuest) {
        syncProgressToSupabase(progress).catch((error) => {
          console.error('Failed to sync progress to Supabase:', error)
        })
      }
    }
  }, [progress, user, isGuest])

  // Listen for lesson completion events to refresh progress
  useEffect(() => {
    const handleLessonCompleted = () => {
      const savedProgress = localStorage.getItem('markov-learn-progress')
      if (savedProgress) {
        try {
          setProgress(JSON.parse(savedProgress))
        } catch (e) {
          console.error('Failed to parse progress data', e)
        }
      }
    }

    window.addEventListener('lesson-completed', handleLessonCompleted)
    return () => window.removeEventListener('lesson-completed', handleLessonCompleted)
  }, [])

  // Fetch courses on mount - optimized with caching
  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true)
      try {
        const fetchedCourses = await fetchCourses()
        setCourses(fetchedCourses)
        if (fetchedCourses.length > 0) {
          // Respect a pre-selected course (e.g., from Lesson page "Next Course")
          const preselect = typeof window !== 'undefined' ? localStorage.getItem('markov-selected-course') : null
          const validPreselect = preselect && fetchedCourses.some(c => c.id === preselect) ? preselect : null
          setSelectedCourseId(validPreselect || fetchedCourses[0].id)
          if (validPreselect) localStorage.removeItem('markov-selected-course')
        }
      } catch (error) {
        console.error('Failed to load courses:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [])

  // Prefetch lessons for all courses in parallel - optimized with better error handling
  useEffect(() => {
    if (!courses.length) return
    let cancelled = false
    const abortController = new AbortController()
    
    ;(async () => {
      try {
        // Use Promise.allSettled to handle partial failures gracefully
        const entries = await Promise.allSettled(
          courses.map(async (c) => {
            const ls = await fetchLessonsByCourse(c.id)
            return [c.id, ls.sort((a, b) => a.order - b.order)] as const
          })
        )
        if (cancelled) return
        
        const map: Record<string, Lesson[]> = {}
        for (const entry of entries) {
          if (entry.status === 'fulfilled') {
            const [id, ls] = entry.value
            map[id] = ls
          }
        }
        setCourseLessonsMap(map)
      } catch (e) {
        console.warn("Lesson prefetch failed", e)
      }
    })()
    return () => {
      cancelled = true
      abortController.abort()
    }
  }, [courses])

  // Optimized: Use prefetched lessons instead of fetching again when course changes
  useEffect(() => {
    if (selectedCourseId && courseLessonsMap[selectedCourseId]) {
      // Use prefetched lessons immediately for instant UI update
      setLessons(courseLessonsMap[selectedCourseId])
    } else if (selectedCourseId) {
      // Fallback: fetch if not in prefetched map (shouldn't happen normally)
      const loadLessons = async () => {
        try {
          const fetchedLessons = await fetchLessonsByCourse(selectedCourseId)
          setLessons(fetchedLessons.sort((a, b) => a.order - b.order))
        } catch (error) {
          console.error('Failed to load lessons:', error)
        }
      }
      loadLessons()
    }
  }, [selectedCourseId, courseLessonsMap])

  const currentCourse = courses.find((c) => c.id === selectedCourseId)
  
  // Calculate progress for currently loaded lessons (used for per-lesson UI only)
  // Stable per-course progress computed from prefetched map to avoid UI resets
  const getCourseProgress = useCallback(
    (courseId: string) => {
      const list = courseLessonsMap[courseId] || []
      if (!list.length) return 0
      const done = list.filter((l) => progress[l.id]?.completed).length
      return (done / list.length) * 100
    },
    [courseLessonsMap, progress]
  )
  const selectedCourseProgress = selectedCourseId ? getCourseProgress(selectedCourseId) : 0

  // Global progress across all courses for the topbar
  const { totalLessonsAll, totalCompletedAll } = (() => {
    const courseIds = Object.keys(courseLessonsMap)
    if (!courseIds.length) return { totalLessonsAll: 0, totalCompletedAll: 0 }
    let total = 0
    let done = 0
    for (const id of courseIds) {
      const list = courseLessonsMap[id] || []
      total += list.length
      if (list.length) {
        done += list.filter((l) => progress[l.id]?.completed).length
      }
    }
    return { totalLessonsAll: total, totalCompletedAll: done }
  })()
  const globalProgress = totalLessonsAll > 0 ? (totalCompletedAll / totalLessonsAll) * 100 : 0
  
  // Helper to check if lesson is completed
  const isLessonCompleted = (lessonId: string) => progress[lessonId]?.completed || false
  
  // Check if all lessons in current course are completed
  const isCourseCompleted = lessons.length > 0 && lessons.every((l) => isLessonCompleted(l.id))

  // Calculate reward stats - create course to lessons mapping
  const courseLessonsMapForRewards: Record<string, string[]> = {}
  Object.entries(courseLessonsMap).forEach(([courseId, lessons]) => {
    courseLessonsMapForRewards[courseId] = lessons.map(l => l.id)
  })
  const rewardStats = getRewardStats(progress, courseLessonsMapForRewards)

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
      <MainNav currentPath="/learn" showOverallProgress={true} overallProgress={globalProgress} />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside
          className={`
          fixed md:static inset-y-0 left-0 top-16 z-40 w-80 bg-card border-r border-border transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        >
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            <div>
              <h2 className="text-lg font-semibold mb-2">Learning Path</h2>
              <p className="text-sm text-muted-foreground">Master Markov chains through structured lessons</p>
            </div>

            <div className="space-y-4">
              {courses.map((course) => {
                // Use prefetched lessons map so each course shows its own progress consistently
                const isSelected = selectedCourseId === course.id
                const individualCourseProgress = getCourseProgress(course.id)
                
                return (
                <Card
                  key={course.id}
                  className={`cursor-pointer transition-all duration-300 ease-in-out hover:shadow-md ${
                    selectedCourseId === course.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    // Optimistically hydrate lessons for the selected course for snappy UI
                    const prefetched = courseLessonsMap[course.id]
                    if (prefetched && prefetched.length > 0) {
                      setLessons(prefetched)
                    }
                    setSelectedCourseId(course.id)
                    setSidebarOpen(false)
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{course.title}</CardTitle>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        selectedCourseId === course.id ? "rotate-90" : ""
                      }`} />
                    </div>
                    <CardDescription className="text-sm">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{course.lessons} lessons</span>
                      <span className="font-medium">{Math.round(individualCourseProgress)}%</span>
                    </div>
                    <Progress value={individualCourseProgress} className="mt-2 transition-all duration-500" />
                  </CardContent>
                </Card>
                )
              })}
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
        <main className="flex-1 overflow-y-auto h-full">
          <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
            {/* Course Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{currentCourse?.title}</Badge>
                <span className="text-sm text-muted-foreground">{lessons.length} lessons</span>
              </div>
              <h1 className="text-3xl font-bold">{currentCourse?.title}</h1>
              <p className="text-lg text-muted-foreground">{currentCourse?.description}</p>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Course Progress</span>
                  <Progress value={selectedCourseProgress} className="w-40 transition-all duration-500" />
                  <span className="text-sm font-medium">{Math.round(selectedCourseProgress)}%</span>
                </div>
              </div>
            </div>

            {/* Rewards Display */}
            <RewardsDisplay stats={rewardStats} compact={true} />

            {/* Course Completion Badge */}
            {isCourseCompleted && (
              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-semibold text-primary">Course Completed! 🎉</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        You've finished all {lessons.length} lessons in this course
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lessons Grid */}
            <div className="grid gap-4">
              {lessons.length > 0 ? (
                lessons.map((lesson, index) => {
                  const completed = isLessonCompleted(lesson.id)
                  return (
                  <Card
                    key={lesson.id}
                    className={`hover:shadow-md transition-all duration-300 ease-in-out hover:scale-[1.01] ${
                      completed ? "bg-primary/5 border-primary/20" : ""
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`
                            w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                            ${completed ? "bg-primary text-primary-foreground scale-110" : "bg-muted text-muted-foreground"}
                          `}
                          >
                            {completed ? (
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
                                <span>{formatEstimatedTime(estimateLessonTime(lesson.content))}</span>
                              </div>
                              {completed && (
                                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                  Completed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Link href={`/learn/${lesson.id}`}>
                          <Button
                            variant={completed ? "outline" : "default"}
                            size="sm"
                            className="cursor-pointer transition-all duration-200 hover:scale-105"
                          >
                            {completed ? (
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
                  )
                })
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

      {/* Mobile Floating Sidebar Toggle */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="shadow-lg cursor-pointer"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle course sidebar"
        >
          {sidebarOpen ? (
            <>
              <X className="mr-2 h-5 w-5" />
              Close
            </>
          ) : (
            <>
              <Menu className="mr-2 h-5 w-5" />
              Courses
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
