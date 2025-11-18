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

// GET export practice questions as JSON
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

    // Fetch all practice questions
    const { data: questions, error } = await supabase
      .from("practice_questions")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch practice questions: ${error.message}`)
    }

    // Transform database format to export format
    const exportData = {
      questions: (questions || []).map((q) => ({
        id: q.id,
        title: q.title,
        question: q.question,
        type: q.type,
        options: q.options,
        correct_answer: q.correct_answer,
        hint: q.hint,
        solution: q.solution,
        math_explanation: q.math_explanation,
        difficulty: q.difficulty,
        tags: q.tags || [],
        status: q.status,
        createdAt: q.created_at,
        updatedAt: q.updated_at,
      })),
    }

    // Return as JSON with proper headers for download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="practice-questions-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error: any) {
    console.error("Export error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export practice questions" },
      { status: 500 }
    )
  }
}
