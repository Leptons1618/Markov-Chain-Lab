import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Delete a user account
 * Admin only endpoint
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const adminStatus = await isAdmin(user.id)
    if (!adminStatus) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const { userId } = params

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // Check if target user is admin
    const { data: targetAdmin } = await serviceClient
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    // Delete user progress
    try {
      await serviceClient
        .from('user_progress')
        .delete()
        .eq('user_id', userId)
    } catch (error) {
      console.error('Error deleting user progress:', error)
      // Continue even if this fails
    }

    // Remove from admin_users if exists
    try {
      await serviceClient
        .from('admin_users')
        .delete()
        .eq('user_id', userId)
    } catch (error) {
      console.error('Error removing from admin_users:', error)
      // Continue even if this fails
    }

    // Delete the auth user (this will cascade delete related data)
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[userId]/delete:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
