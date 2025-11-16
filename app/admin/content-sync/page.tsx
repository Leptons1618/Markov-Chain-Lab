"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, AlertCircle, Info, Loader2 } from "lucide-react"

interface SyncLog {
  id: string
  action: string
  content: string
  status: "success" | "pending" | "error"
  timestamp: string
}

export default function ContentSyncPage() {
  const [syncLogs] = useState<SyncLog[]>([])
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    // TODO: Implement actual sync logic
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setSyncing(false)
  }

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
    <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Content Synchronization</h1>
            <p className="text-muted-foreground">Track all content updates and synchronization activities</p>
          </div>

          {/* Sync Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Synchronization</CardTitle>
              <CardDescription>Trigger content synchronization manually</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button onClick={handleSync} disabled={syncing} className="cursor-pointer">
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing..." : "Sync Now"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {syncing ? "Synchronizing content..." : "Click to sync all content"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sync Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Syncs</p>
                  <p className="text-3xl font-bold">{syncLogs.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="text-3xl font-bold text-green-600">
                    {syncLogs.filter((l) => l.status === "success").length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {syncLogs.filter((l) => l.status === "pending").length}
                  </p>
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
              {syncLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-2">No synchronization logs yet</p>
                  <p className="text-sm text-muted-foreground">
                    Sync logs will appear here after you perform synchronization operations
                  </p>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
    </div>
  )
}
