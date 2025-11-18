import { type NextRequest, NextResponse } from "next/server"
import { getStore, saveStore, type Course } from "@/lib/server/lms-store"
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

// GET all courses
export async function GET() {
  try {
    const { courses } = getStore()
    return NextResponse.json({ success: true, data: courses })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch courses" }, { status: 500 })
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

    const newCourse: Course = {
      id: slug || title.toLowerCase().replace(/\s+/g, "-"),
      title,
      description,
      slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
      lessons: 0,
      status: "draft" as "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const { courses } = getStore()
    courses.push(newCourse)
    await saveStore()
    return NextResponse.json({ success: true, data: newCourse }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create course" }, { status: 500 })
  }
}
