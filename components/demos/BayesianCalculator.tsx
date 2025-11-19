"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useTheme } from "next-themes"

export interface BayesianCalculatorProps {
  initialPrior?: number
  initialLikelihood?: number
  initialEvidence?: number
  height?: number
}

export default function BayesianCalculator({
  initialPrior = 0.5,
  initialLikelihood = 0.8,
  initialEvidence = 0.6,
  height = 500,
}: BayesianCalculatorProps) {
  const [prior, setPrior] = useState(initialPrior)
  const [likelihood, setLikelihood] = useState(initialLikelihood)
  const [evidence, setEvidence] = useState(initialEvidence)
  const [Recharts, setRecharts] = useState<any | null>(null)
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
    }
  }, [])

  // Calculate posterior probability using Bayes' theorem
  // P(A|B) = P(B|A) * P(A) / P(B)
  const posterior = useMemo(() => {
    if (evidence === 0) return 0
    return (likelihood * prior) / evidence
  }, [prior, likelihood, evidence])

  // Calculate normalized posterior (when evidence is computed from prior and likelihood)
  const normalizedPosterior = useMemo(() => {
    const totalEvidence = likelihood * prior + (1 - likelihood) * (1 - prior)
    if (totalEvidence === 0) return 0
    return (likelihood * prior) / totalEvidence
  }, [prior, likelihood])

  // Chart data for visualization
  const chartData = useMemo(() => {
    return [
      { name: "Prior P(A)", value: prior, type: "Prior" },
      { name: "Likelihood P(B|A)", value: likelihood, type: "Likelihood" },
      { name: "Evidence P(B)", value: evidence, type: "Evidence" },
      { name: "Posterior P(A|B)", value: posterior, type: "Posterior" },
      { name: "Normalized Posterior", value: normalizedPosterior, type: "Normalized" },
    ]
  }, [prior, likelihood, evidence, posterior, normalizedPosterior, theme, resolvedTheme])

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = Recharts || {}

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Bayesian Calculator</h3>
        <div className="text-xs text-muted-foreground">Bayes' Theorem: P(A|B) = P(B|A) × P(A) / P(B)</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Inputs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center justify-between">
              <span>Prior P(A)</span>
              <span className="font-mono text-xs text-muted-foreground">{prior.toFixed(3)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={prior}
              onChange={(e) => setPrior(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-muted-foreground">Probability of hypothesis A before observing evidence</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center justify-between">
              <span>Likelihood P(B|A)</span>
              <span className="font-mono text-xs text-muted-foreground">{likelihood.toFixed(3)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={likelihood}
              onChange={(e) => setLikelihood(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-muted-foreground">Probability of evidence B given hypothesis A</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center justify-between">
              <span>Evidence P(B)</span>
              <span className="font-mono text-xs text-muted-foreground">{evidence.toFixed(3)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={evidence}
              onChange={(e) => setEvidence(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-muted-foreground">Marginal probability of evidence B</div>
          </div>

          {/* Results */}
          <div className="bg-muted/30 rounded-md p-3 space-y-2 border border-border">
            <div className="text-xs font-semibold mb-2">Results</div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Posterior P(A|B):</span>
              <span className="font-mono font-bold text-primary">{posterior.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Normalized Posterior:</span>
              <span className="font-mono font-bold text-primary">{normalizedPosterior.toFixed(4)}</span>
            </div>
            <div className="pt-2 border-t border-border text-[10px] text-muted-foreground">
              Normalized uses: P(B) = P(B|A)×P(A) + P(B|¬A)×(1-P(A))
            </div>
          </div>

          {/* Example scenarios */}
          <div className="bg-muted/20 rounded-md p-3 border border-border">
            <div className="text-xs font-semibold mb-2">Quick Examples</div>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => {
                  setPrior(0.01)
                  setLikelihood(0.9)
                  setEvidence(0.1)
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-muted transition-colors"
              >
                Medical Test: Rare disease (1% prior)
              </button>
              <button
                onClick={() => {
                  setPrior(0.5)
                  setLikelihood(0.8)
                  setEvidence(0.5)
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-muted transition-colors"
              >
                Coin Flip: Fair coin, biased observation
              </button>
              <button
                onClick={() => {
                  setPrior(0.3)
                  setLikelihood(0.95)
                  setEvidence(0.4)
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-muted transition-colors"
              >
                Spam Filter: 30% spam rate
              </button>
            </div>
          </div>
        </div>

        {/* Right: Visualization */}
        <div className="space-y-3">
          {Recharts ? (
            <div className="bg-muted/20 rounded-lg p-3 border border-border" style={{ height: Math.max(300, height - 200) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 15, bottom: 25, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                  <XAxis
                    dataKey="name"
                    stroke="currentColor"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis domain={[0, 1]} stroke="currentColor" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                    formatter={(value: number) => value.toFixed(4)}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-muted/20 rounded-lg p-3 border border-border flex items-center justify-center" style={{ height: Math.max(300, height - 200) }}>
              <div className="text-sm text-muted-foreground">Loading chart...</div>
            </div>
          )}

          {/* Formula display */}
          <div className="bg-muted/20 rounded-md p-3 border border-border">
            <div className="text-xs font-semibold mb-2">Bayes' Theorem</div>
            <div className="text-xs font-mono space-y-1">
              <div>P(A|B) = P(B|A) × P(A) / P(B)</div>
              <div className="text-muted-foreground mt-2">
                = {likelihood.toFixed(3)} × {prior.toFixed(3)} / {evidence.toFixed(3)}
              </div>
              <div className="text-primary font-bold mt-1">
                = {posterior.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
