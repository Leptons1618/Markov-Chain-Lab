"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { useTheme } from "next-themes"

export interface InteractiveVisualizationProps {
  initialStates?: number
  height?: number
}

export default function InteractiveVisualization({
  initialStates = 3,
  height = 500,
}: InteractiveVisualizationProps) {
  const [numStates, setNumStates] = useState(initialStates)
  const [transitionMatrix, setTransitionMatrix] = useState<number[][]>([])
  const [currentState, setCurrentState] = useState(0)
  const [history, setHistory] = useState<number[]>([])
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(500)
  const [Recharts, setRecharts] = useState<any | null>(null)
  const timerRef = useRef<number | null>(null)
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    let mounted = true
    import("recharts")
      .then((mod) => mounted && setRecharts(mod))
      .catch(() => {
        // Chart library not available
      })
    return () => {
      mounted = false
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  // Initialize transition matrix
  useEffect(() => {
    const matrix: number[][] = []
    for (let i = 0; i < numStates; i++) {
      const row: number[] = []
      const remaining = 1.0
      for (let j = 0; j < numStates; j++) {
        if (j === numStates - 1) {
          row.push(remaining)
        } else {
          const val = remaining / (numStates - j)
          row.push(val)
        }
      }
      matrix.push(row)
    }
    setTransitionMatrix(matrix)
  }, [numStates])

  // Update matrix cell
  const updateMatrixCell = (row: number, col: number, value: number) => {
    const newMatrix = transitionMatrix.map((r, i) =>
      r.map((c, j) => {
        if (i === row && j === col) {
          return Math.max(0, Math.min(1, value))
        }
        return c
      })
    )
    // Normalize row to sum to 1
    const rowSum = newMatrix[row].reduce((sum, val) => sum + val, 0)
    if (rowSum > 0) {
      newMatrix[row] = newMatrix[row].map((val) => val / rowSum)
    }
    setTransitionMatrix(newMatrix)
  }

  // Simulate one step
  const step = () => {
    const row = transitionMatrix[currentState]
    if (!row || row.length === 0) return

    const rand = Math.random()
    let cumulative = 0
    let nextState = currentState

    for (let i = 0; i < row.length; i++) {
      cumulative += row[i]
      if (rand <= cumulative) {
        nextState = i
        break
      }
    }

    setCurrentState(nextState)
    setHistory((h) => [...h.slice(-49), nextState]) // Keep last 50 states
  }

  // Auto-run simulation
  useEffect(() => {
    if (running && transitionMatrix.length > 0) {
      timerRef.current = window.setInterval(step, speed) as unknown as number
    } else {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [running, speed, transitionMatrix, currentState])

  // Reset simulation
  const reset = () => {
    setRunning(false)
    setCurrentState(0)
    setHistory([])
  }

  // Calculate state visit frequencies
  const stateFrequencies = useMemo(() => {
    const freq: Record<number, number> = {}
    history.forEach((state) => {
      freq[state] = (freq[state] || 0) + 1
    })
    return freq
  }, [history, theme, resolvedTheme])

  // Chart data for history visualization
  const historyChartData = useMemo(() => {
    return history.map((state, index) => ({
      step: index,
      state,
    }))
  }, [history])

  // Chart data for state frequencies
  const frequencyChartData = useMemo(() => {
    return Array.from({ length: numStates }, (_, i) => ({
      state: `State ${i}`,
      frequency: stateFrequencies[i] || 0,
    }))
  }, [numStates, stateFrequencies])

  const { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts || {}

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Interactive Markov Chain Visualization</h3>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">States:</label>
          <input
            type="number"
            min="2"
            max="10"
            value={numStates}
            onChange={(e) => {
              const val = Math.max(2, Math.min(10, Number(e.target.value)))
              setNumStates(val)
              reset()
            }}
            className="w-16 px-2 py-1 text-xs rounded border border-border bg-background"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Transition Matrix */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Transition Matrix</div>
          <div className="bg-muted/20 rounded-md p-3 border border-border overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-1"></th>
                  {Array.from({ length: numStates }, (_, i) => (
                    <th key={i} className="text-center p-1 font-mono">
                      S{i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transitionMatrix.map((row, i) => (
                  <tr key={i}>
                    <td className="p-1 font-mono font-semibold">S{i}</td>
                    {row.map((val, j) => (
                      <td key={j} className="p-1">
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={val.toFixed(2)}
                          onChange={(e) => updateMatrixCell(i, j, Number(e.target.value))}
                          className="w-full px-1 py-0.5 text-xs rounded border border-border bg-background text-center font-mono"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Controls */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={step}
                disabled={running}
                className="flex-1 px-3 py-2 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Step
              </button>
              <button
                onClick={() => setRunning(!running)}
                className="flex-1 px-3 py-2 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
              >
                {running ? "Pause" : "Run"}
              </button>
              <button
                onClick={reset}
                className="px-3 py-2 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors"
              >
                Reset
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Speed: {speed}ms</label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Current State */}
          <div className="bg-muted/30 rounded-md p-3 border border-border">
            <div className="text-xs font-semibold mb-2">Current State</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-mono font-bold text-primary">S{currentState}</div>
              <div className="text-xs text-muted-foreground">Steps: {history.length}</div>
            </div>
          </div>
        </div>

        {/* Right: Visualizations */}
        <div className="space-y-3">
          {/* History Chart */}
          {Recharts && history.length > 0 && (
            <div className="bg-muted/20 rounded-lg p-3 border border-border" style={{ height: Math.max(200, (height - 200) / 2) }}>
              <div className="text-xs font-semibold mb-2">State History</div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyChartData} margin={{ top: 5, right: 15, bottom: 25, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                  <XAxis dataKey="step" stroke="currentColor" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, numStates - 1]} stroke="currentColor" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="state"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Frequency Chart */}
          {Recharts && history.length > 0 && (
            <div className="bg-muted/20 rounded-lg p-3 border border-border" style={{ height: Math.max(200, (height - 200) / 2) }}>
              <div className="text-xs font-semibold mb-2">State Visit Frequencies</div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencyChartData} margin={{ top: 5, right: 15, bottom: 25, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                  <XAxis dataKey="state" stroke="currentColor" tick={{ fontSize: 10 }} />
                  <YAxis stroke="currentColor" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="frequency" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {history.length === 0 && (
            <div className="bg-muted/20 rounded-lg p-3 border border-border flex items-center justify-center" style={{ height: Math.max(400, height - 100) }}>
              <div className="text-sm text-muted-foreground text-center">
                Click "Step" or "Run" to start simulation
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
