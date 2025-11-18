import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Get detailed user information
 * Admin only endpoint
 */
export async function GET(
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

    // Get user from auth.users
    const { data: targetUser, error: userError } = await serviceClient.auth.admin.getUserById(userId)

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is admin
    const { data: adminUser } = await serviceClient
      .from('admin_users')
      .select('user_id, email, created_at')
      .eq('user_id', userId)
      .single()

    // Get user progress
    const { data: userProgress, error: progressError } = await serviceClient
      .from('user_progress')
      .select('user_id, progress_data')
      .eq('user_id', userId)
      .single()

    const progress = userProgress?.progress_data || {}
    const totalLessons = Object.keys(progress).length
    const completedLessons = Object.values(progress).filter((p: any) => p.completed).length
    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

    // Get detailed lesson progress
    const lessonProgress = Object.entries(progress).map(([lessonId, progressData]: [string, any]) => ({
      lessonId,
      completed: progressData.completed || false,
      lastAccessed: progressData.lastAccessed || null,
      progress: progressData.progress || 0,
    }))

    return NextResponse.json({
      user: {
        id: targetUser.user.id,
        email: targetUser.user.email,
        name: targetUser.user.user_metadata?.name || targetUser.user.email?.split('@')[0] || 'User',
        createdAt: targetUser.user.created_at,
        lastSignIn: targetUser.user.last_sign_in_at,
        emailVerified: targetUser.user.email_confirmed_at !== null,
        phone: targetUser.user.phone,
        metadata: targetUser.user.user_metadata,
      },
      isAdmin: !!adminUser,
      adminInfo: adminUser ? {
        createdAt: adminUser.created_at,
      } : null,
      progress: {
        totalLessons,
        completedLessons,
        percentage: Math.round(progressPercentage),
        lessonProgress,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/users/[userId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
