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

// GET single lesson from database
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const supabase = createServiceClient()

    const { data: lesson, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .single()

    if (error || !lesson) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 })
    }

    // Transform to expected format
    const transformedLesson = {
      id: lesson.id,
      courseId: lesson.course_id,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      status: lesson.status,
      order: lesson.order || 0,
      createdAt: new Date(lesson.created_at),
      updatedAt: new Date(lesson.updated_at),
    }

    return NextResponse.json({ success: true, data: transformedLesson })
  } catch (error: any) {
    console.error("Error fetching lesson:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch lesson" },
      { status: 500 }
    )
  }
}

// PUT update lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
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

    const { lessonId } = await params
    const body = await request.json()
    const supabase = createServiceClient()

    // Check if lesson exists
    const { data: existing } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", lessonId)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 })
    }

    // Update lesson
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.content !== undefined) updateData.content = body.content
    if (body.status !== undefined) updateData.status = body.status
    if (body.order !== undefined) updateData.order = body.order
    if (body.courseId !== undefined) updateData.course_id = body.courseId

    const { data: updatedLesson, error } = await supabase
      .from("lessons")
      .update(updateData)
      .eq("id", lessonId)
      .select()
      .single()

    if (error) {
      console.error("Failed to update lesson:", error)
      return NextResponse.json(
        { success: false, error: `Failed to update lesson: ${error.message}` },
        { status: 500 }
      )
    }

    // Transform to expected format
    const transformedLesson = {
      id: updatedLesson.id,
      courseId: updatedLesson.course_id,
      title: updatedLesson.title,
      description: updatedLesson.description,
      content: updatedLesson.content,
      status: updatedLesson.status,
      order: updatedLesson.order || 0,
      createdAt: new Date(updatedLesson.created_at),
      updatedAt: new Date(updatedLesson.updated_at),
    }

    return NextResponse.json({ success: true, data: transformedLesson })
  } catch (error: any) {
    console.error("Error updating lesson:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update lesson" },
      { status: 500 }
    )
  }
}

// DELETE lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
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

    const { lessonId } = await params
    const supabase = createServiceClient()

    // Check if lesson exists
    const { data: existing } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", lessonId)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ success: false, error: "Lesson not found" }, { status: 404 })
    }

    // Delete lesson (course lesson count will be updated by trigger)
    const { error } = await supabase
      .from("lessons")
      .delete()
      .eq("id", lessonId)

    if (error) {
      console.error("Failed to delete lesson:", error)
      return NextResponse.json(
        { success: false, error: `Failed to delete lesson: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Lesson deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting lesson:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete lesson" },
      { status: 500 }
    )
  }
}
