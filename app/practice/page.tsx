"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trophy,
  Target,
  Brain,
  Clock,
  ArrowRight,
  Lightbulb,
  BookOpen,
} from "lucide-react"
import Link from "next/link"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { MobileNav } from "@/components/mobile-nav"

interface Question {
  id: string
  type: "multiple-choice" | "true-false" | "numerical" | "matrix"
  category: "foundations" | "core-concepts" | "advanced"
  difficulty: "easy" | "medium" | "hard"
  question: string
  options?: string[]
  correctAnswer: string | number
  explanation: string
  points: number
}

const practiceQuestions: Question[] = [
  {
    id: "q1",
    type: "multiple-choice",
    category: "foundations",
    difficulty: "easy",
    question: "What is the key property that defines a Markov process?",
    options: [
      "The future depends only on the present state",
      "The future depends on all past states",
      "The process is always deterministic",
      "The process has infinite states",
    ],
    correctAnswer: "The future depends only on the present state",
    explanation:
      "The Markov property states that the future state depends only on the current state, not on the sequence of events that led to it. This is also known as the 'memoryless' property.",
    points: 10,
  },
  {
    id: "q2",
    type: "true-false",
    category: "foundations",
    difficulty: "easy",
    question: "In a transition matrix, each row must sum to 1.",
    correctAnswer: "true",
    explanation:
      "Yes, each row in a transition matrix represents the probabilities of transitioning from one state to all possible states, so they must sum to 1.",
    points: 10,
  },
  {
    id: "q3",
    type: "numerical",
    category: "core-concepts",
    difficulty: "medium",
    question:
      "If a 2-state Markov chain has transition matrix P = [[0.7, 0.3], [0.4, 0.6]], what is the steady-state probability of state 1? (Round to 3 decimal places)",
    correctAnswer: 0.571,
    explanation:
      "To find steady-state probabilities, solve πP = π. For this matrix, π₁ = 4/7 ≈ 0.571 and π₂ = 3/7 ≈ 0.429.",
    points: 20,
  },
  {
    id: "q4",
    type: "multiple-choice",
    category: "core-concepts",
    difficulty: "medium",
    question: "What type of state can a Markov chain never leave once it enters?",
    options: ["Transient state", "Recurrent state", "Absorbing state", "Periodic state"],
    correctAnswer: "Absorbing state",
    explanation:
      "An absorbing state is one where the probability of staying in that state is 1, meaning once entered, the chain cannot leave.",
    points: 15,
  },
  {
    id: "q5",
    type: "true-false",
    category: "advanced",
    difficulty: "hard",
    question: "Every finite Markov chain has a unique steady-state distribution.",
    correctAnswer: "false",
    explanation:
      "This is false. A finite Markov chain has a unique steady-state distribution only if it is irreducible and aperiodic. Chains with multiple communicating classes can have multiple steady-state distributions.",
    points: 25,
  },
  {
    id: "q6",
    type: "multiple-choice",
    category: "advanced",
    difficulty: "hard",
    question: "In the context of Hidden Markov Models, what is 'hidden'?",
    options: [
      "The transition probabilities",
      "The observation sequence",
      "The underlying state sequence",
      "The emission probabilities",
    ],
    correctAnswer: "The underlying state sequence",
    explanation:
      "In Hidden Markov Models, we can observe the outputs/emissions but cannot directly observe which state the system is in at any given time. The state sequence is 'hidden'.",
    points: 25,
  },
]

interface QuizState {
  currentQuestion: number
  answers: Record<string, string | number>
  score: number
  completed: boolean
  showExplanation: boolean
  timeStarted: number
}

