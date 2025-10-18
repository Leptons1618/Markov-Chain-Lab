import { type NextRequest, NextResponse } from "next/server"

// Mock lesson storage
const mockLessons: any = {
  "1": {
    id: "1",
    courseId: "chains",
    title: "What is a Markov Chain?",
    description: "Understanding the fundamental concept",
    content: "# Markov Chains Explained\n\nA Markov chain is a stochastic model...",
    status: "published",
    order: 1,
  },
}

// GET single lesson
export async function GET(request: NextRequest, { params }: { params: { lessonId: string } }) {
  try {
    const lessonId = params.lessonId
    const lesson = mockLessons[lessonId]

    if (!lesson) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: lesson })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch lesson" }, { status: 500 })
  }
}

// PUT update lesson
export async function PUT(request: NextRequest, { params }: { params: { lessonId: string } }) {
  try {
    const lessonId = params.lessonId
    const body = await request.json()

    if (!mockLessons[lessonId]) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 })
    }

    const updatedLesson = {
      ...mockLessons[lessonId],
      ...body,
      updatedAt: new Date(),
    }

    mockLessons[lessonId] = updatedLesson
    return NextResponse.json({ success: true, data: updatedLesson })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update lesson" }, { status: 500 })
  }
}

// DELETE lesson
export async function DELETE(request: NextRequest, { params }: { params: { lessonId: string } }) {
  try {
    const lessonId = params.lessonId

    if (!mockLessons[lessonId]) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 })
    }

    delete mockLessons[lessonId]
    return NextResponse.json({ success: true, message: "Lesson deleted successfully" })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete lesson" }, { status: 500 })
  }
}
