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

// GET all practice questions
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
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || null

    let query = supabase
      .from("practice_questions")
      .select("*")
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
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
      throw new Error(`Failed to fetch practice questions: ${error.message}`)
    }

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

// POST create new practice question
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
    const {
      id,
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
      status = "draft",
      lesson_id,
    } = body

    // Validation
    if (!id || !title || !question || !type || !solution) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: id, title, question, type, solution" },
        { status: 400 }
      )
    }

    if (!["multiple_choice", "text_input", "numeric_input"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid type. Must be 'multiple_choice', 'text_input', or 'numeric_input'" },
        { status: 400 }
      )
    }

    if (type === "multiple_choice" && (!options || !Array.isArray(options) || options.length === 0)) {
      return NextResponse.json(
        { success: false, error: "Multiple choice questions require options array" },
        { status: 400 }
      )
    }

    if ((type === "text_input" || type === "numeric_input") && !correct_answer) {
      return NextResponse.json(
        { success: false, error: `${type} questions require correct_answer` },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Validate lesson_id if provided
    if (lesson_id && lesson_id.trim() !== "") {
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
    }

    const { data, error } = await supabase
      .from("practice_questions")
      .insert({
        id,
        title,
        question,
        type,
        options: options || null,
        correct_answer: correct_answer || null,
        hint: hint || null,
        solution,
        math_explanation: math_explanation || null,
        difficulty: difficulty || null,
        tags: tags || [],
        status,
        lesson_id: lesson_id || null,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create practice question: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error("POST practice question error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create practice question" },
      { status: 500 }
    )
  }
}
