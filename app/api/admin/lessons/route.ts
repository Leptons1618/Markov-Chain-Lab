import { type NextRequest, NextResponse } from "next/server"

// Mock lesson storage
const lessons: any[] = [
  {
    id: "1",
    courseId: "chains",
    title: "What is a Markov Chain?",
    description: "Understanding the fundamental concept",
    content: "# Markov Chains Explained\n\nA Markov chain is a stochastic model...",
    status: "published",
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// GET all lessons or filter by courseId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")

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
    return NextResponse.json({ success: true, data: newLesson }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create lesson" }, { status: 500 })
  }
}
