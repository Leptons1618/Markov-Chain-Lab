import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname

  // Only create Supabase client for routes that need auth
  // Skip API routes, static assets, and _next files to avoid unnecessary checks
  const needsAuthCheck = 
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_next/') &&
    !pathname.startsWith('/favicon') &&
    (pathname.startsWith('/auth/') || 
     pathname.startsWith('/admin') ||
     pathname.startsWith('/learn') ||
     pathname === '/')

  if (needsAuthCheck) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Only check user for routes that need authentication verification
    // For most routes, Supabase SSR will handle token refresh automatically via cookies
    if (pathname.startsWith('/auth/reset-password')) {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        
        // Handle refresh token errors silently - these are expected when tokens expire
        if (error) {
          const errorCode = error.code || ''
          const errorMessage = error.message?.toLowerCase() || ''
          
          // Refresh token errors are expected and should be handled silently
          if (errorCode === 'refresh_token_not_found' || 
              errorMessage.includes('refresh_token') ||
              errorMessage.includes('invalid refresh token')) {
            // Silent fail - user will need to sign in again
            // Allow through - the page will handle showing appropriate UI
          } else {
            // Log other auth errors
            console.error('Auth error in middleware:', error)
          }
        } else if (!user) {
          return NextResponse.redirect(new URL('/learn', request.url))
        }
      } catch (error: any) {
        // Handle unexpected errors
        const errorCode = error?.code || ''
        const errorMessage = error?.message?.toLowerCase() || ''
        
        if (errorCode !== 'refresh_token_not_found' && 
            !errorMessage.includes('refresh_token') &&
            !errorMessage.includes('invalid refresh token')) {
          // Only log unexpected errors
          console.error('Unexpected auth error in middleware:', error)
        }
      }
    }
    // For other routes, Supabase SSR handles token refresh automatically
    // No need to call getUser() - it will refresh via cookie handling

    // For admin routes, don't check admin status here - let AdminLayout handle it
    // This prevents blocking database queries in middleware and avoids refresh token errors
    // AdminLayout already checks admin status client-side with proper error handling
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * - static assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
}
