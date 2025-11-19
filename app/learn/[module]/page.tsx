"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, CheckCircle, Lightbulb, Calculator, RotateCcw, Clock, Eye, Code, Copy, Check, List, X, BookOpen, Target, TrendingUp, Sparkles, BookMarked, Award, Zap } from "lucide-react"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { fetchLesson, fetchLessonsByCourse, fetchCourses, type Lesson, type Course } from "@/lib/lms"
import MarkdownRenderer from "@/components/markdown-renderer"
import { estimateLessonTime, formatEstimatedTime } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { syncProgressToSupabase } from "@/lib/progress-sync"
import { MainNav } from "@/components/main-nav"

export default function LessonPage({ params }: { params: any }) {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLessonCompleted, setIsLessonCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [readingProgress, setReadingProgress] = useState(0)
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

  // Calculate reading progress (scroll-based)
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100
      setReadingProgress(Math.min(100, Math.max(0, progress)))
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  const estimatedTime = formatEstimatedTime(estimateLessonTime(lesson.content))
  const lessonNumber = currentLessonIndex + 1

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <MainNav currentPath="/learn" showOverallProgress={true} overallProgress={progressPercentage} />
      
      {/* Reading Progress Bar */}
      <div className="sticky top-16 z-30 h-1 bg-muted/50">
        <div 
          className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Blog-style Header */}
      <article className="w-full max-w-5xl mx-auto px-4 py-8 sm:px-6 md:px-8 lg:px-12 space-y-6 overflow-x-hidden">
        {/* Hero Section */}
        <header className="space-y-6 pb-8 border-b border-border/50">
          {/* Breadcrumb & Meta */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="outline" className="text-xs px-2 py-0.5 h-6">
              <BookOpen className="h-3 w-3 mr-1" />
              Lesson {lessonNumber} of {totalLessons}
            </Badge>
            <Badge variant="secondary" className="text-xs px-2 py-0.5 h-6 bg-primary/10 text-primary border-primary/20">
              <Clock className="h-3 w-3 mr-1" />
              {estimatedTime}
            </Badge>
            {isLessonCompleted && (
              <Badge variant="default" className="text-xs px-2 py-0.5 h-6 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                <Award className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
              <TrendingUp className="h-3 w-3" />
              <span>{Math.round(progressPercentage)}% Course Progress</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {lesson.title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
              {lesson.description}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4 text-primary" />
              <span>Learning Objective</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Interactive Content</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>Hands-on Practice</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg md:prose-xl max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted/50 prose-pre:border prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:bg-muted/30 prose-blockquote:pl-4 prose-blockquote:italic">
            <MarkdownRenderer content={lesson.content} />
          </div>

          {/* Completion Section */}
          <div className="mt-12 pt-8 border-t border-border/50">
            {!isLessonCompleted ? (
              <Card className="p-6 bg-gradient-to-br from-primary/5 via-primary/5 to-transparent border-primary/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Ready to move forward?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Mark this lesson as complete to unlock the next one
                    </p>
                  </div>
                  <Button 
                    onClick={markLessonComplete} 
                    size="lg" 
                    className="cursor-pointer transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Mark Complete
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-6 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-emerald-500/20">
                    <Award className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      Lesson Completed!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Great job! You're making excellent progress.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <footer className="mt-12 pt-8 border-t border-border/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Previous Lesson */}
            <div className="w-full">
              {previousLesson ? (
                <Link href={`/learn/${previousLesson.id}`} className="block w-full">
                  <Card className="p-4 hover:bg-muted/50 transition-all cursor-pointer group border-border/50 h-full">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors flex-shrink-0">
                        <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-1">Previous Lesson</div>
                        <div className="font-medium line-clamp-2 break-words">{previousLesson.title}</div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ) : (
                <Card className="p-4 opacity-50 border-border/50 h-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted flex-shrink-0">
                      <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-1">Previous Lesson</div>
                      <div className="font-medium">No previous lesson</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Next Lesson */}
            <div className="w-full">
              {nextLesson ? (
                <Link href={`/learn/${nextLesson.id}`} className="block w-full">
                  <Card className={`p-4 transition-all cursor-pointer group border-border/50 h-full ${
                    isLessonCompleted 
                      ? 'hover:bg-primary/5 hover:border-primary/30' 
                      : 'opacity-60 cursor-not-allowed'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md transition-colors flex-shrink-0 ${
                        isLessonCompleted 
                          ? 'bg-primary/10 group-hover:bg-primary/20' 
                          : 'bg-muted'
                      }`}>
                        <ArrowRight className={`h-4 w-4 transition-colors ${
                          isLessonCompleted 
                            ? 'text-primary' 
                            : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-1">Next Lesson</div>
                        <div className="font-medium line-clamp-2 break-words">{nextLesson.title}</div>
                        {!isLessonCompleted && (
                          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Complete this lesson first
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ) : isLessonCompleted ? (
                <div className="space-y-2 h-full flex flex-col">
                  {nextCourse ? (
                    <Link
                      href="/learn"
                      onClick={() => {
                        try { localStorage.setItem('markov-selected-course', nextCourse.id) } catch {}
                      }}
                      className="block"
                    >
                      <Button className="w-full cursor-pointer transition-all duration-200 hover:scale-105 shadow-lg">
                        <BookMarked className="mr-2 h-4 w-4" />
                        <span className="truncate">Next Course: {nextCourse.title}</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/learn" className="block">
                      <Button className="w-full cursor-pointer transition-all duration-200 hover:scale-105 shadow-lg bg-emerald-600 hover:bg-emerald-700">
                        <Award className="mr-2 h-4 w-4" />
                        Course Complete!
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Link href="/learn" className="block">
                    <Button variant="outline" className="w-full cursor-pointer">
                      Back to Learn
                    </Button>
                  </Link>
                </div>
              ) : (
                <Card className="p-4 opacity-60 border-border/50 h-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted flex-shrink-0">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-1">Next Lesson</div>
                      <div className="font-medium">Complete this lesson first</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </footer>
      </article>
    </div>
  )
}
