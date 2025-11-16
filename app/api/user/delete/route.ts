import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Delete user account API route
 * Deletes user account and all associated data
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Not authenticated'
        },
        { status: 401 }
      )
    }

    const serviceClient = createServiceClient()

    // Delete user progress
    try {
      await serviceClient
        .from('user_progress')
        .delete()
        .eq('user_id', user.id)
    } catch (error) {
      console.error('Error deleting user progress:', error)
      // Continue even if this fails
    }

    // Remove from admin_users if exists
    try {
      await serviceClient
        .from('admin_users')
        .delete()
        .eq('user_id', user.id)
    } catch (error) {
      console.error('Error removing from admin_users:', error)
      // Continue even if this fails
    }

    // Sign out the user first to clear session
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out user:', error)
      // Continue with deletion even if sign out fails
    }

    // Delete the auth user (this will cascade delete related data)
    try {
      const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user.id)
      
      if (deleteError) {
        console.error('Error deleting user:', deleteError)
        return NextResponse.json(
          { 
            success: false,
            error: deleteError.message || 'Failed to delete account'
          },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to delete account'
        },
        { status: 500 }
      )
    }

    // Create response and clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })

    // Clear all Supabase auth cookies
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
    ]

    cookiesToClear.forEach(cookieName => {
      response.cookies.delete(cookieName)
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
    })

    return response
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'An error occurred while deleting your account'
      },
      { status: 500 }
    )
  }
}
