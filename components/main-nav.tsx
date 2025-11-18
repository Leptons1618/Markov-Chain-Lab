"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { MobileNav } from "@/components/mobile-nav"
import { AuthButton } from "@/components/auth/auth-button"
import { useAuth } from "@/components/auth/auth-provider"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Globe } from "lucide-react"
import { Logo } from "@/components/logo"

interface NavItem {
  href: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface MainNavProps {
  currentPath?: string
  showOverallProgress?: boolean
  overallProgress?: number
  isAdmin?: boolean
  adminNavItems?: NavItem[]
}

export function MainNav({ currentPath = "/", showOverallProgress = false, overallProgress = 0, isAdmin = false, adminNavItems = [] }: MainNavProps) {
  const { user, isGuest } = useAuth()
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const isOnAdminPage = currentPath.startsWith("/admin")

  // Check if current user is admin (for public pages)
  // Use shared cache from admin-layout to avoid duplicate API calls
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || isOnAdminPage) {
        setUserIsAdmin(false)
        setCheckingAdmin(false)
        return
      }

      // Check cache first (shared with admin-layout)
      // Access the cache from admin-layout module scope
      const cacheKey = `adminStatusCache_${user.id}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        try {
          const cacheData = JSON.parse(cached)
          const now = Date.now()
          // Use cache if less than 5 minutes old
          if (now - cacheData.timestamp < 300000) {
            setUserIsAdmin(cacheData.isAdmin || false)
            setCheckingAdmin(false)
            return
          }
        } catch (e) {
          // Invalid cache, continue to fetch
        }
      }

      try {
        const response = await fetch('/api/admin/auth', {
          method: 'GET',
          credentials: 'include',
        })
        const data = await response.json()
        const adminStatus = data.isAdmin || false
        setUserIsAdmin(adminStatus)
        
        // Update cache
        sessionStorage.setItem(cacheKey, JSON.stringify({
          isAdmin: adminStatus,
          timestamp: Date.now(),
        }))
      } catch (error) {
        console.error('Failed to check admin status:', error)
        setUserIsAdmin(false)
      } finally {
        setCheckingAdmin(false)
      }
    }

    checkAdminStatus()
  }, [user, isOnAdminPage])

  const publicNavItems = [
    { href: "/learn", label: "Learn" },
    { href: "/tools", label: "Tools" },
    { href: "/examples", label: "Examples" },
    { href: "/practice", label: "Practice" },
    { href: "/about", label: "About" },
  ]

  const navItems = isAdmin && adminNavItems.length > 0 ? adminNavItems : publicNavItems

  const activeItem = navItems.find(item => {
    if (item.href === "/admin") {
      return currentPath === "/admin"
    }
    return currentPath.startsWith(item.href)
  })

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Logo variant="icon" showText={true} />
          </div>
          <div className="flex items-center gap-4">
            {showOverallProgress && !isGuest && user && (
              <div className="hidden lg:flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <Progress value={overallProgress} className="w-24 transition-all duration-300" />
                <span className="font-medium text-foreground min-w-[3rem]">{Math.round(overallProgress)}%</span>
              </div>
            )}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 transition-colors ${
                      activeItem?.href === item.href
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                )
              })}
              {/* Admin/Site Switch */}
              {isOnAdminPage ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/" className="gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">View Site</span>
                  </Link>
                </Button>
              ) : (
                !checkingAdmin && userIsAdmin && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin" className="gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Link>
                  </Button>
                )
              )}
              <ThemeSwitcher />
              <AuthButton />
            </div>
            <MobileNav currentPath={currentPath} isAdmin={isAdmin} adminNavItems={adminNavItems} userIsAdmin={userIsAdmin} checkingAdmin={checkingAdmin} />
          </div>
        </div>
      </div>
    </nav>
  )
}
