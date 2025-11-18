"use client"

import { ReactNode, useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, LayoutDashboard, Users } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { usePathname, useRouter } from "next/navigation"
import { DeleteAccountDialog } from "@/components/auth/delete-account-dialog"
import { MainNav } from "@/components/main-nav"
import Link from "next/link"

interface AdminLayoutProps {
  children: ReactNode
}

// Cache admin status to avoid repeated checks
let adminStatusCache: { userId: string | null; isAdmin: boolean; timestamp: number } = {
  userId: null,
  isAdmin: false,
  timestamp: 0,
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Function to clear admin cache (useful when user logs out or account is deleted)
export function clearAdminCache() {
  adminStatusCache = {
    userId: null,
    isAdmin: false,
    timestamp: 0,
  }
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [privilegesRevoked, setPrivilegesRevoked] = useState(false)
  const [userDeleted, setUserDeleted] = useState(false)
  const previousAdminStatusRef = useRef<boolean | null>(null)

  // Check admin status with caching - memoized to prevent hook order issues
  const checkAdminStatus = useCallback(async (skipCache = false) => {
    if (!user) {
      setIsAdmin(false)
      setCheckingAuth(false)
      adminStatusCache = { userId: null, isAdmin: false, timestamp: 0 }
      return
    }

    // Check cache first (unless skipCache is true)
    const now = Date.now()
    if (
      !skipCache &&
      adminStatusCache.userId === user.id &&
      now - adminStatusCache.timestamp < CACHE_DURATION
    ) {
      const cachedStatus = adminStatusCache.isAdmin
      setIsAdmin(cachedStatus)
      setCheckingAuth(false)
      // If user was admin but now isn't (from cache), show revoked message
      if (previousAdminStatusRef.current === true && !cachedStatus) {
        setPrivilegesRevoked(true)
      }
      previousAdminStatusRef.current = cachedStatus
      return
    }

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'GET',
        credentials: 'include',
      })
      
      // Check if user was deleted (401 or 404)
      if (response.status === 401 || response.status === 404) {
        setUserDeleted(true)
        setIsAdmin(false)
        setCheckingAuth(false)
        return
      }

      const data = await response.json()
      const adminStatus = data.isAdmin || false
      
      // Check if privileges were revoked (was admin, now not admin)
      // Use ref to track previous state
      if (previousAdminStatusRef.current === true && !adminStatus) {
        setPrivilegesRevoked(true)
        clearAdminCache()
      }
      
      // Update states
      setIsAdmin(adminStatus)
      previousAdminStatusRef.current = adminStatus
      
      // Update cache
      adminStatusCache = {
        userId: user.id,
        isAdmin: adminStatus,
        timestamp: now,
      }
    } catch (error) {
      console.error('Failed to check admin status:', error)
      setIsAdmin(false)
    } finally {
      setCheckingAuth(false)
    }
  }, [user])

  // Initial check
  useEffect(() => {
    if (user) {
      // Set initial previous admin status based on cache
      const cachedWasAdmin = adminStatusCache.userId === user.id ? adminStatusCache.isAdmin : false
      previousAdminStatusRef.current = cachedWasAdmin
    } else {
      previousAdminStatusRef.current = null
    }
    checkAdminStatus()
  }, [user, checkAdminStatus])

  // Set up Realtime subscription for admin status changes
  useEffect(() => {
    // Always call hooks - use early return after hook setup
    if (!user || checkingAuth) {
      return
    }

    let channel: ReturnType<typeof import('@/lib/supabase/client').createClient>['channel'] | null = null
    let fallbackInterval: NodeJS.Timeout | null = null

    // Import createClient dynamically to avoid SSR issues
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      
      // Subscribe to a channel for this user's admin status changes
      channel = supabase
        .channel(`admin-status:${user.id}`, {
          config: {
            broadcast: { self: true },
          },
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'admin_users',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Admin status change detected:', payload)
            
            // If DELETE event, privileges were revoked
            if (payload.eventType === 'DELETE') {
              if (previousAdminStatusRef.current === true) {
                setPrivilegesRevoked(true)
                clearAdminCache()
              }
              setIsAdmin(false)
              previousAdminStatusRef.current = false
            }
            // If INSERT event, privileges were granted
            else if (payload.eventType === 'INSERT') {
              setIsAdmin(true)
              previousAdminStatusRef.current = true
              setPrivilegesRevoked(false)
              // Update cache
              adminStatusCache = {
                userId: user.id,
                isAdmin: true,
                timestamp: Date.now(),
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to admin status changes')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Realtime channel error - falling back to periodic check')
            // Fallback: if Realtime fails, do periodic checks
            if (!fallbackInterval) {
              fallbackInterval = setInterval(() => {
                checkAdminStatus(true)
              }, 30000) // Check every 30 seconds as fallback
            }
          }
        })
    }).catch((error) => {
      console.error('Failed to set up Realtime subscription:', error)
      // Fallback: if Realtime fails, do periodic checks
      if (!fallbackInterval) {
        fallbackInterval = setInterval(() => {
          checkAdminStatus(true)
        }, 30000) // Check every 30 seconds as fallback
      }
    })

    return () => {
      if (channel) {
        import('@/lib/supabase/client').then(({ createClient }) => {
          const supabase = createClient()
          supabase.removeChannel(channel!)
        }).catch(() => {
          // Ignore cleanup errors
        })
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval)
      }
    }
  }, [user, checkingAuth, checkAdminStatus])

  // Also listen for auth state changes (user deletion)
  useEffect(() => {
    // Always call hooks - use early return after hook setup
    if (!user) {
      return
    }

    let subscription: { unsubscribe: () => void } | null = null

    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        // If user is signed out unexpectedly, they might have been deleted
        if (event === 'SIGNED_OUT' && session === null) {
          setUserDeleted(true)
        }
        // If token refresh fails, user might be deleted
        if (event === 'TOKEN_REFRESHED' && !session?.user) {
          setUserDeleted(true)
        }
      })

      subscription = authSubscription
    }).catch((error) => {
      console.error('Failed to set up auth state listener:', error)
    })

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const handleLogout = useCallback(async () => {
    // signOut already handles redirect, so just call it
    await signOut()
  }, [signOut])

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/courses", label: "Courses" },
    { href: "/admin/content-sync", label: "Sync" },
    { href: "/admin/identity", label: "Identity", icon: Users },
  ]

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Auto sign out when user is deleted
  useEffect(() => {
    if (userDeleted) {
      // Auto sign out after a short delay
      const timer = setTimeout(() => {
        handleLogout()
      }, 3000) // 3 second delay to show message

      return () => clearTimeout(timer)
    }
  }, [userDeleted, handleLogout])

  if (userDeleted) {
    // User account was deleted
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-destructive">Account Deleted</h2>
          <p className="text-muted-foreground">
            Your account has been deleted. You will be signed out automatically in a few seconds.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out and Go to Learn
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin && user) {
    // User is authenticated but not admin - show access denied or privileges revoked
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">
            {privilegesRevoked ? "Admin Privileges Revoked" : "Access Denied"}
          </h2>
          <p className="text-muted-foreground">
            {privilegesRevoked
              ? "Your admin privileges have been removed. You no longer have access to the admin panel."
              : "You do not have admin privileges. Please contact an administrator if you believe this is an error."}
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Button asChild>
              <Link href="/learn">Go to Learn</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    // Not authenticated - let children handle auth UI
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Use MainNav with admin nav items */}
      <MainNav currentPath={pathname} isAdmin={true} adminNavItems={navItems} />

      {/* Admin Content */}
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
      
      <DeleteAccountDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
    </div>
  )
}
