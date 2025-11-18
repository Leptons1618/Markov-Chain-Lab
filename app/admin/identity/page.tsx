"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Shield, ShieldCheck, User, Search, Loader2, AlertCircle, Eye, MoreVertical, Mail, Trash2, RotateCcw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth/auth-provider"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface UserWithProgress {
  id: string
  email: string
  name: string
  createdAt: string
  lastSignIn: string | null
  isAdmin: boolean
  progress: {
    totalLessons: number
    completedLessons: number
    percentage: number
  }
}

export default function IdentityManagerPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
  const [resetProgressDialogOpen, setResetProgressDialogOpen] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load users')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Failed to load users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const toggleAdminRole = async (userId: string, currentIsAdmin: boolean) => {
    if (updating) return

    setUpdating(userId)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          isAdmin: !currentIsAdmin,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update role')
      }

      // Reload users to reflect changes
      await loadUsers()
    } catch (err) {
      console.error('Failed to update role:', err)
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setUpdating(null)
    }
  }

  const sendResetPassword = async (userId: string) => {
    if (actionLoading) return

    setActionLoading(userId)
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
      setActionLoading(null)
    }
  }

  const resetProgress = async (userId: string) => {
    if (actionLoading) return

    setActionLoading(userId)
    setError(null)
    setResetProgressDialogOpen(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-progress`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reset progress')
      }

      // Reload users to reflect changes
      await loadUsers()
      alert('User progress reset successfully')
    } catch (err) {
      console.error('Failed to reset progress:', err)
      setError(err instanceof Error ? err.message : 'Failed to reset progress')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteUser = async (userId: string) => {
    if (actionLoading) return

    setActionLoading(userId)
    setError(null)
    setDeleteDialogOpen(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}/delete`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      // Reload users to reflect changes
      await loadUsers()
      alert('User deleted successfully')
    } catch (err) {
      console.error('Failed to delete user:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to page 1 when search term or page size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, pageSize])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Identity Manager</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage users, view their progress, and control admin access
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Page Size Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 cursor-text w-full"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-muted-foreground">Loading users...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {searchTerm ? "No users match your search." : "No users found."}
          </p>
        </Card>
      ) : (
        <>
          {/* Desktop/Tablet Table View */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">User</TableHead>
                    <TableHead className="min-w-[200px]">Email</TableHead>
                    <TableHead className="min-w-[140px]">Progress</TableHead>
                    <TableHead className="min-w-[100px]">Role</TableHead>
                    <TableHead className="text-right min-w-[400px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{user.name}</div>
                            {user.id === currentUser?.id && (
                              <span className="text-xs text-muted-foreground">(You)</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm truncate block max-w-[200px]">{user.email}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground mb-1">
                              {user.progress.completedLessons}/{user.progress.totalLessons}
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${user.progress.percentage}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-medium shrink-0">
                            {user.progress.percentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge variant="default" className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <Link href={`/admin/identity/${user.id}`}>
                            <Button variant="outline" size="sm" className="gap-2 shrink-0">
                              <Eye className="h-4 w-4" />
                              <span>Details</span>
                            </Button>
                          </Link>
                          <Button
                            variant={user.isAdmin ? "outline" : "default"}
                            size="sm"
                            onClick={() => toggleAdminRole(user.id, user.isAdmin)}
                            disabled={updating === user.id || user.id === currentUser?.id}
                            className="gap-2 shrink-0"
                          >
                            {updating === user.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Updating...</span>
                              </>
                            ) : user.isAdmin ? (
                              <>
                                <Shield className="h-4 w-4" />
                                <span>Remove Admin</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4" />
                                <span>Make Admin</span>
                              </>
                            )}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" disabled={actionLoading === user.id} className="shrink-0">
                                {actionLoading === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => sendResetPassword(user.id)}
                                disabled={actionLoading === user.id}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Send Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setResetProgressDialogOpen(user.id)}
                                disabled={actionLoading === user.id}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset Progress
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteDialogOpen(user.id)}
                                disabled={actionLoading === user.id || user.id === currentUser?.id}
                                variant="destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {paginatedUsers.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="space-y-4">
                  {/* User Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{user.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                        {user.id === currentUser?.id && (
                          <span className="text-xs text-muted-foreground">(You)</span>
                        )}
                      </div>
                    </div>
                    <div>
                      {user.isAdmin ? (
                        <Badge variant="default" className="gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {user.progress.completedLessons}/{user.progress.totalLessons} ({user.progress.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${user.progress.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Joined</div>
                      <div className="font-medium">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Last Sign In</div>
                      <div className="font-medium">
                        {user.lastSignIn
                          ? new Date(user.lastSignIn).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Link href={`/admin/identity/${user.id}`} className="flex-1 min-w-[120px]">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Eye className="h-4 w-4" />
                        Details
                      </Button>
                    </Link>
                    <Button
                      variant={user.isAdmin ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleAdminRole(user.id, user.isAdmin)}
                      disabled={updating === user.id || user.id === currentUser?.id}
                      className="flex-1 min-w-[120px] gap-2"
                    >
                      {updating === user.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : user.isAdmin ? (
                        <>
                          <Shield className="h-4 w-4" />
                          Remove Admin
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Make Admin
                        </>
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={actionLoading === user.id} className="shrink-0">
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => sendResetPassword(user.id)}
                          disabled={actionLoading === user.id}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setResetProgressDialogOpen(user.id)}
                          disabled={actionLoading === user.id}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset Progress
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteDialogOpen(user.id)}
                          disabled={actionLoading === user.id || user.id === currentUser?.id}
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Delete User Dialog */}
          <AlertDialog open={deleteDialogOpen !== null} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
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
                  onClick={() => deleteDialogOpen && deleteUser(deleteDialogOpen)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Reset Progress Dialog */}
          <AlertDialog open={resetProgressDialogOpen !== null} onOpenChange={(open) => !open && setResetProgressDialogOpen(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset User Progress</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reset this user's progress? All lesson completion data will be cleared. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => resetProgressDialogOpen && resetProgress(resetProgressDialogOpen)}
                >
                  Reset Progress
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Pagination - Always show if there are users */}
          {filteredUsers.length > 0 && (
            <Card className="p-4">
              <div className="flex flex-col gap-4">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of{" "}
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
                  {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </div>
                {totalPages > 1 ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="w-full sm:w-auto"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-10"
                            >
                              {page}
                            </Button>
                          )
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-2 text-muted-foreground">...</span>
                        }
                        return null
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="w-full sm:w-auto"
                    >
                      Next
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center sm:text-left">
                    All users displayed
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Summary Stats - Single Chip */}
      {!loading && users.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
          <Badge variant="outline" className="px-4 py-2 text-sm font-medium gap-2">
            <User className="h-4 w-4" />
            <span className="font-semibold">{users.length}</span>
            <span className="text-muted-foreground">Total Users</span>
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm font-medium gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="font-semibold text-primary">{users.filter(u => u.isAdmin).length}</span>
            <span className="text-muted-foreground">Admins</span>
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm font-medium gap-2">
            <User className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-green-600">{users.filter(u => u.progress.totalLessons > 0).length}</span>
            <span className="text-muted-foreground">Active Learners</span>
          </Badge>
        </div>
      )}
    </div>
  )
}
