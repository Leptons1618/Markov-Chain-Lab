import { type NextRequest, NextResponse } from "next/server"
import { getDesignStore, saveDesignStore } from "@/lib/server/design-store"

// DELETE a specific design
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const store = getDesignStore()
    const initialLength = store.designs.length
    store.designs = store.designs.filter((d) => d.id !== id)
    
    if (store.designs.length === initialLength) {
      return NextResponse.json({ success: false, error: "Design not found" }, { status: 404 })
    }
    
    await saveDesignStore()
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete design" }, { status: 500 })
  }
}
