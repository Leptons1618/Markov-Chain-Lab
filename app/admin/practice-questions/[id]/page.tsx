"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Save, Loader2, Plus, X, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { fetchCourses, fetchLessonsByCourse, type Course, type Lesson } from "@/lib/lms"

interface Option {
  id: string
  text: string
  correct: boolean
}

interface PracticeQuestion {
  id: string
  title: string
  question: string
  type: "multiple_choice" | "text_input" | "numeric_input"
  options?: Option[]
  correct_answer?: string
  hint?: string
  solution: string
  math_explanation?: string
  difficulty?: "easy" | "medium" | "hard"
  tags?: string[]
  status: "draft" | "published"
  lesson_id?: string
}

export default function EditPracticeQuestionPage() {
  const params = useParams()
  const router = useRouter()
  const questionId = params.id as string

  const [formData, setFormData] = useState<PracticeQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [newTag, setNewTag] = useState("")
  const [newOptionText, setNewOptionText] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [loadingLessons, setLoadingLessons] = useState(false)

  // Load courses on mount
  useEffect(() => {
    const loadCourses = async () => {
      const fetchedCourses = await fetchCourses()
      setCourses(fetchedCourses)
    }
    loadCourses()
  }, [])

  useEffect(() => {
    const loadQuestion = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/practice-questions/${questionId}`)
        const data = await response.json()
        if (data.success && data.data) {
          setFormData(data.data)
          // If question has lesson_id, find its course and load lessons
          if (data.data.lesson_id && courses.length > 0) {
            // Find course by checking lessons - try all courses
            for (const course of courses) {
              const courseLessons = await fetchLessonsByCourse(course.id)
              if (courseLessons.some(l => l.id === data.data.lesson_id)) {
                setSelectedCourseId(course.id)
                setLessons(courseLessons.sort((a, b) => a.order - b.order))
                break
              }
            }
          }
        } else {
          setError("Question not found")
        }
      } catch (error) {
        console.error("Failed to load question:", error)
        setError("Failed to load question")
      } finally {
        setLoading(false)
      }
    }

    if (questionId && courses.length > 0) {
      loadQuestion()
    }
  }, [questionId, courses])

  // Load lessons when course is selected
  useEffect(() => {
    if (!selectedCourseId) {
      setLessons([])
      return
    }

    const loadLessons = async () => {
      setLoadingLessons(true)
      const fetchedLessons = await fetchLessonsByCourse(selectedCourseId)
      setLessons(fetchedLessons.sort((a, b) => a.order - b.order))
      setLoadingLessons(false)
    }

    loadLessons()
  }, [selectedCourseId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!formData) return
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev!,
      [name]: value,
    }))
    setError("")
  }

  const handleSelectChange = (name: string, value: string) => {
    if (!formData) return
    setFormData((prev) => ({
      ...prev!,
      [name]: value === "" ? undefined : value,
    }))
    setError("")
  }

  const addOption = () => {
    if (!formData || !newOptionText.trim()) return
    const newOption: Option = {
      id: String.fromCharCode(97 + (formData.options?.length || 0)),
      text: newOptionText.trim(),
      correct: false,
    }
    setFormData((prev) => ({
      ...prev!,
      options: [...(prev?.options || []), newOption],
    }))
    setNewOptionText("")
  }

  const removeOption = (index: number) => {
    if (!formData) return
    setFormData((prev) => ({
      ...prev!,
      options: prev?.options?.filter((_, i) => i !== index) || [],
    }))
  }

  const toggleOptionCorrect = (index: number) => {
    if (!formData) return
    setFormData((prev) => ({
      ...prev!,
      options: prev?.options?.map((opt, i) =>
        i === index ? { ...opt, correct: !opt.correct } : opt
      ) || [],
    }))
  }

  const addTag = () => {
    if (!formData || !newTag.trim() || formData.tags?.includes(newTag.trim())) return
    setFormData((prev) => ({
      ...prev!,
      tags: [...(prev?.tags || []), newTag.trim()],
    }))
    setNewTag("")
  }

  const removeTag = (tag: string) => {
    if (!formData) return
    setFormData((prev) => ({
      ...prev!,
      tags: prev?.tags?.filter((t) => t !== tag) || [],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setSaving(true)
    setError("")

    // Validation
    if (!formData.title || !formData.question || !formData.solution) {
      setError("Please fill in all required fields")
      setSaving(false)
      return
    }

    if (formData.type === "multiple_choice" && (!formData.options || formData.options.length === 0)) {
      setError("Multiple choice questions require at least one option")
      setSaving(false)
      return
    }

    if (formData.type === "multiple_choice" && !formData.options?.some((opt) => opt.correct)) {
      setError("At least one option must be marked as correct")
      setSaving(false)
      return
    }

    if ((formData.type === "text_input" || formData.type === "numeric_input") && !formData.correct_answer) {
      setError(`${formData.type.replace("_", " ")} questions require a correct answer`)
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/admin/practice-questions/${questionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        router.push("/admin/practice-questions")
      } else {
        const errorMsg = result.error || "Failed to update practice question"
        const hintMsg = result.hint ? `\n\n${result.hint}` : ""
        setError(errorMsg + hintMsg)
      }
    } catch (error) {
      console.error("Failed to update practice question:", error)
      setError("Failed to update practice question. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading question...</p>
        </div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Question not found</p>
          <Link href="/admin/practice-questions">
            <Button variant="outline">Back to Practice Questions</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Practice Question</CardTitle>
          <CardDescription>Update practice question details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id">Question ID</Label>
                <Input
                  id="id"
                  name="id"
                  value={formData.id}
                  disabled
                  className="cursor-not-allowed bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  className="cursor-text"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Question Type *</Label>
                <Select value={formData.type} onValueChange={(value: any) => handleSelectChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="text_input">Text Input</SelectItem>
                    <SelectItem value="numeric_input">Numeric Input</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={formData.difficulty || ""} onValueChange={(value: any) => handleSelectChange("difficulty", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question">Question *</Label>
              <Textarea
                id="question"
                name="question"
                value={formData.question}
                onChange={handleChange}
                rows={4}
                required
                disabled={saving}
                className="cursor-text"
              />
            </div>

            {formData.type === "multiple_choice" && (
              <div className="space-y-2">
                <Label>Options *</Label>
                <div className="space-y-2">
                  {formData.options?.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option.text}
                        onChange={(e) => {
                          const newOptions = [...(formData.options || [])]
                          newOptions[index].text = e.target.value
                          setFormData((prev) => ({ ...prev!, options: newOptions }))
                        }}
                        placeholder={`Option ${option.id}`}
                        className="flex-1 cursor-text"
                      />
                      <Button
                        type="button"
                        variant={option.correct ? "default" : "outline"}
                        onClick={() => toggleOptionCorrect(index)}
                        className="cursor-pointer"
                      >
                        {option.correct ? <CheckCircle2 className="h-4 w-4" /> : "Mark Correct"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newOptionText}
                      onChange={(e) => setNewOptionText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addOption()
                        }
                      }}
                      placeholder="Add new option..."
                      className="flex-1 cursor-text"
                    />
                    <Button type="button" onClick={addOption} variant="outline" className="cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {(formData.type === "text_input" || formData.type === "numeric_input") && (
              <div className="space-y-2">
                <Label htmlFor="correct_answer">Correct Answer *</Label>
                <Input
                  id="correct_answer"
                  name="correct_answer"
                  value={formData.correct_answer || ""}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  className="cursor-text"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="hint">Hint</Label>
              <Textarea
                id="hint"
                name="hint"
                value={formData.hint || ""}
                onChange={handleChange}
                rows={2}
                disabled={saving}
                className="cursor-text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution">Solution *</Label>
              <Textarea
                id="solution"
                name="solution"
                value={formData.solution}
                onChange={handleChange}
                rows={4}
                required
                disabled={saving}
                className="cursor-text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="math_explanation">Math Explanation (Step-by-step)</Label>
              <Textarea
                id="math_explanation"
                name="math_explanation"
                value={formData.math_explanation || ""}
                onChange={handleChange}
                rows={6}
                disabled={saving}
                className="cursor-text font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use LaTeX math notation: $E[X] = \sum x \cdot P(X=x)$
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="Add tag..."
                  className="flex-1 cursor-text"
                />
                <Button type="button" onClick={addTag} variant="outline" className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course">Course (for mapping)</Label>
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

              <div className="space-y-2">
                <Label htmlFor="lesson_id">Lesson (optional)</Label>
                <Select
                  value={formData.lesson_id || "__none__"}
                  onValueChange={(value: string) => handleSelectChange("lesson_id", value === "__none__" ? undefined : value)}
                  disabled={!selectedCourseId || loadingLessons}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingLessons ? "Loading..." : "Select a lesson"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No lesson mapping</SelectItem>
                    {lessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <Button type="submit" disabled={saving} className="cursor-pointer">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Link href="/admin/practice-questions">
                <Button type="button" variant="outline" disabled={saving} className="cursor-pointer bg-transparent">
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
