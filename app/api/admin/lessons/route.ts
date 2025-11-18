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

// GET all lessons or filter by courseId from database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")
    const supabase = createServiceClient()

    let query = supabase
      .from("lessons")
      .select("*")
      .order("order", { ascending: true })

    if (courseId) {
      query = query.eq("course_id", courseId)
    }

    const { data: lessons, error } = await query

    if (error) {
      console.error("Failed to fetch lessons from database:", error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch lessons: ${error.message}` },
        { status: 500 }
      )
    }

    // Transform database format to expected format
    const transformedLessons = (lessons || []).map((lesson) => ({
      id: lesson.id,
      courseId: lesson.course_id,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      status: lesson.status,
      order: lesson.order || 0,
      createdAt: new Date(lesson.created_at),
      updatedAt: new Date(lesson.updated_at),
    }))

    return NextResponse.json({ success: true, data: transformedLessons })
  } catch (error: any) {
    console.error("Error fetching lessons:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch lessons" },
      { status: 500 }
    )
  }
}

// POST create new lesson
export async function POST(request: NextRequest) {
  try {
    // Check admin privileges
    const authCheck = await checkAdminAccess()
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const body = await request.json()
    const { courseId, title, description, content } = body

    if (!courseId || !title || !description) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify course exists
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .maybeSingle()

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })
    }

    // Get the next order number
    const { data: existingLessons } = await supabase
      .from("lessons")
      .select("order")
      .eq("course_id", courseId)
      .order("order", { ascending: false })
      .limit(1)

    const nextOrder = existingLessons && existingLessons.length > 0 
      ? (existingLessons[0].order || 0) + 1 
      : 1

    const lessonId = `${courseId}-${Date.now()}`

    const { data: newLesson, error } = await supabase
      .from("lessons")
      .insert({
        id: lessonId,
        course_id: courseId,
        title,
        description,
        content: content || "",
        status: "draft",
        order: nextOrder,
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to create lesson:", error)
      return NextResponse.json(
        { success: false, error: `Failed to create lesson: ${error.message}` },
        { status: 500 }
      )
    }

    // Transform to expected format
    const transformedLesson = {
      id: newLesson.id,
      courseId: newLesson.course_id,
      title: newLesson.title,
      description: newLesson.description,
      content: newLesson.content,
      status: newLesson.status,
      order: newLesson.order || 0,
      createdAt: new Date(newLesson.created_at),
      updatedAt: new Date(newLesson.updated_at),
    }

    return NextResponse.json({ success: true, data: transformedLesson }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating lesson:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create lesson" },
      { status: 500 }
    )
  }
}
