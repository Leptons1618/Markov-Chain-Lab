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

// POST import practice questions from JSON
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
    const optionsJson = formData.get("options") as string | null

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

    // Read and parse file
    const fileContent = await file.text()
    let importData: any

    try {
      importData = JSON.parse(fileContent)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON format" },
        { status: 400 }
      )
    }

    // Validate structure
    if (!importData.questions || !Array.isArray(importData.questions)) {
      return NextResponse.json(
        { success: false, error: "Invalid format: missing or invalid 'questions' array" },
        { status: 400 }
      )
    }

    // Parse import options
    const importOptions = optionsJson ? JSON.parse(optionsJson) : {}
    const {
      overwriteQuestions = {},
      saveQuestionsAsNew = [],
    } = importOptions

    const supabase = createServiceClient()
    const results: any = { created: 0, updated: 0, errors: [] }

    // Process each question
    for (const question of importData.questions) {
      try {
        if (!question.id || !question.title || !question.question || !question.type || !question.solution) {
          results.errors.push(`Question missing required fields: ${question.id || "unknown"}`)
          continue
        }

        const shouldOverwrite = overwriteQuestions[question.id] === true
        const shouldSaveAsNew = saveQuestionsAsNew.includes(question.id)

        if (shouldSaveAsNew) {
          const newId = `${question.id}-${Date.now()}`
          const { error } = await supabase
            .from("practice_questions")
            .insert({
              id: newId,
              title: question.title,
              question: question.question,
              type: question.type,
              options: question.options || null,
              correct_answer: question.correct_answer || null,
              hint: question.hint || null,
              solution: question.solution,
              math_explanation: question.math_explanation || null,
              difficulty: question.difficulty || null,
              tags: question.tags || [],
              status: question.status || "draft",
              lesson_id: question.lesson_id || null,
              created_at: question.createdAt || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

          if (error) throw error
          results.created++
        } else if (shouldOverwrite) {
          const { error } = await supabase
            .from("practice_questions")
            .upsert({
              id: question.id,
              title: question.title,
              question: question.question,
              type: question.type,
              options: question.options || null,
              correct_answer: question.correct_answer || null,
              hint: question.hint || null,
              solution: question.solution,
              math_explanation: question.math_explanation || null,
              difficulty: question.difficulty || null,
              tags: question.tags || [],
              status: question.status || "draft",
              lesson_id: question.lesson_id || null,
              created_at: question.createdAt || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: "id" })

          if (error) throw error
          results.updated++
        } else {
          // Check if exists
          const { data: existing } = await supabase
            .from("practice_questions")
            .select("id")
            .eq("id", question.id)
            .single()

          if (!existing) {
            const { error } = await supabase
              .from("practice_questions")
              .insert({
                id: question.id,
                title: question.title,
                question: question.question,
                type: question.type,
                options: question.options || null,
                correct_answer: question.correct_answer || null,
                hint: question.hint || null,
                solution: question.solution,
                math_explanation: question.math_explanation || null,
                difficulty: question.difficulty || null,
                tags: question.tags || [],
                status: question.status || "draft",
                created_at: question.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })

            if (error) throw error
            results.created++
          }
        }
      } catch (error: any) {
        results.errors.push(`Question ${question.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error: any) {
    console.error("Import error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to import practice questions" },
      { status: 500 }
    )
  }
}
