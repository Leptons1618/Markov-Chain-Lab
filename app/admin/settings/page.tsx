"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, RefreshCw, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "MarkovLearn",
    siteDescription: "Interactive learning platform for Markov chains",
    adminEmail: "admin@markovlearn.com",
    contentSyncEnabled: true,
    autoPublish: false,
  })

  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle")
  const [linkedContent, setLinkedContent] = useState([
    { id: "1", title: "Probability Refresher", type: "lesson", status: "synced" },
    { id: "2", title: "Markov Chain Basics", type: "course", status: "synced" },
    { id: "3", title: "Weather Example", type: "example", status: "pending" },
  ])

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSync = async () => {
    setSyncStatus("syncing")
    // Simulate sync process
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setSyncStatus("success")
    setTimeout(() => setSyncStatus("idle"), 3000)
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
                <Link href="/admin/content-sync" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sync
                </Link>
                <Link href="/admin/settings" className="text-foreground font-medium transition-colors">
                  Settings
                </Link>
              </nav>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="cursor-pointer">
                View Site
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Admin Settings</h1>
            <p className="text-muted-foreground">Configure LMS and content synchronization</p>
          </div>

          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic platform information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => handleSettingChange("siteName", e.target.value)}
                  className="cursor-text"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => handleSettingChange("siteDescription", e.target.value)}
                  rows={3}
                  className="cursor-text"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => handleSettingChange("adminEmail", e.target.value)}
                  className="cursor-text"
                />
              </div>
              <Button className="cursor-pointer">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </Card>

          {/* Content Synchronization */}
          <Card>
            <CardHeader>
              <CardTitle>Content Synchronization</CardTitle>
              <CardDescription>Sync LMS content with existing learning materials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">Auto-sync Content</p>
                    <p className="text-sm text-muted-foreground">Automatically sync changes to existing content</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.contentSyncEnabled}
                    onChange={(e) => handleSettingChange("contentSyncEnabled", e.target.checked)}
                    className="cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">Auto-publish</p>
                    <p className="text-sm text-muted-foreground">Automatically publish new content</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoPublish}
                    onChange={(e) => handleSettingChange("autoPublish", e.target.checked)}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-medium text-sm">Sync Status</p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSync}
                    disabled={syncStatus === "syncing"}
                    className="cursor-pointer"
                    variant={syncStatus === "success" ? "outline" : "default"}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
                    {syncStatus === "idle" && "Sync Now"}
                    {syncStatus === "syncing" && "Syncing..."}
                    {syncStatus === "success" && "Synced Successfully"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Content Status */}
          <Card>
            <CardHeader>
              <CardTitle>Linked Content Status</CardTitle>
              <CardDescription>View synchronization status of linked content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {linkedContent.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                    </div>
                    <Badge variant={item.status === "synced" ? "default" : "secondary"} className="capitalize">
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Integration Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Integration Guide
              </CardTitle>
              <CardDescription>How to integrate LMS with existing content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Step 1: Create Content in LMS</h4>
                  <p className="text-sm text-muted-foreground">
                    Create courses and lessons in the LMS admin panel. Each piece of content gets a unique ID and URL.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Step 2: Link Existing Content</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the content linker to connect related courses, lessons, and examples. This creates
                    cross-references between materials.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Step 3: Enable Synchronization</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable auto-sync to automatically update content when changes are made. Use manual sync for
                    immediate updates.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Step 4: Publish Content</h4>
                  <p className="text-sm text-muted-foreground">
                    Publish lessons and courses to make them available to students. Draft content is only visible to
                    admins.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
