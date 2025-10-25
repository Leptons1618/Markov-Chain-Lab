"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

interface SyncLog {
  id: string
  action: string
  content: string
  status: "success" | "pending" | "error"
  timestamp: string
}

export default function ContentSyncPage() {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([
    {
      id: "1",
      action: "Updated",
      content: "Probability Refresher Lesson",
      status: "success",
      timestamp: "2 minutes ago",
    },
    {
      id: "2",
      action: "Created",
      content: "Markov Chain Basics Course",
      status: "success",
      timestamp: "1 hour ago",
    },
    {
      id: "3",
      action: "Linked",
      content: "Weather Example to Basics Course",
      status: "pending",
      timestamp: "3 hours ago",
    },
    {
      id: "4",
      action: "Published",
      content: "Advanced Topics Module",
      status: "success",
      timestamp: "1 day ago",
    },
  ])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">M</span>
                </div>
                <span className="font-semibold text-lg">Admin</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin/courses" className="text-muted-foreground hover:text-foreground transition-colors">
                  Courses
                </Link>
                <Link href="/admin/content-sync" className="text-foreground font-medium transition-colors">
                  Sync
                </Link>
                <Link href="/admin/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Button className="cursor-pointer">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
              <Link href="/">
                <Button variant="ghost" size="sm" className="cursor-pointer">
                  View Site
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Content Synchronization</h1>
            <p className="text-muted-foreground">Track all content updates and synchronization activities</p>
          </div>

          {/* Sync Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Syncs</p>
                  <p className="text-3xl font-bold">24</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="text-3xl font-bold text-green-600">22</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">2</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sync Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Logs</CardTitle>
              <CardDescription>Recent content synchronization activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {syncLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(log.status)}
                      <div>
                        <p className="font-medium">
                          {log.action} {log.content}
                        </p>
                        <p className="text-sm text-muted-foreground">{log.timestamp}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        log.status === "success" ? "default" : log.status === "pending" ? "secondary" : "destructive"
                      }
                      className="capitalize"
                    >
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
