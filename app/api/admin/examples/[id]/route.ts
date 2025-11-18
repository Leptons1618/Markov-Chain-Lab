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

// GET single example
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAdminAccess()
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { id } = await params
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("examples")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Example not found" },
          { status: 404 }
        )
      }
      throw new Error(`Failed to fetch example: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error("GET example error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch example" },
      { status: 500 }
    )
  }
}

// PUT update example
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAdminAccess()
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()
    const {
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
      status,
    } = body

    const supabase = createServiceClient()

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) {
      if (!["classic", "modern"].includes(category)) {
        return NextResponse.json(
          { success: false, error: "Invalid category" },
          { status: 400 }
        )
      }
      updateData.category = category
    }
    if (difficulty !== undefined) {
      if (!["beginner", "intermediate", "advanced"].includes(difficulty)) {
        return NextResponse.json(
          { success: false, error: "Invalid difficulty" },
          { status: 400 }
        )
      }
      updateData.difficulty = difficulty
    }
    if (applications !== undefined) updateData.applications = applications
    if (interactive_demo !== undefined) updateData.interactive_demo = interactive_demo
    if (design !== undefined) {
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
      updateData.design = design
    }
    if (explanation !== undefined) updateData.explanation = explanation
    if (lesson_connections !== undefined) updateData.lesson_connections = lesson_connections
    if (mathematical_details !== undefined) updateData.mathematical_details = mathematical_details
    if (real_world_context !== undefined) updateData.real_world_context = real_world_context
    if (practice_questions !== undefined) updateData.practice_questions = practice_questions
    if (status !== undefined) updateData.status = status

    const { data, error } = await supabase
      .from("examples")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Example not found" },
          { status: 404 }
        )
      }
      throw new Error(`Failed to update example: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error("PUT example error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update example" },
      { status: 500 }
    )
  }
}

// DELETE example
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAdminAccess()
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    const { id } = await params
    const supabase = createServiceClient()

    const { error } = await supabase
      .from("examples")
      .delete()
      .eq("id", id)

    if (error) {
      throw new Error(`Failed to delete example: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("DELETE example error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete example" },
      { status: 500 }
    )
  }
}
