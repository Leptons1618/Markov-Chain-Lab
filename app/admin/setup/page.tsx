"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Copy, AlertCircle, Info, ExternalLink } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

export default function AdminSetupPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState("")
  const [copied, setCopied] = useState(false)

  const sqlQuery = `INSERT INTO admin_users (user_id, email)
SELECT id, email
FROM auth.users
WHERE email = '${email || 'user-email@example.com'}'
ON CONFLICT (user_id) DO NOTHING;`

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlQuery)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Admin Setup Guide</h1>
          <p className="text-muted-foreground">
            Learn how to grant admin privileges to users
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Admin privileges are managed through the <code className="px-1 py-0.5 bg-muted rounded text-sm">admin_users</code> table in Supabase.
            Users must first sign up, then you can grant them admin access.
          </AlertDescription>
        </Alert>

        {/* Current User Info */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle>Your Account</CardTitle>
              <CardDescription>Current authenticated user information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded mt-1">{user.email}</p>
              </div>
              <div>
                <Label>User ID</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded mt-1 break-all">{user.id}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Method 1: SQL Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Method 1: Using Supabase SQL Editor (Recommended)
            </CardTitle>
            <CardDescription>Easiest way to add admin users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleCopy} variant="outline">
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy SQL
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the email of the user you want to make an admin
              </p>
            </div>

            <div className="space-y-2">
              <Label>SQL Query</Label>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{sqlQuery}</code>
                </pre>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>Go to your Supabase project dashboard</li>
                <li>Navigate to <strong>SQL Editor</strong></li>
                <li>Copy the SQL query above (or click Copy SQL button)</li>
                <li>Replace <code className="bg-background px-1 rounded">user-email@example.com</code> with the actual email</li>
                <li>Execute the query</li>
                <li>The user will now have admin access</li>
              </ol>
            </div>

            <Button
              variant="outline"
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Supabase Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Method 2: Table Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Method 2: Using Supabase Table Editor</CardTitle>
            <CardDescription>Visual way to add admin users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Steps:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                <li>Go to your Supabase project dashboard</li>
                <li>Navigate to <strong>Authentication</strong> → <strong>Users</strong></li>
                <li>Find the user you want to make an admin</li>
                <li>Copy their <strong>User ID</strong> (UUID)</li>
                <li>Go to <strong>Table Editor</strong> → <strong>admin_users</strong></li>
                <li>Click <strong>Insert row</strong></li>
                <li>Enter:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><code className="bg-muted px-1 rounded">user_id</code>: The UUID from step 4</li>
                    <li><code className="bg-muted px-1 rounded">email</code>: The user's email address</li>
                  </ul>
                </li>
                <li>Click <strong>Save</strong></li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Current User */}
        {user && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Quick Add: Make Yourself Admin</CardTitle>
              <CardDescription>Copy this SQL to grant yourself admin access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-background border border-border p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{`INSERT INTO admin_users (user_id, email)
VALUES ('${user.id}', '${user.email}')
ON CONFLICT (user_id) DO NOTHING;`}</code>
                </pre>
                <Button
                  onClick={() => {
                    const sql = `INSERT INTO admin_users (user_id, email)
VALUES ('${user.id}', '${user.email}')
ON CONFLICT (user_id) DO NOTHING;`
                    navigator.clipboard.writeText(sql)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  After running this SQL, sign out and sign back in to refresh your admin status.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Check if a user is an admin:</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                <code>{`SELECT * FROM admin_users WHERE email = 'user@example.com';`}</code>
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-2">Remove admin access:</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                <code>{`DELETE FROM admin_users WHERE email = 'user@example.com';`}</code>
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-2">List all admins:</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                <code>{`SELECT * FROM admin_users;`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
