"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Edit, Trash2, Plus, Loader2, Download, RefreshCw, Upload, FileText, X } from "lucide-react"
import Link from "next/link"
import { fetchCourses, type Course } from "@/lib/lms"

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importType, setImportType] = useState<"lms" | "course" | "lesson">("lms")
  const [importing, setImporting] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch courses on mount
  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true)
      try {
        const fetchedCourses = await fetchCourses()
        setCourses(fetchedCourses)
      } catch (error) {
        console.error("Failed to load courses:", error)
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [])

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/courses/${id}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        setCourses(courses.filter((c) => c.id !== id))
      } else {
        const error = await response.json()
        alert(`Failed to delete course: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to delete course:", error)
      alert("Failed to delete course. Please try again.")
    } finally {
      setDeleting(null)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch("/api/admin/content/export", {
        method: "GET",
      })

      if (!response.ok) {
        const data = await response.json()
        alert(`Export failed: ${data.error || "Unknown error"}`)
        return
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = "lms-export.json"
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert("Export completed successfully!")
    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to export content")
    } finally {
      setExporting(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      // Reload courses from the server
      const fetchedCourses = await fetchCourses()
      setCourses(fetchedCourses)
      alert("Courses synchronized successfully!")
    } catch (error) {
      console.error("Sync error:", error)
      alert("Failed to synchronize courses")
    } finally {
      setSyncing(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".json")) {
      alert("Please upload a JSON file")
      return
    }

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", importType)
      if (importType === "lesson" && selectedCourseId) {
        formData.append("courseId", selectedCourseId)
      }

      const response = await fetch("/api/admin/content/import-single", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        alert(`Import failed: ${data.error}`)
        return
      }

      alert(
        `Import completed!\n` +
        `${data.data.created} created, ${data.data.updated} updated`
      )

      // Reload courses
      const fetchedCourses = await fetchCourses()
      setCourses(fetchedCourses)
      setImportDialogOpen(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Import error:", error)
      alert("Failed to import content")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-8">
          {/* Title and Actions */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Manage Courses</h1>
              <p className="text-muted-foreground">Create, edit, and organize your course content</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setImportDialogOpen(true)}
                variant="outline"
                className="cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button
                onClick={handleExport}
                disabled={exporting}
                variant="outline"
                className="cursor-pointer"
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
              <Button
                onClick={handleSync}
                disabled={syncing}
                variant="outline"
                className="cursor-pointer"
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync
                  </>
                )}
              </Button>
              <Link href="/admin/courses/new">
                <Button className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  New Course
                </Button>
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-4">
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md cursor-text"
            />
          </div>

          {/* Courses List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading courses...</span>
              </div>
            ) : filteredCourses.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm ? "No courses match your search." : "No courses found. Create your first course to get started."}
                </p>
                {!searchTerm && (
                  <Link href="/admin/courses/new" className="mt-4 inline-block">
                    <Button className="cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Course
                    </Button>
                  </Link>
                )}
              </Card>
            ) : (
              filteredCourses.map((course) => (
                <Card key={course.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{course.title}</h3>
                        <Badge variant={course.status === "published" ? "default" : "secondary"}>{course.status}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{course.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {course.lessons} lessons • Created {new Date(course.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/courses/${course.id}`}>
                        <Button variant="outline" size="sm" className="cursor-pointer bg-transparent">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(course.id)}
                        disabled={deleting === course.id}
                        className="cursor-pointer bg-transparent text-destructive hover:text-destructive"
                      >
                        {deleting === course.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Content</DialogTitle>
            <DialogDescription>
              Upload JSON file to import courses, lessons, or full LMS data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Import Type</label>
              <Select value={importType} onValueChange={(value: "lms" | "course" | "lesson") => setImportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lms">Full LMS (lms.json)</SelectItem>
                  <SelectItem value="course">Single Course</SelectItem>
                  <SelectItem value="lesson">Single Lesson</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {importType === "lesson" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign to Course</label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Select File</label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing || (importType === "lesson" && !selectedCourseId)}
                className="cursor-pointer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false)
                setImportType("lms")
                setSelectedCourseId("")
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""
                }
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
