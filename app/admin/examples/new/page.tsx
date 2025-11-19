"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload } from "@/components/ui/file-upload"
import { DesignPreview } from "@/components/admin/design-preview"
import { Save, Loader2, ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/lib/hooks/use-toast"

export default function NewExamplePage() {
  const router = useRouter()
  const { success, error } = useToast()
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    description: "",
    category: "classic" as "classic" | "modern",
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
    applications: [] as string[],
    interactive_demo: false,
    status: "draft" as "draft" | "published",
    design: JSON.stringify({ states: [], transitions: [] }, null, 2),
    explanation: "",
    lesson_connections: "",
    mathematical_details: "",
    real_world_context: "",
    practice_questions: "",
  })
  const [newApplication, setNewApplication] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [designFile, setDesignFile] = useState<File | null>(null)
  const [parsedDesign, setParsedDesign] = useState<any>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "title" && !prev.id && { id: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }),
    }))
    setFormError("")
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFormError("")
  }

  const addApplication = () => {
    if (!newApplication.trim()) return
    setFormData((prev) => ({
      ...prev,
      applications: [...prev.applications, newApplication.trim()],
    }))
    setNewApplication("")
  }

  const removeApplication = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      applications: prev.applications.filter((_, i) => i !== index),
    }))
  }

  const handleDesignFileSelect = async (file: File) => {
    setDesignFile(file)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)

      // Handle tools export format: { version, chain: { states, transitions }, ... }
      let design = parsed
      if (parsed.chain && parsed.chain.states && parsed.chain.transitions) {
        design = parsed.chain
      } else if (parsed.design && parsed.design.states && parsed.design.transitions) {
        design = parsed.design
      }

      // Validate design structure
      if (!design.states || !Array.isArray(design.states) || design.states.length === 0) {
        error("Invalid design format. Design must have at least one state.")
        setDesignFile(null)
        return
      }
      if (!design.transitions || !Array.isArray(design.transitions)) {
        error("Invalid design format. Design must have transitions array.")
        setDesignFile(null)
        return
      }

      setParsedDesign(design)
      setFormData((prev) => ({
        ...prev,
        design: JSON.stringify(design, null, 2),
      }))
      success("Design imported successfully!")
    } catch (err: any) {
      console.error("Design import error:", err)
      error(`Failed to import design: ${err.message}`)
      setDesignFile(null)
      setParsedDesign(null)
    }
  }

  const handleDesignFileRemove = () => {
    setDesignFile(null)
    setParsedDesign(null)
    setFormData((prev) => ({
      ...prev,
      design: JSON.stringify({ states: [], transitions: [] }, null, 2),
    }))
  }

  const currentDesign = useMemo(() => {
    try {
      const design = JSON.parse(formData.design)
      if (design.states && design.transitions) {
        return design
      }
    } catch {
      // Invalid JSON, return null
    }
    return parsedDesign
  }, [formData.design, parsedDesign])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    // Validate required fields
    if (!formData.id || !formData.title || !formData.description) {
      setFormError("Please fill in all required fields (ID, Title, Description)")
      return
    }

    // Validate design JSON
    let design
    try {
      design = JSON.parse(formData.design)
      if (!design.states || !Array.isArray(design.states) || design.states.length === 0) {
        setFormError("Design must have at least one state")
        return
      }
      if (!design.transitions || !Array.isArray(design.transitions)) {
        setFormError("Design must have transitions array")
        return
      }
    } catch (err) {
      setFormError("Invalid design JSON format")
      return
    }

    setIsSubmitting(true)

    try {
      const payload: any = {
        id: formData.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        applications: formData.applications,
        interactive_demo: formData.interactive_demo,
        design,
        status: formData.status,
      }

      if (formData.explanation) payload.explanation = formData.explanation
      if (formData.real_world_context) payload.real_world_context = formData.real_world_context
      if (formData.practice_questions) {
        try {
          payload.practice_questions = JSON.parse(formData.practice_questions)
        } catch {
          payload.practice_questions = formData.practice_questions.split("\n").filter((q) => q.trim())
        }
      }
      if (formData.lesson_connections) {
        try {
          payload.lesson_connections = JSON.parse(formData.lesson_connections)
        } catch {
          setFormError("Invalid lesson_connections JSON format")
          setIsSubmitting(false)
          return
        }
      }
      if (formData.mathematical_details) {
        try {
          payload.mathematical_details = JSON.parse(formData.mathematical_details)
        } catch {
          setFormError("Invalid mathematical_details JSON format")
          setIsSubmitting(false)
          return
        }
      }

      const response = await fetch("/api/admin/examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create example")
      }

      success("Example created successfully!")
      router.push("/admin/examples")
    } catch (err: any) {
      console.error("Create error:", err)
      setFormError(err.message || "Failed to create example")
      error(err.message || "Failed to create example")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/examples">
          <Button variant="outline" size="sm" className="shrink-0">
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold break-words">Create New Example</h1>
          <p className="text-muted-foreground break-words">Add a new example Markov chain</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Example Details</CardTitle>
          <CardDescription>Fill in the details for your new example</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{formError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id">Example ID *</Label>
                <Input
                  id="id"
                  name="id"
                  placeholder="e.g., pushkin-poetry"
                  value={formData.id}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="cursor-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Pushkin's Poetry Analysis"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="cursor-text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of the example..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
                required
                disabled={isSubmitting}
                className="cursor-text"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value: any) => handleSelectChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty *</Label>
                <Select value={formData.difficulty} onValueChange={(value: any) => handleSelectChange("difficulty", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <Label htmlFor="design">Design (JSON) *</Label>
                  <div className="text-xs text-muted-foreground">
                    Compatible with tools export format
                  </div>
                </div>
                <FileUpload
                  accept=".json"
                  onFileSelect={handleDesignFileSelect}
                  onFileRemove={handleDesignFileRemove}
                  selectedFile={designFile}
                  disabled={isSubmitting}
                />
              </div>

              {/* Design Preview */}
              {currentDesign && (
                <div className="space-y-2">
                  <Label>Design Preview</Label>
                  <DesignPreview design={currentDesign} width={400} height={250} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="design-json">Design JSON (editable)</Label>
                <Textarea
                  id="design"
                  name="design"
                  value={formData.design}
                  onChange={handleChange}
                  rows={12}
                  required
                  disabled={isSubmitting}
                  className="font-mono text-sm cursor-text"
                  placeholder='{"states": [...], "transitions": [...]}'
                />
                <p className="text-xs text-muted-foreground">
                  JSON object with states and transitions arrays. You can import from tools export or edit manually.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation</Label>
              <Textarea
                id="explanation"
                name="explanation"
                value={formData.explanation}
                onChange={handleChange}
                rows={4}
                disabled={isSubmitting}
                className="cursor-text"
                placeholder="Detailed explanation of the example..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="real_world_context">Real-World Context</Label>
              <Textarea
                id="real_world_context"
                name="real_world_context"
                value={formData.real_world_context}
                onChange={handleChange}
                rows={3}
                disabled={isSubmitting}
                className="cursor-text"
                placeholder="How this example applies to real-world scenarios..."
              />
            </div>

            <div className="space-y-2">
              <Label>Applications</Label>
              <div className="flex gap-2">
                <Input
                  value={newApplication}
                  onChange={(e) => setNewApplication(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addApplication())}
                  placeholder="Add application area..."
                  className="cursor-text"
                />
                <Button type="button" onClick={addApplication} variant="outline">
                  Add
                </Button>
              </div>
              {formData.applications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.applications.map((app, index) => (
                    <div key={index} className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm">
                      {app}
                      <button
                        type="button"
                        onClick={() => removeApplication(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="interactive_demo"
                checked={formData.interactive_demo}
                onChange={(e) => setFormData((prev) => ({ ...prev, interactive_demo: e.target.checked }))}
                className="cursor-pointer"
              />
              <Label htmlFor="interactive_demo" className="cursor-pointer">
                Interactive Demo Available
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => handleSelectChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Example
                  </>
                )}
              </Button>
              <Link href="/admin/examples">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
