import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Reset user progress
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
    const serviceClient = createServiceClient()

    // Verify user exists
    const { data: targetUser, error: userError } = await serviceClient.auth.admin.getUserById(userId)

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Reset user progress to empty object
    const { error: updateError } = await serviceClient
      .from('user_progress')
      .upsert({
        user_id: userId,
        progress_data: {},
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (updateError) {
      console.error('Error resetting progress:', updateError)
      return NextResponse.json(
        { error: 'Failed to reset user progress' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User progress reset successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/admin/users/[userId]/reset-progress:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
