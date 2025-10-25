import { type NextRequest, NextResponse } from "next/server"
import { getDesignStore, saveDesignStore } from "@/lib/server/design-store"

// GET all saved designs
export async function GET() {
  try {
    const { designs } = getDesignStore()
    return NextResponse.json({ success: true, data: designs })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch designs" }, { status: 500 })
  }
}

// POST create new design
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, chain } = body

    if (!name || !chain) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const newDesign = {
      id: `design-${Date.now()}`,
      name,
      savedAt: new Date().toISOString(),
      chain,
    }

    const store = getDesignStore()
    store.designs.push(newDesign)
    await saveDesignStore()
    
    return NextResponse.json({ success: true, data: newDesign }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create design" }, { status: 500 })
  }
}
