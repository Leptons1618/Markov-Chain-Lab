"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Play,
  RotateCcw,
  TrendingUp,
  Cloud,
  Gamepad2,
  Users,
  Search,
  DollarSign,
  Dna,
  MessageSquare,
  ArrowRight,
  BarChart3,
} from "lucide-react"
import Link from "next/link"

interface Example {
  id: string
  title: string
  description: string
  category: "classic" | "modern"
  difficulty: "beginner" | "intermediate" | "advanced"
  icon: React.ReactNode
  states: string[]
  applications: string[]
  interactiveDemo?: boolean
}

const examples: Example[] = [
  {
    id: "weather",
    title: "Weather Prediction Model",
    description: "A simple 2-state model predicting sunny and rainy days based on current weather",
    category: "classic",
    difficulty: "beginner",
    icon: <Cloud className="h-5 w-5" />,
    states: ["Sunny", "Rainy"],
    applications: ["Meteorology", "Agriculture Planning", "Event Planning"],
    interactiveDemo: true,
  },
  {
    id: "random-walk",
    title: "Random Walk",
    description: "Mathematical model of a path consisting of random steps, fundamental to many processes",
    category: "classic",
    difficulty: "beginner",
    icon: <TrendingUp className="h-5 w-5" />,
    states: ["Position -2", "Position -1", "Position 0", "Position 1", "Position 2"],
    applications: ["Stock Prices", "Brownian Motion", "Diffusion Processes"],
    interactiveDemo: true,
  },
  {
    id: "monopoly",
    title: "Monopoly Board Game",
    description: "Analysis of player movement around the Monopoly board using transition probabilities",
    category: "classic",
    difficulty: "intermediate",
    icon: <Gamepad2 className="h-5 w-5" />,
    states: ["Go", "Mediterranean Ave", "Community Chest", "Baltic Ave", "Income Tax", "Reading Railroad"],
    applications: ["Game Theory", "Probability Analysis", "Strategy Optimization"],
    interactiveDemo: false,
  },
  {
    id: "queue-system",
    title: "Queueing System",
    description: "Customer service queue with arrival and departure rates",
    category: "classic",
    difficulty: "intermediate",
    icon: <Users className="h-5 w-5" />,
    states: ["0 customers", "1 customer", "2 customers", "3 customers", "4+ customers"],
    applications: ["Call Centers", "Restaurant Management", "Traffic Flow"],
    interactiveDemo: true,
  },
  {
    id: "pagerank",
    title: "Google PageRank Algorithm",
    description: "Web page ranking based on link structure and random surfer model",
    category: "modern",
    difficulty: "advanced",
    icon: <Search className="h-5 w-5" />,
    states: ["Page A", "Page B", "Page C", "Page D"],
    applications: ["Search Engines", "Social Network Analysis", "Citation Analysis"],
    interactiveDemo: false,
  },
  {
    id: "stock-model",
    title: "Stock Price Modeling",
    description: "Simplified model of stock price movements with up, down, and stable states",
    category: "modern",
    difficulty: "intermediate",
    icon: <DollarSign className="h-5 w-5" />,
    states: ["Bull Market", "Bear Market", "Stable Market"],
    applications: ["Financial Analysis", "Risk Assessment", "Portfolio Management"],
    interactiveDemo: true,
  },
  {
    id: "dna-sequence",
    title: "DNA Sequence Analysis",
    description: "Modeling nucleotide sequences and gene prediction using Hidden Markov Models",
    category: "modern",
    difficulty: "advanced",
    icon: <Dna className="h-5 w-5" />,
    states: ["A (Adenine)", "T (Thymine)", "G (Guanine)", "C (Cytosine)"],
    applications: ["Bioinformatics", "Gene Prediction", "Evolutionary Biology"],
    interactiveDemo: false,
  },
  {
    id: "nlp-model",
    title: "Natural Language Processing",
    description: "Text generation and language modeling using word transition probabilities",
    category: "modern",
    difficulty: "advanced",
    icon: <MessageSquare className="h-5 w-5" />,
    states: ["Noun", "Verb", "Adjective", "Adverb", "Article"],
    applications: ["Chatbots", "Text Generation", "Language Translation"],
    interactiveDemo: false,
  },
]

