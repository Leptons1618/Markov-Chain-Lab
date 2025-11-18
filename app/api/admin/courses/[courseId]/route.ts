import { type NextRequest, NextResponse } from "next/server"
import { getStore, saveStore } from "@/lib/server/lms-store"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin-auth"

// Helper function to check admin privileges
async function checkAdminAccess() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { authorized: false, error: "Not authenticated", status: 401 }
  }

  const adminStatus = await isAdmin(user.id)
  if (!adminStatus) {
    return { authorized: false, error: "Access denied. Admin privileges required.", status: 403 }
  }

  return { authorized: true, user }
}

// GET single course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params
    const { courses } = getStore()
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
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // Check admin privileges
    const authCheck = await checkAdminAccess()
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { courseId } = await params
    const body = await request.json()
    const { courses } = getStore()
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
    await saveStore()
    return NextResponse.json({ success: true, data: updatedCourse })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update course" }, { status: 500 })
  }
}

// DELETE course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // Check admin privileges
    const authCheck = await checkAdminAccess()
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { courseId } = await params
    const { courses } = getStore()
    const courseIndex = courses.findIndex(c => c.id === courseId)
    if (courseIndex === -1) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })
    }

    courses.splice(courseIndex, 1)
    await saveStore()
    return NextResponse.json({ success: true, message: "Course deleted successfully" })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete course" }, { status: 500 })
  }
}
