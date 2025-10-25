import { type NextRequest, NextResponse } from "next/server"
import { getStore, updateCourseLessonCounts, saveStore } from "@/lib/server/lms-store"

// GET all lessons or filter by courseId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")

    const { lessons } = getStore()
    let filtered = lessons
    if (courseId) {
      filtered = lessons.filter((l) => l.courseId === courseId)
    }

    return NextResponse.json({ success: true, data: filtered })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch lessons" }, { status: 500 })
  }
}

// POST create new lesson
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, title, description, content } = body

    if (!courseId || !title || !description) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Verify course exists
    const { courses, lessons } = getStore()
    const course = courses.find(c => c.id === courseId)
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })
    }

    const newLesson = {
      id: Date.now().toString(),
      courseId,
      title,
      description,
      content: content || "",
      status: "draft",
      order: lessons.filter((l) => l.courseId === courseId).length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    lessons.push(newLesson)
    updateCourseLessonCounts()
    await saveStore()
    
    return NextResponse.json({ success: true, data: newLesson }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create lesson" }, { status: 500 })
  }
}
