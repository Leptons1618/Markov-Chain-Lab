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
