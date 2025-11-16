import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      // Redirect to home with error
      return NextResponse.redirect(`${origin}/?error=auth_failed`)
    }
    
    // Session established successfully
    if (data?.user) {
      console.log('OAuth callback successful, user:', data.user.id)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/learn`)
}
