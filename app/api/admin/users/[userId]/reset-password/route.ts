import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Send password reset email to a user
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

    // Get user email
    const { data: targetUser, error: userError } = await serviceClient.auth.admin.getUserById(userId)

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userEmail = targetUser.user.email

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    // Generate password reset link and send email
    const { data, error: resetError } = await serviceClient.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
    })

    if (resetError) {
      console.error('Error generating reset link:', resetError)
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/admin/users/[userId]/reset-password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
