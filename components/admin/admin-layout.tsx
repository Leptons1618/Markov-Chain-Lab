"use client"

import { ReactNode, useState, useEffect } from "react"
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

  // Check admin status with caching
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false)
        setCheckingAuth(false)
        adminStatusCache = { userId: null, isAdmin: false, timestamp: 0 }
        return
      }

      // Check cache first
      const now = Date.now()
      if (
        adminStatusCache.userId === user.id &&
        now - adminStatusCache.timestamp < CACHE_DURATION
      ) {
        setIsAdmin(adminStatusCache.isAdmin)
        setCheckingAuth(false)
        return
      }

      try {
        const response = await fetch('/api/admin/auth', {
          method: 'GET',
          credentials: 'include',
        })
        const data = await response.json()
        const adminStatus = data.isAdmin || false
        setIsAdmin(adminStatus)
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
    }

    checkAdminStatus()
  }, [user])

  const handleLogout = async () => {
    // signOut already handles redirect, so just call it
    await signOut()
  }

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

  if (!isAdmin && user) {
    // User is authenticated but not admin - show access denied
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            You do not have admin privileges. Please contact an administrator if you believe this is an error.
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
