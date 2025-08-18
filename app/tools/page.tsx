"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Play, RotateCcw, Download, Upload, Trash2, ArrowRight } from "lucide-react"
import Link from "next/link"

interface State {
  id: string
  name: string
  x: number
  y: number
  color: string
}

interface Transition {
  id: string
  from: string
  to: string
  probability: number
}

interface MarkovChain {
  states: State[]
  transitions: Transition[]
}

const defaultColors = [
  "#059669", // primary
  "#10b981", // accent
  "#d97706", // chart-3
  "#be123c", // chart-4
  "#ec4899", // chart-5
]

export default function ToolsPage() {
  const [chain, setChain] = useState<MarkovChain>({ states: [], transitions: [] })
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [selectedTransition, setSelectedTransition] = useState<string | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationStep, setSimulationStep] = useState(0)
  const [currentState, setCurrentState] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const addState = useCallback(
    (x: number, y: number) => {
      const newState: State = {
        id: `state-${Date.now()}`,
        name: `S${chain.states.length + 1}`,
        x,
        y,
        color: defaultColors[chain.states.length % defaultColors.length],
      }
      setChain((prev) => ({ ...prev, states: [...prev.states, newState] }))
    },
    [chain.states.length],
  )

  const addTransition = useCallback(
    (fromId: string, toId: string) => {
      const existingTransition = chain.transitions.find((t) => t.from === fromId && t.to === toId)
      if (existingTransition) return

      const newTransition: Transition = {
        id: `transition-${Date.now()}`,
        from: fromId,
        to: toId,
        probability: 0.5,
      }
      setChain((prev) => ({ ...prev, transitions: [...prev.transitions, newTransition] }))
    },
    [chain.transitions],
  )

  const updateTransitionProbability = useCallback((transitionId: string, probability: number) => {
    setChain((prev) => ({
      ...prev,
      transitions: prev.transitions.map((t) => (t.id === transitionId ? { ...t, probability } : t)),
    }))
  }, [])

  const deleteState = useCallback((stateId: string) => {
    setChain((prev) => ({
      states: prev.states.filter((s) => s.id !== stateId),
      transitions: prev.transitions.filter((t) => t.from !== stateId && t.to !== stateId),
    }))
    setSelectedState(null)
  }, [])

  const deleteTransition = useCallback((transitionId: string) => {
    setChain((prev) => ({
      ...prev,
      transitions: prev.transitions.filter((t) => t.id !== transitionId),
    }))
    setSelectedTransition(null)
  }, [])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Check if clicking on existing state
      const clickedState = chain.states.find((state) => {
        const distance = Math.sqrt((state.x - x) ** 2 + (state.y - y) ** 2)
        return distance <= 30
      })

      if (clickedState) {
        if (selectedState && selectedState !== clickedState.id) {
          // Create transition between selected state and clicked state
          addTransition(selectedState, clickedState.id)
          setSelectedState(null)
        } else if (selectedState === clickedState.id) {
          addTransition(selectedState, clickedState.id)
          setSelectedState(null)
        } else {
          setSelectedState(clickedState.id)
        }
      } else {
        // Add new state
        addState(x, y)
        setSelectedState(null)
      }
    },
    [chain.states, selectedState, addState, addTransition],
  )

  const startSimulation = useCallback(() => {
    if (chain.states.length === 0) return

    setIsSimulating(true)
    setSimulationStep(0)
    setCurrentState(chain.states[0].id)
  }, [chain.states])

  const stepSimulation = useCallback(() => {
    if (!currentState) return

    const outgoingTransitions = chain.transitions.filter((t) => t.from === currentState)
    if (outgoingTransitions.length === 0) return

    // Simple random selection based on probabilities
    const random = Math.random()
    let cumulative = 0

    for (const transition of outgoingTransitions) {
      cumulative += transition.probability
      if (random <= cumulative) {
        setCurrentState(transition.to)
        break
      }
    }

    setSimulationStep((prev) => prev + 1)
  }, [currentState, chain.transitions])

  const resetSimulation = useCallback(() => {
    setIsSimulating(false)
    setSimulationStep(0)
    setCurrentState(null)
  }, [])

  const generateTransitionMatrix = useCallback(() => {
    if (chain.states.length === 0) return []

    const matrix = chain.states.map(() => chain.states.map(() => 0))

    chain.transitions.forEach((transition) => {
      const fromIndex = chain.states.findIndex((s) => s.id === transition.from)
      const toIndex = chain.states.findIndex((s) => s.id === transition.to)
      if (fromIndex !== -1 && toIndex !== -1) {
        matrix[fromIndex][toIndex] = transition.probability
      }
    })

    return matrix
  }, [chain])

  const transitionMatrix = generateTransitionMatrix()

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
                <Badge variant="secondary">Chain Builder</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-80 border-r border-border bg-card/50 p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Chain Builder</h2>
              <p className="text-sm text-muted-foreground">
                Create your own Markov chain by adding states and transitions
              </p>
            </div>

            <Tabs defaultValue="build" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="build">Build</TabsTrigger>
                <TabsTrigger value="simulate">Simulate</TabsTrigger>
                <TabsTrigger value="analyze">Analyze</TabsTrigger>
              </TabsList>

              <TabsContent value="build" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Instructions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>• Click on canvas to add states</p>
                    <p>• Click a state, then another to create transitions</p>
                    <p>• Use the properties panel to edit values</p>
                  </CardContent>
                </Card>

                {selectedState && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">State Properties</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="state-name">Name</Label>
                        <Input
                          id="state-name"
                          value={chain.states.find((s) => s.id === selectedState)?.name || ""}
                          onChange={(e) => {
                            setChain((prev) => ({
                              ...prev,
                              states: prev.states.map((s) =>
                                s.id === selectedState ? { ...s, name: e.target.value } : s,
                              ),
                            }))
                          }}
                        />
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => deleteState(selectedState)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete State
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {chain.transitions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Transitions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {chain.transitions.map((transition) => {
                        const fromState = chain.states.find((s) => s.id === transition.from)
                        const toState = chain.states.find((s) => s.id === transition.to)
                        return (
                          <div key={transition.id} className="flex items-center gap-2 text-sm">
                            <span>{fromState?.name}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span>{toState?.name}</span>
                            <Input
                              type="number"
                              min="0"
                              max="1"
                              step="0.1"
                              value={transition.probability}
                              onChange={(e) =>
                                updateTransitionProbability(transition.id, Number.parseFloat(e.target.value))
                              }
                              className="w-16 h-6 text-xs"
                            />
                            <Button variant="ghost" size="sm" onClick={() => deleteTransition(transition.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="simulate" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Simulation Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button onClick={startSimulation} disabled={chain.states.length === 0 || isSimulating} size="sm">
                        <Play className="mr-2 h-4 w-4" />
                        Start
                      </Button>
                      <Button onClick={stepSimulation} disabled={!isSimulating} size="sm">
                        Step
                      </Button>
                      <Button onClick={resetSimulation} variant="outline" size="sm">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                    </div>
                    {isSimulating && (
                      <div className="text-sm">
                        <p>Step: {simulationStep}</p>
                        <p>Current State: {chain.states.find((s) => s.id === currentState)?.name}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analyze" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Transition Matrix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transitionMatrix.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="text-xs border-collapse">
                          <thead>
                            <tr>
                              <th className="border border-border p-1"></th>
                              {chain.states.map((state) => (
                                <th key={state.id} className="border border-border p-1">
                                  {state.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {chain.states.map((state, i) => (
                              <tr key={state.id}>
                                <th className="border border-border p-1">{state.name}</th>
                                {transitionMatrix[i].map((prob, j) => (
                                  <td key={j} className="border border-border p-1 text-center">
                                    {prob.toFixed(2)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Add states and transitions to see matrix</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 relative">
          <div
            ref={canvasRef}
            className="w-full h-full bg-muted/10 cursor-crosshair relative overflow-hidden"
            onClick={handleCanvasClick}
          >
            {/* Grid Background */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
              }}
            />

            {/* Transitions */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {chain.transitions.map((transition) => {
                const fromState = chain.states.find((s) => s.id === transition.from)
                const toState = chain.states.find((s) => s.id === transition.to)
                if (!fromState || !toState) return null

                const isSelfLoop = fromState.id === toState.id

                if (isSelfLoop) {
                  const radius = 32 // State circle radius
                  const loopRadius = 25
                  const cx = fromState.x
                  const cy = fromState.y - radius - loopRadius
                  const startX = fromState.x - radius * 0.7
                  const startY = fromState.y - radius * 0.7
                  const endX = fromState.x + radius * 0.7
                  const endY = fromState.y - radius * 0.7

                  return (
                    <g key={transition.id}>
                      <path
                        d={`M ${startX} ${startY} Q ${cx - loopRadius} ${cy} ${cx} ${cy} Q ${cx + loopRadius} ${cy} ${endX} ${endY}`}
                        stroke="white"
                        strokeWidth="4"
                        fill="none"
                        opacity="0.8"
                      />
                      <path
                        d={`M ${startX} ${startY} Q ${cx - loopRadius} ${cy} ${cx} ${cy} Q ${cx + loopRadius} ${cy} ${endX} ${endY}`}
                        stroke="#059669"
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                      />
                      <text x={cx} y={cy - 8} textAnchor="middle" className="text-xs fill-foreground font-medium">
                        {transition.probability.toFixed(2)}
                      </text>
                    </g>
                  )
                }

                const radius = 32 // Half of state circle size (64px / 2)
                const dx = toState.x - fromState.x
                const dy = toState.y - fromState.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                // Calculate edge points
                const fromX = fromState.x + (dx / distance) * radius
                const fromY = fromState.y + (dy / distance) * radius
                const toX = toState.x - (dx / distance) * radius
                const toY = toState.y - (dy / distance) * radius

                return (
                  <g key={transition.id}>
                    <line x1={fromX} y1={fromY} x2={toX} y2={toY} stroke="white" strokeWidth="4" opacity="0.8" />
                    <line
                      x1={fromX}
                      y1={fromY}
                      x2={toX}
                      y2={toY}
                      stroke="#059669"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                    <text
                      x={(fromX + toX) / 2}
                      y={(fromY + toY) / 2 - 10}
                      textAnchor="middle"
                      className="text-xs fill-foreground font-medium"
                    >
                      {transition.probability.toFixed(2)}
                    </text>
                  </g>
                )
              })}

              {/* Arrow marker definition */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#059669" />
                </marker>
              </defs>
            </svg>

            {/* States */}
            {chain.states.map((state) => (
              <div
                key={state.id}
                className={`
                  absolute w-16 h-16 rounded-full border-2 flex items-center justify-center
                  text-sm font-medium cursor-pointer transition-all transform -translate-x-8 -translate-y-8
                  ${selectedState === state.id ? "ring-2 ring-primary ring-offset-2" : ""}
                  ${currentState === state.id ? "ring-2 ring-accent ring-offset-2 scale-110" : ""}
                `}
                style={{
                  left: state.x,
                  top: state.y,
                  backgroundColor: state.color + "20",
                  borderColor: state.color,
                  color: state.color,
                }}
              >
                {state.name}
              </div>
            ))}

            {/* Instructions overlay */}
            {chain.states.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Card className="p-6 text-center">
                  <CardContent>
                    <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Start Building Your Chain</h3>
                    <p className="text-muted-foreground">Click anywhere on the canvas to add your first state</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
