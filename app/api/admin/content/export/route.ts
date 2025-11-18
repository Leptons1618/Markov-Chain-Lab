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

// GET export LMS content as JSON
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminAccess()
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const supabase = createServiceClient()

    // Fetch all courses
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: true })

    if (coursesError) {
      throw new Error(`Failed to fetch courses: ${coursesError.message}`)
    }

    // Fetch all lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("*")
      .order("course_id, order", { ascending: true })

    if (lessonsError) {
      throw new Error(`Failed to fetch lessons: ${lessonsError.message}`)
    }

    // Transform database format to lms.json format
    const exportData = {
      courses: (courses || []).map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        slug: course.slug,
        lessons: course.lessons || 0,
        status: course.status,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
      })),
      lessons: (lessons || []).map((lesson) => ({
        id: lesson.id,
        courseId: lesson.course_id,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        status: lesson.status,
        order: lesson.order || 0,
        createdAt: lesson.created_at,
        updatedAt: lesson.updated_at,
      })),
    }

    // Return as JSON with proper headers for download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="lms-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error: any) {
    console.error("Export error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export content" },
      { status: 500 }
    )
  }
}
