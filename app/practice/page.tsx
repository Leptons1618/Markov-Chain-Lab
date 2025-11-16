"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { MainNav } from "@/components/main-nav"
import { fetchCourses, fetchLessonsByCourse, type Course, type Lesson } from "@/lib/lms"
import { BookOpen, CheckCircle, Clock, Lightbulb, Loader2 } from "lucide-react"

interface PracticePrompt {
  id: string
  text: string
}

const STORAGE_KEY = "markov-practice-tracker"

function extractPracticePrompts(content: string, lessonId: string): PracticePrompt[] {
  if (!content) return []

  const heading = "## Practice Prompts"
  const startIndex = content.indexOf(heading)
  if (startIndex === -1) return []

  const afterHeading = content.slice(startIndex + heading.length)
  const nextHeadingMatch = afterHeading.search(/\n##\s+/)
  const section = nextHeadingMatch !== -1 ? afterHeading.slice(0, nextHeadingMatch) : afterHeading

  const prompts: PracticePrompt[] = []
  const lines = section
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  lines.forEach((line, index) => {
    const numberedMatch = line.match(/^\d+\.\s+(.*)/)
    const bulletMatch = line.match(/^[-*]\s+(.*)/)
    const text = numberedMatch?.[1] ?? bulletMatch?.[1]
    if (text) {
      const slug = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 24)

      prompts.push({
        id: `${lessonId}-prompt-${index}-${slug || "item"}`,
        text: text.trim(),
      })
    }
  })

  return prompts
}

