import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Force logout API route
 * Clears all session cookies and signs out the user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Sign out from Supabase
    await supabase.auth.signOut()

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear all possible Supabase cookies
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'sb-auth-token',
    ]

    // Get all cookies and clear them
    const allCookies = request.cookies.getAll()
    allCookies.forEach(({ name }) => {
      if (name.includes('supabase') || name.includes('sb-')) {
        response.cookies.delete(name)
        response.cookies.set(name, '', {
          expires: new Date(0),
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        })
      }
    })

    // Also clear the specific cookies
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
    console.error('Force logout error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to logout'
      },
      { status: 500 }
    )
  }
}
