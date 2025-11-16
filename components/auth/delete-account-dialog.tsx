"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Trash2 } from "lucide-react"
import { useAuth } from "./auth-provider"

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const { user, deleteAccount } = useAuth()
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const userEmail = user?.email || ""
  const expectedText = "DELETE"

  const handleDelete = async () => {
    if (confirmText !== expectedText) {
      setError("Please type DELETE to confirm")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { error } = await deleteAccount()
      if (error) {
        setError(error.message || "Failed to delete account")
        setLoading(false)
      }
      // If successful, deleteAccount handles redirect
    } catch (err) {
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setConfirmText("")
      setError(null)
      onOpenChange(newOpen)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This will permanently delete:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Your account and all authentication data</li>
                  <li>All your learning progress</li>
                  <li>All your achievements and rewards</li>
                  <li>Your admin privileges (if applicable)</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-delete">
                Type <strong>DELETE</strong> to confirm:
              </Label>
              <Input
                id="confirm-delete"
                type="text"
                placeholder="Type DELETE"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value)
                  setError(null)
                }}
                disabled={loading}
                className="font-mono"
              />
            </div>
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading || confirmText !== expectedText}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
