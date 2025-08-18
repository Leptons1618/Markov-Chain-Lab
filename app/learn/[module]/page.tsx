"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, CheckCircle, Lightbulb, Calculator } from "lucide-react"
import Link from "next/link"

// Sample lesson content for foundations module
const lessonContent = {
  "probability-basics": {
    title: "Probability Refresher",
    description: "Review fundamental probability concepts essential for understanding Markov chains",
    content: [
      {
        type: "text",
        content: "Probability theory forms the foundation of Markov chains. Let's review the key concepts you'll need.",
      },
      {
        type: "definition",
        title: "Sample Space",
        content: "The set of all possible outcomes of an experiment, denoted as Ω (omega).",
      },
      {
        type: "formula",
        title: "Probability Axioms",
        content: "For any event A: 0 ≤ P(A) ≤ 1, P(Ω) = 1, and for disjoint events: P(A ∪ B) = P(A) + P(B)",
      },
      {
        type: "interactive",
        title: "Coin Flip Simulation",
        content: "Try flipping a virtual coin to see probability in action.",
      },
    ],
  },
}

export default function LessonPage({ params }: { params: { module: string } }) {
  const [currentSection, setCurrentSection] = useState(0)
  const lesson = lessonContent["probability-basics"] // Default lesson

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/learn" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back to Learn</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Progress value={25} className="w-32" />
              <span className="text-sm text-muted-foreground">1 of 4</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
        {/* Lesson Header */}
        <div className="space-y-4">
          <Badge variant="outline">Foundations</Badge>
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
          <p className="text-lg text-muted-foreground">{lesson.description}</p>
        </div>

        {/* Lesson Content */}
        <div className="space-y-8">
          {lesson.content.map((section, index) => (
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
                  <div className="bg-card border border-border p-4 rounded-lg font-mono text-center">
                    {section.content}
                  </div>
                </div>
              )}

              {section.type === "interactive" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  <p className="text-muted-foreground">{section.content}</p>
                  <Card className="p-6 bg-primary/5 border-primary/20">
                    <div className="text-center space-y-4">
                      <div className="text-6xl">🪙</div>
                      <div className="space-y-2">
                        <Button>Flip Coin</Button>
                        <p className="text-sm text-muted-foreground">Heads: 0 | Tails: 0 | Total: 0</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-border">
          <Button variant="outline" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span className="text-sm">Lesson Complete</span>
          </div>
          <Button>
            Next Lesson
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
