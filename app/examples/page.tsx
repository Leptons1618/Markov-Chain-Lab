"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  BookOpen,
  Calculator,
  Link as LinkIcon,
  Sparkles,
  Zap,
  TrendingUp,
  ArrowRight,
  History,
  Code,
  Atom,
  Users,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { MainNav } from "@/components/main-nav"

interface Example {
  id: string
  title: string
  description: string
  category: "classic" | "modern"
  difficulty: "beginner" | "intermediate" | "advanced"
  icon?: React.ReactNode
  states: string[]
  applications: string[]
  interactiveDemo?: boolean
}

export default function ExamplesPage() {
  const [examples, setExamples] = useState<Example[]>([])
  const [selectedExample, setSelectedExample] = useState<Example | null>(null)
  const [hoveredExample, setHoveredExample] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load examples from API
  useEffect(() => {
    setLoading(true)
    fetch("/api/examples")
      .then(async (res) => {
        // Check if response is JSON
        const contentType = res.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Expected JSON but got ${contentType}`)
        }
        return res.json()
      })
      .then((data) => {
        if (data.success) {
          // Map API data to component format
          const mapped = (data.data || []).map((ex: any) => ({
            id: ex.id,
            title: ex.title,
            description: ex.description,
            category: ex.category,
            difficulty: ex.difficulty,
            icon: getIconForExample(ex.id),
            states: ex.design?.states?.map((s: any) => s.name) || [],
            applications: ex.applications || [],
            interactiveDemo: ex.interactiveDemo || false,
          }))
          setExamples(mapped)
        } else {
          console.error("API returned error:", data.error)
          setExamples([])
        }
      })
      .catch((err) => {
        console.error("Failed to load examples:", err)
        setExamples([])
      })
      .finally(() => setLoading(false))
  }, [])

  function getIconForExample(id: string) {
    const icons: Record<string, React.ReactNode> = {
      "pushkin-poetry": <BookOpen className="h-6 w-6" />,
      pagerank: <LinkIcon className="h-6 w-6" />,
      "text-generation": <Code className="h-6 w-6" />,
      "neutron-chain": <Atom className="h-6 w-6" />,
      "queue-system": <Users className="h-6 w-6" />,
    }
    return icons[id] || <Sparkles className="h-6 w-6" />
  }

  function getDifficultyColor(difficulty: string) {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
      case "intermediate":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
      case "advanced":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      default:
        return "bg-muted"
    }
  }

  const classicExamples = examples.filter((e) => e.category === "classic")
  const modernExamples = examples.filter((e) => e.category === "modern")

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <MainNav currentPath="/examples" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Interactive Examples</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Real-World Markov Chains
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore how Markov chains power everything from poetry analysis to web search. Each example connects to our courses and can be opened in the interactive Chain Builder.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="p-12">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading examples...</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && examples.length === 0 && (
          <Card className="p-12">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No Examples Available</h3>
                <p className="text-muted-foreground">
                  Examples are being added to showcase real-world Markov chain applications. Check back soon!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Classic Examples Section */}
        {!loading && classicExamples.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Classic Examples</h2>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
            <p className="text-muted-foreground mb-8 text-center max-w-2xl mx-auto">
              Fundamental applications that demonstrate core Markov chain concepts—from Markov's original 1906 analysis to queueing theory
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {classicExamples.map((example) => (
                <Card
                  key={example.id}
                  className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                    selectedExample?.id === example.id ? "ring-2 ring-primary shadow-lg" : ""
                  }`}
                  onMouseEnter={() => setHoveredExample(example.id)}
                  onMouseLeave={() => setHoveredExample(null)}
                >
                  {/* Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <CardHeader className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                          {example.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{example.title}</CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium ${getDifficultyColor(example.difficulty)}`}
                            >
                              {example.difficulty}
                            </Badge>
                            {example.interactiveDemo && (
                              <Badge variant="secondary" className="text-xs">
                                <Play className="h-3 w-3 mr-1" />
                                Interactive
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {example.states.length} states
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative space-y-4">
                    <CardDescription className="text-base leading-relaxed">
                      {example.description}
                    </CardDescription>

                    {/* Applications */}
                    {example.applications && example.applications.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          Applications
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {example.applications.map((app) => (
                            <Badge key={app} variant="secondary" className="text-xs">
                              {app}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-border/60">
                      <Button
                        asChild
                        className="flex-1 sm:flex-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/tools?example=${example.id}`}>
                          <Play className="mr-2 h-4 w-4" />
                          Open in Builder
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        asChild
                        className="flex-1 sm:flex-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/examples/${example.id}`}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Learn More
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Modern Examples Section */}
        {!loading && modernExamples.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Modern Applications</h2>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
            <p className="text-muted-foreground mb-8 text-center max-w-2xl mx-auto">
              Advanced applications in technology, AI, and data science—from Google's PageRank to nuclear physics simulations
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {modernExamples.map((example) => (
                <Card
                  key={example.id}
                  className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                    selectedExample?.id === example.id ? "ring-2 ring-primary shadow-lg" : ""
                  }`}
                  onMouseEnter={() => setHoveredExample(example.id)}
                  onMouseLeave={() => setHoveredExample(null)}
                >
                  {/* Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <CardHeader className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                          {example.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{example.title}</CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-xs font-medium ${getDifficultyColor(example.difficulty)}`}
                            >
                              {example.difficulty}
                            </Badge>
                            {example.interactiveDemo && (
                              <Badge variant="secondary" className="text-xs">
                                <Play className="h-3 w-3 mr-1" />
                                Interactive
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {example.states.length} states
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative space-y-4">
                    <CardDescription className="text-base leading-relaxed">
                      {example.description}
                    </CardDescription>

                    {/* Applications */}
                    {example.applications && example.applications.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          Applications
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {example.applications.map((app) => (
                            <Badge key={app} variant="secondary" className="text-xs">
                              {app}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-border/60">
                      <Button
                        asChild
                        className="flex-1 sm:flex-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/tools?example=${example.id}`}>
                          <Play className="mr-2 h-4 w-4" />
                          Open in Builder
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        asChild
                        className="flex-1 sm:flex-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/examples/${example.id}`}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Learn More
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        {!loading && examples.length > 0 && (
        <Card className="mt-16 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold">Ready to Build Your Own?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Use our interactive Chain Builder to create and experiment with your own Markov chains. Import examples, modify them, and discover new patterns.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/tools">
                  Try Chain Builder
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/learn">
                  Explore Courses
                  <BookOpen className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  )
}
