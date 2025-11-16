import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin-auth'

/**
 * Admin authentication API route
 * Validates user authentication via Supabase and checks admin status
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { 
          authenticated: false,
          isAdmin: false,
          error: 'Not authenticated'
        },
        { status: 401 }
      )
    }

    const adminStatus = await isAdmin(user.id)

    return NextResponse.json({
      authenticated: true,
      isAdmin: adminStatus,
      user: {
        id: user.id,
        email: user.email,
      }
    })
  } catch (error) {
    console.error('Admin auth check error:', error)
    return NextResponse.json(
      { 
        authenticated: false,
        isAdmin: false,
        error: 'Authentication check failed'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { 
          authenticated: false,
          isAdmin: false,
          error: 'Please sign in first'
        },
        { status: 401 }
      )
    }

    const adminStatus = await isAdmin(user.id)

    if (!adminStatus) {
      return NextResponse.json(
        { 
          authenticated: true,
          isAdmin: false,
          error: 'Access denied. Admin privileges required.'
        },
        { status: 403 }
      )
    }

    return NextResponse.json({ 
      authenticated: true,
      isAdmin: true,
      message: 'Admin access granted',
      user: {
        id: user.id,
        email: user.email,
      }
    })
  } catch (error) {
    console.error('Admin authentication error:', error)
    return NextResponse.json(
      { 
        authenticated: false,
        isAdmin: false,
        error: 'Authentication failed'
      },
      { status: 500 }
    )
  }
}