export default function PracticePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedLessonId, setSelectedLessonId] = useState<string>("")
  const [promptsByLesson, setPromptsByLesson] = useState<Record<string, PracticePrompt[]>>({})
  const [completedPrompts, setCompletedPrompts] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingLessons, setLoadingLessons] = useState(false)
  const hydrationRef = useRef(false)

  // Restore saved practice notes and completion state
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as {
          completedPrompts?: Record<string, boolean>
          notes?: Record<string, string>
        }
        if (parsed.completedPrompts) setCompletedPrompts(parsed.completedPrompts)
        if (parsed.notes) setNotes(parsed.notes)
      }
    } catch (error) {
      console.warn("Failed to restore practice progress", error)
    } finally {
      hydrationRef.current = true
    }
  }, [])

  // Persist practice state whenever it changes
  useEffect(() => {
    if (!hydrationRef.current || typeof window === "undefined") return

    const payload = JSON.stringify({ completedPrompts, notes })
    window.localStorage.setItem(STORAGE_KEY, payload)
  }, [completedPrompts, notes])

  // Fetch available courses
  useEffect(() => {
    let cancelled = false

    const loadCourses = async () => {
      setLoadingCourses(true)
      const fetchedCourses = await fetchCourses()
      if (cancelled) return

      setCourses(fetchedCourses)
      if (fetchedCourses.length > 0) {
        setSelectedCourseId((current) => {
          if (current && fetchedCourses.some((course) => course.id === current)) {
            return current
          }
          return fetchedCourses[0].id
        })
      }
      setLoadingCourses(false)
    }

    loadCourses()

    return () => {
      cancelled = true
    }
  }, [])

  // Fetch lessons whenever the selected course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setLessons([])
      setSelectedLessonId("")
      return
    }

    let cancelled = false

    const loadLessons = async () => {
      setLoadingLessons(true)
      const fetchedLessons = await fetchLessonsByCourse(selectedCourseId)
      if (cancelled) return

      const sorted = [...fetchedLessons].sort((a, b) => a.order - b.order)
      setLessons(sorted)

      setPromptsByLesson((prev) => {
        const next = { ...prev }
        sorted.forEach((lesson) => {
          next[lesson.id] = extractPracticePrompts(lesson.content, lesson.id)
        })
        return next
      })

      setSelectedLessonId((current) => {
        if (current && sorted.some((lesson) => lesson.id === current)) {
          return current
        }
        return sorted[0]?.id ?? ""
      })

      setLoadingLessons(false)
    }

    loadLessons()

    return () => {
      cancelled = true
    }
  }, [selectedCourseId])

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? null
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? null
  const selectedPrompts = selectedLesson ? promptsByLesson[selectedLesson.id] ?? [] : []

  const togglePromptCompletion = (promptId: string) => {
    setCompletedPrompts((prev) => {
      const next = { ...prev }
      if (next[promptId]) {
        delete next[promptId]
      } else {
        next[promptId] = true
      }
      return next
    })
  }

  const updateNote = (promptId: string, value: string) => {
    setNotes((prev) => {
      const next = { ...prev }
      if (value.trim().length === 0) {
        delete next[promptId]
      } else {
        next[promptId] = value
      }
      return next
    })
  }

  const selectedLessonProgress = (() => {
    if (selectedPrompts.length === 0) return 0
    const completedCount = selectedPrompts.filter((prompt) => completedPrompts[prompt.id]).length
    return (completedCount / selectedPrompts.length) * 100
  })()

  const aggregateCourseProgress = (() => {
    if (lessons.length === 0) return { total: 0, completed: 0, percent: 0 }
    let total = 0
    let done = 0
    lessons.forEach((lesson) => {
      const prompts = promptsByLesson[lesson.id] ?? []
      total += prompts.length
      done += prompts.filter((prompt) => completedPrompts[prompt.id]).length
    })
    return {
      total,
      completed: done,
      percent: total > 0 ? (done / total) * 100 : 0,
    }
  })()

  const tabsValue = selectedLessonId || lessons[0]?.id || ""

  if (loadingCourses) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading practice catalog…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <MainNav currentPath="/practice" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Practice Lab</Badge>
            {selectedCourse && <span className="text-sm text-muted-foreground">{selectedCourse.title}</span>}
          </div>
          <h1 className="text-3xl font-bold">Course-Aligned Practice</h1>
          <p className="text-lg text-muted-foreground">
            Work through lesson-specific prompts sourced directly from the LMS to reinforce what you just learned.
          </p>
        </header>

        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Selected course</div>
                <select
                  className="w-full sm:w-72 rounded-md border border-input bg-background p-2 text-sm"
                  value={selectedCourseId}
                  onChange={(event) => setSelectedCourseId(event.target.value)}
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Course practice completion</div>
                <div className="flex items-center gap-3">
                  <Progress value={aggregateCourseProgress.percent} className="w-48" />
                  <span className="text-sm text-muted-foreground">
                    {aggregateCourseProgress.completed}/{aggregateCourseProgress.total} prompts
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Lesson Practice</h2>
              <p className="text-sm text-muted-foreground">
                Choose a lesson to review targeted prompts and capture takeaways.
              </p>
            </div>
            {selectedLesson && (
              <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">{selectedLesson.title}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Progress value={selectedLessonProgress} className="w-24" />
                    <span>{Math.round(selectedLessonProgress)}% complete</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {lessons.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                {loadingLessons ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading lessons…</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Lightbulb className="mx-auto h-6 w-6" />
                    <p>No lessons available for this course yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Tabs value={tabsValue} onValueChange={setSelectedLessonId} className="w-full">
              <div className="overflow-x-auto">
                <TabsList className="inline-flex min-w-full justify-start">
                  {lessons.map((lesson) => (
                    <TabsTrigger key={lesson.id} value={lesson.id} className="whitespace-nowrap">
                      {lesson.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {lessons.map((lesson) => (
                <TabsContent key={lesson.id} value={lesson.id} className="space-y-4 pt-4">
                  {loadingLessons ? (
                    <div className="flex justify-center py-12 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <LessonPrompts
                      prompts={promptsByLesson[lesson.id] ?? []}
                      completedPrompts={completedPrompts}
                      notes={notes}
                      onTogglePrompt={togglePromptCompletion}
                      onUpdateNote={updateNote}
                    />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </section>
      </div>
    </div>
  )
}

interface LessonPromptsProps {
  prompts: PracticePrompt[]
  completedPrompts: Record<string, boolean>
  notes: Record<string, string>
  onTogglePrompt: (promptId: string) => void
  onUpdateNote: (promptId: string, value: string) => void
}

function LessonPrompts({ prompts, completedPrompts, notes, onTogglePrompt, onUpdateNote }: LessonPromptsProps) {
  if (prompts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          <Lightbulb className="mx-auto h-6 w-6 mb-3" />
          <p>
            No structured practice prompts available for this lesson yet. Check back after updating the lesson content.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {prompts.map((prompt, index) => {
        const completed = completedPrompts[prompt.id] ?? false
        return (
          <Card key={prompt.id} className={completed ? "border-primary/40 bg-primary/5" : undefined}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3">
                <Badge variant="outline">Prompt {index + 1}</Badge>
                {completed && (
                  <span className="flex items-center gap-1 text-sm text-primary">
                    <CheckCircle className="h-4 w-4" />
                    Completed
                  </span>
                )}
              </div>
              <Button variant={completed ? "secondary" : "outline"} size="sm" onClick={() => onTogglePrompt(prompt.id)}>
                {completed ? "Mark as incomplete" : "Mark complete"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base leading-relaxed">{prompt.text}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>Capture your reasoning or solution sketch</span>
                </div>
                <Textarea
                  placeholder="Write your approach, key steps, or lingering questions…"
                  value={notes[prompt.id] ?? ""}
                  onChange={(event) => onUpdateNote(prompt.id, event.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
