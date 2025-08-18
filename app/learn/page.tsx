"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ChevronRight, Clock, CheckCircle, PlayCircle, ArrowLeft, Menu, X } from "lucide-react"
import Link from "next/link"

const learningModules = [
  {
    id: "foundations",
    title: "Foundations",
    description: "Probability basics and mathematical prerequisites",
    lessons: [
      { id: "probability-basics", title: "Probability Refresher", duration: "15 min", completed: true },
      { id: "states-transitions", title: "States and Transitions", duration: "20 min", completed: true },
      { id: "matrices", title: "Reading Transition Matrices", duration: "25 min", completed: false },
      { id: "terminology", title: "Basic Terminology", duration: "10 min", completed: false },
    ],
    progress: 50,
  },
  {
    id: "core-concepts",
    title: "Core Concepts",
    description: "Understanding Markov processes and their properties",
    lessons: [
      { id: "markov-property", title: "The Markov Property", duration: "30 min", completed: false },
      { id: "discrete-continuous", title: "Discrete vs Continuous Time", duration: "25 min", completed: false },
      { id: "state-spaces", title: "Finite vs Infinite State Spaces", duration: "20 min", completed: false },
      { id: "state-classification", title: "Classification of States", duration: "35 min", completed: false },
    ],
    progress: 0,
  },
  {
    id: "advanced-topics",
    title: "Advanced Topics",
    description: "Steady-state analysis and complex applications",
    lessons: [
      { id: "steady-state", title: "Steady-State Analysis", duration: "40 min", completed: false },
      { id: "convergence", title: "Convergence Properties", duration: "35 min", completed: false },
      { id: "ergodic-theory", title: "Ergodic Theory Basics", duration: "45 min", completed: false },
      { id: "hmm-intro", title: "Hidden Markov Models", duration: "50 min", completed: false },
    ],
    progress: 0,
  },
]

export default function LearnPage() {
  const [selectedModule, setSelectedModule] = useState("foundations")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentModule = learningModules.find((m) => m.id === selectedModule)

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
                <span className="text-sm text-muted-foreground">Progress: 17%</span>
                <Progress value={17} className="w-24" />
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
              {learningModules.map((module) => (
                <Card
                  key={module.id}
                  className={`cursor-pointer transition-colors ${
                    selectedModule === module.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    setSelectedModule(module.id)
                    setSidebarOpen(false)
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{module.title}</CardTitle>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription className="text-sm">{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {module.lessons.filter((l) => l.completed).length}/{module.lessons.length} lessons
                      </span>
                      <span className="font-medium">{module.progress}%</span>
                    </div>
                    <Progress value={module.progress} className="mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="pt-4 border-t border-border">
              <Link href="/resources">
                <Button variant="outline" className="w-full bg-transparent">
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
            {/* Module Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{currentModule?.title}</Badge>
                <span className="text-sm text-muted-foreground">{currentModule?.lessons.length} lessons</span>
              </div>
              <h1 className="text-3xl font-bold">{currentModule?.title}</h1>
              <p className="text-lg text-muted-foreground">{currentModule?.description}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Progress value={currentModule?.progress} className="w-32" />
                  <span className="text-sm font-medium">{currentModule?.progress}% complete</span>
                </div>
              </div>
            </div>

            {/* Lessons Grid */}
            <div className="grid gap-4">
              {currentModule?.lessons.map((lesson, index) => (
                <Card
                  key={lesson.id}
                  className={`hover:shadow-md transition-shadow ${
                    lesson.completed ? "bg-primary/5 border-primary/20" : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${lesson.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                        `}
                        >
                          {lesson.completed ? (
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
                              <span>{lesson.duration}</span>
                            </div>
                            {lesson.completed && (
                              <Badge variant="secondary" className="text-xs">
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link href={`/learn/${selectedModule}?lesson=${lesson.id}`}>
                        <Button variant={lesson.completed ? "outline" : "default"} size="sm" className="cursor-pointer">
                          {lesson.completed ? (
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
              ))}
            </div>

            {/* Module Completion */}
            {currentModule?.progress === 100 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 text-center space-y-4">
                  <CheckCircle className="h-12 w-12 text-primary mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold">Module Complete!</h3>
                    <p className="text-muted-foreground">
                      Great job completing {currentModule.title}. Ready for the next challenge?
                    </p>
                  </div>
                  <Button>
                    Continue to Next Module
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
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
