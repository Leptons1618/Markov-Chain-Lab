import type React from "react"

export interface Course {
  id: string
  title: string
  description: string
  slug: string
  lessons: number
  status: "draft" | "published"
  createdAt: Date
  updatedAt: Date
}

export interface Lesson {
  id: string
  courseId: string
  title: string
  description: string
  content: string
  status: "draft" | "published"
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface LessonContent {
  type: "text" | "definition" | "formula" | "interactive"
  title?: string
  content: string | React.ReactNode
}

// Fetch all courses from LMS API
export async function fetchCourses(): Promise<Course[]> {
  try {
    const response = await fetch("/api/admin/courses", { cache: "no-store" })
    const data = await response.json()
    return data.success ? data.data : []
  } catch (error) {
    console.error("Failed to fetch courses:", error)
    return []
  }
}

// Fetch single course by ID
export async function fetchCourse(courseId: string): Promise<Course | null> {
  try {
    const response = await fetch(`/api/admin/courses/${courseId}`, { cache: "no-store" })
    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error("Failed to fetch course:", error)
    return null
  }
}

// Fetch lessons for a course
export async function fetchLessonsByCourse(courseId: string): Promise<Lesson[]> {
  try {
    const response = await fetch(`/api/admin/lessons?courseId=${courseId}`, { cache: "no-store" })
    const data = await response.json()
    return data.success ? data.data : []
  } catch (error) {
    console.error("Failed to fetch lessons:", error)
    return []
  }
}

// Fetch single lesson by ID
export async function fetchLesson(lessonId: string): Promise<Lesson | null> {
  try {
    const response = await fetch(`/api/admin/lessons/${lessonId}`, { cache: "no-store" })
    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error("Failed to fetch lesson:", error)
    return null
  }
}

// Parse lesson content from markdown/JSON format
export function parseLessonContent(content: string): LessonContent[] {
  if (!content) return []

  try {
    // Try to parse as JSON first (for structured content)
    return JSON.parse(content)
  } catch {
    // Fallback: treat as plain text
    return [{ type: "text", content }]
  }
}
