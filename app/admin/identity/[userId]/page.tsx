"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ShieldCheck, User, Loader2, AlertCircle, ArrowLeft, Mail, Calendar, CheckCircle2, XCircle, RotateCcw, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
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
import { useAuth } from "@/components/auth/auth-provider"

interface UserDetails {
  user: {
    id: string
    email: string
    name: string
    createdAt: string
    lastSignIn: string | null
    emailVerified: boolean
    phone: string | null
    metadata: Record<string, any>
  }
  isAdmin: boolean
  adminInfo: {
    createdAt: string
  } | null
  progress: {
    totalLessons: number
    completedLessons: number
    percentage: number
    lessonProgress: Array<{
      lessonId: string
      completed: boolean
      lastAccessed: string | null
      progress: number
    }>
  }
}

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const userId = params.userId as string
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resetProgressDialogOpen, setResetProgressDialogOpen] = useState(false)

  useEffect(() => {
    if (userId) {
      loadUserDetails()
    }
  }, [userId])

  const loadUserDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load user details')
      }

      const data = await response.json()
      setUserDetails(data)
    } catch (err) {
      console.error('Failed to load user details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  const sendResetPassword = async () => {
    if (actionLoading || !userId) return

    setActionLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send reset password email')
      }

      alert('Password reset email sent successfully')
    } catch (err) {
      console.error('Failed to send reset password:', err)
      setError(err instanceof Error ? err.message : 'Failed to send reset password email')
    } finally {
      setActionLoading(false)
    }
  }

  const resetProgress = async () => {
    if (actionLoading || !userId) return

    setActionLoading(true)
    setError(null)
    setResetProgressDialogOpen(false)

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-progress`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reset progress')
      }

      // Reload user details to reflect changes
      await loadUserDetails()
      alert('User progress reset successfully')
    } catch (err) {
      console.error('Failed to reset progress:', err)
      setError(err instanceof Error ? err.message : 'Failed to reset progress')
    } finally {
      setActionLoading(false)
    }
  }

  const deleteUser = async () => {
    if (actionLoading || !userId) return

    setActionLoading(true)
    setError(null)
    setDeleteDialogOpen(false)

    try {
      const response = await fetch(`/api/admin/users/${userId}/delete`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      // Redirect to identity page
      router.push('/admin/identity')
      alert('User deleted successfully')
    } catch (err) {
      console.error('Failed to delete user:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete user')
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-muted-foreground">Loading user details...</span>
      </div>
    )
  }

  if (error || !userDetails) {
    return (
      <div className="space-y-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'User not found'}</AlertDescription>
        </Alert>
        <Link href="/admin/identity">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link href="/admin/identity">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">User Details</h1>
          <p className="text-muted-foreground">
            Detailed information about {userDetails.user.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={sendResetPassword}
            disabled={actionLoading}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Reset Password
          </Button>
          <Button
            variant="outline"
            onClick={() => setResetProgressDialogOpen(true)}
            disabled={actionLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Progress
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={actionLoading || userDetails.user.id === currentUser?.id}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete User
          </Button>
        </div>
      </div>

      {/* User Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Name</p>
              <p className="font-medium">{userDetails.user.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </p>
              <p className="font-medium">{userDetails.user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                {userDetails.user.emailVerified ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Not Verified
                  </Badge>
                )}
              </div>
            </div>
            {userDetails.user.phone && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                <p className="font-medium">{userDetails.user.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Account Created
              </p>
              <p className="font-medium">
                {new Date(userDetails.user.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Last Sign In</p>
              <p className="font-medium">
                {userDetails.user.lastSignIn
                  ? new Date(userDetails.user.lastSignIn).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Role & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Role</p>
              {userDetails.isAdmin ? (
                <Badge variant="default" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Administrator
                </Badge>
              ) : (
                <Badge variant="outline">User</Badge>
              )}
            </div>
            {userDetails.isAdmin && userDetails.adminInfo && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Admin Since</p>
                <p className="font-medium">
                  {new Date(userDetails.adminInfo.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
          <CardDescription>
            Overall progress across all lessons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Lessons</p>
              <p className="text-2xl font-bold">{userDetails.progress.totalLessons}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {userDetails.progress.completedLessons}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Progress</p>
              <div className="flex items-center gap-2">
                <Progress value={userDetails.progress.percentage} className="flex-1" />
                <span className="text-2xl font-bold min-w-[3rem]">
                  {userDetails.progress.percentage}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lesson Progress Details */}
      {userDetails.progress.lessonProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lesson Progress Details</CardTitle>
            <CardDescription>
              Individual lesson completion status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lesson ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Last Accessed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userDetails.progress.lessonProgress.map((lesson) => (
                  <TableRow key={lesson.lessonId}>
                    <TableCell className="font-mono text-sm">{lesson.lessonId}</TableCell>
                    <TableCell>
                      {lesson.completed ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline">In Progress</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${lesson.progress}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-medium min-w-[2.5rem]">
                          {lesson.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {lesson.lastAccessed
                          ? new Date(lesson.lastAccessed).toLocaleString()
                          : 'Never'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Metadata (if available) */}
      {userDetails.user.metadata && Object.keys(userDetails.user.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Metadata</CardTitle>
            <CardDescription>
              User metadata and custom fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(userDetails.user.metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone. All user data including progress will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Progress Dialog */}
      <AlertDialog open={resetProgressDialogOpen} onOpenChange={setResetProgressDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset User Progress</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset this user's progress? All lesson completion data will be cleared. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetProgress}>
              Reset Progress
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
