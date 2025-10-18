import { type NextRequest, NextResponse } from "next/server"
import { courses } from "../route"

// GET single course
export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = params.courseId
    const course = courses.find(c => c.id === courseId)

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

    const courseIndex = courses.findIndex(c => c.id === courseId)
    if (courseIndex === -1) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })
    }

    const updatedCourse = {
      ...courses[courseIndex],
      ...body,
      updatedAt: new Date(),
    }

    courses[courseIndex] = updatedCourse
    return NextResponse.json({ success: true, data: updatedCourse })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update course" }, { status: 500 })
  }
}

// DELETE course
export async function DELETE(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = params.courseId

    const courseIndex = courses.findIndex(c => c.id === courseId)
    if (courseIndex === -1) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })
    }

    courses.splice(courseIndex, 1)
    return NextResponse.json({ success: true, message: "Course deleted successfully" })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete course" }, { status: 500 })
  }
}
