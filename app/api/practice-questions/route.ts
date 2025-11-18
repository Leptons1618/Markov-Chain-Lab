import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// GET practice questions (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get("lessonId")
    const courseId = searchParams.get("courseId")

    const supabase = createServiceClient()

    let query = supabase
      .from("practice_questions")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: true })

    // Filter by lesson if provided
    if (lessonId) {
      query = query.eq("lesson_id", lessonId)
    }

    // Filter by course if provided (need to join with lessons)
    if (courseId && !lessonId) {
      // First get all lesson IDs for this course
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id")
        .eq("course_id", courseId)

      if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map((l) => l.id)
        query = query.in("lesson_id", lessonIds)
      } else {
        // No lessons for this course, return empty
        return NextResponse.json({
          success: true,
          data: [],
        })
      }
    }

    const { data: questions, error } = await query

    if (error) {
      // Handle table not found error gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Practice questions table does not exist yet. Run migrations first.')
        return NextResponse.json({
          success: true,
          data: [],
        })
      }
      console.error("Supabase query error:", error)
      throw new Error(`Failed to fetch practice questions: ${error.message}`)
    }

    console.log(`Fetched ${questions?.length || 0} practice questions (lessonId: ${lessonId}, courseId: ${courseId})`)

    return NextResponse.json({
      success: true,
      data: questions || [],
    })
  } catch (error: any) {
    console.error("GET practice questions error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch practice questions" },
      { status: 500 }
    )
  }
}
