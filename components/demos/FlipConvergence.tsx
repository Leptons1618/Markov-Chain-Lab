"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

// Coin flip convergence demo
// - Simulates Bernoulli(p) trials and shows running mean converging to p
// - Uses lazy-loaded Recharts for the chart; pauses updates when offscreen/tab hidden
// - Keeps dataset capped to avoid memory bloat

export interface FlipConvergenceProps {
  p?: number // true probability of heads
  trials?: number // total trials to simulate
  updateIntervalMs?: number // interval between batches
  batch?: number // flips per tick
  maxPoints?: number // cap number of points kept for rendering
  height?: number
  autoStart?: boolean // auto-start on mount
}

export default function FlipConvergence({
  p = 0.5,
  trials = 2000,
  updateIntervalMs = 30,
  batch = 50,
  maxPoints = 800,
  height = 450,
  autoStart = false,
}: FlipConvergenceProps) {
  const [Recharts, setRecharts] = useState<any | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [simErr, setSimErr] = useState<string | null>(null)

  // State for simulation
  const [n, setN] = useState(0)
  const [heads, setHeads] = useState(0)
  const [running, setRunning] = useState(false)
  const dataRef = useRef<Array<{ n: number; pHat: number }>>([])
  const [tick, setTick] = useState(0)
  const timerRef = useRef<number | null>(null)
  const mountedRef = useRef(true)
  const [currentFace, setCurrentFace] = useState<"heads" | "tails">("heads")
  const [flipping, setFlipping] = useState(false)
  const [speed, setSpeed] = useState(updateIntervalMs)
  const [colorMode, setColorMode] = useState<"color" | "bw">("color")
  const flipTimeoutRef = useRef<number | null>(null)
  const isFlippingRef = useRef(false)
  
  // Refs to track current values for interval callbacks
  const nRef = useRef(0)
  const headsRef = useRef(0)

  // Lazy-load recharts on mount only when needed (client-only)
  useEffect(() => {
    let mounted = true
    import("recharts")
      .then((mod) => mounted && setRecharts(mod))
      .catch((e) => {
        console.warn("recharts failed to load", e)
        if (mounted) setLoadErr("Chart library not available")
      })
    return () => {
      mounted = false
    }
  }, [])

  // Pause when tab hidden to save CPU
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        if (timerRef.current) window.clearInterval(timerRef.current)
        timerRef.current = null
      } else if (!timerRef.current && running) {
        start()
      }
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [running])

  const stop = useCallback(() => {
    setRunning(false)
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const stepOnce = useCallback(() => {
    try {
      const P = Number.isFinite(p) ? Math.min(1, Math.max(0, Number(p))) : 0.5
      const TRIALS = Number.isFinite(trials as number) ? Math.max(1, Math.floor(Number(trials))) : 1
      const MAX = Number.isFinite(maxPoints as number) ? Math.max(50, Math.floor(Number(maxPoints))) : 800

      const currentN = nRef.current
      const currentHeads = headsRef.current

      if (currentN >= TRIALS) {
        stop()
        return
      }

      const isHeads = Math.random() < P
      const localN = currentN + 1
      const localHeads = currentHeads + (isHeads ? 1 : 0)

      // Update refs immediately
      nRef.current = localN
      headsRef.current = localHeads

      // Update state (batched)
      setN(localN)
      setHeads(localHeads)
      setCurrentFace(isHeads ? "heads" : "tails")

      // Update chart data with the correct values
      const pHat = localN > 0 ? localHeads / localN : 0
      
      if (Number.isFinite(pHat)) {
        let arr = dataRef.current
        const lengthDesc = Object.getOwnPropertyDescriptor(arr, "length")
        if (!Object.isExtensible(arr) || (lengthDesc && lengthDesc.writable === false) || Object.isFrozen(arr) || Object.isSealed(arr)) {
          arr = arr.slice()
          dataRef.current = arr
        }
        
        // Always add new point to show convergence over time
        arr.push({ n: localN, pHat })
        
        // Keep only recent points for performance, but preserve continuity
        if (arr.length > MAX * 1.2) {
          const keepRecent = Math.floor(MAX * 0.7)
          const decimateOlder = arr.length - keepRecent
          const newArr: typeof arr = []
          for (let i = 0; i < decimateOlder; i += 2) {
            newArr.push(arr[i])
          }
          for (let i = decimateOlder; i < arr.length; i++) {
            newArr.push(arr[i])
          }
          dataRef.current = newArr
        }
        setTick((t) => t + 1)
      }

      // Brief visual flip animation (non-blocking)
      if (!isFlippingRef.current) {
        if (flipTimeoutRef.current) window.clearTimeout(flipTimeoutRef.current)
        isFlippingRef.current = true
        setFlipping(true)
        flipTimeoutRef.current = window.setTimeout(() => {
          setFlipping(false)
          isFlippingRef.current = false
          flipTimeoutRef.current = null
        }, 50)
      }

      if (localN >= TRIALS) stop()
    } catch (e: any) {
      console.error("FlipConvergence stepOnce error:", e)
      setSimErr(e?.message || "Simulation error")
      stop()
    }
  }, [p, trials, maxPoints, stop])

  const start = useCallback(() => {
    if (timerRef.current) return
    setRunning(true)
    const interval = Number.isFinite(speed as number) ? Math.max(10, Math.floor(Number(speed))) : 30
    timerRef.current = window.setInterval(stepOnce, interval) as unknown as number
  }, [stepOnce, speed])

  const reset = useCallback(() => {
    stop()
    setN(0)
    setHeads(0)
    nRef.current = 0
    headsRef.current = 0
    dataRef.current = []
    setTick((t) => t + 1)
    setCurrentFace("heads")
  }, [stop])

  const flipOnce = useCallback(() => {
    if (n >= trials || flipping) return
    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current)
    setFlipping(true)
    const isHeads = Math.random() < p
    flipTimeoutRef.current = window.setTimeout(() => {
      setCurrentFace(isHeads ? "heads" : "tails")
      const localN = n + 1
      const localHeads = heads + (isHeads ? 1 : 0)
      
      // Update refs
      nRef.current = localN
      headsRef.current = localHeads
      
      setN(localN)
      setHeads(localHeads)
      const pHat = localN > 0 ? localHeads / localN : 0
      if (Number.isFinite(pHat)) {
        let arr = dataRef.current
        const lengthDesc = Object.getOwnPropertyDescriptor(arr, "length")
        if (!Object.isExtensible(arr) || (lengthDesc && lengthDesc.writable === false) || Object.isFrozen(arr) || Object.isSealed(arr)) {
          arr = arr.slice()
          dataRef.current = arr
        }
        arr.push({ n: localN, pHat })
        const MAX = Number.isFinite(maxPoints as number) ? Math.max(1, Math.floor(Number(maxPoints))) : 400
        if (arr.length > MAX + 20) {
          arr.splice(0, arr.length - MAX)
        }
        setTick((t) => t + 1)
      }
      setFlipping(false)
      flipTimeoutRef.current = null
    }, 200)
  }, [n, heads, p, trials, maxPoints, flipping])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (flipTimeoutRef.current) window.clearTimeout(flipTimeoutRef.current)
    }
  }, [])

  // ALWAYS call all hooks before any conditional returns (Rules of Hooks)
  const pHat = n > 0 ? heads / n : 0
  const chartData = useMemo(() => dataRef.current.slice(), [tick])

  // Now safe to return early after all hooks have been called
  if (loadErr || simErr) {
    return (
      <div className="rounded-md border border-border bg-card p-4">
        <div className="text-sm">{loadErr || simErr}</div>
        <div className="text-xs text-muted-foreground mt-1">Try again or ensure dependencies are installed.</div>
      </div>
    )
  }

  if (!Recharts) {
    return (
      <div className="rounded-md border border-border bg-card p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-40 bg-muted rounded" />
          <div className="h-24 w-full bg-muted rounded" />
        </div>
      </div>
    )
  }

  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } = Recharts

  const lineColor = colorMode === "color" ? "url(#colorGradient)" : "#1f2937"
  const coinHeadsColor = colorMode === "color" ? "from-yellow-400 to-orange-500" : "from-gray-700 to-gray-900"
  const coinTailsColor = colorMode === "color" ? "from-gray-300 to-gray-500" : "from-gray-500 to-gray-700"
  const refLineColor = colorMode === "color" ? "#8b5cf6" : "#6b7280"

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Coin Flip Convergence</h3>
        <button 
          onClick={() => setColorMode(m => m === "color" ? "bw" : "color")}
          className="px-2 py-1 text-xs rounded border border-border hover:bg-muted transition-colors flex items-center gap-1"
          title="Toggle color mode"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          {colorMode === "color" ? "Color" : "B&W"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Left: Coin & Controls */}
        <div className="space-y-3 min-w-0">
          {/* Coin Display */}
          <div className="flex flex-col items-center justify-center bg-muted/30 rounded-lg p-4 border border-border">
            <div 
              className={`w-28 h-28 rounded-full flex items-center justify-center shadow-lg transition-all duration-75 ${
                flipping ? "animate-spin" : ""
              }`}
              style={{ 
                boxShadow: "0 6px 12px rgba(0,0,0,0.3)",
                animationDuration: flipping ? "0.05s" : undefined
              }}
            >
              {flipping ? (
                <svg className="w-20 h-20 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="4 4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              ) : currentFace === "heads" ? (
                <svg className="w-24 h-24" viewBox="0 0 100 100">
                  <defs>
                    <radialGradient id="goldGrad" cx="40%" cy="40%">
                      <stop offset="0%" style={{ stopColor: colorMode === "color" ? "#fbbf24" : "#6b7280", stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: colorMode === "color" ? "#f59e0b" : "#4b5563", stopOpacity: 1 }} />
                    </radialGradient>
                  </defs>
                  <circle cx="50" cy="50" r="48" fill="url(#goldGrad)" stroke={colorMode === "color" ? "#d97706" : "#374151"} strokeWidth="2"/>
                  <circle cx="50" cy="50" r="42" fill="none" stroke={colorMode === "color" ? "#92400e" : "#1f2937"} strokeWidth="1" opacity="0.3"/>
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="32" fontWeight="bold" fill={colorMode === "color" ? "#92400e" : "#111827"}>H</text>
                </svg>
              ) : (
                <svg className="w-24 h-24" viewBox="0 0 100 100">
                  <defs>
                    <radialGradient id="silverGrad" cx="40%" cy="40%">
                      <stop offset="0%" style={{ stopColor: colorMode === "color" ? "#e5e7eb" : "#9ca3af", stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: colorMode === "color" ? "#9ca3af" : "#6b7280", stopOpacity: 1 }} />
                    </radialGradient>
                  </defs>
                  <circle cx="50" cy="50" r="48" fill="url(#silverGrad)" stroke={colorMode === "color" ? "#6b7280" : "#374151"} strokeWidth="2"/>
                  <circle cx="50" cy="50" r="42" fill="none" stroke={colorMode === "color" ? "#4b5563" : "#1f2937"} strokeWidth="1" opacity="0.3"/>
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="32" fontWeight="bold" fill={colorMode === "color" ? "#1f2937" : "#111827"}>T</text>
                </svg>
              )}
            </div>
            <div className="mt-2 text-xs font-medium">
              {flipping ? "Flipping..." : currentFace === "heads" ? "Heads" : "Tails"}
            </div>
          </div>

          {/* Flip Button */}
          <button 
            onClick={flipOnce}
            disabled={flipping || running || n >= trials}
            className="w-full px-3 py-2 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {flipping ? "Flipping..." : n >= trials ? "Complete" : "Flip Once"}
          </button>

          {/* Stats */}
          <div className="bg-muted/30 rounded-md p-3 space-y-1.5 text-xs border border-border">
            <div className="flex justify-between">
              <span>Flips:</span>
              <span className="font-mono font-semibold">{n}/{trials}</span>
            </div>
            <div className="flex justify-between">
              <span>Heads:</span>
              <span className="font-mono font-semibold">{heads}</span>
            </div>
            <div className="flex justify-between">
              <span>Tails:</span>
              <span className="font-mono font-semibold">{n - heads}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-border">
              <span>p̂:</span>
              <span className="font-mono font-bold">{pHat.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span>p:</span>
              <span className="font-mono font-bold">{p.toFixed(4)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground block">Speed: {speed}ms</label>
              <input 
                type="range" 
                min="50" 
                max="500" 
                step="50"
                value={speed}
                onChange={(e) => {
                  setSpeed(Number(e.target.value))
                  if (running) {
                    stop()
                    setTimeout(() => start(), 50)
                  }
                }}
                className="w-full h-2"
                style={{ maxWidth: '100%' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {running ? (
                <button onClick={stop} className="px-2 py-1.5 text-xs font-medium rounded border border-border hover:bg-muted transition-colors flex items-center justify-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                  Pause
                </button>
              ) : (
                <button onClick={start} disabled={n >= trials} className="px-2 py-1.5 text-xs font-medium rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  {n >= trials ? "Done" : "Start"}
                </button>
              )}
              <button onClick={reset} className="px-2 py-1.5 text-xs font-medium rounded border border-border hover:bg-muted transition-colors flex items-center justify-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Right: Chart & Model */}
        <div className="space-y-3 min-w-0 overflow-hidden">
          <div className="bg-muted/20 rounded-lg p-3 border border-border" style={{ height: Math.max(360, height) }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 15, bottom: 25, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                <XAxis 
                  dataKey="n" 
                  stroke="currentColor" 
                  tick={{ fontSize: 10 }} 
                  label={{ value: "Flips (n)", position: "insideBottom", offset: -15, fontSize: 10 }}
                />
                <YAxis 
                  domain={[0, 1]} 
                  stroke="currentColor" 
                  tick={{ fontSize: 10 }}
                  label={{ value: "p̂", angle: -90, position: "insideLeft", fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))", 
                    borderRadius: 6,
                    fontSize: 11
                  }}
                />
                <ReferenceLine 
                  y={p} 
                  stroke={refLineColor}
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ value: `p=${p}`, position: "right", fontSize: 10 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pHat" 
                  stroke={lineColor}
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false}
                />
                {colorMode === "color" && (
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Probability Model */}
          <div className="bg-muted/20 rounded-md p-3 border border-border">
            <div className="text-xs font-semibold mb-2 text-center">Bernoulli Model</div>
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="text-center">
                <div className="font-mono font-bold">H</div>
                <div className="text-muted-foreground">p={p.toFixed(2)}</div>
              </div>
              <div className="text-muted-foreground">|</div>
              <div className="text-center">
                <div className="font-mono font-bold">T</div>
                <div className="text-muted-foreground">p={(1-p).toFixed(2)}</div>
              </div>
            </div>
            <div className="text-[10px] text-center text-muted-foreground mt-2">
              Law of Large Numbers: p̂ → p as n → ∞
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
