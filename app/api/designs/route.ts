import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET all saved designs for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('user_designs')
      .select('design_id, name, saved_at, chain_data')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch designs:', error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch designs" },
        { status: 500 }
      )
    }

    const designs = (data || []).map(row => ({
      id: row.design_id,
      name: row.name,
      savedAt: row.saved_at,
      chain: row.chain_data,
    }))

    return NextResponse.json({ success: true, data: designs })
  } catch (error) {
    console.error('Error in GET /api/designs:', error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch designs" },
      { status: 500 }
    )
  }
}

// POST create new design
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, chain, id } = body

    if (!name || !chain) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const designId = id || `design-${Date.now()}`
    const savedAt = new Date().toISOString()

    const { data, error } = await supabase
      .from('user_designs')
      .upsert({
        user_id: user.id,
        design_id: designId,
        name,
        saved_at: savedAt,
        chain_data: chain,
      }, {
        onConflict: 'user_id,design_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to save design:', error)
      return NextResponse.json(
        { success: false, error: "Failed to create design" },
        { status: 500 }
      )
    }

    const newDesign = {
      id: data.design_id,
      name: data.name,
      savedAt: data.saved_at,
      chain: data.chain_data,
    }
    
    return NextResponse.json({ success: true, data: newDesign }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/designs:', error)
    return NextResponse.json(
      { success: false, error: "Failed to create design" },
      { status: 500 }
    )
  }
}
