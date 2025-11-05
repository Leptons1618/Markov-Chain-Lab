"use client"

import React, { useEffect, useRef, useState } from "react"

export interface FlipCardProps {
  intervalMs?: number // auto-flip interval; 0 to disable
  size?: number // px
}

export default function FlipCard({ intervalMs = 0, size = 96 }: FlipCardProps) {
  const [isHeads, setIsHeads] = useState(true)
  const [flipping, setFlipping] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!intervalMs) return
    timerRef.current = window.setInterval(() => triggerFlip(), intervalMs) as unknown as number
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [intervalMs])

  function triggerFlip() {
    if (flipping) return
    setFlipping(true)
    // Simple timed animation; after animation ends, toggle face
    window.setTimeout(() => {
      setIsHeads((h) => !h)
      setFlipping(false)
    }, 600)
  }

  const dimension = `${size}px`

  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative [transform-style:preserve-3d] transition-transform duration-500 ease-out select-none`}
        style={{ width: dimension, height: dimension, transform: flipping ? "rotateY(180deg)" : "rotateY(0deg)" }}
        aria-live="polite"
      >
        {/* Heads */}
        <div
          className="absolute inset-0 rounded-full bg-emerald-500 text-white flex items-center justify-center text-3xl font-bold [backface-visibility:hidden] shadow-lg"
          aria-hidden={!isHeads}
        >
          H
        </div>
        {/* Tails */}
        <div
          className="absolute inset-0 rounded-full bg-sky-500 text-white flex items-center justify-center text-3xl font-bold [backface-visibility:hidden] rotate-y-180 shadow-lg"
          aria-hidden={isHeads}
        >
          T
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-sm">{isHeads ? "Heads" : "Tails"}</div>
        <div className="flex gap-2">
          <button onClick={triggerFlip} className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground">Flip</button>
          <button
            onClick={() => {
              if (timerRef.current) {
                window.clearInterval(timerRef.current)
                timerRef.current = null
              }
            }}
            className="px-3 py-1.5 text-xs rounded-md border"
          >
            Stop Auto
          </button>
        </div>
      </div>
    </div>
  )
}
