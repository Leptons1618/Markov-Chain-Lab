import { type NextRequest, NextResponse } from "next/server"
import { lessons } from "../route"

// GET single lesson
export async function GET(request: NextRequest, { params }: { params: { lessonId: string } }) {
  try {
    const lessonId = params.lessonId
    const lesson = lessons.find(l => l.id === lessonId)

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

    const lessonIndex = lessons.findIndex(l => l.id === lessonId)
    if (lessonIndex === -1) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 })
    }

    const updatedLesson = {
      ...lessons[lessonIndex],
      ...body,
      updatedAt: new Date(),
    }

    lessons[lessonIndex] = updatedLesson
    return NextResponse.json({ success: true, data: updatedLesson })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update lesson" }, { status: 500 })
  }
}

// DELETE lesson
export async function DELETE(request: NextRequest, { params }: { params: { lessonId: string } }) {
  try {
    const lessonId = params.lessonId

    const lessonIndex = lessons.findIndex(l => l.id === lessonId)
    if (lessonIndex === -1) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 })
    }

    lessons.splice(lessonIndex, 1)
    return NextResponse.json({ success: true, message: "Lesson deleted successfully" })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete lesson" }, { status: 500 })
  }
}
