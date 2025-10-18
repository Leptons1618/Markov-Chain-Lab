"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, CheckCircle, Lightbulb, Calculator, RotateCcw } from "lucide-react"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { fetchLesson, fetchLessonsByCourse, parseLessonContent, type Lesson } from "@/lib/lms"

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

  const contentSections = parseLessonContent(lesson.content)

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
          {contentSections.length > 0 ? (
            contentSections.map((section, index) => (
              <Card key={index} className="p-6">
                {section.type === "text" && <p className="text-lg leading-relaxed">{section.content}</p>}

                {section.type === "definition" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{section.title}</h3>
                    </div>
                    <p className="text-muted-foreground bg-muted/50 p-4 rounded-lg">{section.content}</p>
                  </div>
                )}

                {section.type === "formula" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-accent" />
                      <h3 className="text-lg font-semibold">{section.title}</h3>
                    </div>
                    <div className="bg-card border border-border p-6 rounded-lg text-center">
                      <div className="font-mono">{section.content}</div>
                    </div>
                  </div>
                )}

                {section.type === "interactive" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                    <p className="text-muted-foreground">{section.content}</p>
                    <Card className="p-6 bg-primary/5 border-primary/20">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="text-center space-y-6">
                          <div className="flex justify-center">
                            <div className="w-20 h-20 flex items-center justify-center bg-primary/10 rounded-full border-2 border-primary/20 relative overflow-hidden">
                              <div
                                className={`text-4xl absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                                  coinFlips.isFlipping ? "" : coinFlips.currentResult ? "scale-110" : "scale-100"
                                }`}
                                style={{
                                  transformStyle: "preserve-3d",
                                  animation: coinFlips.isFlipping ? "flipCoin 0.2s ease-in-out" : "none",
                                }}
                              >
                                {coinFlips.isFlipping
                                  ? "🪙"
                                  : coinFlips.currentResult === "heads"
                                    ? "👑"
                                    : coinFlips.currentResult === "tails"
                                      ? "🪙"
                                      : "🪙"}
                              </div>
                            </div>
                          </div>

                          <style jsx>{`
                            @keyframes flipCoin {
                              0% { transform: rotateY(0deg) scale(1); }
                              50% { transform: rotateY(90deg) scale(0.8); }
                              100% { transform: rotateY(180deg) scale(1); }
                            }
                          `}</style>

                          <div className="h-8 flex items-center justify-center">
                            {coinFlips.currentResult && !coinFlips.isFlipping && (
                              <div className="text-lg font-semibold capitalize text-primary animate-pulse">
                                {coinFlips.currentResult}!
                              </div>
                            )}
                          </div>

                          <div className="flex gap-4 justify-center">
                            <Button
                              onClick={flipCoin}
                              size="lg"
                              className="cursor-pointer"
                              disabled={coinFlips.isFlipping}
                            >
                              {coinFlips.isFlipping ? "Flipping..." : "Flip Coin"}
                            </Button>
                            <Button
                              onClick={resetCoinFlips}
                              variant="outline"
                              size="lg"
                              className="cursor-pointer bg-transparent"
                              disabled={coinFlips.isFlipping}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Reset
                            </Button>
                          </div>

                          <div className="text-sm text-muted-foreground">
                            Total Flips: {coinFlips.total}
                            {coinFlips.total > 0 && (
                              <div className="mt-2 space-y-1">
                                <div className="text-blue-600">
                                  Heads: {coinFlips.heads} ({headsPercentage}%)
                                </div>
                                <div className="text-orange-600">
                                  Tails: {coinFlips.tails} ({tailsPercentage}%)
                                </div>
                              </div>
                            )}
                            {coinFlips.total > 10 && (
                              <div className="mt-2 text-xs text-primary">
                                Notice how the percentages approach 50% as you flip more coins!
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-center">Convergence to 50%</h4>
                          {coinFlips.history.length > 0 ? (
                            <div className="h-64 w-full bg-transparent rounded-lg border border-border/30 p-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={coinFlips.history}
                                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={1.5} />
                                  <XAxis
                                    dataKey="flip"
                                    label={{ value: "Number of Flips", position: "insideBottom", offset: -10 }}
                                    stroke="#6b7280"
                                    fontSize={11}
                                    strokeWidth={1.5}
                                  />
                                  <YAxis
                                    domain={[0, 100]}
                                    label={{ value: "Percentage", angle: -90, position: "insideLeft" }}
                                    stroke="#6b7280"
                                    fontSize={11}
                                    strokeWidth={1.5}
                                  />
                                  <Tooltip
                                    formatter={(value: number, name: string) => [
                                      `${value.toFixed(1)}%`,
                                      name === "headsPercent" ? "Heads" : "Tails",
                                    ]}
                                    contentStyle={{
                                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                                      border: "1px solid #d1d5db",
                                      borderRadius: "6px",
                                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                      backdropFilter: "blur(4px)",
                                    }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="headsPercent"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                                    name="headsPercent"
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="tailsPercent"
                                    stroke="#ea580c"
                                    strokeWidth={3}
                                    dot={{ fill: "#ea580c", strokeWidth: 2, r: 4 }}
                                    name="tailsPercent"
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey={() => 50}
                                    stroke="#6b7280"
                                    strokeWidth={2}
                                    strokeDasharray="8 4"
                                    dot={false}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <div className="h-64 flex items-center justify-center text-muted-foreground border border-dashed border-border/50 rounded-lg bg-transparent">
                              Start flipping to see the convergence chart!
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground text-center">
                            The dashed line shows the theoretical 50% probability. Watch how the actual percentages
                            converge to this line!
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No content available for this lesson yet.</p>
            </Card>
          )}
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
