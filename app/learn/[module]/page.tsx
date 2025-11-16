"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, CheckCircle, Lightbulb, Calculator, RotateCcw, Clock } from "lucide-react"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { fetchLesson, fetchLessonsByCourse, fetchCourses, type Lesson, type Course } from "@/lib/lms"
import MarkdownRenderer from "@/components/markdown-renderer"
import { estimateLessonTime, formatEstimatedTime } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { syncProgressToSupabase } from "@/lib/progress-sync"

export default function LessonPage({ params }: { params: any }) {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLessonCompleted, setIsLessonCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user, isGuest } = useAuth()
  const [coinFlips, setCoinFlips] = useState({
    heads: 0,
    tails: 0,
    total: 0,
    currentResult: null as string | null,
    isFlipping: false,
    history: [] as { flip: number; headsPercent: number; tailsPercent: number }[],
  })

  const resolvedParams = React.use(params as any) as { module?: string }
  const lessonId = resolvedParams?.module ?? ""

  // Load completion status from localStorage
  useEffect(() => {
    if (lessonId) {
      const savedProgress = localStorage.getItem('markov-learn-progress')
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress)
          setIsLessonCompleted(progress[lessonId]?.completed || false)
        } catch (e) {
          console.error('Failed to parse progress data', e)
        }
      }
    }
  }, [lessonId])

  // Fetch lesson data and courses
  useEffect(() => {
    const loadLesson = async () => {
      setLoading(true)
      const fetchedLesson = await fetchLesson(lessonId)
      setLesson(fetchedLesson)

      if (fetchedLesson) {
        const courseLessons = await fetchLessonsByCourse(fetchedLesson.courseId)
        setAllLessons(courseLessons.sort((a, b) => a.order - b.order))
      }
      // Prefetch courses list to enable Next Course navigation
      try {
        const cs = await fetchCourses()
        setCourses(cs)
      } catch {}
      setLoading(false)
    }

    if (lessonId) {
      loadLesson()
    }
  }, [lessonId])

  const getCurrentLessonIndex = () => {
    return allLessons.findIndex((l) => l.id === lessonId)
  }

  const getNextLesson = () => {
    const currentIndex = getCurrentLessonIndex()
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      return allLessons[currentIndex + 1]
    }
    return null
  }

  const getPreviousLesson = () => {
    const currentIndex = getCurrentLessonIndex()
    if (currentIndex > 0) {
      return allLessons[currentIndex - 1]
    }
    return null
  }

  const nextLesson = getNextLesson()
  const previousLesson = getPreviousLesson()
  const currentLessonIndex = getCurrentLessonIndex()
  const totalLessons = allLessons.length
  const completedCount = allLessons.filter(l => {
    const savedProgress = localStorage.getItem('markov-learn-progress')
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress)
        return progress[l.id]?.completed || false
      } catch {
        return false
      }
    }
    return false
  }).length
  const progressPercentage = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0

  // Compute next course (if any) based on current lesson's courseId and courses order
  const currentCourseId = lesson?.courseId
  const currentCourseIndex = currentCourseId ? courses.findIndex(c => c.id === currentCourseId) : -1
  const nextCourse = currentCourseIndex >= 0 && currentCourseIndex < courses.length - 1 ? courses[currentCourseIndex + 1] : null

  const markLessonComplete = async () => {
    setIsLessonCompleted(true)
    
    // Save to localStorage
    const savedProgress = localStorage.getItem('markov-learn-progress')
    const progress = savedProgress ? JSON.parse(savedProgress) : {}
    progress[lessonId] = {
      completed: true,
      lastAccessedAt: new Date().toISOString()
    }
    localStorage.setItem('markov-learn-progress', JSON.stringify(progress))
    
    // Sync to Supabase if authenticated (not guest mode)
    if (user && !isGuest) {
      try {
        await syncProgressToSupabase(progress)
      } catch (error) {
        console.error('Failed to sync progress to Supabase:', error)
      }
    }
    
    // Trigger a custom event to notify other components (like rewards)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lesson-completed', { detail: { lessonId } }))
    }
  }

  const flipCoin = () => {
    setCoinFlips((prev) => ({ ...prev, isFlipping: true }))

    setTimeout(() => {
      const isHeads = Math.random() < 0.5
      const result = isHeads ? "heads" : "tails"
      const newTotal = coinFlips.total + 1
      const newHeads = coinFlips.heads + (isHeads ? 1 : 0)
      const newTails = coinFlips.tails + (isHeads ? 0 : 1)

      const headsPercent = (newHeads / newTotal) * 100
      const tailsPercent = (newTails / newTotal) * 100

      setCoinFlips((prev) => ({
        heads: newHeads,
        tails: newTails,
        total: newTotal,
        currentResult: result,
        isFlipping: false,
        history: [...prev.history, { flip: newTotal, headsPercent, tailsPercent }].slice(-50),
      }))
    }, 200)
  }

  const resetCoinFlips = () => {
    setCoinFlips({ heads: 0, tails: 0, total: 0, currentResult: null, isFlipping: false, history: [] })
  }

  const headsPercentage = coinFlips.total > 0 ? ((coinFlips.heads / coinFlips.total) * 100).toFixed(1) : "0.0"
  const tailsPercentage = coinFlips.total > 0 ? ((coinFlips.tails / coinFlips.total) * 100).toFixed(1) : "0.0"

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Lesson not found</h1>
          <Link href="/learn">
            <Button className="cursor-pointer">Back to Learn</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Render markdown content directly (GFM). For structured JSON content, we can extend later.

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/learn" className="flex items-center gap-2 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back to Learn</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">Module:</span>
              <Progress value={progressPercentage} className="w-32 transition-all duration-500" />
              <span className="text-sm font-medium">
                {currentLessonIndex + 1}/{totalLessons}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8 space-y-8">
        <div className="space-y-4">
          <Badge variant="outline">{lesson.title}</Badge>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{lesson.title}</h1>
              <p className="text-lg text-muted-foreground mt-2">{lesson.description}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatEstimatedTime(estimateLessonTime(lesson.content))}</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="p-4 sm:p-6 md:p-8">
            <MarkdownRenderer content={lesson.content} />
          </Card>
        </div>

        {!isLessonCompleted && (
          <div className="flex justify-center pt-4">
            <Button onClick={markLessonComplete} size="lg" className="cursor-pointer transition-all duration-300 hover:scale-105">
              <CheckCircle className="mr-2 h-5 w-5" />
              Mark Lesson Complete
            </Button>
          </div>
        )}
        
        {isLessonCompleted && (
          <div className="flex justify-center pt-4">
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-primary/10 text-primary border-primary/20">
              <CheckCircle className="mr-2 h-4 w-4 inline" />
              Lesson Completed!
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between pt-8 border-t border-border">
          {previousLesson ? (
            <Link href={`/learn/${previousLesson.id}`}>
              <Button variant="outline" className="cursor-pointer bg-transparent transition-all duration-200 hover:scale-105">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            </Link>
          ) : (
            <Button variant="outline" disabled className="cursor-not-allowed bg-transparent opacity-50">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}


          {nextLesson ? (
            <Link href={`/learn/${nextLesson.id}`}>
              <Button className="cursor-pointer transition-all duration-200 hover:scale-105" disabled={!isLessonCompleted}>
                Next Lesson
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : isLessonCompleted ? (
            <div className="flex items-center gap-2">
              {nextCourse ? (
                <Link
                  href="/learn"
                  onClick={() => {
                    try { localStorage.setItem('markov-selected-course', nextCourse.id) } catch {}
                  }}
                >
                  <Button className="cursor-pointer transition-all duration-200 hover:scale-105 bg-primary">
                    Next Course: {nextCourse.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/learn">
                  <Button className="cursor-pointer transition-all duration-200 hover:scale-105 bg-primary">
                    Course Complete!
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link href="/learn">
                <Button variant="outline" className="cursor-pointer">
                  Back to Learn
                </Button>
              </Link>
            </div>
          ) : (
            <Button disabled className="cursor-not-allowed opacity-50">
              Finish Lesson First
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
