import { type NextRequest, NextResponse } from "next/server"

// Mock database
const mockCourses: any = {
  foundations: {
    id: "foundations",
    title: "Foundations",
    description: "Basic probability and mathematical concepts",
    slug: "foundations",
    lessons: 4,
    status: "published",
  },
  chains: {
    id: "chains",
    title: "Markov Chain Basics",
    description: "Introduction to Markov chains and state transitions",
    slug: "markov-chain-basics",
    lessons: 5,
    status: "published",
  },
}

// GET single course
export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = params.courseId
    const course = mockCourses[courseId]

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: course })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch course" }, { status: 500 })
  }
}

// PUT update course
export async function PUT(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = params.courseId
    const body = await request.json()

    if (!mockCourses[courseId]) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })
    }

    const updatedCourse = {
      ...mockCourses[courseId],
      ...body,
      updatedAt: new Date(),
    }

    mockCourses[courseId] = updatedCourse
    return NextResponse.json({ success: true, data: updatedCourse })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update course" }, { status: 500 })
  }
}

// DELETE course
export async function DELETE(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = params.courseId

    if (!mockCourses[courseId]) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })
    }

    delete mockCourses[courseId]
    return NextResponse.json({ success: true, message: "Course deleted successfully" })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete course" }, { status: 500 })
  }
}
