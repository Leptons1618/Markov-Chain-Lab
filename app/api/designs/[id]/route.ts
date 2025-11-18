import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// DELETE a specific design
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { id } = await params

    const { error } = await supabase
      .from('user_designs')
      .delete()
      .eq('user_id', user.id)
      .eq('design_id', id)
    
    if (error) {
      console.error('Failed to delete design:', error)
      return NextResponse.json(
        { success: false, error: "Failed to delete design" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/designs/[id]:', error)
    return NextResponse.json(
      { success: false, error: "Failed to delete design" },
      { status: 500 }
    )
  }
}
