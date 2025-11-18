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

// POST import single course or lesson
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
    const type = formData.get("type") as string // "course", "lesson", or "lms"
    const courseId = formData.get("courseId") as string | null // For lesson mapping

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      )
    }

    if (!file.name.endsWith(".json")) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Please upload a JSON file." },
        { status: 400 }
      )
    }

    const fileContent = await file.text()
    let data: any

    try {
      data = JSON.parse(fileContent)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON format" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const results: any = { created: 0, updated: 0, errors: [] }

    if (type === "course") {
      // Import single course
      if (!data.id || !data.title || !data.description) {
        return NextResponse.json(
          { success: false, error: "Invalid course format. Missing required fields." },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from("courses")
        .upsert({
          id: data.id,
          title: data.title,
          description: data.description,
          slug: data.slug || data.id,
          status: data.status || "draft",
          created_at: data.createdAt || new Date().toISOString(),
          updated_at: data.updatedAt || new Date().toISOString(),
        }, {
          onConflict: "id"
        })

      if (error) {
        results.errors.push(`Course ${data.id}: ${error.message}`)
      } else {
        results.updated++
      }
    } else if (type === "lesson") {
      // Import single lesson
      if (!data.id || !data.title || !data.description || !data.content) {
        return NextResponse.json(
          { success: false, error: "Invalid lesson format. Missing required fields." },
          { status: 400 }
        )
      }

      const targetCourseId = courseId || data.courseId
      if (!targetCourseId) {
        return NextResponse.json(
          { success: false, error: "Course ID is required for lesson import" },
          { status: 400 }
        )
      }

      // Verify course exists
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("id", targetCourseId)
        .single()

      if (!course) {
        return NextResponse.json(
          { success: false, error: `Course ${targetCourseId} not found` },
          { status: 404 }
        )
      }

      const { error } = await supabase
        .from("lessons")
        .upsert({
          id: data.id,
          course_id: targetCourseId,
          title: data.title,
          description: data.description,
          content: data.content,
          status: data.status || "draft",
          order: data.order || 0,
          created_at: data.createdAt || new Date().toISOString(),
          updated_at: data.updatedAt || new Date().toISOString(),
        }, {
          onConflict: "id"
        })

      if (error) {
        results.errors.push(`Lesson ${data.id}: ${error.message}`)
      } else {
        results.updated++
      }
    } else if (type === "lms") {
      // Import full lms.json (same as import endpoint)
      const { courses, lessons, options } = data

      if (!courses || !Array.isArray(courses) || !lessons || !Array.isArray(lessons)) {
        return NextResponse.json(
          { success: false, error: "Invalid LMS format" },
          { status: 400 }
        )
      }

      const {
        overwriteCourses = {},
        overwriteLessons = {},
        saveCoursesAsNew = [],
        saveLessonsAsNew = []
      } = options || {}

      // Process courses
      for (const course of courses) {
        try {
          const shouldOverwrite = overwriteCourses[course.id] === true
          const shouldSaveAsNew = saveCoursesAsNew.includes(course.id)

          if (shouldSaveAsNew) {
            const newId = `${course.id}-${Date.now()}`
            const { error } = await supabase
              .from("courses")
              .insert({
                id: newId,
                title: course.title,
                description: course.description,
                slug: `${course.slug}-${Date.now()}`,
                status: course.status,
                created_at: course.createdAt || new Date().toISOString(),
                updated_at: course.updatedAt || new Date().toISOString()
              })

            if (error) throw error
            results.created++
          } else if (shouldOverwrite) {
            const { error } = await supabase
              .from("courses")
              .upsert({
                id: course.id,
                title: course.title,
                description: course.description,
                slug: course.slug,
                status: course.status,
                created_at: course.createdAt || new Date().toISOString(),
                updated_at: course.updatedAt || new Date().toISOString()
              }, { onConflict: "id" })

            if (error) throw error
            results.updated++
          } else {
            const { data: existing } = await supabase
              .from("courses")
              .select("id")
              .eq("id", course.id)
              .single()

            if (!existing) {
              const { error } = await supabase
                .from("courses")
                .insert({
                  id: course.id,
                  title: course.title,
                  description: course.description,
                  slug: course.slug,
                  status: course.status,
                  created_at: course.createdAt || new Date().toISOString(),
                  updated_at: course.updatedAt || new Date().toISOString()
                })

              if (error) throw error
              results.created++
            }
          }
        } catch (error: any) {
          results.errors.push(`Course ${course.id}: ${error.message}`)
        }
      }

      // Process lessons
      for (const lesson of lessons) {
        try {
          const shouldOverwrite = overwriteLessons[lesson.id] === true
          const shouldSaveAsNew = saveLessonsAsNew.includes(lesson.id)

          let courseId = lesson.courseId
          if (saveCoursesAsNew.includes(lesson.courseId)) {
            const { data: courses } = await supabase
              .from("courses")
              .select("id")
              .like("id", `${lesson.courseId}-%`)
              .order("created_at", { ascending: false })
              .limit(1)
              .single()
            
            if (courses) {
              courseId = courses.id
            }
          }

          if (shouldSaveAsNew) {
            const newId = `${lesson.id}-${Date.now()}`
            const { error } = await supabase
              .from("lessons")
              .insert({
                id: newId,
                course_id: courseId,
                title: lesson.title,
                description: lesson.description,
                content: lesson.content,
                status: lesson.status,
                order: lesson.order || 0,
                created_at: lesson.createdAt || new Date().toISOString(),
                updated_at: lesson.updatedAt || new Date().toISOString()
              })

            if (error) throw error
            results.created++
          } else if (shouldOverwrite) {
            const { error } = await supabase
              .from("lessons")
              .upsert({
                id: lesson.id,
                course_id: courseId,
                title: lesson.title,
                description: lesson.description,
                content: lesson.content,
                status: lesson.status,
                order: lesson.order || 0,
                created_at: lesson.createdAt || new Date().toISOString(),
                updated_at: lesson.updatedAt || new Date().toISOString()
              }, { onConflict: "id" })

            if (error) throw error
            results.updated++
          } else {
            const { data: existing } = await supabase
              .from("lessons")
              .select("id")
              .eq("id", lesson.id)
              .single()

            if (!existing) {
              const { error } = await supabase
                .from("lessons")
                .insert({
                  id: lesson.id,
                  course_id: courseId,
                  title: lesson.title,
                  description: lesson.description,
                  content: lesson.content,
                  status: lesson.status,
                  order: lesson.order || 0,
                  created_at: lesson.createdAt || new Date().toISOString(),
                  updated_at: lesson.updatedAt || new Date().toISOString()
                })

              if (error) throw error
              results.created++
            }
          }
        } catch (error: any) {
          results.errors.push(`Lesson ${lesson.id}: ${error.message}`)
        }
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid type. Must be 'course', 'lesson', or 'lms'" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error: any) {
    console.error("Import error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to import content" },
      { status: 500 }
    )
  }
}
