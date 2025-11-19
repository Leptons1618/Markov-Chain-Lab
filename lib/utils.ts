import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Estimate reading time for lesson content
 * Assumes average reading speed of 200 words per minute
 * Adds extra time for code blocks, formulas, and interactive elements
 */
export function estimateLessonTime(content: string): number {
  if (!content) return 5 // Default minimum
  
  // Count words (rough estimate)
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length
  
  // Base reading time (200 words per minute)
  let minutes = Math.ceil(wordCount / 200)
  
  // Add time for code blocks (count triple backticks)
  const codeBlocks = (content.match(/```/g) || []).length / 2
  minutes += codeBlocks * 2 // 2 minutes per code block
  
  // Add time for formulas (count $ signs)
  const formulas = (content.match(/\$/g) || []).length / 2
  minutes += Math.ceil(formulas * 0.5) // 30 seconds per formula
  
  // Add time for interactive elements
  if (content.includes('Interactive') || content.includes('Simulator')) {
    minutes += 3
  }
  
  // Minimum 5 minutes, round to nearest 5
  return Math.max(5, Math.round(minutes / 5) * 5)
}

/**
 * Format estimated time as a readable string
 */
export function formatEstimatedTime(minutes: number): string {
  if (minutes < 60) {
    return `~${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `~${hours} hr`
  }
  return `~${hours} hr ${mins} min`
}

/**
 * Get CSS variable value as a color string
 * Works with oklch() values and converts them for use in SVG/Canvas
 */
export function getCSSVariableColor(variableName: string): string {
  if (typeof window === "undefined") {
    // SSR fallback - return a default color
    return "#3b82f6"
  }
  
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim()
  
  if (!value) {
    return "#3b82f6" // fallback
  }
  
  // If it's already a valid color format, return it
  // For oklch values, they should work directly in modern browsers
  return value
}

/**
 * Get theme-aware chart colors
 */
export function getChartColors(): string[] {
  if (typeof window === "undefined") {
    return ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]
  }
  
  const colors = []
  for (let i = 1; i <= 5; i++) {
    const color = getCSSVariableColor(`--chart-${i}`)
    colors.push(color)
  }
  
  return colors.length > 0 ? colors : ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]
}

/**
 * Get theme-aware primary color
 */
export function getPrimaryColor(): string {
  return getCSSVariableColor("--primary")
}

/**
 * Get theme-aware accent color
 */
export function getAccentColor(): string {
  return getCSSVariableColor("--accent")
}

/**
 * Get theme-aware destructive color
 */
export function getDestructiveColor(): string {
  return getCSSVariableColor("--destructive")
}
