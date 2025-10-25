"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Copy, Check } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import MarkdownRenderer from "@/components/markdown-renderer"
import { fetchLesson } from "@/lib/lms"

function MarkdownSection({ lessonId }: { lessonId: string }) {
  const [content, setContent] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const lesson = await fetchLesson(lessonId)
      setContent(lesson?.content ?? "")
      setLoading(false)
    }
    if (lessonId) load()
  }, [lessonId])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading content…</div>
  }
  return <MarkdownRenderer content={content} />
}

export default function PreviewPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const lessonId = params.lessonId as string
  const [copied, setCopied] = useState(false)

  const previewUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/learn/${lessonId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(previewUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Real content is fetched below

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href={`/admin/courses/${courseId}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-semibold">Back to Course</span>
            </Link>
            <div className="flex gap-2">
              <Button onClick={handleCopyLink} variant="outline" className="cursor-pointer bg-transparent">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
              <Link href={previewUrl} target="_blank">
                <Button className="cursor-pointer">View Live</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {/* Markdown will be rendered here */}
            <MarkdownSection lessonId={lessonId} />
          </div>
        </Card>

        {/* Sharing Section */}
        <Card className="mt-8 p-6">
          <h3 className="font-semibold mb-4">Share This Lesson</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Preview URL</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={previewUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-muted text-sm font-mono"
                />
                <Button onClick={handleCopyLink} variant="outline" className="cursor-pointer bg-transparent">
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Embed Code</p>
              <textarea
                readOnly
                value={`<iframe src="${previewUrl}" width="100%" height="600" frameborder="0"></iframe>`}
                className="w-full px-3 py-2 border border-border rounded-md bg-muted text-sm font-mono"
                rows={3}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
