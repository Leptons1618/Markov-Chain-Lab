"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Copy, Check } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function PreviewPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const lessonId = params.lessonId as string
  const [copied, setCopied] = useState(false)

  const previewUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/learn/${courseId}?lesson=${lessonId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(previewUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lessonContent = `# What is a Markov Chain?

A Markov chain is a stochastic model describing a sequence of possible events in which the probability of each event depends only on the state attained in the previous event.

## Key Properties

1. **Memoryless Property**: The future state depends only on the current state, not on the sequence of events that preceded it.
2. **State Space**: The set of all possible states the system can be in.
3. **Transition Probabilities**: The probability of moving from one state to another.

## Mathematical Definition

A Markov chain is defined by:
- A finite set of states S = {s₁, s₂, ..., sₙ}
- A transition matrix P where P(i,j) represents the probability of transitioning from state i to state j
- An initial state distribution

## Example: Weather Model

Consider a simple weather model with two states:
- Sunny (S)
- Rainy (R)

The transition probabilities might be:
- P(S→S) = 0.7 (70% chance sunny day follows sunny day)
- P(S→R) = 0.3 (30% chance rainy day follows sunny day)
- P(R→S) = 0.4 (40% chance sunny day follows rainy day)
- P(R→R) = 0.6 (60% chance rainy day follows rainy day)`

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href={`/admin/courses/${courseId}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-semibold">Back to Course</span>
            </Link>
            <div className="flex gap-2">
              <Button onClick={handleCopyLink} variant="outline" className="cursor-pointer bg-transparent">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
              <Link href={previewUrl} target="_blank">
                <Button className="cursor-pointer">View Live</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <h1>What is a Markov Chain?</h1>
            <p>
              A Markov chain is a stochastic model describing a sequence of possible events in which the probability of
              each event depends only on the state attained in the previous event.
            </p>

            <h2>Key Properties</h2>
            <ol>
              <li>
                <strong>Memoryless Property</strong>: The future state depends only on the current state, not on the
                sequence of events that preceded it.
              </li>
              <li>
                <strong>State Space</strong>: The set of all possible states the system can be in.
              </li>
              <li>
                <strong>Transition Probabilities</strong>: The probability of moving from one state to another.
              </li>
            </ol>

            <h2>Mathematical Definition</h2>
            <p>A Markov chain is defined by:</p>
            <ul>
              <li>A finite set of states S = {"{s₁, s₂, ..., sₙ}"}</li>
              <li>
                A transition matrix P where P(i,j) represents the probability of transitioning from state i to state j
              </li>
              <li>An initial state distribution</li>
            </ul>

            <h2>Example: Weather Model</h2>
            <p>
              Consider a simple weather model with two states:
              <br />- Sunny (S)
              <br />- Rainy (R)
            </p>
            <p>The transition probabilities might be:</p>
            <ul>
              <li>P(S→S) = 0.7 (70% chance sunny day follows sunny day)</li>
              <li>P(S→R) = 0.3 (30% chance rainy day follows sunny day)</li>
              <li>P(R→S) = 0.4 (40% chance sunny day follows rainy day)</li>
              <li>P(R→R) = 0.6 (60% chance rainy day follows rainy day)</li>
            </ul>
          </div>
        </Card>

        {/* Sharing Section */}
        <Card className="mt-8 p-6">
          <h3 className="font-semibold mb-4">Share This Lesson</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Preview URL</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={previewUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-muted text-sm font-mono"
                />
                <Button onClick={handleCopyLink} variant="outline" className="cursor-pointer bg-transparent">
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Embed Code</p>
              <textarea
                readOnly
                value={`<iframe src="${previewUrl}" width="100%" height="600" frameborder="0"></iframe>`}
                className="w-full px-3 py-2 border border-border rounded-md bg-muted text-sm font-mono"
                rows={3}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
