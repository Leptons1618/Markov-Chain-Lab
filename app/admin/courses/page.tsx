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
import { Edit, Trash2, Plus, Loader2, Download, RefreshCw, Upload, FileText, X, FileJson, CheckCircle2, AlertCircle, BookOpen, GraduationCap } from "lucide-react"
import Link from "next/link"
import { fetchCourses, type Course } from "@/lib/lms"
import { useToast } from "@/lib/hooks/use-toast"

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
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast: showToast, success, error, info, warning } = useToast()

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
        success("Course deleted successfully")
      } else {
        const errorData = await response.json()
        error(`Failed to delete course: ${errorData.error}`)
      }
    } catch (err) {
      console.error("Failed to delete course:", err)
      error("Failed to delete course. Please try again.")
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
        error(`Export failed: ${data.error || "Unknown error"}`)
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

      success("Export completed successfully!")
    } catch (err) {
      console.error("Export error:", err)
      error("Failed to export content")
    } finally {
      setExporting(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      // Sync lms.json to database
      const response = await fetch("/api/admin/content/sync", {
        method: "POST",
      })

      const data = await response.json()

      if (!data.success) {
        error(`Sync failed: ${data.error}`)
        return
      }

      const results = data.data
      const totalCourses = results.courses.created + results.courses.updated
      const totalLessons = results.lessons.created + results.lessons.updated
      const errorCount = results.courses.errors.length + results.lessons.errors.length

      if (errorCount > 0) {
        showToast("warning", `Sync completed with ${errorCount} error(s)`, {
          description: `${totalCourses} courses, ${totalLessons} lessons synced`,
        })
      } else {
        success("Content synchronized successfully!", {
          description: `${totalCourses} courses, ${totalLessons} lessons synced`,
        })
      }

      // Reload courses from the server
      const fetchedCourses = await fetchCourses()
      setCourses(fetchedCourses)
    } catch (err) {
      console.error("Sync error:", err)
      error("Failed to synchronize content")
    } finally {
      setSyncing(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".json")) {
      error("Please upload a JSON file")
      return
    }

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      
      // Validate structure based on import type
      if (importType === "lms") {
        if (!parsed.courses || !Array.isArray(parsed.courses)) {
          error("Invalid LMS file format. Expected JSON with 'courses' array.")
          return
        }
        info(`Preview loaded: ${parsed.courses.length} courses, ${parsed.lessons?.length || 0} lessons`)
      } else if (importType === "course") {
        if (!parsed.id || !parsed.title) {
          error("Invalid course file format. Expected course object with 'id' and 'title'.")
          return
        }
        info(`Preview loaded: ${parsed.title}`)
      } else if (importType === "lesson") {
        if (!parsed.id || !parsed.title) {
          error("Invalid lesson file format. Expected lesson object with 'id' and 'title'.")
          return
        }
        info(`Preview loaded: ${parsed.title}`)
      }

      setPreviewFile(file)
      setPreviewData(parsed)
    } catch (err) {
      console.error("File parse error:", err)
      error("Failed to parse JSON file. Please check the file format.")
    }
  }

  const handleUpload = async () => {
    if (!previewFile) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append("file", previewFile)
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
        error(`Import failed: ${data.error}`)
        return
      }

      success("Import completed successfully!", {
        description: `${data.data.created} created, ${data.data.updated} updated`,
      })

      // Reload courses
      const fetchedCourses = await fetchCourses()
      setCourses(fetchedCourses)
      setImportDialogOpen(false)
      setPreviewData(null)
      setPreviewFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      console.error("Import error:", err)
      error("Failed to import content")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-8">
          {/* Title and Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Manage Courses</h1>
              <p className="text-muted-foreground">Create, edit, and organize your course content</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setImportDialogOpen(true)}
                variant="outline"
                className="cursor-pointer w-full sm:w-auto"
                size="sm"
              >
                <Upload className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Import</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button
                onClick={handleExport}
                disabled={exporting}
                variant="outline"
                className="cursor-pointer w-full sm:w-auto"
                size="sm"
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                    <span className="hidden sm:inline">Exporting...</span>
                    <span className="sm:hidden">Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Export</span>
                    <span className="sm:hidden">Export</span>
                  </>
                )}
              </Button>
              <Button
                onClick={handleSync}
                disabled={syncing}
                variant="outline"
                className="cursor-pointer w-full sm:w-auto"
                size="sm"
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                    <span className="hidden sm:inline">Syncing...</span>
                    <span className="sm:hidden">Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sync</span>
                    <span className="sm:hidden">Sync</span>
                  </>
                )}
              </Button>
              <Link href="/admin/courses/new" className="w-full sm:w-auto">
                <Button className="cursor-pointer w-full sm:w-auto" size="sm">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Course</span>
                  <span className="sm:hidden">New Course</span>
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
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold break-words">{course.title}</h3>
                        <Badge variant={course.status === "published" ? "default" : "secondary"}>{course.status}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-3 break-words">{course.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {course.lessons} lessons • Created {new Date(course.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
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
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        setImportDialogOpen(open)
        if (!open) {
          setPreviewData(null)
          setPreviewFile(null)
          setImportType("lms")
          setSelectedCourseId("")
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
        }
      }}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl break-words">Import Content</DialogTitle>
                <DialogDescription className="mt-1 break-words">
                  Upload JSON file to import courses, lessons, or full LMS data. Preview the contents before uploading.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Import Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Import Type
              </label>
              <Select value={importType} onValueChange={(value: "lms" | "course" | "lesson") => {
                setImportType(value)
                setPreviewData(null)
                setPreviewFile(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""
                }
              }}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lms">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Full LMS (lms.json)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="course">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      <span>Single Course</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="lesson">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Single Lesson</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Course Selection for Lessons */}
            {importType === "lesson" && (
              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Assign to Course
                </label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="h-11">
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
                {!selectedCourseId && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Please select a course to assign the lesson to
                  </p>
                )}
              </div>
            )}

            {/* File Upload Section */}
            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                Select JSON File
              </label>
              <div className="relative">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  disabled={importing || (importType === "lesson" && !selectedCourseId)}
                  className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50"
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {importType === "lms" && 'File must contain "courses" and "lessons" arrays'}
                {importType === "course" && 'File must contain a course object with "id" and "title"'}
                {importType === "lesson" && 'File must contain a lesson object with "id" and "title"'}
              </p>
            </div>

            {/* Preview Section */}
            {previewData && (
              <div className="space-y-3 border-2 border-primary/20 rounded-lg p-5 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold flex flex-wrap items-center gap-2">
                        <span>Preview Ready</span>
                        {importType === "lms" && (
                          <>
                            <Badge variant="secondary" className="text-xs">
                              {previewData.courses?.length || 0} courses
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {previewData.lessons?.length || 0} lessons
                            </Badge>
                          </>
                        )}
                        {(importType === "course" || importType === "lesson") && (
                          <Badge variant="secondary" className="text-xs">
                            {importType === "course" ? "Course" : "Lesson"}
                          </Badge>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 break-words">
                        Review the content below before uploading
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreviewData(null)
                      setPreviewFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                    className="cursor-pointer hover:bg-destructive/10 hover:text-destructive shrink-0 self-start sm:self-center"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                  {importType === "lms" && (
                    <>
                      {previewData.courses?.slice(0, 5).map((c: any, idx: number) => (
                        <div key={idx} className="text-sm p-3 bg-background/80 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded bg-primary/10 mt-0.5">
                              <BookOpen className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-foreground flex items-center gap-2">
                                <span className="text-primary">#{idx + 1}</span>
                                <span className="truncate">{c.title || c.id}</span>
                              </div>
                              <div className="text-muted-foreground text-xs mt-1 line-clamp-1">{c.description}</div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {c.lessons || 0} lessons
                                </Badge>
                                {c.status && (
                                  <Badge variant="secondary" className="text-xs capitalize">
                                    {c.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {previewData.courses?.length > 5 && (
                        <div className="text-sm text-muted-foreground text-center py-3 bg-background/50 rounded-lg border border-dashed">
                          <BookOpen className="h-4 w-4 mx-auto mb-1 opacity-50" />
                          ... and {previewData.courses.length - 5} more courses
                        </div>
                      )}
                    </>
                  )}
                  {(importType === "course" || importType === "lesson") && (
                    <div className="text-sm p-4 bg-background/80 rounded-lg border border-border/50">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded bg-primary/10 mt-0.5">
                          {importType === "course" ? (
                            <GraduationCap className="h-5 w-5 text-primary" />
                          ) : (
                            <FileText className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground mb-1">{previewData.title || previewData.id}</div>
                          <div className="text-muted-foreground text-xs mb-3 line-clamp-3">{previewData.description}</div>
                          <div className="flex flex-wrap gap-2">
                            {previewData.status && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {previewData.status}
                              </Badge>
                            )}
                            {previewData.id && (
                              <Badge variant="secondary" className="text-xs">
                                ID: {previewData.id}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false)
                setPreviewData(null)
                setPreviewFile(null)
                setImportType("lms")
                setSelectedCourseId("")
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""
                }
              }}
              disabled={importing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!previewFile || importing || (importType === "lesson" && !selectedCourseId)}
              className="cursor-pointer w-full sm:w-auto min-w-[120px]"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Uploading...</span>
                  <span className="sm:hidden">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Upload {importType === "lms" ? "Content" : importType === "course" ? "Course" : "Lesson"}</span>
                  <span className="sm:hidden">Upload</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
