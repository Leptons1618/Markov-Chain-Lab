import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// GET all example Markov chains (public endpoint)
export async function GET() {
  try {
    // First, try to read from JSON file as fallback
    let examplesFromFile: any[] = []
    try {
      const fs = await import("node:fs")
      const path = await import("node:path")
      const dataPath = path.join(process.cwd(), "data", "examples.json")
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, "utf8")
        examplesFromFile = JSON.parse(raw)
      }
    } catch (fileError) {
      console.warn("Could not read examples.json file:", fileError)
    }

    // Try to fetch from database
    try {
      const supabase = createServiceClient()
      
      const { data: examples, error } = await supabase
        .from("examples")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })

      if (error) {
        // If table doesn't exist, fall back to JSON file
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Examples table does not exist yet. Falling back to JSON file.')
          return NextResponse.json({ success: true, data: examplesFromFile })
        }
        // For other errors, log and fall back to JSON file
        console.warn('Database error, falling back to JSON file:', error.message)
        return NextResponse.json({ success: true, data: examplesFromFile })
      }

      // Transform database format to match expected format
      const transformedExamples = (examples || []).map((ex: any) => ({
        id: ex.id,
        title: ex.title,
        description: ex.description,
        category: ex.category,
        difficulty: ex.difficulty,
        applications: ex.applications || [],
        interactiveDemo: ex.interactive_demo || false,
        design: ex.design,
        explanation: ex.explanation,
        lessonConnections: ex.lesson_connections,
        mathematicalDetails: ex.mathematical_details,
        realWorldContext: ex.real_world_context,
        practiceQuestions: ex.practice_questions || [],
      }))

      return NextResponse.json({ success: true, data: transformedExamples })
    } catch (dbError: any) {
      // If database connection fails, fall back to JSON file
      console.warn('Database connection failed, falling back to JSON file:', dbError.message)
      return NextResponse.json({ success: true, data: examplesFromFile })
    }
  } catch (error: any) {
    console.error("GET examples error:", error)
    // Always return JSON, even on error
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch examples", data: [] },
      { status: 500 }
    )
  }
}
