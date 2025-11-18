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

// POST import content with overwrite/save-as-new options
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAccess()
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const body = await request.json()
    const { courses, lessons, options } = body

    if (!courses || !Array.isArray(courses) || !lessons || !Array.isArray(lessons)) {
      return NextResponse.json(
        { success: false, error: "Invalid data format" },
        { status: 400 }
      )
    }

    const {
      overwriteCourses = {},
      overwriteLessons = {},
      saveCoursesAsNew = [],
      saveLessonsAsNew = []
    } = options || {}

    const supabase = createServiceClient()
    const results = {
      courses: { created: 0, updated: 0, skipped: 0, errors: [] as string[] },
      lessons: { created: 0, updated: 0, skipped: 0, errors: [] as string[] }
    }

    // Process courses
    for (const course of courses) {
      try {
        const shouldOverwrite = overwriteCourses[course.id] === true
        const shouldSaveAsNew = saveCoursesAsNew.includes(course.id)

        if (shouldSaveAsNew) {
          // Generate new ID
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
          results.courses.created++
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
            }, {
              onConflict: "id"
            })

          if (error) throw error
          results.courses.updated++
        } else {
          // Check if exists
          const { data: existing } = await supabase
            .from("courses")
            .select("id")
            .eq("id", course.id)
            .single()

          if (existing) {
            results.courses.skipped++
          } else {
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
            results.courses.created++
          }
        }
      } catch (error: any) {
        results.courses.errors.push(`Course ${course.id}: ${error.message}`)
      }
    }

    // Process lessons
    for (const lesson of lessons) {
      try {
        const shouldOverwrite = overwriteLessons[lesson.id] === true
        const shouldSaveAsNew = saveLessonsAsNew.includes(lesson.id)

        // Check if course exists (might be new ID if saved as new)
        let courseId = lesson.courseId
        if (saveCoursesAsNew.includes(lesson.courseId)) {
          // Find the new course ID
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
          results.lessons.created++
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
            }, {
              onConflict: "id"
            })

          if (error) throw error
          results.lessons.updated++
        } else {
          const { data: existing } = await supabase
            .from("lessons")
            .select("id")
            .eq("id", lesson.id)
            .single()

          if (existing) {
            results.lessons.skipped++
          } else {
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
            results.lessons.created++
          }
        }
      } catch (error: any) {
        results.lessons.errors.push(`Lesson ${lesson.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to import content" },
      { status: 500 }
    )
  }
}
