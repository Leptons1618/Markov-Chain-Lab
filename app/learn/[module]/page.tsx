"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, CheckCircle, Lightbulb, Calculator, RotateCcw } from "lucide-react"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { fetchLesson, fetchLessonsByCourse, type Lesson } from "@/lib/lms"
import MarkdownRenderer from "@/components/markdown-renderer"

export default function LessonPage({ params }: { params: any }) {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [isLessonCompleted, setIsLessonCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
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

  // Fetch lesson data
  useEffect(() => {
    const loadLesson = async () => {
      setLoading(true)
      const fetchedLesson = await fetchLesson(lessonId)
      setLesson(fetchedLesson)

      if (fetchedLesson) {
        const courseLessons = await fetchLessonsByCourse(fetchedLesson.courseId)
        setAllLessons(courseLessons.sort((a, b) => a.order - b.order))
      }
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
  const progressPercentage = currentLessonIndex >= 0 ? ((currentLessonIndex + 1) / totalLessons) * 100 : 0

  const markLessonComplete = () => {
    setIsLessonCompleted(true)
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
            <div className="flex items-center gap-4">
              <Progress value={progressPercentage} className="w-32" />
              <span className="text-sm text-muted-foreground">
                {currentLessonIndex + 1} of {totalLessons}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
        <div className="space-y-4">
          <Badge variant="outline">{lesson.title}</Badge>
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
          <p className="text-lg text-muted-foreground">{lesson.description}</p>
        </div>

        <div className="space-y-8">
          <Card className="p-6">
            <MarkdownRenderer content={lesson.content} />
          </Card>
        </div>

        {!isLessonCompleted && (
          <div className="flex justify-center pt-4">
            <Button onClick={markLessonComplete} size="lg" className="cursor-pointer">
              Mark Lesson Complete
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between pt-8 border-t border-border">
          {previousLesson ? (
            <Link href={`/learn/${previousLesson.id}`}>
              <Button variant="outline" className="cursor-pointer bg-transparent">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            </Link>
          ) : (
            <Button variant="outline" disabled className="cursor-not-allowed bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}

          <div className="flex items-center gap-2">
            {isLessonCompleted ? (
              <>
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-sm">Lesson Complete</span>
              </>
            ) : (
              <>
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                <span className="text-sm text-muted-foreground">In Progress</span>
              </>
            )}
          </div>

          {nextLesson ? (
            <Link href={`/learn/${nextLesson.id}`}>
              <Button className="cursor-pointer" disabled={!isLessonCompleted}>
                Next Lesson
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button disabled className="cursor-not-allowed">
              Course Complete!
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
