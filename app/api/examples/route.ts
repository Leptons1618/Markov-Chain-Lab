import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"

// GET all example Markov chains
export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), "data", "examples.json")
    const raw = fs.readFileSync(dataPath, "utf8")
    const examples = JSON.parse(raw)
    return NextResponse.json({ success: true, data: examples })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch examples" }, { status: 500 })
  }
}
