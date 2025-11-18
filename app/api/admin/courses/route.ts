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

// GET all courses from database
export async function GET() {
  try {
    const supabase = createServiceClient()
    
    const { data: courses, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Failed to fetch courses from database:", error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch courses: ${error.message}` },
        { status: 500 }
      )
    }

    // Transform database format to expected format
    const transformedCourses = (courses || []).map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      slug: course.slug,
      lessons: course.lessons || 0,
      status: course.status,
      createdAt: new Date(course.created_at),
      updatedAt: new Date(course.updated_at),
    }))

    return NextResponse.json({ success: true, data: transformedCourses })
  } catch (error: any) {
    console.error("Error fetching courses:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch courses" },
      { status: 500 }
    )
  }
}

// POST create new course
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
    const { title, description, slug } = body

    if (!title || !description) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const courseId = slug || title.toLowerCase().replace(/\s+/g, "-")
    const supabase = createServiceClient()

    const { data: newCourse, error } = await supabase
      .from("courses")
      .insert({
        id: courseId,
        title,
        description,
        slug: slug || courseId,
        lessons: 0,
        status: "draft",
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to create course:", error)
      return NextResponse.json(
        { success: false, error: `Failed to create course: ${error.message}` },
        { status: 500 }
      )
    }

    // Transform to expected format
    const transformedCourse = {
      id: newCourse.id,
      title: newCourse.title,
      description: newCourse.description,
      slug: newCourse.slug,
      lessons: newCourse.lessons || 0,
      status: newCourse.status,
      createdAt: new Date(newCourse.created_at),
      updatedAt: new Date(newCourse.updated_at),
    }

    return NextResponse.json({ success: true, data: transformedCourse }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating course:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create course" },
      { status: 500 }
    )
  }
}
