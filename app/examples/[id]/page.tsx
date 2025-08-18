"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Play, RotateCcw, BarChart3, BookOpen, Calculator } from "lucide-react"
import Link from "next/link"

// Sample detailed case study for weather model
const caseStudyData = {
  weather: {
    title: "Weather Prediction Model",
    description: "A comprehensive analysis of a 2-state Markov chain for weather forecasting",
    difficulty: "beginner",
    estimatedTime: "15 minutes",
    sections: [
      {
        id: "problem",
        title: "Problem Statement",
        content: `
          Imagine you're planning outdoor events and need to predict tomorrow's weather based on today's conditions. 
          Historical data shows that weather patterns have memory - sunny days tend to be followed by more sunny days, 
          and rainy days often come in clusters.
        `,
      },
      {
        id: "model",
        title: "Mathematical Model",
        content: `
          We model weather as a 2-state Markov chain with states S = {Sunny, Rainy}.
          The transition matrix P represents the probability of weather changes:
          
          P = [0.7  0.3]
              [0.4  0.6]
              
          Where P[i,j] is the probability of transitioning from state i to state j.
        `,
      },
      {
        id: "analysis",
        title: "Steady-State Analysis",
        content: `
          To find the long-term weather distribution, we solve πP = π where π is the steady-state vector.
          
          Setting up the equations:
          0.7π₁ + 0.4π₂ = π₁
          0.3π₁ + 0.6π₂ = π₂
          π₁ + π₂ = 1
          
          Solving: π₁ = 4/7 ≈ 0.571 (Sunny), π₂ = 3/7 ≈ 0.429 (Rainy)
        `,
      },
    ],
  },
}

export default function CaseStudyPage({ params }: { params: { id: string } }) {
  const [currentSection, setCurrentSection] = useState(0)
  const [simulationData, setSimulationData] = useState<number[]>([])
  const [isSimulating, setIsSimulating] = useState(false)

  const caseStudy = caseStudyData.weather // Default to weather case study

  const runSimulation = () => {
    setIsSimulating(true)
    const steps = 100
    const data: number[] = []
    let currentState = 0 // Start with Sunny (0)

    for (let i = 0; i < steps; i++) {
      data.push(currentState)
      // Transition based on probabilities
      const random = Math.random()
      if (currentState === 0) {
        // Currently Sunny
        currentState = random < 0.7 ? 0 : 1
      } else {
        // Currently Rainy
        currentState = random < 0.4 ? 0 : 1
      }
    }

    setSimulationData(data)
    setIsSimulating(false)
  }

  const sunnyDays = simulationData.filter((state) => state === 0).length
  const rainyDays = simulationData.filter((state) => state === 1).length
  const totalDays = simulationData.length

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
              <Progress value={((currentSection + 1) / caseStudy.sections.length) * 100} className="w-32" />
              <span className="text-sm text-muted-foreground">
                {currentSection + 1} of {caseStudy.sections.length}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{caseStudy.difficulty}</Badge>
            <Badge variant="secondary">{caseStudy.estimatedTime}</Badge>
          </div>
          <h1 className="text-3xl font-bold">{caseStudy.title}</h1>
          <p className="text-lg text-muted-foreground">{caseStudy.description}</p>
        </div>

        {/* Section Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {caseStudy.sections.map((section, index) => (
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

        {/* Current Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentSection === 0 && <BookOpen className="h-5 w-5" />}
              {currentSection === 1 && <Calculator className="h-5 w-5" />}
              {currentSection === 2 && <BarChart3 className="h-5 w-5" />}
              {caseStudy.sections[currentSection].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-line text-foreground leading-relaxed">
                {caseStudy.sections[currentSection].content}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Simulation */}
        {currentSection === 2 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Interactive Simulation</CardTitle>
              <CardDescription>
                Run a 100-day weather simulation to see the steady-state distribution in action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Button onClick={runSimulation} disabled={isSimulating}>
                  {isSimulating ? (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Simulation
                    </>
                  )}
                </Button>
                {totalDays > 0 && <div className="text-sm text-muted-foreground">{totalDays} days simulated</div>}
              </div>

              {totalDays > 0 && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Sunny Days</span>
                        <span className="text-lg font-bold text-primary">{sunnyDays}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {((sunnyDays / totalDays) * 100).toFixed(1)}% (Expected: 57.1%)
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Rainy Days</span>
                        <span className="text-lg font-bold text-accent">{rainyDays}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {((rainyDays / totalDays) * 100).toFixed(1)}% (Expected: 42.9%)
                      </div>
                    </Card>
                  </div>

                  {/* Simple visualization */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Weather Pattern (Last 50 days)</h4>
                    <div className="flex gap-1 overflow-x-auto">
                      {simulationData.slice(-50).map((state, index) => (
                        <div
                          key={index}
                          className={`w-3 h-8 rounded-sm ${state === 0 ? "bg-primary" : "bg-accent"}`}
                          title={state === 0 ? "Sunny" : "Rainy"}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-primary rounded-sm" />
                        <span>Sunny</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-accent rounded-sm" />
                        <span>Rainy</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
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
            onClick={() => setCurrentSection(Math.min(caseStudy.sections.length - 1, currentSection + 1))}
            disabled={currentSection === caseStudy.sections.length - 1}
          >
            Next
            <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  )
}
