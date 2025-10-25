"use client";

import React, { useEffect, useMemo, useState } from "react"

// Lightweight, defers loading of react-markdown & remark-gfm until needed.
// Avoids SSR module resolution and keeps initial bundles small.
export default function MarkdownRenderer({ content }: { content: string }) {
  const [MD, setMD] = useState<null | ((props: any) => React.ReactNode)>(null)
  const [gfm, setGfm] = useState<any>(null)
  const [rehypeHl, setRehypeHl] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [
          { default: ReactMarkdown },
          { default: remarkGfm },
          { default: rehypeHighlight },
        ] = await Promise.all([
          import("react-markdown"),
          import("remark-gfm"),
          import("rehype-highlight"),
        ])
        if (mounted) {
          // Wrap ReactMarkdown to avoid re-renders when content changes
          setMD(() => (props: any) => React.createElement(ReactMarkdown as any, props))
          setGfm(() => remarkGfm)
          setRehypeHl(() => rehypeHighlight)
        }
      } catch {
        // If dynamic import fails (e.g., offline), we keep a plain fallback
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const sanitized = useMemo(() => content ?? "", [content])

  if (!MD) {
    // Plain fallback: render as pre-wrapped text to preserve readability
    return (
      <pre className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{sanitized}</pre>
    )
  }

  return (
    <div className="markdown prose max-w-none prose-headings:scroll-mt-24 dark:prose-invert">
      {/* We do not allow raw HTML by default. */}
      {MD({
        children: sanitized,
        remarkPlugins: gfm ? [gfm] : [],
        rehypePlugins: rehypeHl ? [rehypeHl] : [],
      })}
    </div>
  )
}
