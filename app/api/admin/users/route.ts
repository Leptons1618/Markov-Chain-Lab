import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Get all users with their progress and admin status
 * Admin only endpoint
 */
export async function GET(request: NextRequest) {
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

    // Use service client to access auth.users and related tables
    const serviceClient = createServiceClient()

    // Get all users from auth.users using admin API
    let authUsers: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      try {
        const { data, error: usersError } = await serviceClient.auth.admin.listUsers({
          page,
          perPage: 1000,
        })

        if (usersError) {
          console.error('Error fetching users:', usersError)
          // If admin API fails, try alternative approach
          break
        }

        if (data?.users && data.users.length > 0) {
          authUsers.push(...data.users)
          hasMore = data.users.length === 1000
          page++
        } else {
          hasMore = false
        }
      } catch (err) {
        console.error('Error in listUsers:', err)
        hasMore = false
      }
    }

    // Get all admin users
    const { data: adminUsers, error: adminError } = await serviceClient
      .from('admin_users')
      .select('user_id, email')

    if (adminError) {
      console.error('Error fetching admin users:', adminError)
    }

    const adminUserIds = new Set((adminUsers || []).map(au => au.user_id))

    // Get all user progress
    const { data: userProgress, error: progressError } = await serviceClient
      .from('user_progress')
      .select('user_id, progress_data')

    if (progressError) {
      console.error('Error fetching user progress:', progressError)
    }

    const progressMap = new Map(
      (userProgress || []).map(up => [up.user_id, up.progress_data || {}])
    )

    // Combine user data with progress and admin status
    const usersWithDetails = authUsers.map(authUser => {
      const progress = progressMap.get(authUser.id) || {}
      const totalLessons = Object.keys(progress).length
      const completedLessons = Object.values(progress).filter((p: any) => p.completed).length
      const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        createdAt: authUser.created_at,
        lastSignIn: authUser.last_sign_in_at,
        isAdmin: adminUserIds.has(authUser.id),
        progress: {
          totalLessons,
          completedLessons,
          percentage: Math.round(progressPercentage),
        },
      }
    })

    // Sort by created date (newest first)
    usersWithDetails.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({ users: usersWithDetails })
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
