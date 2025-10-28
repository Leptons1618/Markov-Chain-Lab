"use client"

import { useEffect, useMemo, useState } from "react"

export default function MarkdownRenderer({ content }: { content: string }) {
  const [components, setComponents] = useState<{
    ReactMarkdown: any
    remarkGfm: any
    rehypeHighlight: any
    rehypeSanitize: any
  } | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [
          { default: ReactMarkdown },
          { default: remarkGfm },
          { default: rehypeHighlight },
          { default: rehypeSanitize },
        ] = await Promise.all([
          import("react-markdown"),
          import("remark-gfm"),
          import("rehype-highlight"),
          import("rehype-sanitize"),
        ])
        if (mounted) {
          setComponents({
            ReactMarkdown,
            remarkGfm,
            rehypeHighlight,
            rehypeSanitize,
          })
        }
      } catch (error) {
        console.error("[v0] Failed to load markdown components:", error)
        if (mounted) {
          setLoadError(true)
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const sanitized = useMemo(() => content ?? "", [content])

  const customComponents = useMemo(
    () => ({
      // Custom code block handler for interactive elements
      code: ({ node, inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || "")
        const lang = match ? match[1] : ""

        // Handle special interactive code blocks
        if (!inline && lang === "chart") {
          return <InteractiveChart code={String(children).trim()} />
        }
        if (!inline && lang === "video") {
          return <VideoEmbed code={String(children).trim()} />
        }

        // Regular code block
        return (
          <code className={className} {...props}>
            {children}
          </code>
        )
      },
      // Enhanced image handling with lazy loading
      img: ({ node, ...props }: any) => (
        <img {...props} loading="lazy" className="rounded-lg shadow-md max-w-full h-auto" alt={props.alt || ""} />
      ),
      // Enhanced video support
      video: ({ node, ...props }: any) => (
        <video {...props} controls className="rounded-lg shadow-md max-w-full h-auto" />
      ),
    }),
    [],
  )

  // Loading state
  if (!components && !loadError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading content...</div>
      </div>
    )
  }

  // Error state - still try to show content
  if (loadError || !components) {
    return (
      <div className="prose max-w-none dark:prose-invert">
        <div className="whitespace-pre-wrap leading-relaxed">{sanitized}</div>
      </div>
    )
  }

  const { ReactMarkdown, remarkGfm, rehypeHighlight, rehypeSanitize } = components

  return (
    <div className="prose max-w-none prose-headings:scroll-mt-24 dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSanitize]}
        components={customComponents}
      >
        {sanitized}
      </ReactMarkdown>
    </div>
  )
}

function InteractiveChart({ code }: { code: string }) {
  const [chartData, setChartData] = useState<any[]>([])
  const [inputValue, setInputValue] = useState("")
  const [chartType, setChartType] = useState<"line" | "bar">("line")

  useEffect(() => {
    try {
      const config = JSON.parse(code)
      setChartData(config.data || [])
      setChartType(config.type || "line")
    } catch {
      // Invalid JSON, use default
      setChartData([
        { name: "A", value: 10 },
        { name: "B", value: 20 },
        { name: "C", value: 15 },
      ])
    }
  }, [code])

  const addDataPoint = () => {
    if (!inputValue) return
    const newPoint = {
      name: `Point ${chartData.length + 1}`,
      value: Number.parseFloat(inputValue) || 0,
    }
    setChartData([...chartData, newPoint])
    setInputValue("")
  }

  const resetChart = () => {
    try {
      const config = JSON.parse(code)
      setChartData(config.data || [])
    } catch {
      setChartData([])
    }
  }

  // Lazy load Recharts
  const [Recharts, setRecharts] = useState<any>(null)

  useEffect(() => {
    import("recharts").then((module) => {
      setRecharts(module)
    })
  }, [])

  if (!Recharts) {
    return <div className="text-sm text-muted-foreground">Loading chart...</div>
  }

  const { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts

  return (
    <div className="not-prose my-6 p-4 border border-border rounded-lg bg-card space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <h4 className="text-sm font-semibold">Interactive Chart</h4>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setChartType(chartType === "line" ? "bar" : "line")}
            className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Toggle {chartType === "line" ? "Bar" : "Line"}
          </button>
          <button
            onClick={resetChart}
            className="px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
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

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter value"
          className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={addDataPoint}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap"
        >
          Add Point
        </button>
      </div>
    </div>
  )
}

function VideoEmbed({ code }: { code: string }) {
  const [videoConfig, setVideoConfig] = useState<any>({})

  useEffect(() => {
    try {
      const config = JSON.parse(code)
      setVideoConfig(config)
    } catch {
      // Treat as plain URL
      setVideoConfig({ url: code.trim() })
    }
  }, [code])

  const { url, title, thumbnail } = videoConfig

  // Detect video platform
  const isYouTube = url?.includes("youtube.com") || url?.includes("youtu.be")
  const isVimeo = url?.includes("vimeo.com")

  // Extract video ID
  let embedUrl = url
  if (isYouTube) {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1]
    embedUrl = `https://www.youtube.com/embed/${videoId}`
  } else if (isVimeo) {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1]
    embedUrl = `https://player.vimeo.com/video/${videoId}`
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
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
    </div>
  )
}
