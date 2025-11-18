import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase/service"
import fs from "node:fs"
import path from "node:path"

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

// POST sync examples from JSON file to database
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAccess()
    if (!authCheck.authorized) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      )
    }

    // Read examples from JSON file
    const dataPath = path.join(process.cwd(), "data", "examples.json")
    let examplesData: any[] = []
    
    try {
      const raw = fs.readFileSync(dataPath, "utf8")
      examplesData = JSON.parse(raw)
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: `Failed to read examples.json: ${error.message}` },
        { status: 500 }
      )
    }

    if (!Array.isArray(examplesData)) {
      return NextResponse.json(
        { success: false, error: "Invalid examples.json format. Expected an array." },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    }

    for (const example of examplesData) {
      try {
        // Check if example exists
        const { data: existing } = await supabase
          .from("examples")
          .select("id")
          .eq("id", example.id)
          .maybeSingle()

        const wasExisting = !!existing

        // Transform JSON format to database format
        const dbExample = {
          id: example.id,
          title: example.title,
          description: example.description,
          category: example.category || "classic",
          difficulty: example.difficulty || "beginner",
          applications: example.applications || [],
          interactive_demo: example.interactiveDemo || example.interactive_demo || false,
          design: example.design,
          explanation: example.explanation || null,
          lesson_connections: example.lessonConnections || null,
          mathematical_details: example.mathematicalDetails || null,
          real_world_context: example.realWorldContext || null,
          practice_questions: example.practiceQuestions || [],
          status: example.status || "published",
        }

        const { error } = await supabase
          .from("examples")
          .upsert(dbExample, { onConflict: "id" })

        if (error) {
          results.errors.push(`Example ${example.id}: ${error.message}`)
        } else {
          wasExisting ? results.updated++ : results.created++
        }
      } catch (error: any) {
        results.errors.push(`Example ${example.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error: any) {
    console.error("Sync examples error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync examples" },
      { status: 500 }
    )
  }
}
