"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

// Small presentational icons used for copy actions
function IconClipboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className || "w-4 h-4"} aria-hidden>
      <rect x="9" y="2" width="7" height="4" rx="1" />
      <rect x="3" y="6" width="18" height="16" rx="2" />
    </svg>
  )
}

function IconLambda({ className }: { className?: string }) {
  // simple lambda-like glyph using text fallback for consistency
  return (
    <span className={className || "inline-block w-4 h-4 text-xs leading-4"} aria-hidden>
      λ
    </span>
  )
}

// Reusable copy button with transient "copied" state and consistent visuals
function CopyButton({
  text,
  title,
  ariaLabel,
  variant = "clipboard",
  className = "",
}: {
  text: string
  title?: string
  ariaLabel?: string
  variant?: "clipboard" | "lambda"
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    let t: any = null
    if (copied) t = setTimeout(() => setCopied(false), 1400)
    return () => clearTimeout(t)
  }, [copied])

  const onClick = useCallback(() => {
    try {
      navigator.clipboard?.writeText(text)
      setCopied(true)
    } catch {
      // ignore
    }
  }, [text])

  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={`px-2 py-1 rounded-md border text-sm flex items-center gap-2 transition transform duration-150 ease-in-out hover:-translate-y-0.5 active:translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-1 ${className}`}
    >
      {copied ? (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : variant === "lambda" ? (
        <IconLambda className="text-sm" />
      ) : (
        <IconClipboard className="w-4 h-4" />
      )}
      <span className="sr-only">{ariaLabel || title || "Copy"}</span>
    </button>
  )
}

/**
 * markdown-renderer.tsx
 *
 * Enhanced Markdown renderer for math-heavy educational content.
 * - Dynamically (and safely) imports optional math libs (remark-math, rehype-katex, katex).
 * - Falls back gracefully when math libs are missing (shows raw LaTeX with "Copy" button).
 * - Supports: GFM, syntax highlighting, sanitized HTML, TOC, copyable code blocks,
 *   collapsible "solution" fenced blocks, interactive chart/video handlers preserved.
 *
 * Drop this file in place of your previous component. If you want full KaTeX rendering,
 * install: `npm i remark-math rehype-katex katex` (or yarn/pnpm).
 */

/* ---------------------
   Top-level component
   --------------------- */

