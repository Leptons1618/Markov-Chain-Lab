"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useTheme } from "next-themes"

export interface PMFPDFExplorerProps {
  distribution?: "binomial" | "poisson" | "normal" | "exponential" | "uniform"
  height?: number
}

type DistributionType = "binomial" | "poisson" | "normal" | "exponential" | "uniform"

export default function PMFPDFExplorer({
  distribution: initialDistribution = "binomial",
  height = 500,
}: PMFPDFExplorerProps) {
  const [distType, setDistType] = useState<DistributionType>(initialDistribution)
  const [Recharts, setRecharts] = useState<any | null>(null)
  const { theme, resolvedTheme } = useTheme()

  // Parameters for different distributions
  const [n, setN] = useState(20) // Binomial: number of trials
  const [p, setP] = useState(0.5) // Binomial: success probability
  const [lambda, setLambda] = useState(5) // Poisson: rate parameter
  const [mu, setMu] = useState(0) // Normal: mean
  const [sigma, setSigma] = useState(1) // Normal: standard deviation
  const [rate, setRate] = useState(1) // Exponential: rate parameter
  const [a, setA] = useState(0) // Uniform: lower bound
  const [b, setB] = useState(1) // Uniform: upper bound

  useEffect(() => {
    let mounted = true
    import("recharts")
      .then((mod) => mounted && setRecharts(mod))
      .catch(() => {
        // Chart library not available
      })
    return () => {
      mounted = false
    }
  }, [])

  // Calculate PMF/PDF values - recalculate when theme changes
  const chartData = useMemo(() => {
    const data: Array<{ x: number; y: number; label?: string }> = []

    if (distType === "binomial") {
      // PMF: P(X=k) = C(n,k) * p^k * (1-p)^(n-k)
      for (let k = 0; k <= n; k++) {
        const prob = binomialPMF(k, n, p)
        data.push({ x: k, y: prob, label: `k=${k}` })
      }
    } else if (distType === "poisson") {
      // PMF: P(X=k) = (λ^k * e^(-λ)) / k!
      const maxK = Math.min(30, Math.ceil(lambda * 3))
      for (let k = 0; k <= maxK; k++) {
        const prob = poissonPMF(k, lambda)
        data.push({ x: k, y: prob, label: `k=${k}` })
      }
    } else if (distType === "normal") {
      // PDF: f(x) = (1/(σ√(2π))) * e^(-0.5*((x-μ)/σ)²)
      const range = 4 * sigma
      const start = mu - range
      const end = mu + range
      const steps = 100
      for (let i = 0; i <= steps; i++) {
        const x = start + (end - start) * (i / steps)
        const prob = normalPDF(x, mu, sigma)
        data.push({ x, y: prob })
      }
    } else if (distType === "exponential") {
      // PDF: f(x) = λ * e^(-λx) for x >= 0
      const maxX = Math.max(10, 5 / rate)
      const steps = 100
      for (let i = 0; i <= steps; i++) {
        const x = (maxX * i) / steps
        const prob = exponentialPDF(x, rate)
        data.push({ x, y: prob })
      }
    } else if (distType === "uniform") {
      // PDF: f(x) = 1/(b-a) for a <= x <= b, 0 otherwise
      const steps = 100
      const range = b - a
      for (let i = 0; i <= steps; i++) {
        const x = a + (range * i) / steps
        const prob = x >= a && x <= b ? 1 / range : 0
        data.push({ x, y: prob })
      }
    }

    return data
  }, [distType, n, p, lambda, mu, sigma, rate, a, b, theme, resolvedTheme])

  // Helper functions for PMF/PDF calculations
  function factorial(n: number): number {
    if (n <= 1) return 1
    let result = 1
    for (let i = 2; i <= n; i++) {
      result *= i
    }
    return result
  }

  function binomialPMF(k: number, n: number, p: number): number {
    if (k < 0 || k > n) return 0
    const coeff = factorial(n) / (factorial(k) * factorial(n - k))
    return coeff * Math.pow(p, k) * Math.pow(1 - p, n - k)
  }

  function poissonPMF(k: number, lambda: number): number {
    if (k < 0) return 0
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k)
  }

  function normalPDF(x: number, mu: number, sigma: number): number {
    const variance = sigma * sigma
    const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI))
    const exponent = -0.5 * Math.pow((x - mu) / sigma, 2)
    return coefficient * Math.exp(exponent)
  }

  function exponentialPDF(x: number, rate: number): number {
    if (x < 0) return 0
    return rate * Math.exp(-rate * x)
  }

  // Calculate statistics
  const stats = useMemo(() => {
    if (distType === "binomial") {
      return {
        mean: n * p,
        variance: n * p * (1 - p),
        mode: Math.floor((n + 1) * p),
      }
    } else if (distType === "poisson") {
      return {
        mean: lambda,
        variance: lambda,
        mode: Math.floor(lambda),
      }
    } else if (distType === "normal") {
      return {
        mean: mu,
        variance: sigma * sigma,
        mode: mu,
      }
    } else if (distType === "exponential") {
      return {
        mean: 1 / rate,
        variance: 1 / (rate * rate),
        mode: 0,
      }
    } else if (distType === "uniform") {
      return {
        mean: (a + b) / 2,
        variance: Math.pow(b - a, 2) / 12,
        mode: "any value in [a, b]",
      }
    }
    return { mean: 0, variance: 0, mode: 0 }
  }, [distType, n, p, lambda, mu, sigma, rate, a, b, theme, resolvedTheme])

  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } = Recharts || {}

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">PMF/PDF Explorer</h3>
        <select
          value={distType}
          onChange={(e) => setDistType(e.target.value as DistributionType)}
          className="text-xs px-2 py-1 rounded border border-border bg-background"
        >
          <option value="binomial">Binomial</option>
          <option value="poisson">Poisson</option>
          <option value="normal">Normal</option>
          <option value="exponential">Exponential</option>
          <option value="uniform">Uniform</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Left: Parameters */}
        <div className="space-y-3">
          {distType === "binomial" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-between">
                  <span>n (trials)</span>
                  <span className="font-mono text-xs text-muted-foreground">{n}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={n}
                  onChange={(e) => setN(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-between">
                  <span>p (success prob)</span>
                  <span className="font-mono text-xs text-muted-foreground">{p.toFixed(3)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={p}
                  onChange={(e) => setP(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </>
          )}

          {distType === "poisson" && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between">
                <span>λ (rate)</span>
                <span className="font-mono text-xs text-muted-foreground">{lambda.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.1"
                value={lambda}
                onChange={(e) => setLambda(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {distType === "normal" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-between">
                  <span>μ (mean)</span>
                  <span className="font-mono text-xs text-muted-foreground">{mu.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={mu}
                  onChange={(e) => setMu(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-between">
                  <span>σ (std dev)</span>
                  <span className="font-mono text-xs text-muted-foreground">{sigma.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={sigma}
                  onChange={(e) => setSigma(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </>
          )}

          {distType === "exponential" && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between">
                <span>λ (rate)</span>
                <span className="font-mono text-xs text-muted-foreground">{rate.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {distType === "uniform" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-between">
                  <span>a (lower)</span>
                  <span className="font-mono text-xs text-muted-foreground">{a.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={a}
                  onChange={(e) => {
                    const newA = Number(e.target.value)
                    setA(newA)
                    if (newA >= b) setB(newA + 0.1)
                  }}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-between">
                  <span>b (upper)</span>
                  <span className="font-mono text-xs text-muted-foreground">{b.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={b}
                  onChange={(e) => {
                    const newB = Number(e.target.value)
                    setB(newB)
                    if (newB <= a) setA(newB - 0.1)
                  }}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </>
          )}

          {/* Statistics */}
          <div className="bg-muted/30 rounded-md p-3 space-y-1.5 border border-border">
            <div className="text-xs font-semibold mb-2">Statistics</div>
            <div className="flex justify-between text-xs">
              <span>Mean:</span>
              <span className="font-mono font-semibold">{typeof stats.mean === "number" ? stats.mean.toFixed(3) : stats.mean}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Variance:</span>
              <span className="font-mono font-semibold">{typeof stats.variance === "number" ? stats.variance.toFixed(3) : stats.variance}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Mode:</span>
              <span className="font-mono font-semibold">{typeof stats.mode === "number" ? stats.mode.toFixed(3) : stats.mode}</span>
            </div>
          </div>
        </div>

        {/* Right: Chart */}
        <div className="space-y-3">
          {Recharts ? (
            <div className="bg-muted/20 rounded-lg p-3 border border-border" style={{ height: Math.max(350, height - 150) }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 15, bottom: 25, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                  <XAxis
                    dataKey="x"
                    stroke="currentColor"
                    tick={{ fontSize: 10 }}
                    label={{ value: distType === "binomial" || distType === "poisson" ? "k" : "x", position: "insideBottom", offset: -15, fontSize: 10 }}
                  />
                  <YAxis
                    stroke="currentColor"
                    tick={{ fontSize: 10 }}
                    label={{ value: distType === "normal" || distType === "exponential" || distType === "uniform" ? "f(x)" : "P(X=k)", angle: -90, position: "insideLeft", fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                    formatter={(value: number) => value.toFixed(6)}
                  />
                  {distType === "normal" && (
                    <ReferenceLine x={mu} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeWidth={1.5} />
                  )}
                  <Line
                    type={distType === "binomial" || distType === "poisson" ? "monotone" : "monotone"}
                    dataKey="y"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={distType === "binomial" || distType === "poisson" ? { r: 3 } : false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-muted/20 rounded-lg p-3 border border-border flex items-center justify-center" style={{ height: Math.max(350, height - 150) }}>
              <div className="text-sm text-muted-foreground">Loading chart...</div>
            </div>
          )}

          {/* Formula */}
          <div className="bg-muted/20 rounded-md p-3 border border-border">
            <div className="text-xs font-semibold mb-2">
              {distType === "binomial" || distType === "poisson" ? "PMF" : "PDF"} Formula
            </div>
            <div className="text-xs font-mono space-y-1">
              {distType === "binomial" && (
                <div>P(X=k) = C(n,k) × p^k × (1-p)^(n-k)</div>
              )}
              {distType === "poisson" && (
                <div>P(X=k) = (λ^k × e^(-λ)) / k!</div>
              )}
              {distType === "normal" && (
                <div>f(x) = (1/(σ√(2π))) × e^(-0.5×((x-μ)/σ)²)</div>
              )}
              {distType === "exponential" && (
                <div>f(x) = λ × e^(-λx), x ≥ 0</div>
              )}
              {distType === "uniform" && (
                <div>f(x) = 1/(b-a), a ≤ x ≤ b</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
