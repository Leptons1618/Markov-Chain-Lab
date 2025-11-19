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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Edit, Trash2, Plus, Loader2, Download, RefreshCw, Upload, FileText, X, CheckCircle, FileJson, CheckCircle2, AlertCircle } from "lucide-react"
import { FileUpload } from "@/components/ui/file-upload"
import Link from "next/link"
import { useToast } from "@/lib/hooks/use-toast"

interface PracticeQuestion {
  id: string
  title: string
  question: string
  type: "multiple_choice" | "text_input" | "numeric_input"
  options?: Array<{ id: string; text: string; correct: boolean }>
  correct_answer?: string
  hint?: string
  solution: string
  math_explanation?: string
  difficulty?: "easy" | "medium" | "hard"
  tags?: string[]
  status: "draft" | "published"
  created_at: string
  updated_at: string
}

export default function PracticeQuestionsPage() {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
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

  // Fetch questions on mount
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/admin/practice-questions")
        const data = await response.json()
        if (data.success) {
          setQuestions(data.data || [])
        }
      } catch (error) {
        console.error("Failed to load practice questions:", error)
      } finally {
        setLoading(false)
      }
    }
    loadQuestions()
  }, [])

  const filteredQuestions = questions.filter(
    (q) =>
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.tags && q.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this practice question? This action cannot be undone.")) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/practice-questions/${id}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        setQuestions(questions.filter((q) => q.id !== id))
        success("Practice question deleted successfully")
      } else {
        const errorData = await response.json()
        error(`Failed to delete question: ${errorData.error}`)
      }
    } catch (err) {
      console.error("Failed to delete question:", err)
      error("Failed to delete question. Please try again.")
    } finally {
      setDeleting(null)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch("/api/admin/practice-questions/export", {
        method: "GET",
      })

      if (!response.ok) {
        const data = await response.json()
        error(`Export failed: ${data.error || "Unknown error"}`)
        return
      }

      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = "practice-questions-export.json"
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

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
      error("Failed to export practice questions")
    } finally {
      setExporting(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      // Reload questions from database
      const response = await fetch("/api/admin/practice-questions")
      const data = await response.json()
      if (data.success) {
        setQuestions(data.data || [])
        success("Practice questions synchronized successfully!", {
          description: `Loaded ${data.data?.length || 0} questions`,
        })
      } else {
        error(`Failed to sync: ${data.error}`)
      }
    } catch (err) {
      console.error("Sync error:", err)
      error("Failed to synchronize practice questions")
    } finally {
      setSyncing(false)
    }
  }

  // FileUpload passes a File directly, so accept a File instead of an input change event
  const handleFileSelect = async (file: File) => {
    if (!file) return

    if (!file.name.endsWith(".json")) {
      error("Please upload a JSON file")
      return
    }

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)

      // Validate structure
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        error("Invalid file format. Expected JSON with 'questions' array.")
        return
      }

      setPreviewFile(file)
      setPreviewData(parsed)
      info(`Preview loaded: ${parsed.questions.length} questions found`)
    } catch (err) {
      console.error("File parse error:", err)
      error("Failed to parse JSON file. Please check the file format.")
    }
  }

  const handleFileRemove = () => {
    setPreviewFile(null)
    setPreviewData(null)
  }

  const handleUpload = async () => {
    if (!previewFile) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append("file", previewFile)
      formData.append("options", JSON.stringify({ overwriteQuestions: {}, saveQuestionsAsNew: [] }))

      const response = await fetch("/api/admin/practice-questions/import", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        error(`Import failed: ${data.error}`)
        return
      }

      const errorCount = data.data.errors?.length || 0
      if (errorCount > 0) {
        showToast("warning", `Import completed with ${errorCount} error(s)`, {
          description: `${data.data.created} created, ${data.data.updated} updated`,
        })
      } else {
        success("Import completed successfully!", {
          description: `${data.data.created} created, ${data.data.updated} updated`,
        })
      }

      // Reload questions
      const reloadResponse = await fetch("/api/admin/practice-questions")
      const reloadData = await reloadResponse.json()
      if (reloadData.success) {
        setQuestions(reloadData.data || [])
      }
      setImportDialogOpen(false)
      setPreviewData(null)
      setPreviewFile(null)
    } catch (err) {
      console.error("Import error:", err)
      error("Failed to import practice questions")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Title and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Manage Practice Questions</h1>
          <p className="text-muted-foreground">Create, edit, and organize practice questions</p>
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
          <Link href="/admin/practice-questions/new" className="w-full sm:w-auto">
            <Button className="cursor-pointer w-full sm:w-auto" size="sm">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Question</span>
              <span className="sm:hidden">New Question</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md cursor-text"
        />
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading practice questions...</span>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "No questions match your search." : "No practice questions found. Create your first question to get started."}
            </p>
            {!searchTerm && (
              <Link href="/admin/practice-questions/new" className="mt-4 inline-block">
                <Button className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Question
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          filteredQuestions.map((question) => (
            <Card key={question.id} className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold break-words">{question.title}</h3>
                    <Badge variant={question.status === "published" ? "default" : "secondary"}>
                      {question.status}
                    </Badge>
                    {question.difficulty && (
                      <Badge variant="outline">{question.difficulty}</Badge>
                    )}
                    <Badge variant="outline">{question.type.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-muted-foreground mb-3 line-clamp-2 break-words">{question.question}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {question.tags && question.tags.length > 0 && question.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(question.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/admin/practice-questions/${question.id}`}>
                    <Button variant="outline" size="sm" className="cursor-pointer bg-transparent">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(question.id)}
                    disabled={deleting === question.id}
                    className="cursor-pointer bg-transparent text-destructive hover:text-destructive"
                  >
                    {deleting === question.id ? (
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
        }
      }}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl break-words">Import Practice Questions</DialogTitle>
                <DialogDescription className="mt-1 break-words">
                  Upload a JSON file to import practice questions. Preview the contents before uploading.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* File Upload Section */}
            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                Select JSON File
              </label>
              <FileUpload
                accept=".json"
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                selectedFile={previewFile}
                loading={importing}
                disabled={importing}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Only JSON files are supported. File must contain a "questions" array.
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
                        <Badge variant="secondary" className="text-xs">
                          {previewData.questions?.length || 0} questions
                        </Badge>
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 break-words">
                        Review the questions below before uploading
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFileRemove}
                    className="cursor-pointer hover:bg-destructive/10 hover:text-destructive shrink-0 self-start sm:self-center"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                  {previewData.questions?.slice(0, 10).map((q: any, idx: number) => (
                    <div key={idx} className="text-sm p-3 bg-background/80 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            <span className="text-primary">#{idx + 1}</span>
                            <span className="truncate">{q.title || `Question ${idx + 1}`}</span>
                          </div>
                          <div className="text-muted-foreground text-xs mt-1.5 line-clamp-2">{q.question}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {q.type && (
                          <Badge variant="outline" className="text-xs">
                            {q.type.replace("_", " ")}
                          </Badge>
                        )}
                        {q.difficulty && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {q.difficulty}
                          </Badge>
                        )}
                        {q.lesson_id && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {q.lesson_id}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {previewData.questions?.length > 10 && (
                    <div className="text-sm text-muted-foreground text-center py-3 bg-background/50 rounded-lg border border-dashed">
                      <FileText className="h-4 w-4 mx-auto mb-1 opacity-50" />
                      ... and {previewData.questions.length - 10} more questions
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
              }}
              disabled={importing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!previewFile || importing}
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
                  <span className="hidden sm:inline">Upload Questions</span>
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
