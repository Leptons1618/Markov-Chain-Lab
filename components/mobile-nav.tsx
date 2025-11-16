"use client"

import { useState } from "react"
import { Menu, X, LayoutDashboard, Globe } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { AuthButton } from "@/components/auth/auth-button"

interface NavItem {
  href: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface MobileNavProps {
  currentPath?: string
  isAdmin?: boolean
  adminNavItems?: NavItem[]
  userIsAdmin?: boolean
  checkingAdmin?: boolean
}

export function MobileNav({ currentPath, isAdmin = false, adminNavItems = [], userIsAdmin = false, checkingAdmin = false }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isOnAdminPage = currentPath?.startsWith("/admin") || false

  const publicNavItems = [
    { href: "/learn", label: "Learn" },
    { href: "/tools", label: "Tools" },
    { href: "/examples", label: "Examples" },
    { href: "/practice", label: "Practice" },
    { href: "/about", label: "About" },
  ]

  const navItems = isAdmin && adminNavItems.length > 0 ? adminNavItems : publicNavItems

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-16 left-0 right-0 bg-card border-b border-border shadow-lg z-50 animate-in slide-in-from-top-2">
            <nav className="px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPath === item.href || (item.href !== "/admin" && currentPath?.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                )
              })}
              {/* Admin/Site Switch */}
              {isOnAdminPage ? (
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-md transition-colors text-foreground hover:bg-muted"
                >
                  <Globe className="h-4 w-4" />
                  View Site
                </Link>
              ) : (
                !checkingAdmin && userIsAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-md transition-colors text-foreground hover:bg-muted"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Admin
                  </Link>
                )
              )}
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeSwitcher />
                </div>
                <div className="px-4 py-2">
                  <AuthButton />
                </div>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
