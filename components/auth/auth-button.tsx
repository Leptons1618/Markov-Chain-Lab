"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "./auth-provider"
import { AuthDialog } from "./auth-dialog"
import { DeleteAccountDialog } from "./delete-account-dialog"
import { User, LogOut, AlertCircle, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getGuestModeWarning } from "@/lib/auth"

export function AuthButton() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { user, isGuest, signOut } = useAuth()

  if (isGuest) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Guest
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Guest Mode</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Alert className="m-2 border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-xs">
                {getGuestModeWarning()}
              </AlertDescription>
            </Alert>
            <DropdownMenuItem onClick={() => setAuthDialogOpen(true)}>
              Sign In to Save Progress
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} defaultTab="signin" />
      </>
    )
  }

  if (user) {
    const displayName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Account"
    const truncatedName = displayName.length > 15 ? displayName.substring(0, 15) + "..." : displayName
    
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              <span className="max-w-[100px] truncate">{truncatedName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="max-w-[200px] truncate">
              {user.user_metadata?.name || user.user_metadata?.full_name || user.email}
            </DropdownMenuLabel>
            {user.email && (
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal max-w-[200px] truncate">
                {user.email}
              </DropdownMenuLabel>
            )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={async () => {
              await signOut()
              // Force clear cookies if sign out doesn't work
              setTimeout(async () => {
                try {
                  await fetch('/api/auth/force-logout', { method: 'POST', credentials: 'include' })
                } catch {}
                window.location.href = '/'
              }, 500)
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DeleteAccountDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
      </>
    )
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAuthDialogOpen(true)}>
        <User className="h-4 w-4 mr-2" />
        Sign In
      </Button>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} defaultTab="signin" />
    </>
  )
}
