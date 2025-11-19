"use client"

import { useState, useEffect } from "react"
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
import { Edit, Trash2, Plus, Loader2, Download, Upload, FileJson, Sparkles, RefreshCw } from "lucide-react"
import { FileUpload } from "@/components/ui/file-upload"
import Link from "next/link"
import { useToast } from "@/lib/hooks/use-toast"

interface Example {
  id: string
  title: string
  description: string
  category: "classic" | "modern"
  difficulty: "beginner" | "intermediate" | "advanced"
  applications: string[]
  interactive_demo: boolean
  status: "draft" | "published"
  created_at: string
  updated_at: string
}

export default function ExamplesPage() {
  const [examples, setExamples] = useState<Example[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const { toast: showToast, success, error, info } = useToast()

  const handleFileRemove = () => {
    setPreviewFile(null)
    setPreviewData(null)
  }

  // Fetch examples on mount
  useEffect(() => {
    const loadExamples = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/admin/examples")
        const data = await response.json()
        if (data.success) {
          setExamples(data.data || [])
        }
      } catch (error) {
        console.error("Failed to load examples:", error)
      } finally {
        setLoading(false)
      }
    }
    loadExamples()
  }, [])

  const filteredExamples = examples.filter(
    (ex) =>
      ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.applications.some((app) => app.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this example? This action cannot be undone.")) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/examples/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setExamples(examples.filter((ex) => ex.id !== id))
        success("Example deleted successfully")
      } else {
        const data = await response.json()
        error(data.error || "Failed to delete example")
      }
    } catch (err) {
      console.error("Delete error:", err)
      error("Failed to delete example")
    } finally {
      setDeleting(null)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/admin/examples/sync", {
        method: "POST",
      })
      const data = await response.json()
      if (!data.success) {
        error(`Sync failed: ${data.error}`)
        return
      }
      const results = data.data
      const errorCount = results.errors.length
      if (errorCount > 0) {
        showToast("warning", `Sync completed with ${errorCount} error(s)`, {
          description: `${results.created} created, ${results.updated} updated`,
        })
      } else {
        success("Examples synchronized successfully!", {
          description: `${results.created} created, ${results.updated} updated`,
        })
      }
      // Reload examples
      const reloadResponse = await fetch("/api/admin/examples")
      const reloadData = await reloadResponse.json()
      if (reloadData.success) {
        setExamples(reloadData.data || [])
      }
    } catch (err) {
      console.error("Sync error:", err)
      error("Failed to synchronize examples")
    } finally {
      setSyncing(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch("/api/admin/examples")
      const data = await response.json()
      if (!data.success) {
        error("Failed to fetch examples for export")
        return
      }

      const jsonStr = JSON.stringify(data.data, null, 2)
      const blob = new Blob([jsonStr], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `examples-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      success("Examples exported successfully")
    } catch (err) {
      console.error("Export error:", err)
      error("Failed to export examples")
    } finally {
      setExporting(false)
    }
  }

  const handleFileSelect = async (file: File) => {
    setPreviewFile(file)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      
      // Validate structure
      if (!Array.isArray(parsed)) {
        error("Invalid file format. Expected an array of examples.")
        setPreviewFile(null)
        return
      }

      // Validate each example has required fields
      const invalid = parsed.find((ex: any) => !ex.id || !ex.title || !ex.design)
      if (invalid) {
        error("Invalid file format. Each example must have id, title, and design fields.")
        setPreviewFile(null)
        return
      }

      setPreviewData({
        count: parsed.length,
        examples: parsed.map((ex: any) => ({
          id: ex.id,
          title: ex.title,
          category: ex.category || "classic",
          difficulty: ex.difficulty || "beginner",
        })),
      })
    } catch (err) {
      console.error("Parse error:", err)
      error("Failed to parse JSON file. Please check the file format.")
      setPreviewFile(null)
    }
  }

  const handleUpload = async () => {
    if (!previewFile) return

    setImporting(true)
    try {
      const text = await previewFile.text()
      const parsed = JSON.parse(text)

      let created = 0
      let updated = 0
      const errors: string[] = []

      for (const example of parsed) {
        try {
          // Check if example exists
          const checkResponse = await fetch(`/api/admin/examples/${example.id}`)
          const exists = checkResponse.ok

          const response = exists
            ? await fetch(`/api/admin/examples/${example.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: example.title,
                  description: example.description,
                  category: example.category || "classic",
                  difficulty: example.difficulty || "beginner",
                  applications: example.applications || [],
                  interactive_demo: example.interactiveDemo || example.interactive_demo || false,
                  design: example.design,
                  explanation: example.explanation,
                  lesson_connections: example.lessonConnections,
                  mathematical_details: example.mathematicalDetails,
                  real_world_context: example.realWorldContext,
                  practice_questions: example.practiceQuestions || [],
                  status: example.status || "published",
                }),
              })
            : await fetch("/api/admin/examples", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: example.id,
                  title: example.title,
                  description: example.description,
                  category: example.category || "classic",
                  difficulty: example.difficulty || "beginner",
                  applications: example.applications || [],
                  interactive_demo: example.interactiveDemo || example.interactive_demo || false,
                  design: example.design,
                  explanation: example.explanation,
                  lesson_connections: example.lessonConnections,
                  mathematical_details: example.mathematicalDetails,
                  real_world_context: example.realWorldContext,
                  practice_questions: example.practiceQuestions || [],
                  status: example.status || "published",
                }),
              })

          const data = await response.json()
          if (data.success) {
            exists ? updated++ : created++
          } else {
            errors.push(`${example.id}: ${data.error}`)
          }
        } catch (err: any) {
          errors.push(`${example.id}: ${err.message}`)
        }
      }

      const errorCount = errors.length
      if (errorCount > 0) {
        showToast("warning", `Import completed with ${errorCount} error(s)`, {
          description: `${created} created, ${updated} updated`,
        })
      } else {
        success("Import completed successfully!", {
          description: `${created} created, ${updated} updated`,
        })
      }

      // Reload examples
      const reloadResponse = await fetch("/api/admin/examples")
      const reloadData = await reloadResponse.json()
      if (reloadData.success) {
        setExamples(reloadData.data || [])
      }
      setImportDialogOpen(false)
      setPreviewData(null)
      setPreviewFile(null)
    } catch (err) {
      console.error("Import error:", err)
      error("Failed to import examples")
    } finally {
      setImporting(false)
    }
  }

  function getDifficultyColor(difficulty: string) {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
      case "intermediate":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
      case "advanced":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      default:
        return "bg-muted"
    }
  }

  return (
    <div className="space-y-8">
      {/* Title and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Manage Examples</h1>
          <p className="text-muted-foreground">Create, edit, and organize example Markov chains</p>
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
                <span className="hidden sm:inline">Sync from JSON</span>
                <span className="sm:hidden">Sync</span>
              </>
            )}
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
          <Link href="/admin/examples/new" className="w-full sm:w-auto">
            <Button className="cursor-pointer w-full sm:w-auto" size="sm">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Example</span>
              <span className="sm:hidden">New Example</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search examples..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md cursor-text"
        />
      </div>

      {/* Examples List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading examples...</span>
          </div>
        ) : filteredExamples.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "No examples match your search." : "No examples found. Create your first example to get started."}
            </p>
            {!searchTerm && (
              <Link href="/admin/examples/new" className="mt-4 inline-block">
                <Button className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Example
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          filteredExamples.map((example) => (
            <Card key={example.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <Sparkles className="h-5 w-5 text-primary shrink-0" />
                      <CardTitle className="text-xl break-words">{example.title}</CardTitle>
                    </div>
                    <CardDescription className="text-base mb-3 break-words">{example.description}</CardDescription>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={getDifficultyColor(example.difficulty)}
                      >
                        {example.difficulty}
                      </Badge>
                      <Badge variant="outline">{example.category}</Badge>
                      {example.interactive_demo && (
                        <Badge variant="secondary">Interactive</Badge>
                      )}
                      <Badge variant={example.status === "published" ? "default" : "secondary"}>
                        {example.status}
                      </Badge>
                      {example.applications.length > 0 && (
                        <Badge variant="outline">{example.applications.length} applications</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 sm:ml-4">
                    <Link href={`/admin/examples/${example.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(example.id)}
                      disabled={deleting === example.id}
                    >
                      {deleting === example.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="break-words">Import Examples</DialogTitle>
            <DialogDescription className="break-words">
              Upload a JSON file containing examples. Existing examples with the same ID will be updated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <FileUpload
                accept=".json"
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                selectedFile={previewFile}
                loading={importing}
                disabled={importing}
              />
            </div>
            {previewData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Found {previewData.count} example{previewData.count !== 1 ? "s" : ""}
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {previewData.examples.map((ex: any) => (
                      <div key={ex.id} className="text-sm p-2 rounded bg-muted">
                        <div className="font-medium">{ex.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {ex.category} • {ex.difficulty}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setImportDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!previewFile || importing}
              className="w-full sm:w-auto"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Importing...</span>
                  <span className="sm:hidden">Importing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Import</span>
                  <span className="sm:hidden">Import</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
