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

interface UploadedCourse {
  id: string
  title: string
  description: string
  slug: string
  lessons?: number
  status: "draft" | "published"
  createdAt: string
  updatedAt: string
}

interface UploadedLesson {
  id: string
  courseId: string
  title: string
  description: string
  content: string
  status: "draft" | "published"
  order: number
  createdAt: string
  updatedAt: string
}

interface LMSData {
  courses: UploadedCourse[]
  lessons: UploadedLesson[]
}

// POST upload and parse lms.json
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAccess()
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith(".json")) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Please upload a JSON file." },
        { status: 400 }
      )
    }

    // Read and parse file
    const fileContent = await file.text()
    let lmsData: LMSData

    try {
      lmsData = JSON.parse(fileContent)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON format" },
        { status: 400 }
      )
    }

    // Validate structure
    if (!lmsData.courses || !Array.isArray(lmsData.courses)) {
      return NextResponse.json(
        { success: false, error: "Invalid format: missing or invalid 'courses' array" },
        { status: 400 }
      )
    }

    if (!lmsData.lessons || !Array.isArray(lmsData.lessons)) {
      return NextResponse.json(
        { success: false, error: "Invalid format: missing or invalid 'lessons' array" },
        { status: 400 }
      )
    }

    // Get existing data from database for comparison
    const supabase = createServiceClient()
    
    const { data: existingCourses } = await supabase
      .from("courses")
      .select("id, title, slug, updated_at")
    
    const { data: existingLessons } = await supabase
      .from("lessons")
      .select("id, course_id, title, updated_at")

    // Compare and identify duplicates
    const courseDuplicates = lmsData.courses.map(course => {
      const existing = existingCourses?.find(ec => ec.id === course.id || ec.slug === course.slug)
      return {
        uploaded: course,
        existing: existing || null,
        isDuplicate: !!existing,
        conflictType: existing ? (existing.id === course.id ? "id" : "slug") : null
      }
    })

    const lessonDuplicates = lmsData.lessons.map(lesson => {
      const existing = existingLessons?.find(el => el.id === lesson.id)
      return {
        uploaded: lesson,
        existing: existing || null,
        isDuplicate: !!existing
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        courses: lmsData.courses,
        lessons: lmsData.lessons,
        comparison: {
          courses: courseDuplicates,
          lessons: lessonDuplicates,
          stats: {
            totalCourses: lmsData.courses.length,
            totalLessons: lmsData.lessons.length,
            duplicateCourses: courseDuplicates.filter(c => c.isDuplicate).length,
            duplicateLessons: lessonDuplicates.filter(l => l.isDuplicate).length,
            newCourses: courseDuplicates.filter(c => !c.isDuplicate).length,
            newLessons: lessonDuplicates.filter(l => !l.isDuplicate).length
          }
        }
      }
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process upload" },
      { status: 500 }
    )
  }
}
