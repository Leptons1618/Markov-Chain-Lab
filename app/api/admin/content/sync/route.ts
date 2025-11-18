import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase/service"
import { readFile } from "fs/promises"
import { join } from "path"

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

// POST sync lms.json to database (auto-update existing, create new)
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAccess()
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    // Read lms.json from data directory
    let lmsData: any
    try {
      const filePath = join(process.cwd(), "data", "lms.json")
      const fileContent = await readFile(filePath, "utf-8")
      lmsData = JSON.parse(fileContent)
    } catch (error: any) {
      console.error("Failed to read lms.json:", error)
      return NextResponse.json(
        { success: false, error: `Failed to read lms.json: ${error.message}` },
        { status: 500 }
      )
    }

    if (!lmsData.courses || !Array.isArray(lmsData.courses) || !lmsData.lessons || !Array.isArray(lmsData.lessons)) {
      return NextResponse.json(
        { success: false, error: "Invalid lms.json format: missing courses or lessons arrays" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const results = {
      courses: { created: 0, updated: 0, errors: [] as string[] },
      lessons: { created: 0, updated: 0, errors: [] as string[] }
    }

    // Sync courses - upsert all (update if exists, create if not)
    for (const course of lmsData.courses) {
      try {
        // Check if course exists before upsert
        const { data: existing } = await supabase
          .from("courses")
          .select("id")
          .eq("id", course.id)
          .maybeSingle()

        const wasExisting = !!existing

        const { error } = await supabase
          .from("courses")
          .upsert({
            id: course.id,
            title: course.title,
            description: course.description,
            slug: course.slug,
            status: course.status || "published",
            created_at: course.createdAt ? new Date(course.createdAt).toISOString() : new Date().toISOString(),
            updated_at: course.updatedAt ? new Date(course.updatedAt).toISOString() : new Date().toISOString()
          }, {
            onConflict: "id"
          })

        if (error) {
          results.courses.errors.push(`Course ${course.id}: ${error.message}`)
        } else {
          if (wasExisting) {
            results.courses.updated++
          } else {
            results.courses.created++
          }
        }
      } catch (error: any) {
        results.courses.errors.push(`Course ${course.id}: ${error.message}`)
      }
    }

    // Sync lessons - upsert all (update if exists, create if not)
    for (const lesson of lmsData.lessons) {
      try {
        // Verify course exists
        const { data: courseExists } = await supabase
          .from("courses")
          .select("id")
          .eq("id", lesson.courseId)
          .maybeSingle()

        if (!courseExists) {
          results.lessons.errors.push(`Lesson ${lesson.id}: Course "${lesson.courseId}" does not exist`)
          continue
        }

        // Check if lesson exists before upsert
        const { data: existing } = await supabase
          .from("lessons")
          .select("id")
          .eq("id", lesson.id)
          .maybeSingle()

        const wasExisting = !!existing

        const { error } = await supabase
          .from("lessons")
          .upsert({
            id: lesson.id,
            course_id: lesson.courseId,
            title: lesson.title,
            description: lesson.description,
            content: lesson.content,
            status: lesson.status || "published",
            order: lesson.order || 0,
            created_at: lesson.createdAt ? new Date(lesson.createdAt).toISOString() : new Date().toISOString(),
            updated_at: lesson.updatedAt ? new Date(lesson.updatedAt).toISOString() : new Date().toISOString()
          }, {
            onConflict: "id"
          })

        if (error) {
          results.lessons.errors.push(`Lesson ${lesson.id}: ${error.message}`)
        } else {
          if (wasExisting) {
            results.lessons.updated++
          } else {
            results.lessons.created++
          }
        }
      } catch (error: any) {
        results.lessons.errors.push(`Lesson ${lesson.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Sync completed: ${results.courses.created + results.courses.updated} courses, ${results.lessons.created + results.lessons.updated} lessons`
    })
  } catch (error: any) {
    console.error("Sync error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync content" },
      { status: 500 }
    )
  }
}
