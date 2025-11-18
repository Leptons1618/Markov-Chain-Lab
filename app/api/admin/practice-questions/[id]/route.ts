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

// GET single practice question
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await checkAdminAccess()
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("practice_questions")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Practice question not found" },
          { status: 404 }
        )
      }
      throw new Error(`Failed to fetch practice question: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error("GET practice question error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch practice question" },
      { status: 500 }
    )
  }
}

// PUT update practice question
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await checkAdminAccess()
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const body = await request.json()
    const {
      title,
      question,
      type,
      options,
      correct_answer,
      hint,
      solution,
      math_explanation,
      difficulty,
      tags,
      status,
      lesson_id,
    } = body

    const supabase = createServiceClient()

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (question !== undefined) updateData.question = question
    if (type !== undefined) {
      if (!["multiple_choice", "text_input", "numeric_input"].includes(type)) {
        return NextResponse.json(
          { success: false, error: "Invalid type" },
          { status: 400 }
        )
      }
      updateData.type = type
    }
    if (options !== undefined) updateData.options = options
    if (correct_answer !== undefined) updateData.correct_answer = correct_answer
    if (hint !== undefined) updateData.hint = hint
    if (solution !== undefined) updateData.solution = solution
    if (math_explanation !== undefined) updateData.math_explanation = math_explanation
    if (difficulty !== undefined) updateData.difficulty = difficulty
    if (tags !== undefined) updateData.tags = tags
    if (status !== undefined) updateData.status = status
    
    // Validate lesson_id if provided
    if (lesson_id !== undefined) {
      if (lesson_id && lesson_id.trim() !== "") {
        // Check if lesson exists
        const { data: lessonExists, error: lessonError } = await supabase
          .from("lessons")
          .select("id, title")
          .eq("id", lesson_id)
          .single()

        if (lessonError || !lessonExists) {
          // Try to get some available lessons to help the user
          const { data: availableLessons } = await supabase
            .from("lessons")
            .select("id, title")
            .limit(5)
          
          const availableLessonsList = availableLessons?.map(l => `"${l.id}" (${l.title})`).join(", ") || "none"
          
          return NextResponse.json(
            { 
              success: false, 
              error: `Lesson with ID "${lesson_id}" does not exist in the database. Please ensure lessons are synced to the database first. Available lessons: ${availableLessonsList}`,
              hint: "You may need to import/sync your LMS content to the database. Go to Admin > Courses and use the Import/Sync feature."
            },
            { status: 400 }
          )
        }
        updateData.lesson_id = lesson_id
      } else {
        updateData.lesson_id = null
      }
    }

    const { data, error } = await supabase
      .from("practice_questions")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Practice question not found" },
          { status: 404 }
        )
      }
      // Handle foreign key constraint violation
      if (error.code === "23503" || error.message?.includes("foreign key constraint")) {
        return NextResponse.json(
          { success: false, error: `Invalid lesson_id: The lesson does not exist in the database. Please select a valid lesson.` },
          { status: 400 }
        )
      }
      throw new Error(`Failed to update practice question: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error("PUT practice question error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update practice question" },
      { status: 500 }
    )
  }
}

// DELETE practice question
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await checkAdminAccess()
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from("practice_questions")
      .delete()
      .eq("id", params.id)

    if (error) {
      throw new Error(`Failed to delete practice question: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("DELETE practice question error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete practice question" },
      { status: 500 }
    )
  }
}
