"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MainNav } from "@/components/main-nav"
import { fetchCourses, fetchLessonsByCourse, type Course, type Lesson } from "@/lib/lms"
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Lightbulb, 
  Loader2, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  GraduationCap,
  Target,
  Trophy,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Check
} from "lucide-react"
import MarkdownRenderer from "@/components/markdown-renderer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PracticeQuestion {
  id: string
  title: string
  question: string
  type: "multiple_choice" | "text_input" | "numeric_input"
  options?: Array<{ id: string; text: string; correct: boolean }>
  correct_answer?: string
  hint?: string
  solution: string
  math_explanation?: string
  difficulty?: "easy" | "medium" | "hard"
  tags?: string[]
  lesson_id?: string
}

const STORAGE_KEY = "markov-practice-tracker"

export default function PracticePage() {
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [allQuestions, setAllQuestions] = useState<PracticeQuestion[]>([])
  const [coursesWithQuestions, setCoursesWithQuestions] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [selectedLessonId, setSelectedLessonId] = useState<string>("")
  const [questionsByLesson, setQuestionsByLesson] = useState<Record<string, PracticeQuestion[]>>({})
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [showHints, setShowHints] = useState<Record<string, boolean>>({})
  const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>({})
  const [completedQuestions, setCompletedQuestions] = useState<Record<string, boolean>>({})
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const hydrationRef = useRef(false)

  // Restore saved practice state
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as {
          userAnswers?: Record<string, string>
          completedQuestions?: Record<string, boolean>
        }
        if (parsed.userAnswers) setUserAnswers(parsed.userAnswers)
        if (parsed.completedQuestions) setCompletedQuestions(parsed.completedQuestions)
      }
    } catch (error) {
      console.warn("Failed to restore practice progress", error)
    } finally {
      hydrationRef.current = true
    }
  }, [])

  // Persist practice state
  useEffect(() => {
    if (!hydrationRef.current || typeof window === "undefined") return

    const payload = JSON.stringify({ userAnswers, completedQuestions })
    window.localStorage.setItem(STORAGE_KEY, payload)
  }, [userAnswers, completedQuestions])

  // Fetch all courses and questions
  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      setLoadingCourses(true)
      setLoadingQuestions(true)
      
      try {
        // Fetch all courses
        const fetchedCourses = await fetchCourses()
        if (cancelled) return
        setAllCourses(fetchedCourses)

        // Fetch all published questions (without filters to get all)
        const questionsResponse = await fetch("/api/practice-questions")
        if (!questionsResponse.ok) {
          console.error("Failed to fetch questions:", questionsResponse.status, questionsResponse.statusText)
          throw new Error(`Failed to fetch questions: ${questionsResponse.statusText}`)
        }
        const questionsData = await questionsResponse.json()
        if (cancelled) return

        if (!questionsData.success) {
          console.error("Questions API returned error:", questionsData.error)
          throw new Error(questionsData.error || "Failed to fetch questions")
        }

        const allQuestionsData = questionsData.data || []
        setAllQuestions(allQuestionsData)
        
        console.log(`Loaded ${allQuestionsData.length} practice questions from database`)

        // Get unique lesson IDs that have questions (filter out null/undefined)
        const lessonIdsWithQuestions = new Set(
          allQuestionsData
            .map((q: PracticeQuestion) => q.lesson_id)
            .filter((id): id is string => Boolean(id))
        )

        if (lessonIdsWithQuestions.size === 0 && allQuestionsData.length > 0) {
          // Questions exist but aren't mapped to lessons - show them anyway
          console.warn("Questions exist but aren't mapped to lessons. Consider mapping them in admin panel.")
        }

        if (allQuestionsData.length === 0) {
          setCoursesWithQuestions([])
          setLessons([])
          setAllLessons([])
          setLoadingCourses(false)
          setLoadingQuestions(false)
          return
        }

        // Fetch lessons for all courses
        const lessonsPromises = fetchedCourses.map(async (course) => {
          return await fetchLessonsByCourse(course.id)
        })

        const lessonsArrays = await Promise.all(lessonsPromises)
        if (cancelled) return

        // Flatten all lessons
        const allLessonsFlat = lessonsArrays.flat()
        setAllLessons(allLessonsFlat)

        // Build questions map by lesson first
        const questionsMap: Record<string, PracticeQuestion[]> = {}
        allQuestionsData.forEach((q: PracticeQuestion) => {
          if (q.lesson_id) {
            if (!questionsMap[q.lesson_id]) {
              questionsMap[q.lesson_id] = []
            }
            questionsMap[q.lesson_id].push(q)
          }
        })
        setQuestionsByLesson(questionsMap)

        // Build map of course -> lessons with questions
        const courseToLessons: Record<string, Lesson[]> = {}
        fetchedCourses.forEach((course, index) => {
          const courseLessons = lessonsArrays[index]
          const lessonsWithQ = courseLessons.filter(lesson => {
            const questions = questionsMap[lesson.id] || []
            return questions.length > 0
          })
          if (lessonsWithQ.length > 0) {
            courseToLessons[course.id] = lessonsWithQ.sort((a, b) => a.order - b.order)
          }
        })

        // Filter courses to only those with lessons that have questions
        const coursesWithQ = fetchedCourses.filter(course => courseToLessons[course.id]?.length > 0)
        setCoursesWithQuestions(coursesWithQ)

        // Set initial course selection
        if (coursesWithQ.length > 0) {
          setSelectedCourseId(coursesWithQ[0].id)
        }

        setLoadingCourses(false)
        setLoadingQuestions(false)
      } catch (error) {
        console.error("Failed to load practice data:", error)
        setLoadingCourses(false)
        setLoadingQuestions(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [])

  // Update lessons when course changes
  useEffect(() => {
    if (!selectedCourseId || allLessons.length === 0 || Object.keys(questionsByLesson).length === 0) {
      setLessons([])
      setSelectedLessonId("")
      return
    }

    // Filter lessons for selected course that have questions
    const lessonsWithQ = allLessons
      .filter(lesson => {
        return lesson.courseId === selectedCourseId && (questionsByLesson[lesson.id]?.length || 0) > 0
      })
      .sort((a, b) => a.order - b.order)

    setLessons(lessonsWithQ)

    // Set initial lesson selection
    if (lessonsWithQ.length > 0) {
      setSelectedLessonId((current) => {
        if (current && lessonsWithQ.some(l => l.id === current)) {
          return current
        }
        return lessonsWithQ[0].id
      })
    } else {
      setSelectedLessonId("")
    }
  }, [selectedCourseId, allLessons, questionsByLesson])

  const selectedCourse = coursesWithQuestions.find((course) => course.id === selectedCourseId) ?? null
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? null
  const selectedQuestions = selectedLesson ? questionsByLesson[selectedLesson.id] ?? [] : []

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const toggleHint = (questionId: string) => {
    setShowHints((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }))
  }

  const toggleSolution = (questionId: string) => {
    setShowSolutions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }))
  }

  const checkAnswer = (question: PracticeQuestion) => {
    const userAnswer = userAnswers[question.id]?.trim().toLowerCase()
    
    if (question.type === "multiple_choice") {
      const selectedOption = question.options?.find((opt) => opt.id.toLowerCase() === userAnswer)
      return selectedOption?.correct || false
    } else {
      const correctAnswer = question.correct_answer?.trim().toLowerCase()
      return userAnswer === correctAnswer
    }
  }

  const handleSubmitAnswer = (question: PracticeQuestion) => {
    const isCorrect = checkAnswer(question)
    setSubmittedAnswers((prev) => ({
      ...prev,
      [question.id]: true,
    }))
    if (isCorrect) {
      setCompletedQuestions((prev) => ({
        ...prev,
        [question.id]: true,
      }))
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      // Scroll to top of question area
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Reset current question index when questions change
  useEffect(() => {
    if (selectedQuestions.length > 0) {
      setCurrentQuestionIndex(0)
    }
  }, [selectedLessonId])

  const selectedLessonProgress = (() => {
    if (selectedQuestions.length === 0) return 0
    const completedCount = selectedQuestions.filter((q) => completedQuestions[q.id]).length
    return (completedCount / selectedQuestions.length) * 100
  })()

  const aggregateCourseProgress = (() => {
    if (lessons.length === 0) return { total: 0, completed: 0, percent: 0 }
    let total = 0
    let done = 0
    lessons.forEach((lesson) => {
      const questions = questionsByLesson[lesson.id] ?? []
      total += questions.length
      done += questions.filter((q) => completedQuestions[q.id]).length
    })
    return {
      total,
      completed: done,
      percent: total > 0 ? (done / total) * 100 : 0,
    }
  })()

  if (loadingCourses || loadingQuestions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading practice catalog…</span>
        </div>
      </div>
    )
  }

  if (coursesWithQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav currentPath="/practice" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <HelpCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Practice Questions Available</h3>
                  <p className="text-muted-foreground">
                    Practice questions are being added to the courses. Check back soon!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav currentPath="/practice" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="outline" className="text-sm font-semibold px-3 py-1">
                Practice Lab
              </Badge>
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Master Through Practice
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Test your understanding with interactive questions mapped to each lesson. Build confidence through hands-on practice.
            </p>
          </div>
          <div className="absolute top-0 right-0 opacity-10">
            <Sparkles className="h-32 w-32 text-primary" />
          </div>
        </div>

        {/* Course Selection & Progress */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Select Course</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {coursesWithQuestions.map((course) => {
                    // Count questions for this course
                    const courseLessons = allLessons.filter(l => l.courseId === course.id)
                    const courseQuestionCount = courseLessons.reduce((sum, lesson) => {
                      return sum + (questionsByLesson[lesson.id]?.length || 0)
                    }, 0)
                    
                    return (
                      <SelectItem key={course.id} value={course.id}>
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>{course.title}</span>
                          </div>
                          {courseQuestionCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {courseQuestionCount} questions
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Your Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Course Completion</span>
                  <span className="font-semibold">
                    {aggregateCourseProgress.completed}/{aggregateCourseProgress.total}
                  </span>
                </div>
                <Progress value={aggregateCourseProgress.percent} className="h-3" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{Math.round(aggregateCourseProgress.percent)}% complete</span>
                  <span>{aggregateCourseProgress.total - aggregateCourseProgress.completed} remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lesson Selection & Questions */}
        {selectedCourseId && (
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-xl mb-2">Lesson Practice</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select a lesson to start practicing with interactive questions
                  </p>
                </div>
                {selectedLesson && (
                  <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50 border">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{selectedLesson.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Progress value={selectedLessonProgress} className="w-20 h-1.5" />
                        <span>{Math.round(selectedLessonProgress)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {lessons.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Lightbulb className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">No lessons with questions</h3>
                      <p className="text-muted-foreground">
                        This course doesn't have any lessons with practice questions yet.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Select Lesson
                    </Label>
                    <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choose a lesson" />
                      </SelectTrigger>
                      <SelectContent>
                        {lessons.map((lesson) => {
                          const lessonQuestions = questionsByLesson[lesson.id] ?? []
                          const completed = lessonQuestions.filter((q) => completedQuestions[q.id]).length
                          
                          return (
                            <SelectItem key={lesson.id} value={lesson.id}>
                              <div className="flex items-center justify-between w-full gap-2">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  <span>{lesson.title}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {completed}/{lessonQuestions.length}
                                </Badge>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedLessonId && (
                    <div className="pt-4 border-t">
                      {loadingQuestions ? (
                        <div className="flex justify-center py-16">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-muted-foreground">Loading questions…</span>
                          </div>
                        </div>
                      ) : (
                        <LessonQuestions
                          questions={selectedQuestions}
                          userAnswers={userAnswers}
                          showHints={showHints}
                          showSolutions={showSolutions}
                          completedQuestions={completedQuestions}
                          submittedAnswers={submittedAnswers}
                          currentQuestionIndex={currentQuestionIndex}
                          onAnswerChange={handleAnswerChange}
                          onToggleHint={toggleHint}
                          onToggleSolution={toggleSolution}
                          onSubmitAnswer={handleSubmitAnswer}
                          onNextQuestion={handleNextQuestion}
                          onPreviousQuestion={handlePreviousQuestion}
                          onQuestionSelect={handleQuestionSelect}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

interface LessonQuestionsProps {
  questions: PracticeQuestion[]
  userAnswers: Record<string, string>
  showHints: Record<string, boolean>
  showSolutions: Record<string, boolean>
  completedQuestions: Record<string, boolean>
  submittedAnswers: Record<string, boolean>
  currentQuestionIndex: number
  onAnswerChange: (questionId: string, answer: string) => void
  onToggleHint: (questionId: string) => void
  onToggleSolution: (questionId: string) => void
  onSubmitAnswer: (question: PracticeQuestion) => void
  onNextQuestion: () => void
  onPreviousQuestion: () => void
  onQuestionSelect: (index: number) => void
}

function LessonQuestions({
  questions,
  userAnswers,
  showHints,
  showSolutions,
  completedQuestions,
  submittedAnswers,
  currentQuestionIndex,
  onAnswerChange,
  onToggleHint,
  onToggleSolution,
  onSubmitAnswer,
  onNextQuestion,
  onPreviousQuestion,
  onQuestionSelect,
}: LessonQuestionsProps) {
  if (questions.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-16 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <HelpCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No practice questions yet</h3>
              <p className="text-muted-foreground">
                Practice questions for this lesson are coming soon. Keep learning!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isSubmitted = submittedAnswers[currentQuestion.id] || false
  const isCompleted = completedQuestions[currentQuestion.id] || false

  const checkAnswer = (question: PracticeQuestion) => {
    const userAnswer = userAnswers[question.id]?.trim().toLowerCase()
    
    if (question.type === "multiple_choice") {
      const selectedOption = question.options?.find((opt) => opt.id.toLowerCase() === userAnswer)
      return selectedOption?.correct || false
    } else {
      const correctAnswer = question.correct_answer?.trim().toLowerCase()
      return userAnswer === correctAnswer
    }
  }

  const isCorrect = isSubmitted ? checkAnswer(currentQuestion) : false
  const userAnswer = userAnswers[currentQuestion.id] || ""
  const showHint = showHints[currentQuestion.id] || false
  const showSolution = showSolutions[currentQuestion.id] || false

  return (
    <div className="space-y-6">
      {/* Question Navigation */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold">Question:</Label>
              <Select
                value={currentQuestionIndex.toString()}
                onValueChange={(value) => onQuestionSelect(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questions.map((q, idx) => {
                    const isQSubmitted = submittedAnswers[q.id] || false
                    const isQCompleted = completedQuestions[q.id] || false
                    return (
                      <SelectItem key={q.id} value={idx.toString()}>
                        <div className="flex items-center gap-2">
                          {isQCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : isQSubmitted ? (
                            <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                          )}
                          <span>Question {idx + 1}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                of {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card 
        className={`border-2 transition-all ${
          isSubmitted 
            ? isCorrect 
              ? "border-green-500/50 bg-green-500/5" 
              : "border-red-500/50 bg-red-500/5"
            : "border-border hover:border-primary/30"
        }`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <Badge variant="outline" className="font-semibold">
                  Question {currentQuestionIndex + 1}
                </Badge>
                {currentQuestion.difficulty && (
                  <Badge 
                    variant="secondary"
                    className={`capitalize ${
                      currentQuestion.difficulty === "easy" ? "bg-green-500/20 text-green-700 dark:text-green-400" :
                      currentQuestion.difficulty === "medium" ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" :
                      "bg-red-500/20 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                )}
                {isSubmitted && (
                  <Badge variant={isCorrect ? "default" : "destructive"} className="gap-1">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Correct
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3" />
                        Incorrect
                      </>
                    )}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{currentQuestion.title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <MarkdownRenderer content={currentQuestion.question} hideToolbar={true} />
          </div>

          {currentQuestion.type === "multiple_choice" && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select your answer:</Label>
              <div className="space-y-2">
                {currentQuestion.options?.map((option) => {
                  const isSelected = userAnswer === option.id
                  const showCorrect = isSubmitted && option.correct
                  const showIncorrect = isSubmitted && isSelected && !option.correct
                  
                  return (
                    <div
                      key={option.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        showCorrect
                          ? "border-green-500 bg-green-500/20 dark:bg-green-500/10"
                          : showIncorrect
                          ? "border-red-500 bg-red-500/20 dark:bg-red-500/10"
                          : isSelected
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      } ${isSubmitted ? "cursor-default" : ""}`}
                      onClick={() => !isSubmitted && onAnswerChange(currentQuestion.id, option.id)}
                    >
                      <input
                        type="radio"
                        id={`${currentQuestion.id}-${option.id}`}
                        name={currentQuestion.id}
                        value={option.id}
                        checked={isSelected}
                        onChange={(e) => onAnswerChange(currentQuestion.id, e.target.value)}
                        disabled={isSubmitted}
                        className="mt-0.5 h-4 w-4 cursor-pointer"
                      />
                      <label
                        htmlFor={`${currentQuestion.id}-${option.id}`}
                        className={`flex-1 cursor-pointer ${
                          showCorrect
                            ? "text-green-700 dark:text-green-400 font-semibold"
                            : showIncorrect
                            ? "text-red-700 dark:text-red-400 font-semibold"
                            : ""
                        }`}
                      >
                        <span className="font-semibold mr-2">{option.id.toUpperCase()}.</span>
                        {option.text}
                        {showCorrect && (
                          <CheckCircle2 className="inline h-4 w-4 ml-2 text-green-600 dark:text-green-400" />
                        )}
                        {showIncorrect && (
                          <X className="inline h-4 w-4 ml-2 text-red-600 dark:text-red-400" />
                        )}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {(currentQuestion.type === "text_input" || currentQuestion.type === "numeric_input") && (
            <div className="space-y-2">
              <Label htmlFor={`answer-${currentQuestion.id}`} className="text-base font-semibold">
                Your answer:
              </Label>
              <Input
                id={`answer-${currentQuestion.id}`}
                type={currentQuestion.type === "numeric_input" ? "number" : "text"}
                value={userAnswer}
                onChange={(e) => onAnswerChange(currentQuestion.id, e.target.value)}
                disabled={isSubmitted}
                placeholder="Enter your answer..."
                className={`h-11 ${
                  isSubmitted 
                    ? (isCorrect 
                        ? "border-green-500 bg-green-500/10 dark:bg-green-500/5" 
                        : "border-red-500 bg-red-500/10 dark:bg-red-500/5")
                    : ""
                }`}
              />
              {isSubmitted && (
                <div className={`text-sm font-semibold ${isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                  {isCorrect ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Correct! The answer is: {currentQuestion.correct_answer}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4" />
                      Incorrect. The correct answer is: {currentQuestion.correct_answer}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 flex-wrap pt-2">
            {!isSubmitted && (
              <Button
                onClick={() => onSubmitAnswer(currentQuestion)}
                disabled={!userAnswer.trim()}
                className="cursor-pointer"
              >
                <Target className="h-4 w-4 mr-2" />
                Submit Answer
              </Button>
            )}
            {isSubmitted && currentQuestionIndex < questions.length - 1 && (
              <Button
                onClick={onNextQuestion}
                className="cursor-pointer"
              >
                Next Question
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {currentQuestion.hint && (
              <Button
                variant="outline"
                onClick={() => onToggleHint(currentQuestion.id)}
                className="cursor-pointer"
              >
                <Lightbulb className={`h-4 w-4 mr-2 ${showHint ? "text-yellow-600 dark:text-yellow-400" : ""}`} />
                {showHint ? "Hide Hint" : "Show Hint"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onToggleSolution(currentQuestion.id)}
              className="cursor-pointer"
            >
              <HelpCircle className={`h-4 w-4 mr-2 ${showSolution ? "text-blue-600 dark:text-blue-400" : ""}`} />
              {showSolution ? "Hide Solution" : "Show Solution"}
            </Button>
          </div>

          {showHint && currentQuestion.hint && (
            <Card className="bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800/70">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                  <div className="flex-1 prose prose-sm max-w-none dark:prose-invert">
                    <h4 className="text-sm font-semibold mb-2 text-yellow-900 dark:text-yellow-100">Hint:</h4>
                    <div className="text-yellow-900 dark:text-yellow-100">
                      <MarkdownRenderer content={currentQuestion.hint} hideToolbar={true} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {showSolution && (
            <Card className="bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/70">
              <CardContent className="pt-4 space-y-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <h4 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">Solution:</h4>
                  <div className="text-blue-900 dark:text-blue-100">
                    <MarkdownRenderer content={currentQuestion.solution} hideToolbar={true} />
                  </div>
                </div>
                {currentQuestion.math_explanation && (
                  <div className="prose prose-sm max-w-none dark:prose-invert border-t border-blue-200 dark:border-blue-800 pt-4">
                    <h4 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">
                      Step-by-step Math Explanation:
                    </h4>
                    <div className="text-blue-900 dark:text-blue-100">
                      <MarkdownRenderer content={currentQuestion.math_explanation} hideToolbar={true} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
