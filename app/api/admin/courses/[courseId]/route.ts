import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase/service"

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

// GET single course from database
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params
    const supabase = createServiceClient()

    const { data: course, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single()

    if (error || !course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })
    }

    // Transform to expected format
    const transformedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      slug: course.slug,
      lessons: course.lessons || 0,
      status: course.status,
      createdAt: new Date(course.created_at),
      updatedAt: new Date(course.updated_at),
    }

    return NextResponse.json({ success: true, data: transformedCourse })
  } catch (error: any) {
    console.error("Error fetching course:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch course" },
      { status: 500 }
    )
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
    const supabase = createServiceClient()

    // Check if course exists
    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })
    }

    // Update course
    const { data: updatedCourse, error } = await supabase
      .from("courses")
      .update({
        title: body.title,
        description: body.description,
        slug: body.slug,
        status: body.status,
      })
      .eq("id", courseId)
      .select()
      .single()

    if (error) {
      console.error("Failed to update course:", error)
      return NextResponse.json(
        { success: false, error: `Failed to update course: ${error.message}` },
        { status: 500 }
      )
    }

    // Transform to expected format
    const transformedCourse = {
      id: updatedCourse.id,
      title: updatedCourse.title,
      description: updatedCourse.description,
      slug: updatedCourse.slug,
      lessons: updatedCourse.lessons || 0,
      status: updatedCourse.status,
      createdAt: new Date(updatedCourse.created_at),
      updatedAt: new Date(updatedCourse.updated_at),
    }

    return NextResponse.json({ success: true, data: transformedCourse })
  } catch (error: any) {
    console.error("Error updating course:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update course" },
      { status: 500 }
    )
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
    const supabase = createServiceClient()

    // Check if course exists
    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })
    }

    // Delete course (lessons will be cascade deleted)
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId)

    if (error) {
      console.error("Failed to delete course:", error)
      return NextResponse.json(
        { success: false, error: `Failed to delete course: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Course deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting course:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete course" },
      { status: 500 }
    )
  }
}
