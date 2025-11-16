/**
 * Admin authentication utilities
 * Checks if a user is an admin using Supabase
 */

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export interface AdminUser {
  user_id: string
  email: string
  created_at: string
}

/**
 * Check if a user is an admin
 * Uses service role client to bypass RLS policies
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    // Use service client to bypass RLS since admin_users table blocks all access
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking admin status:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Failed to check admin status:', error)
    return false
  }
}

/**
 * Get admin user by ID
 */
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  try {
    // Use service client to bypass RLS
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    console.error('Failed to get admin user:', error)
    return null
  }
}

/**
 * Get current authenticated admin user
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }

    return await getAdminUser(user.id)
  } catch (error) {
    console.error('Failed to get current admin:', error)
    return null
  }
}
