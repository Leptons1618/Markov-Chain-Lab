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

// GET all examples
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
      .from("examples")
      .select("*")
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data: examples, error } = await query

    if (error) {
      // Handle table not found error gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Examples table does not exist yet. Run migrations first.')
        return NextResponse.json({
          success: true,
          data: [],
        })
      }
      throw new Error(`Failed to fetch examples: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      data: examples || [],
    })
  } catch (error: any) {
    console.error("GET examples error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch examples" },
      { status: 500 }
    )
  }
}

// POST create new example
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
      description,
      category,
      difficulty,
      applications,
      interactive_demo,
      design,
      explanation,
      lesson_connections,
      mathematical_details,
      real_world_context,
      practice_questions,
      status = "draft",
    } = body

    // Validation
    if (!id || !title || !description || !category || !difficulty || !design) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: id, title, description, category, difficulty, design" },
        { status: 400 }
      )
    }

    if (!["classic", "modern"].includes(category)) {
      return NextResponse.json(
        { success: false, error: "Invalid category. Must be 'classic' or 'modern'" },
        { status: 400 }
      )
    }

    if (!["beginner", "intermediate", "advanced"].includes(difficulty)) {
      return NextResponse.json(
        { success: false, error: "Invalid difficulty. Must be 'beginner', 'intermediate', or 'advanced'" },
        { status: 400 }
      )
    }

    // Validate design structure
    if (!design.states || !Array.isArray(design.states) || design.states.length === 0) {
      return NextResponse.json(
        { success: false, error: "Design must have at least one state" },
        { status: 400 }
      )
    }

    if (!design.transitions || !Array.isArray(design.transitions)) {
      return NextResponse.json(
        { success: false, error: "Design must have transitions array" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("examples")
      .insert({
        id,
        title,
        description,
        category,
        difficulty,
        applications: applications || [],
        interactive_demo: interactive_demo || false,
        design,
        explanation: explanation || null,
        lesson_connections: lesson_connections || null,
        mathematical_details: mathematical_details || null,
        real_world_context: real_world_context || null,
        practice_questions: practice_questions || [],
        status,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create example: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error("POST example error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create example" },
      { status: 500 }
    )
  }
}
