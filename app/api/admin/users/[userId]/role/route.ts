import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Update user role (add/remove admin)
 * Admin only endpoint
 */
export async function POST(
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
    const body = await request.json()
    const { isAdmin: makeAdmin } = body

    if (typeof makeAdmin !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request. isAdmin must be a boolean.' },
        { status: 400 }
      )
    }

    // Prevent self-demotion
    if (userId === user.id && !makeAdmin) {
      return NextResponse.json(
        { error: 'You cannot remove your own admin privileges.' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // Get user email from auth.users
    const { data: targetUser, error: userError } = await serviceClient.auth.admin.getUserById(userId)

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userEmail = targetUser.user.email

    if (makeAdmin) {
      // Add admin role
      const { error: insertError } = await serviceClient
        .from('admin_users')
        .upsert({
          user_id: userId,
          email: userEmail,
        }, {
          onConflict: 'user_id'
        })

      if (insertError) {
        console.error('Error adding admin:', insertError)
        return NextResponse.json(
          { error: 'Failed to add admin role' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Admin role added successfully',
      })
    } else {
      // Remove admin role
      const { error: deleteError } = await serviceClient
        .from('admin_users')
        .delete()
        .eq('user_id', userId)

      if (deleteError) {
        console.error('Error removing admin:', deleteError)
        return NextResponse.json(
          { error: 'Failed to remove admin role' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Admin role removed successfully',
      })
    }
  } catch (error) {
    console.error('Error in POST /api/admin/users/[userId]/role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