export default function MarkdownRenderer({ content }: { content: string }) {
  const [libs, setLibs] = useState<any | null>(null)
  const [loadError, setLoadError] = useState(false)
  // removed study/reading modes per UX update
  // UI state enhancements
  const [showRaw, setShowRaw] = useState(false)
  // TOC hidden by default per request
  const [showToc, setShowToc] = useState(false)
  const [activeHeading, setActiveHeading] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  // micro-interaction feedback states for toolbar buttons
  const [rawFlash, setRawFlash] = useState(false)
  const [copyFlash, setCopyFlash] = useState(false)
  const [tocFlash, setTocFlash] = useState(false)

  // dynamic imports with graceful fallback for optional math libs
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Core libs (required)
        const [
          { default: ReactMarkdown },
          { default: remarkGfm },
          { default: rehypeHighlight },
          rehypeSanitizeModule,
          hastUtilSanitizeModule,
        ] = await Promise.all([
          import("react-markdown"),
          import("remark-gfm"),
          import("rehype-highlight"),
          import("rehype-sanitize"),
          import("hast-util-sanitize"),
        ])

        // Optional math libs - try/catch individually
        let remarkMath: any = null
        let rehypeKatex: any = null
        let katexModule: any = null
        try {
          const r = await import("remark-math")
          remarkMath = r?.default ?? r
        } catch (e) {
          // not installed
        }

        try {
          const rk = await import("rehype-katex")
          rehypeKatex = rk?.default ?? rk
        } catch (e) {
          // not installed
        }

        try {
          const kk = await import("katex")
          katexModule = kk?.default ?? kk
        } catch (e) {
          // not installed
        }

        // Inject KaTeX stylesheet only if rehype-katex (or katex) is present
        if (mounted && (rehypeKatex || katexModule) && typeof document !== "undefined") {
          const id = "katex-css"
          if (!document.getElementById(id)) {
            const link = document.createElement("link")
            link.id = id
            link.rel = "stylesheet"
            // pinned CDN; change if you self-host
            link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
            link.crossOrigin = "anonymous"
            document.head.appendChild(link)
          }
        }

        if (!mounted) return

        setLibs({
          ReactMarkdown,
          remarkGfm,
          rehypeHighlight,
          // cast import results to `any` so TS won't complain about missing `.default`
          rehypeSanitize: (rehypeSanitizeModule as any)?.default ?? (rehypeSanitizeModule as any),
          defaultSchema: ((hastUtilSanitizeModule as any)?.default ?? (hastUtilSanitizeModule as any)),
          remarkMath,
          rehypeKatex,
          katexModule,
        })
      } catch (err) {
        console.error("Failed to load markdown libs:", err)
        if (mounted) setLoadError(true)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Always call hooks, even if libs are not loaded yet
  const text = useMemo(() => content ?? "", [content])
  const toc = useMemo(() => {
    const lines = text.split("\n")
    const out: { level: number; text: string; id: string }[] = []
    const slug = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
    for (const ln of lines) {
      const m = ln.match(/^(#{1,6})\s+(.*)$/)
      if (m) out.push({ level: m[1].length, text: m[2].trim(), id: slug(m[2].trim()) })
    }
    return out
  }, [text])

  // Use default values if libs are not loaded
  const ReactMarkdown = libs?.ReactMarkdown ?? (() => <pre className="whitespace-pre-wrap p-4 rounded-md bg-card border border-border">{text}</pre>)
  const remarkGfm = libs?.remarkGfm ?? (() => null)
  const rehypeHighlight = libs?.rehypeHighlight ?? (() => null)
  const rehypeSanitize = libs?.rehypeSanitize ?? (() => null)
  const defaultSchema = libs?.defaultSchema ?? {}
  const remarkMath = libs?.remarkMath ?? null
  const rehypeKatex = libs?.rehypeKatex ?? null
  const katexModule = libs?.katexModule ?? null

  // Build rehype-sanitize options (allow iframe https, code class)
  const rehypeSanitizeOptions = useMemo(() => {
    try {
      const schema = ((defaultSchema as any)?.default ?? defaultSchema) || {}
      const s = JSON.parse(JSON.stringify(schema))
      s.tagNames = Array.from(new Set([...(s.tagNames || []), "iframe"]))
      s.attributes = s.attributes || {}
      s.attributes["iframe"] = Array.from(new Set([...(s.attributes["iframe"] || []), "src", "width", "height", "allow", "allowfullscreen", "frameborder", "title"]))
      s.attributes["code"] = Array.from(new Set([...(s.attributes["code"] || []), "class", "className"]))
      s.protocols = s.protocols || {}
      s.protocols["iframe"] = Array.from(new Set([...(s.protocols["iframe"] || []), "https"]))
      return [rehypeSanitize(s)]
    } catch {
      return [rehypeSanitize]
    }
  }, [rehypeSanitize, defaultSchema])

  // Pre-scan block math $$...$$ and replace with placeholder tokens if remark-math is not available.
  // We'll create a map id => latex, and transformedText to feed into ReactMarkdown.
  const mathMap = useMemo(() => {
    const map = new Map<string, string>()
    let copy = String(text)
    if (!remarkMath) {
      const regex = /\$\$\s*([\s\S]+?)\s*\$\$/g
      let i = 0
      copy = copy.replace(regex, (_, inner: string) => {
        i += 1
        const id = `__MATH_BLOCK_${i}__`
        map.set(id, inner.trim())
        return `\n\n${id}\n\n`
      })
    }
    return { map, transformed: copy }
  }, [text, remarkMath])

  const transformedText = mathMap.transformed

  // Word count / reading time
  const wordCount = useMemo(() => (text || "").trim().split(/\s+/).filter(Boolean).length, [text])
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200))

  // Observe headings to highlight active TOC entry
  useEffect(() => {
    if (typeof window === "undefined") return
    const root = containerRef.current || document
    const headings = Array.from((root as Element).querySelectorAll(".prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6")) as HTMLElement[]
    if (!headings.length) {
      setActiveHeading(null)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length) setActiveHeading(visible[0].target.id || null)
      },
      { root: null, rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.1, 0.25, 0.5, 1] }
    )
    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [transformedText])

  // Custom components for ReactMarkdown (code, img, a, headings, paragraphs -> detect math placeholders)
  const customComponents = useMemo(() => {
    const slugify = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")

    function headingWithAnchor(level: number, id: string, children: any) {
      const Tag = `h${level}` as React.ElementType
      // Map levels to explicit typography classes to ensure different sizes
      const sizeClass =
        level === 1
          ? "text-3xl md:text-4xl font-bold mt-8 mb-4 leading-tight"
          : level === 2
          ? "text-2xl md:text-3xl font-semibold mt-8 mb-3 leading-tight"
          : level === 3
          ? "text-xl md:text-2xl font-semibold mt-6 mb-2 leading-tight"
          : level === 4
          ? "text-lg font-semibold mt-5 mb-2 leading-snug"
          : level === 5
          ? "text-base font-medium mt-4 mb-2 leading-snug"
          : "text-sm font-medium mt-3 mb-2 leading-snug"

      // Render the heading text on the left and the anchor on the right.
      // Use flex to align the anchor to the end while preserving semantics.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return (
        // @ts-ignore
        <Tag id={id} className={`group scroll-mt-24 flex items-center justify-between gap-3 ${sizeClass}`}>
          <span className="flex-1">{children}</span>
        </Tag>
      )
    }

    const base: any = {
      a: ({ href, children, ...props }: any) => {
        const isExternal = href && /^(https?:)?\//.test(href)
        return (
          <a href={href} {...props} {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="underline">
            {children}
          </a>
        )
      },
      img: ({ src, alt, title, ...props }: any) => (
        <img src={src} alt={alt || ""} title={title} loading="lazy" decoding="async" fetchPriority="low" className="rounded-md shadow-sm max-w-full h-auto" />
      ),
      code: ({ node, inline, className, children, ...props }: any) => {
        const codeText = String(children).replace(/\n$/, "")
        const match = /language-(\S+)/.exec(className || "")
        const lang = match ? match[1] : ""

        // preserve special fenced behaviors
        if (!inline && lang === "chart") {
          return <InteractiveChart code={codeText} />
        }
        if (!inline && lang === "video") {
          return <VideoEmbed code={codeText} />
        }
        if (!inline && lang === "solution") {
          return <CollapsibleSolution markdown={codeText} />
        }

        if (inline) {
          return <code className="rounded px-1 py-0.5 bg-muted text-sm">{children}</code>
        }

        const lines = codeText.split(/\r?\n/)

        return (
          <div className="not-prose relative my-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{lang || "code"}</div>
              <CopyButton text={codeText} title="Copy code" ariaLabel="Copy code" className="text-xs px-2 py-0.5 rounded-md border bg-background hover:bg-muted" />
            </div>

            <div className="overflow-auto rounded-md border border-border bg-card text-sm">
              <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr' }}>
                <ol className="text-xs leading-5 text-muted-foreground px-2 py-3" style={{ margin: 0 }}>
                  {lines.map((_, i) => (
                    <li key={i} style={{ listStyle: 'decimal', textAlign: 'right', paddingRight: 8 }}>{i + 1}</li>
                  ))}
                </ol>
                <pre className="m-0 p-3 overflow-x-auto" style={{ whiteSpace: 'pre-wrap' }}>
                  <code className={className} {...props}>
                    {codeText}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        )
      },
      h1: ({ children }: any) => {
        const text = extractText(children)
        return headingWithAnchor(1, slugify(text), children)
      },
      h2: ({ children }: any) => {
        const text = extractText(children)
        return headingWithAnchor(2, slugify(text), children)
      },
      h3: ({ children }: any) => {
        const text = extractText(children)
        return headingWithAnchor(3, slugify(text), children)
      },
      h4: ({ children }: any) => {
        const text = extractText(children)
        return headingWithAnchor(4, slugify(text), children)
      },
      h5: ({ children }: any) => {
        const text = extractText(children)
        return headingWithAnchor(5, slugify(text), children)
      },
      h6: ({ children }: any) => {
        const text = extractText(children)
        return headingWithAnchor(6, slugify(text), children)
      },
      p: ({ children, ...props }: any) => {
        const str = Array.isArray(children) ? children.map((c) => (typeof c === "string" ? c : "")).join("") : typeof children === "string" ? children : ""
        const m = str && str.match(/^__MATH_BLOCK_(\d+)__$/)
        if (m) {
          const id = `math-${m[1]}`
          const latex = mathMap.map.get(`__MATH_BLOCK_${m[1]}__`) || ""
          if (rehypeKatex && katexModule) {
            return <BlockMath latex={latex} id={id} />
          }
          return (
            <div id={id} className="my-6 not-prose">
              <div className="relative rounded-md border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{latex}</pre>
                  <div className="flex flex-col items-end gap-2">
                    <CopyButton text={latex} variant="lambda" title="Copy LaTeX" ariaLabel="Copy LaTeX" className="px-2 py-1 text-xs rounded-md border" />
                  </div>
                </div>
              </div>
            </div>
          )
        }
        // Ensure consistent paragraph spacing and line-height
        const className = [props?.className, "mt-4 mb-4 leading-relaxed text-base"].filter(Boolean).join(" ")
        return <p {...props} className={className}>{children}</p>
      },
      video: ({ node, ...props }: any) => <video {...props} controls className="rounded-lg shadow-md max-w-full h-auto" />,
    }
    return base
  }, [mathMap, rehypeKatex, katexModule])

  const remarkPlugins = useMemo(() => {
    const arr = [remarkGfm]
    if (remarkMath) arr.push(remarkMath)
    return arr.filter(Boolean)
  }, [remarkGfm, remarkMath])

  const rehypePlugins = useMemo(() => {
    const arr: any[] = [rehypeHighlight, ...rehypeSanitizeOptions]
    if (rehypeKatex) arr.push(rehypeKatex)
    return arr.filter(Boolean)
  }, [rehypeHighlight, rehypeKatex, rehypeSanitizeOptions])

  // Always render the same hooks, then branch for UI
  if (!libs && !loadError) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-2 bg-muted rounded w-full" />
          <div className="h-2 bg-muted rounded w-5/6" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    )
  }
  if (loadError || !libs) {
    return (
      <div>
        {toc.length > 0 && (
          <div className="mb-4 p-3 border rounded bg-card">
            <strong className="text-sm">Contents</strong>
            <ul className="list-disc ml-5 text-sm">{toc.map((h) => <li key={h.id}>{h.text}</li>)}</ul>
          </div>
        )}
        <pre className="whitespace-pre-wrap p-4 rounded-md bg-card border border-border">{text}</pre>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* study/reading mode removed */}
          <button
            onClick={() => {
              setShowRaw((s) => !s)
              setRawFlash(true)
              window.setTimeout(() => setRawFlash(false), 700)
            }}
            className="px-2 py-1 rounded-md border text-sm relative overflow-hidden"
            title="Toggle raw/preview"
            aria-pressed={showRaw}
          >
            <span className="flex items-center gap-2">
              <span className={`transition-transform duration-200 ${rawFlash ? 'translate-y-0 scale-100 opacity-0' : ''}`}>{showRaw ? 'Preview' : 'Raw'}</span>
              {/* tick animation appears briefly on click */}
              <svg
                viewBox="0 0 24 24"
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 transition-transform duration-300 ${rawFlash ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </button>
          <CopyButton text={text} title="Copy raw markdown" ariaLabel="Copy raw markdown" className="focus:outline-none focus:ring-2 focus:ring-offset-1" />
          <button
            onClick={() => {
              setShowToc((t) => !t)
              setTocFlash(true)
              window.setTimeout(() => setTocFlash(false), 700)
            }}
            className="px-2 py-1 rounded-md border text-sm relative overflow-hidden"
            title="Toggle table of contents"
            aria-pressed={showToc}
          >
            <span className="flex items-center gap-2">
              <span className={`${tocFlash ? 'opacity-0' : 'opacity-100'} transition-opacity duration-150`}>{showToc ? 'Hide TOC' : 'Show TOC'}</span>
            </span>
            <svg
              viewBox="0 0 24 24"
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 transition-all duration-300 ${tocFlash ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>

        <div className="text-sm text-muted-foreground">{wordCount} words • ~{readingTimeMinutes} min</div>
      </div>
      <div>
        <div ref={containerRef} className="prose max-w-none dark:prose-invert">
          {/* TOC at start of content (collapsed by default) */}
          {showToc && toc.length > 0 && (
            <div className="mb-4 p-3 border rounded bg-card">
              <div className="flex items-center justify-between">
                <strong className="text-sm">Contents</strong>
                <span className="text-xs text-muted-foreground">{toc.length}</span>
              </div>
              <nav className="mt-2 text-sm">
                <ul className="space-y-1">
                  {toc.map((h) => (
                    <li key={h.id} style={{ marginLeft: (h.level - 1) * 8 }}>
                      <a
                        href={`#${h.id}`}
                        onClick={(e) => {
                          e.preventDefault()
                          const el = document.getElementById(h.id)
                          if (el) {
                            const y = el.getBoundingClientRect().top + window.scrollY - 72
                            window.scrollTo({ top: y, behavior: "smooth" })
                          }
                        }}
                        className={`hover:underline ${activeHeading === h.id ? 'font-semibold text-primary' : ''}`}
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}

          {showRaw ? (
            <pre className="whitespace-pre-wrap p-4 rounded-md bg-card border border-border">{text}</pre>
          ) : (
            <ReactMarkdown
              remarkPlugins={remarkPlugins}
              rehypePlugins={rehypePlugins}
              components={customComponents}
            >
              {transformedText}
            </ReactMarkdown>
          )}
        </div>
        {/* In study mode the aside is still available for other controls if desired; we keep it empty here. */}
        <aside className="not-prose mt-4 md:mt-0" aria-hidden>
        </aside>
      </div>
    </div>
  )
}

/* -------------------------
   Helpers & subcomponents
   ------------------------- */

function extractText(children: any): string {
  if (!children) return ""
  if (typeof children === "string") return children
  if (Array.isArray(children)) return children.map(extractText).join("")
  if (typeof children === "object" && "props" in children) return extractText(children.props.children)
  return String(children)
}

/* InteractiveChart and VideoEmbed are preserved from earlier implementation.
   Provide simple lazy-loading wrappers so features remain functional if these libs exist. */

function InteractiveChart({ code }: { code: string }) {
  const [chartData, setChartData] = useState<any[]>([])
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  const [inputValue, setInputValue] = useState("")
  const [Recharts, setRecharts] = useState<any | null>(null)
  const [rechartsError, setRechartsError] = useState(false)

  useEffect(() => {
    try {
      const config = JSON.parse(code)
      setChartData(Array.isArray(config.data) ? config.data : config.data ? [config.data] : [])
      setChartType(config.type === "bar" ? "bar" : "line")
    } catch {
      // parse simple CSV-like or fallback
      const parsed = parseSimpleValues(code)
      setChartData(parsed.length ? parsed : [
        { name: "A", value: 10 },
        { name: "B", value: 20 },
        { name: "C", value: 15 },
      ])
    }
  }, [code])

  useEffect(() => {
    let mounted = true
    import("recharts")
      .then((mod) => {
        if (mounted) setRecharts(mod)
      })
      .catch((e) => {
        console.warn("recharts not available:", e)
        if (mounted) setRechartsError(true)
      })
    return () => {
      mounted = false
    }
  }, [])

  const addDataPoint = useCallback(() => {
    if (!inputValue) return
    const newPoint = { name: `Point ${chartData.length + 1}`, value: Number.parseFloat(inputValue) || 0 }
    setChartData((d) => [...d, newPoint])
    setInputValue("")
  }, [inputValue, chartData.length])

  const resetChart = useCallback(() => {
    try {
      const config = JSON.parse(code)
      setChartData(Array.isArray(config.data) ? config.data : [])
    } catch {
      setChartData([])
    }
  }, [code])

  if (rechartsError) {
    return <div className="text-sm text-muted-foreground">Chart library failed to load.</div>
  }
  if (!Recharts) {
    return <div className="text-sm text-muted-foreground">Loading chart...</div>
  }

  const { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts

  return (
    <div className="not-prose my-6 p-4 border border-border rounded-lg bg-card space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">Interactive Chart</h4>
          <div className="text-xs text-muted-foreground">Type: {chartType}</div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setChartType(chartType === "line" ? "bar" : "line")} className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground">
            Toggle {chartType === "line" ? "Bar" : "Line"}
          </button>
          <button onClick={resetChart} className="px-3 py-1.5 text-xs rounded-md border">Reset</button>
        </div>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter value"
          className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background"
        />
        <button onClick={addDataPoint} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">Add Point</button>
      </div>
    </div>
  )
}

function parseSimpleValues(text: string) {
  const parts = text.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean)
  const out: any[] = []
  for (const p of parts) {
    const m = p.match(/^(.+?)[:=]\s*([0-9.+-eE]+)$/)
    if (m) out.push({ name: m[1].trim(), value: Number(m[2]) })
  }
  return out
}

function VideoEmbed({ code }: { code: string }) {
  const [videoConfig, setVideoConfig] = useState<any>({})

  useEffect(() => {
    try {
      const config = JSON.parse(code)
      setVideoConfig(config)
    } catch {
      setVideoConfig({ url: code.trim() })
    }
  }, [code])

  const { url, title } = videoConfig
  if (!url) return null

  const safeUrl = url.trim()
  const isYouTube = safeUrl.includes("youtube.com") || safeUrl.includes("youtu.be")
  const isVimeo = safeUrl.includes("vimeo.com")
  let embedUrl = safeUrl

  if (isYouTube) {
    const vid = safeUrl.match(/(?:v=|\/)([A-Za-z0-9_-]{6,})/)?.[1]
    if (vid) embedUrl = `https://www.youtube.com/embed/${vid}`
  } else if (isVimeo) {
    const vid = safeUrl.match(/vimeo\.com\/(\d+)/)?.[1]
    if (vid) embedUrl = `https://player.vimeo.com/video/${vid}`
  } else {
    return (
      <div className="not-prose my-6">
        {title && <h4 className="text-sm font-semibold">{title}</h4>}
        <div className="p-4 border rounded-md bg-card">
          <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="underline">Open video</a>
        </div>
      </div>
    )
  }

  return (
    <div className="not-prose my-6 space-y-2">
      {title && <h4 className="text-sm font-semibold">{title}</h4>}
      <div className="relative w-full pb-[56.25%] rounded-lg overflow-hidden shadow-lg bg-muted">
        <iframe
          src={embedUrl}
          title={title || "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
    </div>
  )
}

/* BlockMath: attempts to render via client-side katex if available; otherwise shows raw LaTeX + copy */
function BlockMath({ latex, id }: { latex: string; id: string }) {
  const [rendered, setRendered] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const katex = await import("katex")
        if (!mounted) return
        const html = katex.renderToString(latex, { throwOnError: false, displayMode: true })
        setRendered(html)
      } catch {
        setRendered(null)
      }
    })()
    return () => {
      mounted = false
    }
  }, [latex])

  // copy handled by CopyButton component

  return (
    <div id={id} className="my-6 not-prose">
      <div className="relative rounded-md border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="prose max-w-none">
            {rendered ? <div dangerouslySetInnerHTML={{ __html: rendered }} /> : <pre className="whitespace-pre-wrap text-sm font-mono">{latex}</pre>}
          </div>

          <div className="flex flex-col items-end gap-2">
            <CopyButton text={latex} variant="lambda" title="Copy LaTeX" ariaLabel="Copy LaTeX" className="px-2 py-1 text-xs rounded-md border" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* Collapsible solution block (fenced with ```solution or language=solution) */
function CollapsibleSolution({ markdown }: { markdown: string }) {
  const [open, setOpen] = useState(false)
  return (
    <details className="not-prose my-4 border rounded-md bg-card" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer px-4 py-2 font-medium">Solution (click to {open ? "hide" : "show"})</summary>
      <div className="p-4 prose max-w-none dark:prose-invert">
        <div className="whitespace-pre-wrap">{markdown}</div>
      </div>
    </details>
  )
}
