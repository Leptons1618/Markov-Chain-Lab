import { NextRequest, NextResponse } from 'next/server'

/**
 * Admin authentication API route
 * Validates password server-side using ADMIN_PASSWORD environment variable
 * 
 * Environment variable required:
 * - ADMIN_PASSWORD: Set in AWS Amplify Hosting -> Secrets
 */

// Simple in-memory rate limiting (resets on server restart)
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Check rate limiting
    const now = Date.now()
    const attempts = loginAttempts.get(ip)
    
    if (attempts) {
      // Reset if lockout period has passed
      if (now > attempts.resetAt) {
        loginAttempts.delete(ip)
      } else if (attempts.count >= MAX_ATTEMPTS) {
        const remainingMinutes = Math.ceil((attempts.resetAt - now) / 60000)
        return NextResponse.json(
          { 
            authenticated: false,
            error: `Too many attempts. Try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`
          },
          { status: 429 }
        )
      }
    }

    // Validate environment variable is set
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

    if (!ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD environment variable is not set')
      return NextResponse.json(
        { 
          authenticated: false,
          error: 'Server configuration error. Please contact administrator.'
        },
        { status: 500 }
      )
    }

    // Validate password input
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { authenticated: false, error: 'Invalid request' },
        { status: 400 }
      )
    }

    // Check password
    if (password === ADMIN_PASSWORD) {
      // Success - clear any failed attempts
      loginAttempts.delete(ip)
      
      return NextResponse.json({ 
        authenticated: true,
        message: 'Authentication successful'
      })
    }

    // Failed attempt - increment counter
    const currentAttempts = loginAttempts.get(ip)
    if (currentAttempts) {
      currentAttempts.count++
    } else {
      loginAttempts.set(ip, {
        count: 1,
        resetAt: now + LOCKOUT_DURATION
      })
    }

    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Invalid password'
      },
      { status: 401 }
    )

  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Authentication failed'
      },
      { status: 500 }
    )
  }
}
