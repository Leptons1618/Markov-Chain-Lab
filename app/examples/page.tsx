"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
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

export default function ExamplesPage() {
  const [examples, setExamples] = useState<Example[]>([])
  const [selectedExample, setSelectedExample] = useState<Example | null>(null)
  
  // Load examples from API
  useEffect(() => {
    fetch("/api/examples")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Map API data to component format
          const mapped = data.data.map((ex: any) => ({
            id: ex.id,
            title: ex.title,
            description: ex.description,
            category: ex.category,
            difficulty: ex.difficulty,
            icon: getIconForExample(ex.id),
            states: ex.design.states.map((s: any) => s.name),
            applications: ex.applications,
            interactiveDemo: ex.interactiveDemo,
          }))
          setExamples(mapped)
        }
      })
      .catch(err => console.error("Failed to load examples:", err))
  }, [])
  
  function getIconForExample(id: string) {
    const icons: Record<string, React.ReactNode> = {
      weather: <Cloud className="h-5 w-5" />,
      "random-walk": <TrendingUp className="h-5 w-5" />,
      monopoly: <Gamepad2 className="h-5 w-5" />,
      "queue-system": <Users className="h-5 w-5" />,
      pagerank: <Search className="h-5 w-5" />,
      "stock-model": <DollarSign className="h-5 w-5" />,
      "dna-sequence": <Dna className="h-5 w-5" />,
      "nlp-model": <MessageSquare className="h-5 w-5" />,
    }
    return icons[id] || <BarChart3 className="h-5 w-5" />
  }

  const classicExamples = examples.filter((e) => e.category === "classic")
  const modernExamples = examples.filter((e) => e.category === "modern")

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
            <div className="hidden md:flex items-center gap-6">
              <Link href="/learn" className="text-muted-foreground hover:text-foreground transition-colors">
                Learn
              </Link>
              <Link href="/tools" className="text-muted-foreground hover:text-foreground transition-colors">
                Tools
              </Link>
              <Link href="/examples" className="text-foreground font-medium transition-colors">
                Examples
              </Link>
              <Link href="/practice" className="text-muted-foreground hover:text-foreground transition-colors">
                Practice
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
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
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    View this example in the Chain Builder to see the full state diagram and run simulations.
                  </p>
                  <Button asChild>
                    <Link href={`/tools?example=${selectedExample.id}`}>
                      Open in Chain Builder
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

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

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border flex gap-3">
                <Button asChild className="flex-1 sm:flex-initial">
                  <Link href={`/tools?example=${selectedExample.id}`}>
                    View in Chain Builder
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="flex-1 sm:flex-initial">
                  View Case Study
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
