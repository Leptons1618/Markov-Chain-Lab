/**
 * Progress synchronization utilities
 * Syncs progress between localStorage and Supabase
 */

import { createClient } from "@/lib/supabase/client"

export interface ProgressData {
  [lessonId: string]: {
    completed: boolean
    lastAccessedAt?: string
  }
}

/**
 * Sync progress to Supabase
 */
export async function syncProgressToSupabase(progress: ProgressData): Promise<{ error: Error | null }> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: new Error("User not authenticated") }
  }

  try {
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        progress_data: progress,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Failed to sync progress:', error)
      return { error }
    }

    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Load progress from Supabase
 */
export async function loadProgressFromSupabase(): Promise<{ progress: ProgressData | null; error: Error | null }> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { progress: null, error: new Error("User not authenticated") }
  }

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('progress_data')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Failed to load progress:', error)
      return { progress: null, error }
    }

    return { progress: data?.progress_data || null, error: null }
  } catch (err) {
    return { progress: null, error: err as Error }
  }
}

/**
 * Merge local and remote progress (remote takes precedence)
 */
export function mergeProgress(local: ProgressData, remote: ProgressData | null): ProgressData {
  if (!remote) return local
  
  // Merge: remote takes precedence, but keep local entries not in remote
  const merged = { ...local }
  Object.keys(remote).forEach(lessonId => {
    merged[lessonId] = remote[lessonId]
  })
  
  return merged
}