export default function PracticePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    answers: {},
    score: 0,
    completed: false,
    showExplanation: false,
    timeStarted: Date.now(),
  })
  const [currentAnswer, setCurrentAnswer] = useState<string | number>("")
  const [quizMode, setQuizMode] = useState<"practice" | "assessment">("practice")

  const filteredQuestions = practiceQuestions.filter((q) => {
    const categoryMatch = selectedCategory === "all" || q.category === selectedCategory
    const difficultyMatch = selectedDifficulty === "all" || q.difficulty === selectedDifficulty
    return categoryMatch && difficultyMatch
  })

  const currentQuestion = filteredQuestions[quizState.currentQuestion]
  const totalQuestions = filteredQuestions.length
  const progress = totalQuestions > 0 ? ((quizState.currentQuestion + 1) / totalQuestions) * 100 : 0

  const submitAnswer = () => {
    if (!currentQuestion || currentAnswer === "") return

    const isCorrect =
      currentQuestion.type === "numerical"
        ? Math.abs(Number(currentAnswer) - Number(currentQuestion.correctAnswer)) < 0.001
        : currentAnswer === currentQuestion.correctAnswer

    const newAnswers = { ...quizState.answers, [currentQuestion.id]: currentAnswer }
    const newScore = isCorrect ? quizState.score + currentQuestion.points : quizState.score

    setQuizState((prev) => ({
      ...prev,
      answers: newAnswers,
      score: newScore,
      showExplanation: true,
    }))
  }

  const nextQuestion = () => {
    if (quizState.currentQuestion < totalQuestions - 1) {
      setQuizState((prev) => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        showExplanation: false,
      }))
      setCurrentAnswer("")
    } else {
      setQuizState((prev) => ({ ...prev, completed: true }))
    }
  }

  const resetQuiz = () => {
    setQuizState({
      currentQuestion: 0,
      answers: {},
      score: 0,
      completed: false,
      showExplanation: false,
      timeStarted: Date.now(),
    })
    setCurrentAnswer("")
  }

  const getScorePercentage = () => {
    const maxScore = filteredQuestions.reduce((sum, q) => sum + q.points, 0)
    return maxScore > 0 ? Math.round((quizState.score / maxScore) * 100) : 0
  }

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: "Excellent", color: "text-green-600", icon: Trophy }
    if (percentage >= 75) return { level: "Good", color: "text-blue-600", icon: Target }
    if (percentage >= 60) return { level: "Fair", color: "text-yellow-600", icon: Brain }
    return { level: "Needs Improvement", color: "text-red-600", icon: RotateCcw }
  }

  const isAnswerCorrect = () => {
    if (!currentQuestion) return false
    return currentQuestion.type === "numerical"
      ? Math.abs(Number(currentAnswer) - Number(currentQuestion.correctAnswer)) < 0.001
      : currentAnswer === currentQuestion.correctAnswer
  }

  const timeElapsed = Math.floor((Date.now() - quizState.timeStarted) / 1000)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">M</span>
                </div>
                <span className="font-semibold text-lg">MarkovLearn</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6">
                <Link href="/learn" className="text-muted-foreground hover:text-foreground transition-colors">
                  Learn
                </Link>
                <Link href="/tools" className="text-muted-foreground hover:text-foreground transition-colors">
                  Tools
                </Link>
                <Link href="/examples" className="text-muted-foreground hover:text-foreground transition-colors">
                  Examples
                </Link>
                <Link href="/practice" className="text-foreground font-medium transition-colors">
                  Practice
                </Link>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
                <ThemeSwitcher />
              </div>
              <MobileNav currentPath="/practice" />
            </div>
            {!quizState.completed && totalQuestions > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <Progress value={progress} className="w-32" />
                <span className="text-sm text-muted-foreground">
                  {quizState.currentQuestion + 1} of {totalQuestions}
                </span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-bold">Practice & Assessment</h1>
          <p className="text-lg text-muted-foreground">
            Test your understanding of Markov chains with interactive quizzes and get instant feedback
          </p>
        </div>

        {/* Quiz Setup */}
        {!quizState.completed && quizState.currentQuestion === 0 && !currentQuestion && (
          <div className="space-y-6">
            <Tabs defaultValue="practice" onValueChange={(value) => setQuizMode(value as "practice" | "assessment")}>
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="practice">Practice Mode</TabsTrigger>
                <TabsTrigger value="assessment">Assessment Mode</TabsTrigger>
              </TabsList>

              <TabsContent value="practice" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Practice Mode</CardTitle>
                    <CardDescription>Learn at your own pace with immediate feedback and explanations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                          <option value="all">All Categories</option>
                          <option value="foundations">Foundations</option>
                          <option value="core-concepts">Core Concepts</option>
                          <option value="advanced">Advanced Topics</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <select
                          id="difficulty"
                          className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                          value={selectedDifficulty}
                          onChange={(e) => setSelectedDifficulty(e.target.value)}
                        >
                          <option value="all">All Levels</option>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{filteredQuestions.length} questions available</div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assessment" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Assessment Mode</CardTitle>
                    <CardDescription>Timed assessment with scoring - no hints or immediate feedback</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Timed questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                          <span>Scored results</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>Performance tracking</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        All {practiceQuestions.length} questions will be included
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Button
              onClick={() => {
                setQuizState((prev) => ({ ...prev, timeStarted: Date.now() }))
                if (quizMode === "assessment") {
                  setSelectedCategory("all")
                  setSelectedDifficulty("all")
                }
              }}
              disabled={filteredQuestions.length === 0}
              size="lg"
              className="w-full sm:w-auto"
            >
              Start {quizMode === "practice" ? "Practice" : "Assessment"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Quiz Question */}
        {currentQuestion && !quizState.completed && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {currentQuestion.category.replace("-", " ")}
                  </Badge>
                  <Badge
                    variant={
                      currentQuestion.difficulty === "easy"
                        ? "secondary"
                        : currentQuestion.difficulty === "medium"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{currentQuestion.points} points</span>
                </div>
              </div>
              <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Answer Input */}
              {currentQuestion.type === "multiple-choice" && (
                <RadioGroup value={currentAnswer.toString()} onValueChange={setCurrentAnswer}>
                  {currentQuestion.options?.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === "true-false" && (
                <RadioGroup value={currentAnswer.toString()} onValueChange={setCurrentAnswer}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true" className="cursor-pointer">
                      True
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false" className="cursor-pointer">
                      False
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {currentQuestion.type === "numerical" && (
                <div>
                  <Label htmlFor="numerical-answer">Your Answer</Label>
                  <Input
                    id="numerical-answer"
                    type="number"
                    step="0.001"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Enter your numerical answer"
                    className="mt-1"
                  />
                </div>
              )}

              {/* Explanation */}
              {quizState.showExplanation && (
                <Card className={`${isAnswerCorrect() ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {isAnswerCorrect() ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="space-y-2">
                        <div className="font-medium">
                          {isAnswerCorrect() ? "Correct!" : "Incorrect"}
                          {!isAnswerCorrect() && (
                            <span className="ml-2 text-sm">
                              Correct answer: {currentQuestion.correctAnswer.toString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Question {quizState.currentQuestion + 1} of {totalQuestions}
                </div>
                <div className="flex gap-2">
                  {!quizState.showExplanation ? (
                    <Button onClick={submitAnswer} disabled={currentAnswer === ""}>
                      Submit Answer
                    </Button>
                  ) : (
                    <Button onClick={nextQuestion}>
                      {quizState.currentQuestion < totalQuestions - 1 ? "Next Question" : "Finish Quiz"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quiz Results */}
        {quizState.completed && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  {React.createElement(getPerformanceLevel(getScorePercentage()).icon, {
                    className: `h-8 w-8 ${getPerformanceLevel(getScorePercentage()).color}`,
                  })}
                </div>
                <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
                <CardDescription>Here's how you performed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-primary">{getScorePercentage()}%</div>
                  <div className={`text-lg font-medium ${getPerformanceLevel(getScorePercentage()).color}`}>
                    {getPerformanceLevel(getScorePercentage()).level}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-primary">{quizState.score}</div>
                    <div className="text-sm text-muted-foreground">Points Earned</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-accent">
                      {
                        Object.keys(quizState.answers).filter((id) => {
                          const question = practiceQuestions.find((q) => q.id === id)
                          const answer = quizState.answers[id]
                          if (!question) return false
                          return question.type === "numerical"
                            ? Math.abs(Number(answer) - Number(question.correctAnswer)) < 0.001
                            : answer === question.correctAnswer
                        }).length
                      }
                      /{totalQuestions}
                    </div>
                    <div className="text-sm text-muted-foreground">Correct Answers</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-chart-3">
                      {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, "0")}
                    </div>
                    <div className="text-sm text-muted-foreground">Time Taken</div>
                  </Card>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={resetQuiz} variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button asChild>
                    <Link href="/learn">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Continue Learning
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Performance Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {getScorePercentage() >= 90 ? (
                  <p className="text-muted-foreground">
                    Excellent work! You have a strong understanding of Markov chains. Consider exploring advanced topics
                    or helping others learn.
                  </p>
                ) : getScorePercentage() >= 75 ? (
                  <p className="text-muted-foreground">
                    Good job! You understand most concepts well. Review the questions you missed and practice similar
                    problems.
                  </p>
                ) : getScorePercentage() >= 60 ? (
                  <p className="text-muted-foreground">
                    You're on the right track! Focus on reviewing the foundational concepts and practice more examples.
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Don't worry - learning takes time! Start with the basics in our Learn section and work through the
                    examples step by step.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
