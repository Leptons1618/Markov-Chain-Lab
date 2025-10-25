"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Play, RotateCcw, Download, Upload, Trash2, ArrowRight } from "lucide-react"
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
  const [isPanning, setIsPanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  const CANVAS_WIDTH = 2000
  const CANVAS_HEIGHT = 1500
  const MAX_PAN_X = 200
  const MAX_PAN_Y = 200

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
      if (isPanning || isResizing) return

      if (!canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - panOffset.x - rect.width / 2 + CANVAS_WIDTH / 2
      const y = e.clientY - rect.top - panOffset.y - rect.height / 2 + CANVAS_HEIGHT / 2

      const clickedState = chain.states.find((state) => {
        const distance = Math.sqrt((state.x - x) ** 2 + (state.y - y) ** 2)
        return distance <= 30
      })

      if (clickedState) {
        if (selectedState && selectedState !== clickedState.id) {
          addTransition(selectedState, clickedState.id)
          setSelectedState(null)
        } else if (selectedState === clickedState.id) {
          addTransition(selectedState, clickedState.id)
          setSelectedState(null)
        } else {
          setSelectedState(clickedState.id)
        }
      } else {
        const boundedX = Math.max(50, Math.min(CANVAS_WIDTH - 50, x))
        const boundedY = Math.max(50, Math.min(CANVAS_HEIGHT - 50, y))
        addState(boundedX, boundedY)
        setSelectedState(null)
      }
    },
    [chain.states, selectedState, addState, addTransition, isPanning, isResizing, panOffset],
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

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {
      e.preventDefault()
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPanning) {
        e.preventDefault()
        const deltaX = e.clientX - lastPanPoint.x
        const deltaY = e.clientY - lastPanPoint.y
        setPanOffset((prev) => ({
          x: Math.max(-MAX_PAN_X, Math.min(MAX_PAN_X, prev.x + deltaX)),
          y: Math.max(-MAX_PAN_Y, Math.min(MAX_PAN_Y, prev.y + deltaY)),
        }))
        setLastPanPoint({ x: e.clientX, y: e.clientY })
      }
    },
    [isPanning, lastPanPoint],
  )

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {
      setIsPanning(false)
    }
  }, [])

  const handleSidebarResize = useCallback(
    (e: React.MouseEvent) => {
      setIsResizing(true)
      const startX = e.clientX
      const startWidth = sidebarWidth

      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = Math.max(280, Math.min(600, startWidth + (e.clientX - startX)))
        setSidebarWidth(newWidth)
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [sidebarWidth],
  )

  return (
    <div className="min-h-screen bg-background">
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
              <Link href="/tools" className="text-foreground font-medium transition-colors">
                Tools
              </Link>
              <Link href="/examples" className="text-muted-foreground hover:text-foreground transition-colors">
                Examples
              </Link>
              <Link href="/practice" className="text-muted-foreground hover:text-foreground transition-colors">
                Practice
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
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
        <aside
          className="border-r border-border bg-card/50 p-6 overflow-y-auto relative"
          style={{ width: `${sidebarWidth}px` }}
        >
          <div
            className="absolute right-0 top-0 w-1 h-full cursor-col-resize bg-border hover:bg-primary/20 transition-colors"
            onMouseDown={handleSidebarResize}
          />

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

        <main className="flex-1 relative">
          <div
            ref={canvasRef}
            className={`w-full h-full bg-muted/10 relative overflow-hidden ${isPanning ? "cursor-grabbing" : "cursor-crosshair"}`}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: -CANVAS_WIDTH / 2,
                marginTop: -CANVAS_HEIGHT / 2,
              }}
            >
              <div className="absolute inset-0 border-2 border-dashed border-border/30 rounded-lg" />

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

              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {chain.transitions.map((transition) => {
                  const fromState = chain.states.find((s) => s.id === transition.from)
                  const toState = chain.states.find((s) => s.id === transition.to)
                  if (!fromState || !toState) return null

                  const isSelfLoop = fromState.id === toState.id

                  if (isSelfLoop) {
                    const radius = 32
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

                  // Determine if there is a reverse transition so we can draw distinct curved paths
                  const reverseTransition = chain.transitions.find(
                    (t) => t.from === transition.to && t.to === transition.from,
                  )
                  const isBidirectional = !!reverseTransition

                  const radius = 32
                  const dx = toState.x - fromState.x
                  const dy = toState.y - fromState.y
                  const distance = Math.sqrt(dx * dx + dy * dy)

                  const fromX = fromState.x + (dx / distance) * radius
                  const fromY = fromState.y + (dy / distance) * radius
                  const toX = toState.x - (dx / distance) * radius
                  const toY = toState.y - (dy / distance) * radius

                  if (isBidirectional) {
                    // Compute a canonical orientation for the pair to derive a stable perpendicular.
                    const canonicalFrom = fromState.id < toState.id ? fromState : toState
                    const canonicalTo = canonicalFrom.id === fromState.id ? toState : fromState
                    const baseDx = canonicalTo.x - canonicalFrom.x
                    const baseDy = canonicalTo.y - canonicalFrom.y
                    const baseDist = Math.sqrt(baseDx * baseDx + baseDy * baseDy) || 1
                    const perpXUnit = -baseDy / baseDist
                    const perpYUnit = baseDx / baseDist

                    // Current direction sign relative to canonical orientation
                    const sign = transition.from === canonicalFrom.id ? 1 : -1

                    const midX = (fromX + toX) / 2
                    const midY = (fromY + toY) / 2

                    const CURVE_OFFSET = 60
                    const ENDPOINT_OFFSET = 12

                    const adjFromX = fromX + perpXUnit * ENDPOINT_OFFSET * sign
                    const adjFromY = fromY + perpYUnit * ENDPOINT_OFFSET * sign
                    const adjToX = toX + perpXUnit * ENDPOINT_OFFSET * sign
                    const adjToY = toY + perpYUnit * ENDPOINT_OFFSET * sign

                    const controlX = midX + perpXUnit * CURVE_OFFSET * sign
                    const controlY = midY + perpYUnit * CURVE_OFFSET * sign

                    const pathData = `M ${adjFromX} ${adjFromY} Q ${controlX} ${controlY} ${adjToX} ${adjToY}`

                    const labelX = controlX + perpXUnit * 10 * sign
                    const labelY = controlY + perpYUnit * 10 * sign - 4

                    return (
                      <g key={transition.id}>
                        <path d={pathData} stroke="white" strokeWidth="5" fill="none" opacity="0.92" />
                        <path
                          d={pathData}
                          stroke="#059669"
                          strokeWidth="2.25"
                          fill="none"
                          markerEnd="url(#arrowhead)"
                        />
                        <text x={labelX} y={labelY} textAnchor="middle" className="text-xs fill-foreground font-medium select-none">
                          {transition.probability.toFixed(2)}
                        </text>
                      </g>
                    )
                  } else {
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
                          opacity="1"
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
                  }
                })}

                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#059669" />
                  </marker>
                </defs>
              </svg>

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

              {chain.states.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Card className="p-6 text-center">
                    <CardContent>
                      <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Start Building Your Chain</h3>
                      <p className="text-muted-foreground">Click anywhere on the canvas to add your first state</p>
                      <p className="text-muted-foreground text-xs mt-2">Middle-click and drag to pan the canvas</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
