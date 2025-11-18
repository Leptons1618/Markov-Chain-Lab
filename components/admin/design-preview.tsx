"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface State {
  id: string
  name: string
  x: number
  y: number
  color: string
  isInitial?: boolean
  isFinal?: boolean
}

interface Transition {
  id: string
  from: string
  to: string
  probability: number
  label?: string
}

interface Design {
  states: State[]
  transitions: Transition[]
}

interface DesignPreviewProps {
  design: Design | null
  width?: number
  height?: number
}

export function DesignPreview({ design, width = 300, height = 200 }: DesignPreviewProps) {
  const scaledDesign = useMemo(() => {
    if (!design || !design.states || design.states.length === 0) {
      return null
    }

    // Find bounding box
    const xs = design.states.map((s) => s.x)
    const ys = design.states.map((s) => s.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    const designWidth = Math.max(10, maxX - minX)
    const designHeight = Math.max(10, maxY - minY)

    // Scale to fit preview
    const padding = 20
    const scaleX = (width - padding * 2) / designWidth
    const scaleY = (height - padding * 2) / designHeight
    const scale = Math.min(scaleX, scaleY, 1)

    const scaledWidth = designWidth * scale
    const scaledHeight = designHeight * scale
    const offsetX = (width - scaledWidth) / 2 - minX * scale
    const offsetY = (height - scaledHeight) / 2 - minY * scale

    return {
      states: design.states.map((state) => ({
        ...state,
        x: state.x * scale + offsetX,
        y: state.y * scale + offsetY,
      })),
      transitions: design.transitions,
    }
  }, [design, width, height])

  if (!scaledDesign) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            No design to preview
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="relative" style={{ width, height }}>
          <svg width={width} height={height} className="overflow-visible">
            {/* Draw transitions */}
            {scaledDesign.transitions.map((transition) => {
              const fromState = scaledDesign.states.find((s) => s.id === transition.from)
              const toState = scaledDesign.states.find((s) => s.id === transition.to)
              if (!fromState || !toState) return null

              const dx = toState.x - fromState.x
              const dy = toState.y - fromState.y
              const angle = Math.atan2(dy, dx)
              const radius = 20
              const startX = fromState.x + Math.cos(angle) * radius
              const startY = fromState.y + Math.sin(angle) * radius
              const endX = toState.x - Math.cos(angle) * radius
              const endY = toState.y - Math.sin(angle) * radius

              // Self-loop
              if (transition.from === transition.to) {
                const loopRadius = 30
                return (
                  <g key={transition.id}>
                    <path
                      d={`M ${fromState.x + radius} ${fromState.y} A ${loopRadius} ${loopRadius} 0 1 1 ${fromState.x - radius} ${fromState.y}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-muted-foreground"
                    />
                    {transition.label && (
                      <text
                        x={fromState.x}
                        y={fromState.y - loopRadius - 5}
                        textAnchor="middle"
                        className="text-xs fill-foreground"
                      >
                        {transition.label}
                      </text>
                    )}
                  </g>
                )
              }

              return (
                <g key={transition.id}>
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted-foreground"
                  />
                  {/* Arrow */}
                  <polygon
                    points={`${endX},${endY} ${endX - 8 * Math.cos(angle - Math.PI / 6)},${endY - 8 * Math.sin(angle - Math.PI / 6)} ${endX - 8 * Math.cos(angle + Math.PI / 6)},${endY - 8 * Math.sin(angle + Math.PI / 6)}`}
                    fill="currentColor"
                    className="text-muted-foreground"
                  />
                  {/* Label */}
                  {transition.label && (
                    <text
                      x={(startX + endX) / 2}
                      y={(startY + endY) / 2 - 5}
                      textAnchor="middle"
                      className="text-xs fill-foreground"
                    >
                      {transition.label}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Draw states */}
            {scaledDesign.states.map((state) => (
              <g key={state.id}>
                <circle
                  cx={state.x}
                  cy={state.y}
                  r="20"
                  fill={state.color || "#60a5fa"}
                  stroke={state.isInitial || state.isFinal ? "currentColor" : "none"}
                  strokeWidth={state.isInitial || state.isFinal ? "3" : "0"}
                  className={state.isInitial || state.isFinal ? "text-primary" : ""}
                />
                <text
                  x={state.x}
                  y={state.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium fill-white"
                >
                  {state.name.length > 8 ? state.name.substring(0, 6) + "..." : state.name}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className="mt-2 text-xs text-muted-foreground text-center">
          {scaledDesign.states.length} states, {scaledDesign.transitions.length} transitions
        </div>
      </CardContent>
    </Card>
  )
}