export default function ExamplesPage() {
  const [selectedExample, setSelectedExample] = useState<Example | null>(null)
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [currentState, setCurrentState] = useState<string>("")
  const [simulationSteps, setSimulationSteps] = useState(0)

  const classicExamples = examples.filter((e) => e.category === "classic")
  const modernExamples = examples.filter((e) => e.category === "modern")

  const startSimulation = (example: Example) => {
    setSimulationRunning(true)
    setCurrentState(example.states[0])
    setSimulationSteps(0)
  }

  const stepSimulation = () => {
    if (!selectedExample) return
    // Simple random state transition for demo
    const randomIndex = Math.floor(Math.random() * selectedExample.states.length)
    setCurrentState(selectedExample.states[randomIndex])
    setSimulationSteps((prev) => prev + 1)
  }

  const resetSimulation = () => {
    setSimulationRunning(false)
    setCurrentState("")
    setSimulationSteps(0)
  }

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
                <Badge variant="secondary">Examples</Badge>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-bold">Real-World Examples</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Explore how Markov chains are used across different fields, from simple weather models to complex algorithms
            powering modern technology.
          </p>
        </div>

        <Tabs defaultValue="classic" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="classic">Classic Examples</TabsTrigger>
            <TabsTrigger value="modern">Modern Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="classic" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Classic Examples</h2>
              <p className="text-muted-foreground">
                Fundamental applications that demonstrate core Markov chain concepts
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {classicExamples.map((example) => (
                <Card
                  key={example.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedExample?.id === example.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedExample(example)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {example.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{example.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {example.difficulty}
                          </Badge>
                          {example.interactiveDemo && (
                            <Badge variant="secondary" className="text-xs">
                              Interactive
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{example.description}</CardDescription>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-2">States ({example.states.length})</h4>
                        <div className="flex flex-wrap gap-1">
                          {example.states.slice(0, 3).map((state) => (
                            <Badge key={state} variant="outline" className="text-xs">
                              {state}
                            </Badge>
                          ))}
                          {example.states.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{example.states.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Applications</h4>
                        <div className="flex flex-wrap gap-1">
                          {example.applications.slice(0, 2).map((app) => (
                            <Badge key={app} variant="secondary" className="text-xs">
                              {app}
                            </Badge>
                          ))}
                          {example.applications.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{example.applications.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="modern" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Modern Applications</h2>
              <p className="text-muted-foreground">Advanced applications in technology, finance, and data science</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {modernExamples.map((example) => (
                <Card
                  key={example.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedExample?.id === example.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedExample(example)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        {example.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{example.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {example.difficulty}
                          </Badge>
                          {example.interactiveDemo && (
                            <Badge variant="secondary" className="text-xs">
                              Interactive
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{example.description}</CardDescription>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-2">States ({example.states.length})</h4>
                        <div className="flex flex-wrap gap-1">
                          {example.states.slice(0, 3).map((state) => (
                            <Badge key={state} variant="outline" className="text-xs">
                              {state}
                            </Badge>
                          ))}
                          {example.states.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{example.states.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Applications</h4>
                        <div className="flex flex-wrap gap-1">
                          {example.applications.slice(0, 2).map((app) => (
                            <Badge key={app} variant="secondary" className="text-xs">
                              {app}
                            </Badge>
                          ))}
                          {example.applications.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{example.applications.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Detailed View */}
        {selectedExample && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    {selectedExample.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{selectedExample.title}</CardTitle>
                    <CardDescription>{selectedExample.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedExample.difficulty}</Badge>
                  <Badge variant={selectedExample.category === "classic" ? "secondary" : "default"}>
                    {selectedExample.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* State Visualization */}
              <div>
                <h3 className="text-lg font-semibold mb-4">State Space</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {selectedExample.states.map((state, index) => (
                    <div
                      key={state}
                      className={`
                        p-3 rounded-lg border-2 text-center transition-all
                        ${
                          currentState === state ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"
                        }
                      `}
                    >
                      <div className="text-sm font-medium">{state}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Demo */}
              {selectedExample.interactiveDemo && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Interactive Simulation</h3>
                  <Card className="p-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Button onClick={() => startSimulation(selectedExample)} disabled={simulationRunning} size="sm">
                          <Play className="mr-2 h-4 w-4" />
                          Start
                        </Button>
                        <Button onClick={stepSimulation} disabled={!simulationRunning} size="sm">
                          Step
                        </Button>
                        <Button onClick={resetSimulation} variant="outline" size="sm">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset
                        </Button>
                      </div>
                      {simulationRunning && (
                        <div className="text-sm text-muted-foreground">
                          Step: {simulationSteps} | Current: {currentState}
                        </div>
                      )}
                    </div>
                    {!simulationRunning && !currentState && (
                      <div className="text-center py-8 text-muted-foreground">
                        Click "Start" to begin the simulation
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Applications */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Real-World Applications</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {selectedExample.applications.map((application) => (
                    <Card key={application} className="p-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{application}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Case Study Link */}
              <div className="pt-4 border-t border-border">
                <Button className="w-full sm:w-auto">
                  View Detailed Case Study
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center space-y-4">
            <h3 className="text-xl font-semibold">Ready to Build Your Own?</h3>
            <p className="text-muted-foreground">
              Use our interactive chain builder to create and experiment with your own Markov chains
            </p>
            <Button asChild>
              <Link href="/tools">
                Try Chain Builder
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
