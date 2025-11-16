"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { isGuestMode, setGuestMode, type AuthState } from "@/lib/auth"
import { loadProgressFromSupabase, syncProgressToSupabase, mergeProgress } from "@/lib/progress-sync"

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  deleteAccount: () => Promise<{ error: Error | null }>
  enableGuestMode: () => void
  disableGuestMode: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    // Create supabase client inside useEffect to avoid SSR issues
    let supabase: ReturnType<typeof createClient> | null = null
    try {
      supabase = createClient()
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error)
      setLoading(false)
      return
    }

    if (!supabase) {
      setLoading(false)
      return
    }

    // Check guest mode first
    const guest = isGuestMode()
    setIsGuest(guest)

    if (guest) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
        setUser(null)
        setLoading(false)
        return
      }

      // Set user from session - don't verify immediately to avoid timing issues
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Verify user exists asynchronously (only to detect deleted accounts)
      if (session?.user) {
        // Delay verification slightly to ensure session is fully established
        setTimeout(async () => {
          try {
            const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
            
            // Only clear if we get a specific error indicating user doesn't exist
            // Don't clear on network errors or other transient issues
            if (userError) {
              const errorMsg = userError.message?.toLowerCase() || ''
              // Only act on specific errors that indicate user was deleted
              if ((errorMsg.includes('jwt') && errorMsg.includes('expired')) || 
                  errorMsg.includes('user not found') ||
                  errorMsg.includes('invalid user')) {
                // Session is invalid, but don't clear immediately - let auth state change handle it
                console.log('Session validation issue detected')
              }
            }
          } catch (err) {
            // Ignore verification errors - don't clear session on transient errors
            console.error('Error verifying user (non-critical):', err)
          }
        }, 1000)
      }
    }).catch((error) => {
      console.error('Failed to get session:', error)
      setUser(null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null
      
      // Handle sign out event
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsGuest(false)
        setGuestMode(false)
        if (typeof window !== 'undefined') {
          sessionStorage.clear()
        }
        return
      }
      
      // Set user immediately - don't wait for verification
      setUser(newUser)
      
      if (newUser) {
        setIsGuest(false)
        setGuestMode(false)
        
        // Create initial user_progress record on sign-up/sign-in
        if (event === 'SIGNED_UP' || event === 'SIGNED_IN') {
          try {
            // Small delay to ensure session is fully established
            setTimeout(async () => {
              try {
                // Initialize progress record if it doesn't exist
                await syncProgressToSupabase({})
              } catch (error) {
                console.error('Failed to initialize progress record:', error)
              }
            }, 500)
          } catch (error) {
            console.error('Failed to initialize progress record:', error)
          }
        }
        
        // Sync progress from Supabase when user signs in
        // Add delay to ensure session is ready
        setTimeout(async () => {
          try {
            const { progress: remoteProgress, error: progressError } = await loadProgressFromSupabase()
            
            if (progressError && !progressError.message?.includes('not authenticated')) {
              console.error('Failed to load progress:', progressError)
              return
            }
            
            if (remoteProgress) {
              // Merge with local progress
              const localProgress = localStorage.getItem('markov-learn-progress')
              if (localProgress) {
                try {
                  const local = JSON.parse(localProgress)
                  const merged = mergeProgress(local, remoteProgress)
                  localStorage.setItem('markov-learn-progress', JSON.stringify(merged))
                  // Sync merged progress back to Supabase
                  await syncProgressToSupabase(merged)
                } catch (e) {
                  console.error('Failed to merge progress:', e)
                }
              } else {
                // No local progress, use remote
                localStorage.setItem('markov-learn-progress', JSON.stringify(remoteProgress))
              }
            } else {
              // No remote progress, sync local to remote if exists
              const localProgress = localStorage.getItem('markov-learn-progress')
              if (localProgress) {
                try {
                  const local = JSON.parse(localProgress)
                  await syncProgressToSupabase(local)
                } catch (e) {
                  console.error('Failed to sync local progress:', e)
                }
              } else {
                // No local or remote progress - create empty record
                try {
                  await syncProgressToSupabase({})
                } catch (e) {
                  console.error('Failed to create initial progress record:', e)
                }
              }
            }
          } catch (error) {
            console.error('Failed to sync progress on sign in:', error)
          }
        }, 1000)
        
        // Verify user exists asynchronously (only to detect deleted accounts)
        // Don't block sign-in flow
        setTimeout(async () => {
          try {
            const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser()
            
            // Only clear if we get a specific error indicating user was deleted
            // Check for JWT errors or user not found errors
            if (verifyError) {
              const errorMsg = verifyError.message?.toLowerCase() || ''
              // Only act on specific errors that indicate user was deleted
              // Don't clear on transient errors like network issues
              if ((errorMsg.includes('jwt') && errorMsg.includes('expired')) || 
                  errorMsg.includes('user not found') ||
                  errorMsg.includes('invalid user') ||
                  (errorMsg.includes('jwt') && errorMsg.includes('invalid'))) {
                console.log('User account appears to be deleted, clearing session')
                await supabase.auth.signOut()
                setUser(null)
                setIsGuest(false)
                setGuestMode(false)
                if (typeof window !== 'undefined') {
                  localStorage.clear()
                  sessionStorage.clear()
                }
              }
            } else if (!verifiedUser) {
              // User doesn't exist - account was deleted
              console.log('User account no longer exists, clearing session')
              await supabase.auth.signOut()
              setUser(null)
              setIsGuest(false)
              setGuestMode(false)
              if (typeof window !== 'undefined') {
                localStorage.clear()
                sessionStorage.clear()
              }
            }
          } catch (err) {
            // Ignore verification errors - don't clear session on transient errors
            console.error('Error verifying user (non-critical):', err)
          }
        }, 2000)
      } else {
        setUser(null)
      }
    })

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const supabase = createClient()
      // Get site URL from environment variable or fallback to window.location.origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
            full_name: name || email.split('@')[0],
          },
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const supabase = createClient()
      // Get site URL from environment variable or fallback to window.location.origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/auth/callback`,
        },
      })
    } catch (error) {
      console.error('Failed to sign in with Google:', error)
    }
  }

  const signOut = async () => {
    try {
      const supabase = createClient()
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Supabase sign out error:', error)
      }
      
      // Clear all local state immediately
      setUser(null)
      setIsGuest(false)
      setGuestMode(false)
      
      // Clear all storage
      if (typeof window !== 'undefined') {
        // Clear session storage
        sessionStorage.clear()
        // Note: We keep localStorage progress for guest mode, but clear auth-related items
        // If you want to clear everything, uncomment the next line:
        // localStorage.clear()
      }
      
      // Force a page reload to ensure all state is cleared
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Failed to sign out:', error)
      // Still clear local state even if signOut fails
      setUser(null)
      setIsGuest(false)
      setGuestMode(false)
      
      // Force redirect even on error
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const supabase = createClient()
      // Get site URL from environment variable or fallback to window.location.origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/reset-password`,
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const deleteAccount = async () => {
    try {
      // Delete the account first
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        return { error: new Error(data.error || 'Failed to delete account') }
      }

      // Sign out from Supabase to clear session cookies
      try {
        const supabase = createClient()
        await supabase.auth.signOut()
      } catch (signOutError) {
        console.error('Error signing out:', signOutError)
        // Continue even if sign out fails
      }

      // Clear all local state immediately
      setUser(null)
      setIsGuest(false)
      setGuestMode(false)

      // Clear all storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        
        // Clear all cookies (including Supabase cookies)
        const cookies = document.cookie.split(";")
        cookies.forEach((c) => {
          const eqPos = c.indexOf("=")
          const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
          if (name) {
            // Clear for current path
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
            // Clear for root path
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
            // Clear without domain
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          }
        })
      }

      // Small delay to ensure cookies are cleared, then force hard redirect
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          // Force a complete page reload to clear all state
          window.location.replace('/')
        }
      }, 100)

      return { error: null }
    } catch (error) {
      // Even on error, try to clear session
      try {
        const supabase = createClient()
        await supabase.auth.signOut()
        setUser(null)
        setIsGuest(false)
        setGuestMode(false)
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
      } catch {}
      
      return { error: error as Error }
    }
  }

  const enableGuestMode = () => {
    setGuestMode(true)
    setIsGuest(true)
    setUser(null)
  }

  const disableGuestMode = () => {
    setGuestMode(false)
    setIsGuest(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        deleteAccount,
        enableGuestMode,
        disableGuestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
