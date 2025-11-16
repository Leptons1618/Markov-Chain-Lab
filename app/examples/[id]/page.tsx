"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Play, RotateCcw, BarChart3, BookOpen, Calculator, Link as LinkIcon, Lightbulb, HelpCircle } from "lucide-react"
import Link from "next/link"

interface LessonConnection {
  lessonId: string
  lessonTitle: string
  connection: string
}

interface Example {
  id: string
  title: string
  description: string
  difficulty: string
  explanation: string
  lessonConnections?: LessonConnection[]
  mathematicalDetails?: {
    transitionMatrix?: string
    stationaryDistribution?: string
    keyInsights?: string[]
  }
  realWorldContext?: string
  practiceQuestions?: string[]
  applications?: string[]
}

export default function CaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [example, setExample] = useState<Example | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentSection, setCurrentSection] = useState(0)
  const [simulationData, setSimulationData] = useState<number[]>([])
  const [isSimulating, setIsSimulating] = useState(false)

  useEffect(() => {
    fetch("/api/examples")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const found = data.data.find((ex: Example) => ex.id === id)
          if (found) {
            setExample(found)
            // Create sections dynamically
            const sections = []
            if (found.explanation) sections.push({ id: "overview", title: "Overview", content: found.explanation })
            if (found.mathematicalDetails) sections.push({ id: "mathematics", title: "Mathematical Details", content: found.mathematicalDetails })
            if (found.realWorldContext) sections.push({ id: "context", title: "Real-World Context", content: found.realWorldContext })
            setSections(sections)
          }
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load example:", err)
        setLoading(false)
      })
  }, [id])

  const [sections, setSections] = useState<any[]>([])

  const runSimulation = () => {
    if (!example) return
    setIsSimulating(true)
    const steps = 100
    const data: number[] = []
    let currentState = 0

    // Simple simulation logic (would need to be adapted per example)
    for (let i = 0; i < steps; i++) {
      data.push(currentState)
      const random = Math.random()
      // Simplified transition logic
      currentState = random < 0.5 ? 0 : 1
    }

    setSimulationData(data)
    setIsSimulating(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading example...</p>
        </div>
      </div>
    )
  }

  if (!example) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Example not found</h1>
          <Button asChild>
            <Link href="/examples">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Examples
            </Link>
          </Button>
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
              <Link href="/examples" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back to Examples</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {sections.length > 0 && (
                <>
                  <Progress value={((currentSection + 1) / sections.length) * 100} className="w-32" />
                  <span className="text-sm text-muted-foreground">
                    {currentSection + 1} of {sections.length}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{example.difficulty}</Badge>
            {example.applications && example.applications.length > 0 && (
              <Badge variant="secondary">{example.applications.length} Applications</Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold">{example.title}</h1>
          <p className="text-lg text-muted-foreground">{example.description}</p>
        </div>

        {/* Lesson Connections */}
        {example.lessonConnections && example.lessonConnections.length > 0 && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Related Lessons
              </CardTitle>
              <CardDescription>Explore these lessons to deepen your understanding of this example</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {example.lessonConnections.map((connection, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-card border border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{connection.lessonTitle}</h4>
                      <p className="text-sm text-muted-foreground">{connection.connection}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/learn/${connection.lessonId.split("-")[0]}/${connection.lessonId}`}>
                        View Lesson
                        <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Section Navigation */}
        {sections.length > 0 && (
          <div className="flex gap-2 mb-8 overflow-x-auto">
            {sections.map((section, index) => (
              <Button
                key={section.id}
                variant={currentSection === index ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentSection(index)}
                className="whitespace-nowrap"
              >
                {index + 1}. {section.title}
              </Button>
            ))}
          </div>
        )}

        {/* Current Section */}
        {sections.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentSection === 0 && <BookOpen className="h-5 w-5" />}
                {currentSection === 1 && <Calculator className="h-5 w-5" />}
                {currentSection === 2 && <BarChart3 className="h-5 w-5" />}
                {sections[currentSection]?.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {currentSection === 1 && example.mathematicalDetails ? (
                  <div className="space-y-4">
                    {example.mathematicalDetails.transitionMatrix && (
                      <div>
                        <h4 className="font-semibold mb-2">Transition Matrix</h4>
                        <code className="block p-3 bg-muted rounded-lg text-sm">{example.mathematicalDetails.transitionMatrix}</code>
                      </div>
                    )}
                    {example.mathematicalDetails.stationaryDistribution && (
                      <div>
                        <h4 className="font-semibold mb-2">Stationary Distribution</h4>
                        <code className="block p-3 bg-muted rounded-lg text-sm">{example.mathematicalDetails.stationaryDistribution}</code>
                      </div>
                    )}
                    {example.mathematicalDetails.keyInsights && example.mathematicalDetails.keyInsights.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Key Insights
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {example.mathematicalDetails.keyInsights.map((insight, idx) => (
                            <li key={idx}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="whitespace-pre-line text-foreground leading-relaxed">
                    {typeof sections[currentSection]?.content === "string"
                      ? sections[currentSection].content
                      : JSON.stringify(sections[currentSection]?.content, null, 2)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Practice Questions */}
        {example.practiceQuestions && example.practiceQuestions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Practice Questions
              </CardTitle>
              <CardDescription>Test your understanding with these questions</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3">
                {example.practiceQuestions.map((question, idx) => (
                  <li key={idx} className="text-sm leading-relaxed">
                    {question}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {sections.length > 0 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
              disabled={currentSection === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
              disabled={currentSection === sections.length - 1}
            >
              Next
              <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
            </Button>
          </div>
        )}

        {/* Call to Action */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center space-y-4">
            <h3 className="text-xl font-semibold">Ready to Experiment?</h3>
            <p className="text-muted-foreground">Open this example in the Chain Builder to explore it interactively</p>
            <Button asChild>
              <Link href={`/tools?example=${id}`}>
                Open in Chain Builder
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
