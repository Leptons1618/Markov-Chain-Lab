"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, ShieldCheck, User, Search, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/auth/auth-provider"

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

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Identity Manager</h1>
        <p className="text-muted-foreground">
          Manage users, view their progress, and control admin access
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 cursor-text"
          />
        </div>
      </div>

      {/* Users List */}
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
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{user.name}</h3>
                        {user.isAdmin && (
                          <Badge variant="default" className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={user.progress.percentage} className="flex-1" />
                        <span className="text-sm font-medium min-w-[3rem]">
                          {user.progress.percentage}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {user.progress.completedLessons} of {user.progress.totalLessons} lessons completed
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Joined</p>
                      <p className="text-sm font-medium">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Last Sign In</p>
                      <p className="text-sm font-medium">
                        {user.lastSignIn
                          ? new Date(user.lastSignIn).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant={user.isAdmin ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleAdminRole(user.id, user.isAdmin)}
                    disabled={updating === user.id || user.id === currentUser?.id}
                    className="gap-2 min-w-[120px]"
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
                  {user.id === currentUser?.id && (
                    <p className="text-xs text-muted-foreground text-center">
                      (You)
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && users.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{users.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {users.filter(u => u.isAdmin).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Learners</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {users.filter(u => u.progress.totalLessons > 0).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
