/**
 * Design sync utilities
 * Syncs user designs between localStorage and Supabase
 */

import { createClient } from "@/lib/supabase/client"

export interface SavedDesign {
  id: string
  name: string
  savedAt: string
  chain: {
    states: Array<{
      id: string
      name: string
      x: number
      y: number
      color: string
    }>
    transitions: Array<{
      id: string
      from: string
      to: string
      probability: number
    }>
  }
}

/**
 * Sync designs to Supabase
 */
export async function syncDesignsToSupabase(designs: SavedDesign[]): Promise<{ error: Error | null }> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: new Error("User not authenticated") }
  }

  try {
    // Delete all existing designs for this user
    const { error: deleteError } = await supabase
      .from('user_designs')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Failed to delete existing designs:', deleteError)
      return { error: deleteError }
    }

    // Insert all designs
    if (designs.length > 0) {
      const designsToInsert = designs.map(design => ({
        user_id: user.id,
        design_id: design.id,
        name: design.name,
        saved_at: design.savedAt,
        chain_data: design.chain,
      }))

      const { error: insertError } = await supabase
        .from('user_designs')
        .insert(designsToInsert)

      if (insertError) {
        console.error('Failed to sync designs:', insertError)
        return { error: insertError }
      }
    }

    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Load designs from Supabase
 */
export async function loadDesignsFromSupabase(): Promise<{ designs: SavedDesign[] | null; error: Error | null }> {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      // Auth error - user not authenticated or session expired
      return { designs: null, error: new Error("User not authenticated") }
    }
    
    if (!user) {
      return { designs: null, error: new Error("User not authenticated") }
    }

    const { data, error } = await supabase
      .from('user_designs')
      .select('design_id, name, saved_at, chain_data')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })

    if (error) {
      // PGRST116 = no rows returned (not an error, just empty result)
      // 42P01 = relation does not exist (table doesn't exist yet)
      // Check for empty error objects or specific codes that indicate "no data" not "error"
      if (error.code === 'PGRST116' || error.code === '42P01' || (error.code && !error.message)) {
        // Table doesn't exist or no rows - return empty array (not an error)
        return { designs: [], error: null }
      }
      
      // Only log actual errors
      if (error.message) {
        console.warn('Failed to load designs from database:', error.message)
      }
      
      // Return empty array instead of error for graceful degradation
      return { designs: [], error: null }
    }

    const designs: SavedDesign[] = (data || []).map(row => ({
      id: row.design_id,
      name: row.name,
      savedAt: row.saved_at,
      chain: row.chain_data,
    }))

    return { designs, error: null }
  } catch (err) {
    // Catch any unexpected errors and return empty array (graceful degradation)
    console.warn('Exception loading designs, using fallback:', err)
    return { designs: [], error: null }
  }
}

/**
 * Save a single design to Supabase
 */
export async function saveDesignToSupabase(design: SavedDesign): Promise<{ error: Error | null }> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: new Error("User not authenticated") }
  }

  try {
    const { error } = await supabase
      .from('user_designs')
      .upsert({
        user_id: user.id,
        design_id: design.id,
        name: design.name,
        saved_at: design.savedAt,
        chain_data: design.chain,
      }, {
        onConflict: 'user_id,design_id'
      })

    if (error) {
      console.error('Failed to save design:', error)
      return { error }
    }

    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Delete a design from Supabase
 */
export async function deleteDesignFromSupabase(designId: string): Promise<{ error: Error | null }> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: new Error("User not authenticated") }
  }

  try {
    const { error } = await supabase
      .from('user_designs')
      .delete()
      .eq('user_id', user.id)
      .eq('design_id', designId)

    if (error) {
      console.error('Failed to delete design:', error)
      return { error }
    }

    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Merge local and remote designs (remote takes precedence for conflicts)
 */
export function mergeDesigns(local: SavedDesign[], remote: SavedDesign[] | null): SavedDesign[] {
  if (!remote || remote.length === 0) {
    return local
  }

  // Create a map of remote designs by ID
  const remoteMap = new Map<string, SavedDesign>()
  remote.forEach(design => {
    remoteMap.set(design.id, design)
  })

  // Merge: remote designs take precedence
  const merged: SavedDesign[] = []
  const localIds = new Set<string>()

  // Add all remote designs
  remote.forEach(design => {
    merged.push(design)
    localIds.add(design.id)
  })

  // Add local designs that don't exist in remote
  local.forEach(design => {
    if (!localIds.has(design.id)) {
      merged.push(design)
    }
  })

  // Sort by savedAt (newest first)
  merged.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())

  return merged
}
