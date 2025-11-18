"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect, Suspense, memo, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import * as Popover from "@radix-ui/react-popover"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Play,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  ArrowRight,
  Info,
  Pause,
  Save,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  FilePlus,
  Menu,
  X,
  Wrench,
  Pencil,
  Maximize2,
  Check,
} from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MainNav } from "@/components/main-nav"
import { useAuth } from "@/components/auth/auth-provider"
import { loadDesignsFromSupabase, saveDesignToSupabase, deleteDesignFromSupabase, mergeDesigns, type SavedDesign as SavedDesignType } from "@/lib/designs-sync"

interface State {
  id: string
  name: string
  x: number
  y: number
  color: string
  isInitial?: boolean
  isFinal?: boolean
}

interface Transition {
  id: string
  from: string
  to: string
  probability: number
}

interface SimulationMetrics {
  stateVisits: Record<string, number>
  transitionUsage: Record<string, number>
  pathHistory: string[]
}

interface SavedDesign {
  id: string
  name: string
  savedAt: string
  chain: MarkovChain
}

interface MarkovChain {
  states: State[]
  transitions: Transition[]
}

const defaultColors = [
  "#059669", // primary
  "#10b981", // accent
  "#d97706", // chart-3
  "#be123c", // chart-4
  "#ec4899", // chart-5
]

const PROBABILITY_SCALE = 1_000_000

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const roundProbability = (value: number) => {
  const clamped = clamp01(value)
  return Math.round(clamped * PROBABILITY_SCALE) / PROBABILITY_SCALE
}

const distributeEvenly = (total: number, count: number): number[] => {
  if (count <= 0) return []
  const normalizedTotal = clamp01(total)
  const shares: number[] = []
  let distributed = 0

  for (let i = 0; i < count; i++) {
    const slotsRemaining = count - i
    const remainingTotal = normalizedTotal - distributed
    const share = i === count - 1 ? roundProbability(remainingTotal) : roundProbability(remainingTotal / slotsRemaining)
    const safeShare = clamp01(share)
    shares.push(safeShare)
    distributed += safeShare
  }

  return shares
}

/**
 * Determine device type based on window width
 */
function getDeviceType(): 'phone' | 'tablet' | 'desktop' {
  if (typeof window !== 'undefined') {
    const w = window.innerWidth
    if (w < 640) return 'phone'
    if (w < 1024) return 'tablet'
    return 'desktop'
  }
  return 'desktop'
}

/**
 * Scale a design (from examples.json) to fit the current canvas dimensions
 * Examples are designed for a reference canvas (2000x1500), so we need to scale them
 * to fit mobile/tablet/desktop canvases responsively
 */
function scaleDesignToCanvas(design: MarkovChain, targetWidth: number, targetHeight: number): MarkovChain {
  if (!design.states || design.states.length === 0) {
    return design
  }

  // Reference dimensions (what examples were designed for)
  const REF_WIDTH = 2000
  const REF_HEIGHT = 1500

  // Find bounding box of all nodes in the design
  const xs = design.states.map(s => s.x)
  const ys = design.states.map(s => s.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  // Calculate the design's natural dimensions
  const designWidth = Math.max(10, maxX - minX)
  const designHeight = Math.max(10, maxY - minY)

  // Add padding (10% of target dimensions)
  const paddingX = targetWidth * 0.1
  const paddingY = targetHeight * 0.1
  const availableWidth = targetWidth - paddingX * 2
  const availableHeight = targetHeight - paddingY * 2

  // Calculate scale to fit the design in available space while maintaining aspect ratio
  const scaleX = availableWidth / designWidth
  const scaleY = availableHeight / designHeight
  const scale = Math.min(scaleX, scaleY, 1) // Don't upscale, only downscale if needed

  // Calculate translation to center the design in the canvas
  const scaledWidth = designWidth * scale
  const scaledHeight = designHeight * scale
  const offsetX = (targetWidth - scaledWidth) / 2 - minX * scale
  const offsetY = (targetHeight - scaledHeight) / 2 - minY * scale

  // Apply transformation to all states
  const scaledStates = design.states.map(state => ({
    ...state,
    x: state.x * scale + offsetX,
    y: state.y * scale + offsetY
  }))

  return {
    states: scaledStates,
    transitions: design.transitions
  }
}

function ToolsContent() {
  const searchParams = useSearchParams()
  const { user, isGuest } = useAuth()
  const [chain, setChain] = useState<MarkovChain>({ states: [], transitions: [] })
  const [originalExampleDesign, setOriginalExampleDesign] = useState<MarkovChain | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [selectedTransition, setSelectedTransition] = useState<string | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [simulationStep, setSimulationStep] = useState(0)
  const [currentState, setCurrentState] = useState<string | null>(null)
  const [simulationSpeed, setSimulationSpeed] = useState(500)
  const [simulationMetrics, setSimulationMetrics] = useState<SimulationMetrics>({
    stateVisits: {},
    transitionUsage: {},
    pathHistory: [],
  })
  const [isPanning, setIsPanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const MIN_SCALE = 0.1
  const MAX_SCALE = 3
  const canvasContentRef = useRef<HTMLDivElement>(null)
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const rAFRef = useRef<number | null>(null)
  const pendingViewRef = useRef<{ pan?: { x: number; y: number }; scale?: number } | null>(null)
  const lastTapTimeRef = useRef<number>(0)
  const [sidebarWidth, setSidebarWidth] = useState(550)
  const [isResizing, setIsResizing] = useState(false)
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const autoRunIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [draggingStateId, setDraggingStateId] = useState<string | null>(null)
  const dragRafRef = useRef<number | null>(null)
  const pendingDragPosRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const currentDragPosRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const didDragRef = useRef(false)
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null)
  const [dragRenderTick, setDragRenderTick] = useState(0)
  const DRAG_THRESHOLD = 5 // pixels
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([])
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [pathHistoryLimit, setPathHistoryLimit] = useState<number | "all">(10)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({})
  // Controlled tabs to prevent resets on re-render
  const [activeTab, setActiveTab] = useState<"build" | "simulate" | "analyze">("build")
  // Track pinch gesture data
  const pinchRef = useRef<{ mid: { x: number; y: number }; dist: number } | null>(null)
  const [toolboxOpen, setToolboxOpen] = useState(false)
  const [toolboxOpacity, setToolboxOpacity] = useState(0.4)
  const [hoveredTool, setHoveredTool] = useState<number | null>(null)
  const [mouseAngle, setMouseAngle] = useState<number>(0)
  const toolboxTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const toolboxRef = useRef<HTMLDivElement | null>(null)
  const [isToolboxLocked, setIsToolboxLocked] = useState(false)
  const lastActiveTimeRef = useRef<number>(Date.now())

  // Constants for radial menu
  const RADIAL_TOOL_COUNT = 8

  // Smooth opacity transition based on proximity and idle time
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!toolboxRef.current) return
      
      const rect = toolboxRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const distance = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2))
      
      // Auto-show tools on hover (if not locked) - stricter distance check
      if (!isToolboxLocked && distance < 80) {
        setToolboxOpen(true)
        lastActiveTimeRef.current = Date.now()
      } else if (!isToolboxLocked && distance > 120) {
        setToolboxOpen(false)
      }
      
      // Calculate angle for radial menu when open (wide 180-degree arc)
      if (toolboxOpen) {
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
        setMouseAngle(angle)
        
        // Calculate which tool is being hovered based on angle
        const toolCount = RADIAL_TOOL_COUNT
        // Wide arc from bottom-right (45 deg) to top-left (225 deg)
        const startAngle = Math.PI / 4 // 45 degrees
        const endAngle = Math.PI * 1.25 // 225 degrees
        const angleRange = endAngle - startAngle
        const anglePerTool = angleRange / (toolCount - 1)
        
        // Only highlight if mouse is within the radial menu range (stricter)
        if (distance > 40 && distance < 85) {
          // Check if mouse angle is within the wide arc
          let normalizedAngle = angle
          if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI
          
          // Calculate tool index based on angle
          let toolIndex = -1
          for (let i = 0; i < toolCount; i++) {
            const toolAngle = startAngle + i * anglePerTool
            const angleDiff = Math.abs(normalizedAngle - toolAngle)
            const angleDiffWrapped = Math.abs(normalizedAngle - toolAngle + 2 * Math.PI)
            const minAngleDiff = Math.min(angleDiff, angleDiffWrapped)
            
            // Tool is highlighted if mouse is within 15 degrees of it
            if (minAngleDiff < anglePerTool / 1.5) {
              toolIndex = i
              break
            }
          }
          
          setHoveredTool(toolIndex)
          lastActiveTimeRef.current = Date.now()
        } else {
          setHoveredTool(null)
        }
      } else {
        setHoveredTool(null)
      }
      
      // Proximity-based opacity - only fade when idle AND toolbox is closed
      const proximityThreshold = 150
      const timeSinceActive = Date.now() - lastActiveTimeRef.current
      const idleThreshold = 3000 // 3 seconds of idle time before fading
      
      // Clear any existing timeout
      if (toolboxTimeoutRef.current) {
        clearTimeout(toolboxTimeoutRef.current)
        toolboxTimeoutRef.current = null
      }
      
      // If toolbox is open or locked, keep it fully visible
      if (toolboxOpen || isToolboxLocked) {
        setToolboxOpacity(1)
        lastActiveTimeRef.current = Date.now()
      } else if (distance < proximityThreshold) {
        // Mouse is near - keep it visible
        setToolboxOpacity(1)
        lastActiveTimeRef.current = Date.now()
      } else if (timeSinceActive < idleThreshold) {
        // Recently active - keep it visible for a while
        setToolboxOpacity(1)
        // Set timeout to start fading after idle threshold
        toolboxTimeoutRef.current = setTimeout(() => {
          if (!toolboxOpen && !isToolboxLocked) {
            setToolboxOpacity(0.4)
          }
        }, idleThreshold - timeSinceActive)
      } else {
        // Been idle for a while - fade it
        setToolboxOpacity(0.4)
      }
    }

    const handleTouchStart = () => {
      setToolboxOpacity(1)
      lastActiveTimeRef.current = Date.now()
      if (toolboxTimeoutRef.current) {
        clearTimeout(toolboxTimeoutRef.current)
        toolboxTimeoutRef.current = null
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchstart', handleTouchStart)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchstart', handleTouchStart)
      if (toolboxTimeoutRef.current) {
        clearTimeout(toolboxTimeoutRef.current)
      }
    }
  }, [toolboxOpen, isToolboxLocked])

  // Reset opacity and hoveredTool when toolbox closes
  useEffect(() => {
    if (!toolboxOpen) {
      setHoveredTool(null)
      setIsToolboxLocked(false)
    }
  }, [toolboxOpen])
  const [editingStateId, setEditingStateId] = useState<string | null>(null)
  const [editingStateName, setEditingStateName] = useState("")

  // Track changes to mark unsaved changes
  useEffect(() => {
    if (chain.states.length > 0 || chain.transitions.length > 0) {
      setHasUnsavedChanges(true)
    }
  }, [chain])

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Ref for zoomToFit function to avoid dependency issues
  const zoomToFitRef = useRef<(() => void) | null>(null)
  
  // Load from example URL parameter on mount and fetch saved designs from API
  useEffect(() => {
    // Check if loading from example
    const exampleId = searchParams.get("example")
    if (exampleId) {
      // Load example from API
      fetch(`/api/examples`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const example = data.data.find((ex: any) => ex.id === exampleId)
            if (example?.design) {
              // Store original design for responsive rescaling
              setOriginalExampleDesign(example.design)
              // Scale example coordinates to fit current canvas
              const scaledDesign = scaleDesignToCanvas(example.design, CANVAS_WIDTH, CANVAS_HEIGHT)
              setChain(scaledDesign)
              setHasUnsavedChanges(false)
              // Auto zoom-to-fit after a short delay to ensure rendering is complete
              setTimeout(() => {
                if (example.design.states.length > 0 && zoomToFitRef.current) {
                  zoomToFitRef.current()
                }
              }, 100)
              return
            }
          }
        })
        .catch((err) => console.error("Failed to load example:", err))
    }

    // Load saved designs from localStorage and database
    const loadDesigns = async () => {
      try {
        // Load from localStorage first (for guest users or fallback)
        const savedDesignsData = localStorage.getItem('markov-saved-designs')
        const localDesigns = savedDesignsData ? JSON.parse(savedDesignsData) : []

        // If user is authenticated, load from database and merge
        if (user && !isGuest) {
          const { designs: remoteDesigns, error } = await loadDesignsFromSupabase()
          if (error) {
            console.error("Failed to load designs from database:", error)
            // Fallback to localStorage
            setSavedDesigns(localDesigns)
          } else {
            // Merge local and remote designs
            const merged = mergeDesigns(localDesigns, remoteDesigns)
            setSavedDesigns(merged)
            // Update localStorage with merged designs
            localStorage.setItem('markov-saved-designs', JSON.stringify(merged))
          }
        } else {
          // Guest user - only use localStorage
          setSavedDesigns(localDesigns)
        }
      } catch (err) {
        console.error("Failed to load designs:", err)
      }
    }

    loadDesigns()
  }, [searchParams, user, isGuest])

  // Handle window resize to rescale loaded examples responsively
  useEffect(() => {
    if (!originalExampleDesign) return // Only apply to loaded examples, not user-created designs

    let resizeTimer: NodeJS.Timeout
    const handleResize = () => {
      // Debounce resize events
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        // Recalculate device type and canvas size
        const currentDeviceType = getDeviceType()
        const newCanvasWidth = currentDeviceType === 'phone' ? 1200 : currentDeviceType === 'tablet' ? 1600 : 2000
        const newCanvasHeight = currentDeviceType === 'phone' ? 900 : currentDeviceType === 'tablet' ? 1200 : 1500
        
        // Rescale the original example to new canvas size
        const rescaledDesign = scaleDesignToCanvas(originalExampleDesign, newCanvasWidth, newCanvasHeight)
        setChain(rescaledDesign)
      }, 300)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [originalExampleDesign])

  // Helpers: probability normalization
  const equalizeOutgoing = useCallback((transitions: Transition[], fromId: string) => {
    const outgoing = transitions.filter((t) => t.from === fromId)
    const n = outgoing.length
    if (n === 0) return transitions
    const shares = distributeEvenly(1, n)
    const shareMap: Record<string, number> = {}
    outgoing.forEach((transition, idx) => {
      shareMap[transition.id] = shares[idx] ?? 0
    })

    return transitions.map((t) => (t.from === fromId ? { ...t, probability: roundProbability(shareMap[t.id] ?? 0) } : t))
  }, [])

  const normalizeWithAnchor = useCallback(
    (transitions: Transition[], fromId: string, anchorId: string, anchorValue: number) => {
      const clamped = clamp01(anchorValue)
      const outgoing = transitions.filter((t) => t.from === fromId)
      const others = outgoing.filter((t) => t.id !== anchorId)
      if (others.length === 0) {
        // Only one transition from this state
        return transitions.map((t) => (t.id === anchorId ? { ...t, probability: roundProbability(1) } : t))
      }
      const remaining = clamp01(1 - clamped)
      const evenShares = distributeEvenly(remaining, others.length)
      const shareMap: Record<string, number> = {}
      others.forEach((transition, idx) => {
        shareMap[transition.id] = evenShares[idx] ?? 0
      })
      return transitions.map((t) => {
        if (t.id === anchorId) return { ...t, probability: roundProbability(clamped) }
        if (t.from !== fromId) return t
        return { ...t, probability: roundProbability(shareMap[t.id] ?? 0) }
      })
    },
    [],
  )

  // Device-specific canvas bounds
  const deviceType = typeof window !== 'undefined' ? getDeviceType() : 'desktop'
  const CANVAS_WIDTH = deviceType === 'phone' ? 1200 : deviceType === 'tablet' ? 1600 : 2000
  const CANVAS_HEIGHT = deviceType === 'phone' ? 900 : deviceType === 'tablet' ? 1200 : 1500
  const MAX_PAN_X = CANVAS_WIDTH * 1.5
  const MAX_PAN_Y = CANVAS_HEIGHT * 1.5

  // Schedule batched view updates (pan/zoom) using rAF for smoothness
  const scheduleViewUpdate = useCallback((next: { pan?: { x: number; y: number }; scale?: number }) => {
    pendingViewRef.current = { ...pendingViewRef.current, ...next }
    if (rAFRef.current != null) return
    rAFRef.current = requestAnimationFrame(() => {
      const payload = pendingViewRef.current
      pendingViewRef.current = null
      rAFRef.current && cancelAnimationFrame(rAFRef.current)
      rAFRef.current = null
      if (!payload) return
      if (payload.pan) setPanOffset((prev) => ({ x: payload!.pan!.x, y: payload!.pan!.y }))
      if (payload.scale != null) setScale(payload.scale)
    })
  }, [])

  // Utilities to convert between client (screen) and world (canvas) coordinates
  const getBaseCenterOffset = useCallback(() => {
    if (!canvasRef.current) return { bx: 0, by: 0, rect: { left: 0, top: 0, width: 0, height: 0 } as DOMRect }
    const rect = canvasRef.current.getBoundingClientRect()
    // The inner content is absolutely centered with fixed width/height
    const bx = rect.width / 2 - CANVAS_WIDTH / 2
    const by = rect.height / 2 - CANVAS_HEIGHT / 2
    return { bx, by, rect }
  }, [CANVAS_WIDTH, CANVAS_HEIGHT])

  const clientToWorld = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 }
      const { bx, by, rect } = getBaseCenterOffset()
      const x = (clientX - rect.left - bx - panOffset.x) / scale
      const y = (clientY - rect.top - by - panOffset.y) / scale
      return { x, y }
    },
    [getBaseCenterOffset, panOffset.x, panOffset.y, scale],
  )

  const getVisibleWorldRect = useCallback(() => {
    if (!canvasRef.current) return { x0: 0, y0: 0, x1: CANVAS_WIDTH, y1: CANVAS_HEIGHT }
    const { bx, by, rect } = getBaseCenterOffset()
    const x0 = (0 - bx - panOffset.x) / scale
    const y0 = (0 - by - panOffset.y) / scale
    const x1 = (rect.width - bx - panOffset.x) / scale
    const y1 = (rect.height - by - panOffset.y) / scale
    return { x0, y0, x1, y1 }
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, getBaseCenterOffset, panOffset.x, panOffset.y, scale])

  // Zoom to fit all nodes in view with padding
  const zoomToFit = useCallback(() => {
    if (chain.states.length === 0) return
    
    // Calculate bounding box of all nodes
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    
    chain.states.forEach(state => {
      minX = Math.min(minX, state.x)
      maxX = Math.max(maxX, state.x)
      minY = Math.min(minY, state.y)
      maxY = Math.max(maxY, state.y)
    })
    
    // Add padding around nodes (in world coordinates)
    const padding = 150
    minX -= padding
    maxX += padding
    minY -= padding
    maxY += padding
    
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    
    // Calculate scale to fit content in viewport with some margin
    const scaleX = (rect.width * 0.85) / contentWidth
    const scaleY = (rect.height * 0.85) / contentHeight
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(scaleX, scaleY)))
    
    // Calculate center of content
    const contentCenterX = (minX + maxX) / 2
    const contentCenterY = (minY + maxY) / 2
    
    // Calculate pan to center the content
    const { bx, by } = getBaseCenterOffset()
    const viewportCenterX = rect.width / 2
    const viewportCenterY = rect.height / 2
    
    const newPanX = viewportCenterX - bx - contentCenterX * newScale
    const newPanY = viewportCenterY - by - contentCenterY * newScale
    
    scheduleViewUpdate({ 
      scale: newScale,
      pan: { 
        x: Math.max(-MAX_PAN_X, Math.min(MAX_PAN_X, newPanX)),
        y: Math.max(-MAX_PAN_Y, Math.min(MAX_PAN_Y, newPanY))
      }
    })
  }, [chain.states, MIN_SCALE, MAX_SCALE, MAX_PAN_X, MAX_PAN_Y, getBaseCenterOffset, scheduleViewUpdate])
  
  // Store zoomToFit in ref for use in effects
  useEffect(() => {
    zoomToFitRef.current = zoomToFit
  }, [zoomToFit])

  const addState = useCallback(
    (x: number, y: number) => {
      // Clamp new state position to canvas bounds
      const clampedX = Math.max(50, Math.min(CANVAS_WIDTH - 50, x))
      const clampedY = Math.max(50, Math.min(CANVAS_HEIGHT - 50, y))
      const newState: State = {
        id: `state-${Date.now()}`,
        name: `S${chain.states.length + 1}`,
        x: clampedX,
        y: clampedY,
        color: defaultColors[chain.states.length % defaultColors.length],
      }
      setChain((prev) => ({ ...prev, states: [...prev.states, newState] }))
    },
    [chain.states.length],
  )

  const addTransition = useCallback(
    (fromId: string, toId: string) => {
      const existingTransition = chain.transitions.find((t) => t.from === fromId && t.to === toId)
      if (existingTransition) return

      const newTransition: Transition = {
        id: `transition-${Date.now()}`,
        from: fromId,
        to: toId,
        probability: 1, // will be equalized below
      }
      setChain((prev) => {
        const nextTransitions = [...prev.transitions, newTransition]
        const balanced = equalizeOutgoing(nextTransitions, fromId)
        return { ...prev, transitions: balanced }
      })
    },
    [chain.transitions, equalizeOutgoing],
  )

  const updateTransitionProbability = useCallback(
    (transitionId: string, probability: number) => {
      const sanitized = roundProbability(Number.isFinite(probability) ? probability : 0)
      setChain((prev) => {
        const target = prev.transitions.find((t) => t.id === transitionId)
        if (!target) return prev
        const normalized = normalizeWithAnchor(prev.transitions, target.from, transitionId, sanitized)
        return { ...prev, transitions: normalized }
      })
    },
    [normalizeWithAnchor],
  )

  const deleteState = useCallback((stateId: string) => {
    setChain((prev) => ({
      states: prev.states.filter((s) => s.id !== stateId),
      transitions: prev.transitions.filter((t) => t.from !== stateId && t.to !== stateId),
    }))
    setSelectedState(null)
    setOpenPopovers(prev => ({ ...prev, [stateId]: false }))
  }, [])

  const deleteTransition = useCallback(
    (transitionId: string) => {
      setChain((prev) => {
        const target = prev.transitions.find((t) => t.id === transitionId)
        const filtered = prev.transitions.filter((t) => t.id !== transitionId)
        const balanced = target ? equalizeOutgoing(filtered, target.from) : filtered
        return { ...prev, transitions: balanced }
      })
      setSelectedTransition(null)
    },
    [equalizeOutgoing],
  )

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPanning || isResizing) return

      const target = e.target as HTMLElement
      
      // Ignore clicks from any interactive UI elements
      if (target.closest('button') || target.closest('[role="dialog"]') || 
          target.closest('[data-radix-popper-content-wrapper]') ||
          target.closest('[data-radix-portal]')) return
      
      // Ignore clicks that originate outside the canvas (e.g., floating buttons)
      if (canvasRef.current && !canvasRef.current.contains(target)) return

      // Don't add nodes if clicking on a state node (they have their own click handlers)
      if (target.closest("[data-node-id]")) return

      const { x, y } = clientToWorld(e.clientX, e.clientY)
      addState(x, y)
      setSelectedState(null)
    },
    [addState, isPanning, isResizing, clientToWorld],
  )

  const startSimulation = useCallback(() => {
    if (chain.states.length === 0) return

    setIsSimulating(true)
    setSimulationStep(0)
    const startStateId = chain.states[0].id
    setCurrentState(startStateId)
    setSimulationMetrics({
      stateVisits: { [startStateId]: 1 },
      transitionUsage: {},
      pathHistory: [startStateId],
    })
  }, [chain.states])

  const stepSimulation = useCallback(() => {
    if (!currentState) return

    const outgoingTransitions = chain.transitions.filter((t) => t.from === currentState)
    if (outgoingTransitions.length === 0) return

    const random = Math.random()
    let cumulative = 0

    for (const transition of outgoingTransitions) {
      cumulative += transition.probability
      if (random <= cumulative) {
        const nextState = transition.to
        setCurrentState(nextState)
        setSimulationStep((prev) => prev + 1)

        // Update metrics
        setSimulationMetrics((prev) => ({
          stateVisits: {
            ...prev.stateVisits,
            [nextState]: (prev.stateVisits[nextState] || 0) + 1,
          },
          transitionUsage: {
            ...prev.transitionUsage,
            [transition.id]: (prev.transitionUsage[transition.id] || 0) + 1,
          },
          pathHistory: [...prev.pathHistory, nextState],
        }))
        break
      }
    }
  }, [currentState, chain.transitions])

  const resetSimulation = useCallback(() => {
    setIsSimulating(false)
    setIsAutoRunning(false)
    setSimulationStep(0)
    setCurrentState(null)
    setSimulationMetrics({
      stateVisits: {},
      transitionUsage: {},
      pathHistory: [],
    })
    if (autoRunIntervalRef.current) {
      clearInterval(autoRunIntervalRef.current)
      autoRunIntervalRef.current = null
    }
  }, [])

  // Save/Export functionality (must come after resetSimulation)
  const saveDesign = useCallback(() => {
    if (chain.states.length === 0) {
      alert("Cannot save an empty design")
      return
    }
    setSaveDialogOpen(true)
  }, [chain.states.length])

  const handleSaveConfirm = useCallback(async () => {
    if (!saveName.trim()) {
      alert("Please enter a name for your design")
      return
    }

    try {
      const newDesign: SavedDesign = {
        id: `design-${Date.now()}`,
        name: saveName.trim(),
        savedAt: new Date().toISOString(),
        chain: {
          states: chain.states,
          transitions: chain.transitions,
        },
      }

      // Get existing designs from localStorage
      const savedDesignsData = localStorage.getItem('markov-saved-designs')
      const existingDesigns = savedDesignsData ? JSON.parse(savedDesignsData) : []
      
      // Add new design
      const updatedDesigns = [...existingDesigns, newDesign]
      localStorage.setItem('markov-saved-designs', JSON.stringify(updatedDesigns))
      setSavedDesigns(updatedDesigns)

      // Save to database if authenticated
      if (user && !isGuest) {
        const { error } = await saveDesignToSupabase(newDesign)
        if (error) {
          console.error("Failed to save design to database:", error)
          // Design is still saved locally, so we continue
        }
      }

      setHasUnsavedChanges(false)
      setSaveDialogOpen(false)
      setSaveName("")
    } catch (error) {
      console.error("Failed to save design:", error)
      alert("Failed to save design. Please try again.")
    }
  }, [saveName, chain, user, isGuest])

  const loadDesign = useCallback(
    (design: SavedDesign) => {
      setChain(design.chain)
      setHasUnsavedChanges(false)
      setSelectedState(null)
      setSelectedTransition(null)
      resetSimulation()
      setLibraryOpen(false)
      // Auto zoom-to-fit after a short delay to ensure rendering is complete
      setTimeout(() => {
        if (design.chain.states.length > 0 && zoomToFitRef.current) {
          zoomToFitRef.current()
        }
      }, 100)
    },
    [resetSimulation],
  )

  const deleteDesign = useCallback(async (id: string) => {
    try {
      const savedDesignsData = localStorage.getItem('markov-saved-designs')
      if (savedDesignsData) {
        const designs = JSON.parse(savedDesignsData)
        const updatedDesigns = designs.filter((d: SavedDesign) => d.id !== id)
        localStorage.setItem('markov-saved-designs', JSON.stringify(updatedDesigns))
        setSavedDesigns(updatedDesigns)

        // Delete from database if authenticated
        if (user && !isGuest) {
          const { error } = await deleteDesignFromSupabase(id)
          if (error) {
            console.error("Failed to delete design from database:", error)
            // Design is still deleted locally, so we continue
          }
        }
      }
    } catch (error) {
      console.error("Failed to delete design:", error)
      alert("Failed to delete design. Please try again.")
    }
  }, [user, isGuest])

  const newDesign = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("You have unsaved changes. Do you want to save before creating a new design?")
      if (confirmed) {
        // Open save dialog
        setSaveDialogOpen(true)
        return
      }
    }
    setChain({ states: [], transitions: [] })
    setHasUnsavedChanges(false)
    setSelectedState(null)
    setSelectedTransition(null)
    resetSimulation()
    setPanOffset({ x: 0, y: 0 })
  }, [hasUnsavedChanges, resetSimulation])

  const exportChain = useCallback(() => {
    const data = {
      version: "1.0",
      createdAt: new Date().toISOString(),
      chain: {
        states: chain.states,
        transitions: chain.transitions,
      },
      metadata: {
        stateCount: chain.states.length,
        transitionCount: chain.transitions.length,
      },
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `markov-chain-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [chain])

  // Generate transition matrix
  const generateTransitionMatrix = useCallback(() => {
    if (chain.states.length === 0) return []

    const matrix = chain.states.map(() => chain.states.map(() => 0))

    chain.transitions.forEach((transition) => {
      const fromIndex = chain.states.findIndex((s) => s.id === transition.from)
      const toIndex = chain.states.findIndex((s) => s.id === transition.to)
      if (fromIndex !== -1 && toIndex !== -1) {
        matrix[fromIndex][toIndex] = transition.probability
      }
    })

    return matrix
  }, [chain])

  // Export comprehensive report
  const exportReport = useCallback(() => {
    const matrix = generateTransitionMatrix()
    const chainProperties = {
      totalStates: chain.states.length,
      totalTransitions: chain.transitions.length,
      stateValidation: chain.states.map((state) => {
        const outgoing = chain.transitions.filter((t) => t.from === state.id).length
        const totalProb = chain.transitions
          .filter((t) => t.from === state.id)
          .reduce((sum, t) => sum + t.probability, 0)
        const isValid = Math.abs(totalProb - 1.0) < 0.01 || outgoing === 0
        return {
          state: state.name,
          outgoingTransitions: outgoing,
          totalProbability: totalProb,
          isValid,
        }
      }),
    }

    const report = {
      reportType: "Markov Chain Analysis Report",
      version: "1.0",
      generatedAt: new Date().toISOString(),
      chain: {
        states: chain.states,
        transitions: chain.transitions,
      },
      analysis: {
        chainProperties,
        transitionMatrix: {
          stateLabels: chain.states.map((s) => s.name),
          matrix,
        },
      },
      simulation: isSimulating
        ? {
            currentStep: simulationStep,
            currentState: currentState,
            metrics: {
              stateVisits: simulationMetrics.stateVisits,
              transitionUsage: simulationMetrics.transitionUsage,
              pathHistory: simulationMetrics.pathHistory,
            },
            statistics: {
              totalVisits: simulationStep + 1,
              uniqueStatesVisited: Object.keys(simulationMetrics.stateVisits).length,
              mostVisitedState:
                Object.entries(simulationMetrics.stateVisits).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
            },
          }
        : null,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `markov-report-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [chain, isSimulating, simulationStep, currentState, simulationMetrics, generateTransitionMatrix])

  // Import functionality
  const importChain = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const data = JSON.parse(content)

          if (data.chain && data.chain.states && data.chain.transitions) {
            setChain({
              states: data.chain.states,
              transitions: data.chain.transitions,
            })
            setSelectedState(null)
            setSelectedTransition(null)
            resetSimulation()
          } else {
            alert("Invalid file format. Please select a valid Markov chain JSON file.")
          }
        } catch (error) {
          alert("Error reading file. Please select a valid JSON file.")
          console.error(error)
        }
      }
      reader.readAsText(file)
    },
    [resetSimulation],
  )

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        importChain(file)
      }
      // Reset input so same file can be selected again
      e.target.value = ""
    },
    [importChain],
  )

  const toggleAutoRun = useCallback(() => {
    if (isAutoRunning) {
      setIsAutoRunning(false)
      if (autoRunIntervalRef.current) {
        clearInterval(autoRunIntervalRef.current)
        autoRunIntervalRef.current = null
      }
    } else {
      if (!isSimulating) {
        startSimulation()
      }
      setIsAutoRunning(true)
    }
  }, [isAutoRunning, isSimulating, startSimulation])

  // Auto-run effect
  useEffect(() => {
    if (isAutoRunning && isSimulating) {
      autoRunIntervalRef.current = setInterval(() => {
        stepSimulation()
      }, simulationSpeed)

      return () => {
        if (autoRunIntervalRef.current) {
          clearInterval(autoRunIntervalRef.current)
          autoRunIntervalRef.current = null
        }
      }
    }
  }, [isAutoRunning, isSimulating, simulationSpeed, stepSimulation])

  const transitionMatrix = generateTransitionMatrix()

  // Arrow-key nudging of selected node
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!selectedState) return
      const ae = document.activeElement as HTMLElement | null
      if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.isContentEditable)) return
      const step = e.shiftKey ? 10 : 1
      let dx = 0,
        dy = 0
      if (e.key === "ArrowLeft") dx = -step
      else if (e.key === "ArrowRight") dx = step
      else if (e.key === "ArrowUp") dy = -step
      else if (e.key === "ArrowDown") dy = step
      else return
      e.preventDefault()
      setChain((prev) => ({
        ...prev,
        states: prev.states.map((s) => (s.id === selectedState ? { ...s, x: s.x + dx, y: s.y + dy } : s)),
      }))
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedState])
  
  // Sidebar Tabs component reused for desktop and mobile (memoized to prevent re-renders during drag)
  const SidebarTabs = memo(({ value, onChange }: { value: "build" | "simulate" | "analyze"; onChange: (val: "build" | "simulate" | "analyze") => void }) => (
    <Tabs value={value} onValueChange={(v) => onChange(v as any)} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-muted/50">
        <TabsTrigger value="build" className="data-[state=active]:bg-background transition-all duration-200 hover:cursor-pointer">
          Build
        </TabsTrigger>
        <TabsTrigger value="simulate" className="data-[state=active]:bg-background transition-all duration-200 hover:cursor-pointer">
          Simulate
        </TabsTrigger>
        <TabsTrigger value="analyze" className="data-[state=active]:bg-background transition-all duration-200 hover:cursor-pointer">
          Analyze
        </TabsTrigger>
      </TabsList>

      <TabsContent value="build" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Chain Builder</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-transparent focus-visible:ring-0 cursor-pointer shrink-0">
                  <Info className="h-4 w-4 text-muted-foreground opacity-80 hover:opacity-100 transition-opacity" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[min(300px,90vw)] z-50">
                <div className="space-y-2">
                  <p className="font-medium text-sm">Instructions:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Click on canvas to add states</li>
                    <li>• Click a state, then another to create transitions</li>
                    <li>• Use the properties panel to edit values</li>
                    <li>• Drag on empty canvas to pan</li>
                    <li>• Pinch/scroll to zoom</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {chain.states.length === 0 ? (
          <Card className="transition-all duration-200 border-dashed">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-muted-foreground text-sm">
                <p className="mb-2">No states yet</p>
                <p className="text-xs opacity-75">Click on the canvas to add your first state</p>
              </div>
            </CardContent>
          </Card>
        ) : chain.transitions.length === 0 ? (
          <Card className="transition-all duration-200 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Transitions</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-4 sm:py-6">
              <div className="text-muted-foreground text-sm">
                <p className="mb-2">No transitions yet</p>
                <p className="text-xs opacity-75">Click a state, then click another to create a transition</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Transitions</CardTitle>
            </CardHeader>
            <CardContent 
              className="space-y-2 overflow-y-auto px-3 sm:px-6"
              style={{ 
                maxHeight: `${Math.min(chain.transitions.length * 80 + 20, 600)}px`,
                minHeight: chain.transitions.length > 0 ? '120px' : 'auto'
              }}
            >
              {chain.transitions.map((transition) => {
                const fromState = chain.states.find((s) => s.id === transition.from)
                const toState = chain.states.find((s) => s.id === transition.to)
                return (
                  <div
                    key={transition.id}
                    className="flex flex-col gap-3 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors duration-150 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] sm:items-center sm:gap-4"
                  >
                    {/* State labels - Flexible width with truncation */}
                    <div className="flex items-center gap-2 min-w-0 w-full">
                      <TooltipProvider>
                        <Tooltip delayDuration={500}>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-xs font-mono flex-1 min-w-0 justify-start truncate cursor-default px-2 py-1">
                              {fromState?.name || 'Unknown'}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs z-50">
                            {fromState?.name || 'Unknown'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />

                      <TooltipProvider>
                        <Tooltip delayDuration={500}>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-xs font-mono flex-1 min-w-0 justify-start truncate cursor-default px-2 py-1">
                              {toState?.name || 'Unknown'}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs z-50">
                            {toState?.name || 'Unknown'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Controls - Flexible layout */}
                    <div className="flex items-center gap-2 min-w-0 w-full">
                      {/* Slider - Responsive width */}
                      <Slider
                        value={[Number.isFinite(transition.probability) ? transition.probability : 0]}
                        onValueChange={(values) => updateTransitionProbability(transition.id, roundProbability(values[0] ?? 0))}
                        min={0}
                        max={1}
                        step={0.01}
                        className="flex-1 min-w-[80px] [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_.bg-primary]:h-0.5"
                      />

                      {/* Number input with custom controls */}
                      <div className="relative shrink-0">
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={Number.isFinite(transition.probability) ? transition.probability.toFixed(2) : "0.00"}
                          onChange={(e) => {
                            const parsed = Number.parseFloat(e.target.value)
                            updateTransitionProbability(
                              transition.id,
                              roundProbability(Number.isFinite(parsed) ? parsed : 0),
                            )
                          }}
                          className="w-[4.5rem] h-8 text-xs font-mono text-left pl-2 pr-1 transition-all duration-150 focus:ring-2 focus:ring-primary/50 border-border/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l border-border/60">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const newVal = Math.min(1, (transition.probability || 0) + 0.01)
                              updateTransitionProbability(transition.id, roundProbability(newVal))
                            }}
                            className="flex-1 px-1 hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                            aria-label="Increase probability"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const newVal = Math.max(0, (transition.probability || 0) - 0.01)
                              updateTransitionProbability(transition.id, roundProbability(newVal))
                            }}
                            className="flex-1 px-1 hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground border-t border-border/60 cursor-pointer"
                            aria-label="Decrease probability"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTransition(transition.id)}
                        className="h-8 w-8 shrink-0 transition-all duration-150 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                        aria-label="Delete transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="simulate" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Simulation Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { setActiveTab("simulate"); startSimulation() }} disabled={chain.states.length === 0 || isSimulating} size="sm" className="transition-all duration-150 flex-1 sm:flex-initial">
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
              <Button onClick={() => { setActiveTab("simulate"); stepSimulation() }} disabled={!isSimulating || isAutoRunning} size="sm" className="transition-all duration-150 flex-1 sm:flex-initial">
                Step
              </Button>
              <Button onClick={() => { setActiveTab("simulate"); toggleAutoRun() }} disabled={chain.states.length === 0} variant={isAutoRunning ? "default" : "secondary"} size="sm" className="transition-all duration-150 flex-1 sm:flex-initial">
                {isAutoRunning ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Auto-Run
                  </>
                )}
              </Button>
              <Button onClick={resetSimulation} variant="outline" size="sm" className="transition-all duration-150 bg-transparent flex-1 sm:flex-initial">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>

            {isSimulating && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Speed: {simulationSpeed}ms</Label>
                </div>
                <Slider value={[simulationSpeed]} onValueChange={(values) => setSimulationSpeed(values[0])} min={50} max={2000} step={50} className="w-full" />
              </div>
            )}

            {isSimulating && (
              <div className="space-y-2 text-sm border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Step:</span>
                  <Badge variant="secondary">{simulationStep}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current State:</span>
                  <Badge>{chain.states.find((s) => s.id === currentState)?.name}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isSimulating && Object.keys(simulationMetrics.stateVisits).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">State Visits</Label>
                <div className="space-y-1.5">
                  {Object.entries(simulationMetrics.stateVisits)
                    .sort((a, b) => b[1] - a[1])
                    .map(([stateId, count]) => {
                      const state = chain.states.find((s) => s.id === stateId)
                      const percentage = (((count as number) / (simulationStep + 1)) * 100).toFixed(1)
                      return (
                        <div key={stateId} className="flex items-center gap-2">
                          <span className="text-sm font-medium w-12">{state?.name}</span>
                          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-16 text-right">
                            {count as number} ({percentage}%)
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">Recent Path</Label>
                  <Select value={pathHistoryLimit.toString()} onValueChange={(value) => setPathHistoryLimit(value === "all" ? "all" : Number.parseInt(value))}>
                    <SelectTrigger className="w-24 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Last 5</SelectItem>
                      <SelectItem value="10">Last 10</SelectItem>
                      <SelectItem value="20">Last 20</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1 flex-wrap text-xs">
                  {(pathHistoryLimit === "all" ? simulationMetrics.pathHistory : simulationMetrics.pathHistory.slice(-pathHistoryLimit))
                    .map((stateId, idx, arr) => {
                      const state = chain.states.find((s) => s.id === stateId)
                      return (
                        <span key={idx} className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">{state?.name}</Badge>
                          {idx < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                        </span>
                      )
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="analyze" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transition Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            {transitionMatrix.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse w-full">
                  <thead>
                    <tr>
                      <th className="border border-border p-2 bg-muted/50"></th>
                      {chain.states.map((state) => (
                        <th key={state.id} className="border border-border p-2 bg-muted/50 font-semibold">
                          {state.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chain.states.map((state, i) => (
                      <tr key={state.id} className="transition-colors hover:bg-muted/30">
                        <th className="border border-border p-2 bg-muted/50 font-semibold">{state.name}</th>
                        {transitionMatrix[i].map((prob, j) => {
                          const intensity = prob > 0 ? Math.max(0.15, prob) : 0
                          const bgColor = prob > 0 ? `rgba(5, 150, 105, ${intensity})` : "transparent"
                          return (
                            <td key={j} className="border border-border p-2 text-center font-medium transition-all duration-200 hover:scale-105" style={{ backgroundColor: bgColor }}>
                              {prob > 0 ? prob.toFixed(2) : "—"}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(5, 150, 105, 0.2)" }} />
                    <span>Low</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(5, 150, 105, 0.6)" }} />
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: "rgba(5, 150, 105, 1)" }} />
                    <span>High</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Add states and transitions to see matrix</p>
            )}
          </CardContent>
        </Card>

        {chain.states.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chain Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 transition-all hover:bg-muted">
                  <div className="text-2xl font-bold text-primary">{chain.states.length}</div>
                  <div className="text-xs text-muted-foreground">Total States</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 transition-all hover:bg-muted">
                  <div className="text-2xl font-bold text-primary">{chain.transitions.length}</div>
                  <div className="text-xs text-muted-foreground">Transitions</div>
                </div>
              </div>

              <div className="pt-2 border-t space-y-2">
                <Label className="text-xs text-muted-foreground">Outgoing Transitions per State</Label>
                {chain.states.map((state) => {
                  const outgoing = chain.transitions.filter((t) => t.from === state.id).length
                  const totalProb = chain.transitions.filter((t) => t.from === state.id).reduce((sum, t) => sum + t.probability, 0)
                  const isValid = Math.abs(totalProb - 1.0) < 0.01 || outgoing === 0
                  return (
                    <div key={state.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{state.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={isValid ? "secondary" : "destructive"} className="text-xs">
                          {outgoing} ({totalProb.toFixed(2)})
                        </Badge>
                        {!isValid && <span className="text-xs text-destructive">⚠ Invalid</span>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {chain.transitions.length > 0 && (
                <div className="pt-2 border-t">
                  <Label className="text-xs text-muted-foreground mb-2 block">Transition Probabilities</Label>
                  <div className="space-y-1.5">
                    {chain.transitions.map((transition) => {
                      const fromState = chain.states.find((s) => s.id === transition.from)
                      const toState = chain.states.find((s) => s.id === transition.to)
                      return (
                        <div key={transition.id} className="flex items-center gap-2 text-xs">
                          <span className="font-medium">{fromState?.name}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{toState?.name}</span>
                          <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden ml-2">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${transition.probability * 100}%` }} />
                          </div>
                          <span className="text-muted-foreground w-12 text-right">{(transition.probability * 100).toFixed(0)}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  ))

  // Pointer-based interactions: pan, drag, pinch-zoom
  const onCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Start panning on middle button or left-drag on empty canvas (not on nodes)
    const targetEl = e.target as HTMLElement
    const onNode = !!targetEl.closest('[data-node-id]')
    // Don't start panning if already dragging a node
    if ((e.button === 1 || (e.button === 0 && !onNode)) && !draggingStateId) {
      e.preventDefault()
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 2) {
      // Start pinch gesture
      const pts = Array.from(pointersRef.current.values())
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      pinchRef.current = { mid, dist }
    }
  }, [])

  const onCanvasPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointersRef.current.has(e.pointerId)) {
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      }

      if (pointersRef.current.size >= 2) {
        // Pinch zoom anchored at gesture midpoint using stable refs
        const pts = Array.from(pointersRef.current.values())
        const [p1, p2] = pts
        const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)
        const prev = pinchRef.current || { mid, dist }
        const factor = dist / (prev.dist || dist)
        const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * factor))

        const { bx, by, rect } = getBaseCenterOffset()
        const worldBeforeX = (mid.x - rect.left - bx - panOffset.x) / scale
        const worldBeforeY = (mid.y - rect.top - by - panOffset.y) / scale
        const nextPan = {
          x: Math.max(-MAX_PAN_X, Math.min(MAX_PAN_X, mid.x - rect.left - bx - worldBeforeX * nextScale)),
          y: Math.max(-MAX_PAN_Y, Math.min(MAX_PAN_Y, mid.y - rect.top - by - worldBeforeY * nextScale)),
        }
        scheduleViewUpdate({ scale: nextScale })
        scheduleViewUpdate({ pan: nextPan })
        pinchRef.current = { mid, dist }
        return
      }

      if (draggingStateId) {
        // Check if we've moved beyond the drag threshold
        if (dragStartPosRef.current) {
          const dx = e.clientX - dragStartPosRef.current.x
          const dy = e.clientY - dragStartPosRef.current.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // Only start actual dragging if moved beyond threshold
          if (distance > DRAG_THRESHOLD) {
            e.preventDefault()
            didDragRef.current = true
            dragStartPosRef.current = null // Clear threshold check
            
            const { x, y } = clientToWorld(e.clientX, e.clientY)
            
            // Always update pending position immediately
            pendingDragPosRef.current = { id: draggingStateId, x, y }
            currentDragPosRef.current = { id: draggingStateId, x, y }
            
            // Throttle re-renders with RAF for smooth dragging
            if (!dragRafRef.current) {
              dragRafRef.current = requestAnimationFrame(() => {
                // Trigger minimal re-render only for the dragged node
                setDragRenderTick(t => t + 1)
                dragRafRef.current = null
              })
            }
          }
        } else if (didDragRef.current) {
          // Already dragging, continue
          e.preventDefault()
          const { x, y } = clientToWorld(e.clientX, e.clientY)
          pendingDragPosRef.current = { id: draggingStateId, x, y }
          currentDragPosRef.current = { id: draggingStateId, x, y }
          
          if (!dragRafRef.current) {
            dragRafRef.current = requestAnimationFrame(() => {
              // Trigger minimal re-render only for the dragged node
              setDragRenderTick(t => t + 1)
              dragRafRef.current = null
            })
          }
        }
      } else if (isPanning && !draggingStateId) {
        e.preventDefault()
        const deltaX = e.clientX - lastPanPoint.x
        const deltaY = e.clientY - lastPanPoint.y
        const nextPan = {
          x: Math.max(-MAX_PAN_X, Math.min(MAX_PAN_X, panOffset.x + deltaX)),
          y: Math.max(-MAX_PAN_Y, Math.min(MAX_PAN_Y, panOffset.y + deltaY)),
        }
        scheduleViewUpdate({ pan: nextPan })
        setLastPanPoint({ x: e.clientX, y: e.clientY })
      }
    },
    [clientToWorld, isPanning, lastPanPoint, panOffset.x, panOffset.y, scheduleViewUpdate, draggingStateId, scale, getBaseCenterOffset],
  )

  const onCanvasPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      pointersRef.current.delete(e.pointerId)
      try {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {}
      if (e.button === 1) {
        setIsPanning(false)
      }
      if (draggingStateId && e.button === 0) {
        // Cancel any pending RAF updates
        if (dragRafRef.current) {
          cancelAnimationFrame(dragRafRef.current)
          dragRafRef.current = null
        }
        
        // Use current drag position from ref
        const finalPos = currentDragPosRef.current || pendingDragPosRef.current
        if (finalPos) {
          setChain((prev) => {
            // Clamp node position to canvas bounds
            const clampedX = Math.max(50, Math.min(CANVAS_WIDTH - 50, finalPos.x))
            const clampedY = Math.max(50, Math.min(CANVAS_HEIGHT - 50, finalPos.y))
            // Only update the dragged node
            const newStates = prev.states.map((s) =>
              s.id === finalPos.id ? { ...s, x: clampedX, y: clampedY } : s
            )
            return { ...prev, states: newStates }
          })
          // Clear refs
          currentDragPosRef.current = null
          pendingDragPosRef.current = null
        }
        setDraggingStateId(null)
        setTimeout(() => {
          didDragRef.current = false
        }, 0)
      }
      if (pointersRef.current.size < 2) {
        setIsPanning(false)
        pinchRef.current = null
      }
    },
    [draggingStateId],
  )

  const onCanvasWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault()
      const zoomIntensity = 0.0015
      const delta = -e.deltaY
      const factor = Math.exp(delta * zoomIntensity)
      const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * factor))

      const { bx, by, rect } = getBaseCenterOffset()
      const worldBeforeX = (e.clientX - rect.left - bx - panOffset.x) / scale
      const worldBeforeY = (e.clientY - rect.top - by - panOffset.y) / scale
      const nextPan = {
        x: Math.max(-MAX_PAN_X, Math.min(MAX_PAN_X, e.clientX - rect.left - bx - worldBeforeX * nextScale)),
        y: Math.max(-MAX_PAN_Y, Math.min(MAX_PAN_Y, e.clientY - rect.top - by - worldBeforeY * nextScale)),
      }
      scheduleViewUpdate({ scale: nextScale })
      scheduleViewUpdate({ pan: nextPan })
    },
    [getBaseCenterOffset, panOffset.x, panOffset.y, scale, scheduleViewUpdate],
  )

  // Reset pan/zoom to defaults (recenter view without clearing canvas)
  const resetView = useCallback(() => {
    // Just reset pan and zoom to default view
    scheduleViewUpdate({ pan: { x: 0, y: 0 }, scale: 1 })
  }, [scheduleViewUpdate])

  // Radial menu tools configuration (must be after all action functions are defined)
  const radialTools = useMemo(() => [
    { icon: FilePlus, label: 'New Chain', action: newDesign },
    { icon: Save, label: 'Save', action: saveDesign },
    { icon: FolderOpen, label: 'Library', action: () => setLibraryOpen(true) },
    { icon: Upload, label: 'Import', action: handleImportClick },
    { icon: Download, label: 'Export', action: exportChain },
    { icon: FileText, label: 'Report', action: exportReport },
    { icon: RotateCcw, label: 'Reset', action: resetView },
    { icon: Maximize2, label: 'Fit View', action: zoomToFit, disabled: chain.states.length === 0 },
  ], [chain.states.length, newDesign, saveDesign, handleImportClick, exportChain, exportReport, resetView, zoomToFit])

  // Remove double-click/double-tap to reset view - now handled by button

  const handleSidebarResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(true)
      const startX = e.clientX
      const startWidth = sidebarWidth
      let animationFrameId: number | null = null

      const handleMouseMove = (e: MouseEvent) => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
        animationFrameId = requestAnimationFrame(() => {
          const newWidth = Math.max(280, startWidth + (e.clientX - startX))
          setSidebarWidth(newWidth)
        })
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = "none"
      document.body.style.cursor = "col-resize"
    },
    [sidebarWidth],
  )

  // Helper to get state position (use refs only for currently dragging node)
  const getStatePosition = useCallback(
    (state: State) => {
      // ONLY use refs if this is the CURRENTLY dragging node
      // This prevents stale ref data from affecting other nodes
      if (draggingStateId === state.id) {
        if (currentDragPosRef.current && currentDragPosRef.current.id === state.id) {
          return { x: currentDragPosRef.current.x, y: currentDragPosRef.current.y }
        }
        if (pendingDragPosRef.current && pendingDragPosRef.current.id === state.id) {
          return { x: pendingDragPosRef.current.x, y: pendingDragPosRef.current.y }
        }
      }
      // For all other nodes, use the committed state position
      return { x: state.x, y: state.y }
    },
    [draggingStateId], // Depend on draggingStateId to know which node is active
  )

  // Visible world bounds (for simple virtualization)
  const visiblePad = 200
  const { x0: _vx0, y0: _vy0, x1: _vx1, y1: _vy1 } = getVisibleWorldRect()
  const vx0 = _vx0 - visiblePad
  const vy0 = _vy0 - visiblePad
  const vx1 = _vx1 + visiblePad
  const vy1 = _vy1 + visiblePad
  const visibleIds = new Set(
    chain.states.filter((s) => s.x >= vx0 && s.x <= vx1 && s.y >= vy0 && s.y <= vy1).map((s) => s.id),
  )

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <MainNav currentPath="/tools" />

      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`hidden lg:flex flex-col border-r border-border/40 bg-card/50 backdrop-blur-sm p-4 overflow-y-auto relative transition-all duration-300 ease-in-out ${isResizing ? "select-none" : ""}`}
          style={{
            width: isSidebarMinimized ? "0px" : `${sidebarWidth}px`,
            padding: isSidebarMinimized ? "0" : undefined,
            opacity: isSidebarMinimized ? 0 : 1,
          }}
        >
          <div
            className="absolute right-0 top-0 w-1 h-full cursor-col-resize bg-border/50 hover:bg-primary/30 transition-colors duration-200"
            onMouseDown={handleSidebarResize}
            style={{ display: isSidebarMinimized ? "none" : "block" }}
          />

          <div className="space-y-6">
            <div className="animate-in fade-in-0 slide-in-from-top-2 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Chain Builder
                </h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-transparent focus-visible:ring-0 cursor-pointer">
                        <Info className="h-4 w-4 text-muted-foreground opacity-80 hover:opacity-100 transition-opacity" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <div className="space-y-2">
                        <p className="font-medium">Instructions:</p>
                        <ul className="text-xs space-y-1">
                          <li>• Click on canvas to add states</li>
                          <li>• Click a state, then another to create transitions</li>
                          <li>• Use the properties panel to edit values</li>
                          <li>• Drag on empty canvas to pan • Pinch/scroll to zoom</li>
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-muted-foreground">
                Create your own Markov chain by adding states and transitions
              </p>
            </div>

            <SidebarTabs value={activeTab} onChange={setActiveTab} />
          </div>
        </aside>

        {/* Reset Canvas Button - Mobile */}
        <div className="lg:hidden fixed bottom-20 left-4 z-[60]">
          <Button
            size="icon"
            variant="outline"
            className="h-14 w-14 rounded-2xl shadow-lg bg-card/95 backdrop-blur-xl border border-border/60 cursor-pointer hover:scale-105 transition-all duration-300"
            onClick={resetView}
            title="Reset view and clear canvas"
            aria-label="Reset view and clear canvas"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        <div className="lg:hidden fixed bottom-20 right-4 z-[60]">
          <Popover.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <Popover.Trigger asChild>
              <Button size="lg" className="shadow-lg cursor-pointer rounded-2xl" aria-label="Toggle tool options">
                {mobileMenuOpen ? (
                  <>
                    <X className="mr-2 h-5 w-5" />
                    Close
                  </>
                ) : (
                  <>
                    <Menu className="mr-2 h-5 w-5" />
                    Toolbox
                  </>
                )}
              </Button>
            </Popover.Trigger>
            <Popover.Content
              side="top"
              align="end"
              className="z-[70] w-[min(360px,90vw)] max-h-[65vh] overflow-y-auto rounded-2xl border border-border/60 bg-card/95 p-4 shadow-2xl backdrop-blur"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    className="justify-start"
                    onClick={() => {
                      newDesign()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <FilePlus className="mr-2 h-4 w-4" />
                    New Chain
                  </Button>
                  <Button
                    variant="secondary"
                    className="justify-start"
                    onClick={() => {
                      saveDesign()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    className="justify-start"
                    onClick={() => {
                      setLibraryOpen(true)
                      setMobileMenuOpen(false)
                    }}
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Library
                  </Button>
                  <Button
                    variant="secondary"
                    className="justify-start"
                    onClick={() => {
                      handleImportClick()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                  <Button
                    variant="secondary"
                    className="justify-start"
                    onClick={() => {
                      exportChain()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button
                    variant="secondary"
                    className="justify-start"
                    onClick={() => {
                      exportReport()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Report
                  </Button>
                  <Button
                    variant="secondary"
                    className="justify-start cursor-pointer"
                    onClick={() => {
                      resetView()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset View
                  </Button>
                  <Button
                    variant="secondary"
                    className="justify-start cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => {
                      zoomToFit()
                      setMobileMenuOpen(false)
                    }}
                    disabled={chain.states.length === 0}
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Fit to View
                  </Button>
                </div>
                <div className="border-t pt-4">
                  <div className="max-h-[52vh] overflow-y-auto pr-1">
                    <SidebarTabs value={activeTab} onChange={setActiveTab} />
                  </div>
                </div>
              </div>
              <Popover.Arrow className="fill-card/95" />
            </Popover.Content>
          </Popover.Root>
        </div>

        <button
          onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
          className="hidden lg:block absolute left-0 top-20 z-50 bg-card/80 backdrop-blur-sm border border-border/40 rounded-r-xl p-2 hover:bg-muted transition-all duration-200 shadow-lg hover:shadow-xl group"
          style={{
            transform: isSidebarMinimized ? "translateX(0)" : `translateX(${sidebarWidth}px)`,
            transition: "transform 0.3s ease-in-out",
          }}
          title={isSidebarMinimized ? "Show sidebar" : "Hide sidebar"}
        >
          {isSidebarMinimized ? (
            <ChevronRight className="h-4 w-4 group-hover:scale-110 transition-transform" />
          ) : (
            <ChevronLeft className="h-4 w-4 group-hover:scale-110 transition-transform" />
          )}
        </button>

        <main className="flex-1 relative overflow-hidden">
          <TooltipProvider>
          {/* Redesigned Radial Toolbox - Wide Arc */}
          <div 
            ref={toolboxRef}
            className="hidden lg:block absolute top-10 right-10 z-[60] transition-opacity duration-300"
            style={{ opacity: toolboxOpacity }}
            onMouseEnter={() => {
              setToolboxOpacity(1)
              lastActiveTimeRef.current = Date.now()
              if (!isToolboxLocked) {
                setToolboxOpen(true)
              }
            }}
            onMouseLeave={() => {
              if (!isToolboxLocked) {
                setToolboxOpen(false)
              }
            }}
          >
            <div className="relative">
              {/* Center Button */}
              <button
                onClick={() => {
                  setIsToolboxLocked(!isToolboxLocked)
                  setToolboxOpen(true) // Always ensure it's open on click
                  lastActiveTimeRef.current = Date.now()
                }}
                className="relative h-10 w-10 rounded-full shadow-lg transition-all duration-300 bg-gradient-to-br from-primary via-primary to-primary/90 hover:scale-110 cursor-pointer backdrop-blur-xl border-2 border-primary/20 group z-10"
                aria-label="Toggle toolbox lock"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                <div className="relative z-10 flex items-center justify-center transition-transform duration-300">
                  {isToolboxLocked ? (
                    <X className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Wrench className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
              </button>

              {/* Tool Menu Items - Wide Arc */}
              {toolboxOpen && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  {radialTools.map((tool, index) => {
                    const totalTools = radialTools.length
                    // Wide arc from bottom-right (45 deg) to top-left (225 deg)
                    const startAngle = Math.PI / 4 // 45 degrees
                    const endAngle = Math.PI * 1.25 // 225 degrees
                    const angleRange = endAngle - startAngle
                    const anglePerTool = angleRange / (totalTools - 1)
                    const angle = startAngle + index * anglePerTool
                    const radius = 65 // A comfortable radius for the wider arc
                    
                    const x = Math.cos(angle) * radius
                    const y = Math.sin(angle) * radius
                    
                    const isHovered = hoveredTool === index
                    const isDisabled = tool.disabled

                    return (
                      <div
                        key={index}
                        className="absolute pointer-events-auto animate-in fade-in-0 zoom-in-75 duration-200"
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                          transform: 'translate(-50%, -50%)',
                          animationDelay: `${index * 20}ms`,
                          opacity: hoveredTool !== null && !isHovered ? 0.5 : 1,
                          transition: 'opacity 200ms ease-out, transform 200ms ease-out',
                        }}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          {/* Tool Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!isDisabled) {
                                tool.action()
                                if (!isToolboxLocked) {
                                  setToolboxOpen(false)
                                }
                              }
                            }}
                            disabled={isDisabled}
                            className={`h-7 w-7 rounded-full border transition-all duration-200 flex items-center justify-center ${
                              isHovered && !isDisabled
                                ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-115'
                                : isDisabled
                                ? 'bg-muted/30 text-muted-foreground/40 border-border/20 cursor-not-allowed opacity-50'
                                : 'bg-card/95 backdrop-blur-sm text-card-foreground border-border/40 hover:border-primary/40 cursor-pointer shadow-sm'
                            }`}
                            style={{
                              transition: 'all 200ms ease-out',
                            }}
                          >
                            <tool.icon className="h-3 w-3" />
                          </button>
                          
                          {/* Tool Label - Show on hover */}
                          {isHovered && (
                            <div 
                              className="absolute top-full mt-1 whitespace-nowrap animate-in fade-in-0 slide-in-from-top-1 duration-150"
                              style={{
                                pointerEvents: 'none',
                              }}
                            >
                              <div className={`px-2 py-1 rounded-md text-[10px] font-medium shadow-md ${
                                isDisabled 
                                  ? 'bg-muted/80 text-muted-foreground/60 border border-border/30'
                                  : 'bg-primary/90 text-primary-foreground border border-primary/50'
                              }`}>
                                {tool.label}
                                {isDisabled && <span className=" ml-1">(disabled)</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <div
            ref={canvasRef}
            className={`w-full h-full bg-gradient-to-br from-muted/5 via-background to-muted/10 relative overflow-hidden select-none ${
              isPanning ? "cursor-grabbing" : draggingStateId ? "cursor-move" : "cursor-crosshair"
            }`}
            onClick={handleCanvasClick}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onWheel={onCanvasWheel}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div
              ref={canvasContentRef}
              style={{
                transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${scale})`,
                transformOrigin: "0 0",
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: -CANVAS_WIDTH / 2,
                marginTop: -CANVAS_HEIGHT / 2,
                willChange: draggingStateId || isPanning ? 'transform' : 'auto',
                transition: draggingStateId || isPanning ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-2xl shadow-inner" />

              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, hsl(var(--primary) / 0.3) 1px, transparent 1px),
                    linear-gradient(to bottom, hsl(var(--primary) / 0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Transitions (filtered to visible endpoints) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" className="fill-primary" />
                  </marker>
                  {/* Add filter for label background shadow */}
                  <filter id="label-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                    <feOffset dx="0" dy="1" result="offsetblur" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.3" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {chain.transitions
                  .filter((t) => visibleIds.has(t.from) || visibleIds.has(t.to))
                  .map((transition) => {
                  const fromState = chain.states.find((s) => s.id === transition.from)
                  const toState = chain.states.find((s) => s.id === transition.to)
                  if (!fromState || !toState) return null

                  const fromPos = getStatePosition(fromState)
                  const toPos = getStatePosition(toState)

                  const isSelfLoop = fromState.id === toState.id

                  if (isSelfLoop) {
                    const radius = 32
                    const loopRadius = 28
                    const s = fromState
                    const sPos = fromPos
                    const margin = 80

                    const counts = { top: 0, right: 0, bottom: 0, left: 0 }
                    for (const t of chain.transitions) {
                      if (t.id === transition.id) continue
                      if (t.from !== s.id && t.to !== s.id) continue
                      const otherId = t.from === s.id ? t.to : t.from
                      const other = chain.states.find((st) => st.id === otherId)
                      if (!other) continue
                      const dx = other.x - sPos.x
                      const dy = other.y - sPos.y
                      if (Math.abs(dy) > Math.abs(dx)) {
                        if (dy < 0) counts.top++
                        else counts.bottom++
                      } else {
                        if (dx > 0o0)
                          counts.right++ // Fixed: Changed 00 to 0o0
                        else counts.left++
                      }
                    }

                    let preferred: "top" | "right" | "bottom" | "left" = "top"
                    const centerX = CANVAS_WIDTH / 2
                    const centerY = CANVAS_HEIGHT / 2
                    const dxC = sPos.x - centerX
                    const dyC = sPos.y - centerY
                    if (Math.abs(dyC) > Math.abs(dxC)) preferred = dyC > 0 ? "bottom" : "top"
                    else preferred = dxC > 0 ? "right" : "left"

                    const avoid = new Set<string>()
                    if (sPos.y < margin) avoid.add("top")
                    if (sPos.y > CANVAS_HEIGHT - margin) avoid.add("bottom")
                    if (sPos.x < margin) avoid.add("left")
                    if (sPos.x > CANVAS_WIDTH - margin) avoid.add("right")

                    const orientations: Array<"top" | "right" | "bottom" | "left"> = ["top", "right", "bottom", "left"]
                    const ordered = [preferred, ...orientations.filter((o) => o !== preferred)]
                    let orientation = ordered.filter((o) => !avoid.has(o)).sort((a, b) => counts[a] - counts[b])[0]
                    if (!orientation) orientation = preferred

                    let pathData = ""
                    let labelX = sPos.x
                    let labelY = sPos.y
                    if (orientation === "top") {
                      const cx = sPos.x
                      const cy = sPos.y - radius - loopRadius
                      const startX = sPos.x - radius * 0.7
                      const startY = sPos.y - radius * 0.7
                      const endX = sPos.x + radius * 0.7
                      const endY = sPos.y - radius * 0.7
                      pathData = `M ${startX} ${startY} Q ${cx - loopRadius} ${cy} ${cx} ${cy} Q ${cx + loopRadius} ${cy} ${endX} ${endY}`
                      labelX = cx
                      labelY = cy - 8
                    } else if (orientation === "bottom") {
                      const cx = sPos.x
                      const cy = sPos.y + radius + loopRadius
                      const startX = sPos.x + radius * 0.7
                      const startY = sPos.y + radius * 0.7
                      const endX = sPos.x - radius * 0.7
                      const endY = sPos.y + radius * 0.7
                      pathData = `M ${startX} ${startY} Q ${cx + loopRadius} ${cy} ${cx} ${cy} Q ${cx - loopRadius} ${cy} ${endX} ${endY}`
                      labelX = cx
                      labelY = cy + 16
                    } else if (orientation === "right") {
                      const cx = sPos.x + radius + loopRadius
                      const cy = sPos.y
                      const startX = sPos.x + radius * 0.7
                      const startY = sPos.y - radius * 0.7
                      const endX = sPos.x + radius * 0.7
                      const endY = sPos.y + radius * 0.7
                      pathData = `M ${startX} ${startY} Q ${cx} ${cy - loopRadius} ${cx} ${cy} Q ${cx} ${cy + loopRadius} ${endX} ${endY}`
                      labelX = cx + 14
                      labelY = cy + 4
                    } else if (orientation === "left") {
                      const cx = sPos.x - radius - loopRadius
                      const cy = sPos.y
                      const startX = sPos.x - radius * 0.7
                      const startY = sPos.y + radius * 0.7
                      const endX = sPos.x - radius * 0.7
                      const endY = sPos.y - radius * 0.7
                      pathData = `M ${startX} ${startY} Q ${cx} ${cy + loopRadius} ${cx} ${cy} Q ${cx} ${cy - loopRadius} ${endX} ${endY}`
                      labelX = cx - 14
                      labelY = cy + 4
                    }

                    const labelText = transition.probability.toFixed(2)
                    const labelWidth = labelText.length * 7 + 8
                    const labelHeight = 18

                    return (
                      <g key={transition.id}>
                        <path d={pathData} className="stroke-background dark:stroke-foreground/10" strokeWidth="5" fill="none" opacity="0.92" />
                        <path
                          d={pathData}
                          className="stroke-primary"
                          strokeWidth="2.25"
                          fill="none"
                          markerEnd="url(#arrowhead)"
                        />
                        <rect
                          x={labelX - labelWidth / 2}
                          y={labelY - labelHeight / 2}
                          width={labelWidth}
                          height={labelHeight}
                          rx="4"
                          className="fill-background stroke-border"
                          strokeWidth="1"
                          filter="url(#label-shadow)"
                        />
                        <text
                          x={labelX}
                          y={labelY + 4}
                          textAnchor="middle"
                          className="text-xs fill-foreground font-semibold select-none"
                        >
                          {labelText}
                        </text>
                      </g>
                    )
                  }

                  const reverseTransition = chain.transitions.find(
                    (t) => t.from === transition.to && t.to === transition.from,
                  )
                  const isBidirectional = !!reverseTransition

                  const radius = 32
                  const dx = toPos.x - fromPos.x
                  const dy = toPos.y - fromPos.y
                  const distance = Math.sqrt(dx * dx + dy * dy)

                  const fromX = fromPos.x + (dx / distance) * radius
                  const fromY = fromPos.y + (dy / distance) * radius
                  const toX = toPos.x - (dx / distance) * radius
                  const toY = toPos.y - (dy / distance) * radius

                  if (isBidirectional) {
                    const canonicalFrom = fromState.id < toState.id ? fromState : toState
                    const canonicalTo = canonicalFrom.id === fromState.id ? toState : fromState
                    const baseDx = canonicalTo.x - canonicalFrom.x
                    const baseDy = canonicalTo.y - canonicalFrom.y
                    const baseDist = Math.sqrt(baseDx * baseDx + baseDy * baseDy) || 1
                    const perpXUnit = -baseDy / baseDist
                    const perpYUnit = baseDx / baseDist

                    const sign = transition.from === canonicalFrom.id ? 1 : -1

                    const midX = (fromX + toX) / 2
                    const midY = (fromY + toY) / 2

                    const CURVE_OFFSET = 60
                    const ENDPOINT_OFFSET = 12

                    const adjFromX = fromX + perpXUnit * ENDPOINT_OFFSET * sign
                    const adjFromY = fromY + perpYUnit * ENDPOINT_OFFSET * sign
                    const adjToX = toX + perpXUnit * ENDPOINT_OFFSET * sign
                    const adjToY = toY + perpYUnit * ENDPOINT_OFFSET * sign

                    const controlX = midX + perpXUnit * CURVE_OFFSET * sign
                    const controlY = midY + perpYUnit * CURVE_OFFSET * sign

                    const pathData = `M ${adjFromX} ${adjFromY} Q ${controlX} ${controlY} ${adjToX} ${adjToY}`

                    const labelX = controlX
                    const labelY = controlY

                    const labelText = transition.probability.toFixed(2)
                    const labelWidth = labelText.length * 7 + 8
                    const labelHeight = 18

                    return (
                      <g key={transition.id}>
                        <path d={pathData} className="stroke-background dark:stroke-foreground/10" strokeWidth="5" fill="none" opacity="0.92" />
                        <path
                          d={pathData}
                          className="stroke-primary"
                          strokeWidth="2.25"
                          fill="none"
                          markerEnd="url(#arrowhead)"
                        />
                        <rect
                          x={labelX - labelWidth / 2}
                          y={labelY - labelHeight / 2}
                          width={labelWidth}
                          height={labelHeight}
                          rx="4"
                          className="fill-background stroke-border"
                          strokeWidth="1"
                          filter="url(#label-shadow)"
                        />
                        <text
                          x={labelX}
                          y={labelY + 4}
                          textAnchor="middle"
                          className="text-xs fill-foreground font-semibold select-none"
                        >
                          {labelText}
                        </text>
                      </g>
                    )
                  } else {
                    const labelX = (fromX + toX) / 2
                    const labelY = (fromY + toY) / 2 - 12

                    const labelText = transition.probability.toFixed(2)
                    const labelWidth = labelText.length * 7 + 8
                    const labelHeight = 18

                    return (
                      <g key={transition.id}>
                        <line x1={fromX} y1={fromY} x2={toX} y2={toY} className="stroke-background dark:stroke-foreground/10" strokeWidth="4" opacity="0.8" />
                        <line
                          x1={fromX}
                          y1={fromY}
                          x2={toX}
                          y2={toY}
                          className="stroke-primary"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                          opacity="1"
                        />
                        <rect
                          x={labelX - labelWidth / 2}
                          y={labelY - labelHeight / 2}
                          width={labelWidth}
                          height={labelHeight}
                          rx="4"
                          className="fill-background stroke-border"
                          strokeWidth="1"
                          filter="url(#label-shadow)"
                        />
                        <text
                          x={labelX}
                          y={labelY + 4}
                          textAnchor="middle"
                          className="text-xs fill-foreground font-semibold"
                        >
                          {labelText}
                        </text>
                      </g>
                    )
                  }
                })}
              </svg>

              {chain.states
                .filter((s) => s.x >= vx0 && s.x <= vx1 && s.y >= vy0 && s.y <= vy1)
                .map((state) => {
                  const pos = getStatePosition(state)
                  return (
                <Popover.Root key={state.id} open={openPopovers[state.id]} onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [state.id]: open }))}>
                  <Popover.Trigger asChild>
                    <div
                      data-node-id={state.id}
                      className={`
                        absolute w-16 h-16 rounded-full border-2 flex items-center justify-center
                        text-sm font-medium cursor-pointer transition-all transform -translate-x-8 -translate-y-8 select-none
                        ${selectedState === state.id ? "ring-2 ring-primary ring-offset-2" : ""}
                        ${currentState === state.id ? "ring-2 ring-accent ring-offset-2 scale-110" : ""}
                        ${draggingStateId === state.id ? "transition-none" : ""}
                        ${state.isFinal ? "border-4" : ""}
                      `}
                      style={{
                        left: pos.x,
                        top: pos.y,
                        backgroundColor: state.color + "20",
                        borderColor: state.color,
                        color: state.color,
                        willChange: draggingStateId === state.id ? 'transform' : 'auto',
                        boxShadow: state.isInitial ? `0 0 0 3px ${state.color}40` : undefined,
                      }}
                      onPointerDown={(e) => {
                        if (e.button !== 0) return
                        e.stopPropagation()
                        didDragRef.current = false
                        setIsPanning(false) // Ensure panning is stopped when dragging node
                        setDraggingStateId(state.id)
                        dragStartPosRef.current = { x: e.clientX, y: e.clientY } // Track start position for threshold
                        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                      }}
                      onPointerUp={(e) => {
                        e.stopPropagation()
                        try {
                          ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
                        } catch {}
                        
                        // Save the position BEFORE clearing draggingStateId
                        if (draggingStateId && didDragRef.current) {
                          // Cancel any pending RAF updates
                          if (dragRafRef.current) {
                            cancelAnimationFrame(dragRafRef.current)
                            dragRafRef.current = null
                          }
                          
                          // Use current drag position from ref
                          const finalPos = currentDragPosRef.current || pendingDragPosRef.current
                          if (finalPos) {
                            setChain((prev) => {
                              // Clamp node position to canvas bounds
                              const clampedX = Math.max(50, Math.min(CANVAS_WIDTH - 50, finalPos.x))
                              const clampedY = Math.max(50, Math.min(CANVAS_HEIGHT - 50, finalPos.y))
                              // Only update the dragged node
                              const newStates = prev.states.map((s) =>
                                s.id === finalPos.id ? { ...s, x: clampedX, y: clampedY } : s
                              )
                              return { ...prev, states: newStates }
                            })
                          }
                        }
                        
                        // Now clear the drag state
                        if (draggingStateId) {
                          // Clear refs after state update
                          currentDragPosRef.current = null
                          pendingDragPosRef.current = null
                          setDraggingStateId(null)
                          dragStartPosRef.current = null
                          setTimeout(() => {
                            didDragRef.current = false
                          }, 0)
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (didDragRef.current) {
                          e.preventDefault()
                          return
                        }
                        if (selectedState && selectedState !== state.id) {
                          addTransition(selectedState, state.id)
                          setSelectedState(null)
                        } else if (selectedState === state.id) {
                          addTransition(selectedState, state.id)
                          setSelectedState(null)
                        } else {
                          setSelectedState(state.id)
                        }
                      }}
                    >
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <div className="relative w-full h-full flex items-center justify-center">
                            {/* Initial state indicator - arrow pointing in */}
                            {state.isInitial && (
                              <div 
                                className="absolute -left-8 top-1/2 -translate-y-1/2"
                                style={{ color: state.color }}
                              >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                              </div>
                            )}
                            
                            {/* State name */}
                            <span className="z-10 font-semibold max-w-[75%] truncate px-1">
                              {state.name}
                            </span>
                            
                            {/* Final state indicator - double circle border is handled by CSS */}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          className="bg-card/95 backdrop-blur-sm border-border/60 shadow-xl max-w-[280px] z-[9999] pointer-events-auto"
                          sideOffset={16}
                          collisionPadding={16}
                          avoidCollisions={true}
                        >
                            <div className="space-y-2 text-xs">
                              <div className="font-semibold text-sm border-b border-border/40 pb-1.5 mb-2">
                                {state.name}
                              </div>
                              
                              {/* Incoming transitions */}
                              {(() => {
                                const incoming = chain.transitions.filter(t => t.to === state.id)
                                return incoming.length > 0 ? (
                                  <div>
                                    <div className="font-medium text-muted-foreground mb-1">
                                      Incoming ({incoming.length}):
                                    </div>
                                    <div className="pl-2 space-y-0.5">
                                      {incoming.map(t => {
                                        const fromState = chain.states.find(s => s.id === t.from)
                                        return (
                                          <div key={t.id} className="text-xs">
                                            {fromState?.name || 'Unknown'} → {(t.probability * 100).toFixed(1)}%
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground/60 italic">No incoming transitions</div>
                                )
                              })()}
                              
                              {/* Outgoing transitions */}
                              {(() => {
                                const outgoing = chain.transitions.filter(t => t.from === state.id)
                                return outgoing.length > 0 ? (
                                  <div>
                                    <div className="font-medium text-muted-foreground mb-1">
                                      Outgoing ({outgoing.length}):
                                    </div>
                                    <div className="pl-2 space-y-0.5">
                                      {outgoing.map(t => {
                                        const toState = chain.states.find(s => s.id === t.to)
                                        return (
                                          <div key={t.id} className="text-xs">
                                            → {toState?.name || 'Unknown'} {(t.probability * 100).toFixed(1)}%
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground/60 italic">No outgoing transitions</div>
                                )
                              })()}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                    </div>
                  </Popover.Trigger>
                  <Popover.Content side="top" sideOffset={10} className="z-50 rounded-lg border bg-card p-3 shadow-md w-auto min-w-[280px] max-w-[90vw]">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2">
                          {editingStateId === state.id ? (
                            <>
                              <Input
                                value={editingStateName}
                                onChange={(e) => setEditingStateName(e.target.value)}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setChain((prev) => ({
                                      ...prev,
                                      states: prev.states.map((s) => (s.id === state.id ? { ...s, name: editingStateName } : s)),
                                    }))
                                    setEditingStateId(null)
                                    setEditingStateName("")
                                  } else if (e.key === 'Escape') {
                                    setEditingStateId(null)
                                    setEditingStateName("")
                                  }
                                }}
                                className="h-8 text-sm font-medium transition-all duration-150 focus:ring-2 focus:ring-primary/50 border-border/60"
                                autoFocus
                                placeholder="State name"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-green-500/10 cursor-pointer"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setChain((prev) => ({
                                    ...prev,
                                    states: prev.states.map((s) => (s.id === state.id ? { ...s, name: editingStateName } : s)),
                                  }))
                                  setEditingStateId(null)
                                  setEditingStateName("")
                                }}
                                title="Save"
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold text-sm truncate">{state.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 hover:bg-primary/10 cursor-pointer"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingStateId(state.id)
                                  setEditingStateName(state.name)
                                }}
                                title="Edit name"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onPointerDown={(e) => {
                            e.stopPropagation()
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            deleteState(state.id)
                          }}
                          className="h-8 shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      
                      {/* State Type Controls */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2 border-t">
                        <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={state.isInitial || false}
                            onChange={(e) => {
                              e.stopPropagation()
                              setChain((prev) => ({
                                ...prev,
                                states: prev.states.map((s) => 
                                  s.id === state.id 
                                    ? { ...s, isInitial: e.target.checked, isFinal: e.target.checked ? false : s.isFinal }
                                    : s
                                ),
                              }))
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                          />
                          <span className="text-xs font-medium">Initial State</span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={state.isFinal || false}
                            onChange={(e) => {
                              e.stopPropagation()
                              setChain((prev) => ({
                                ...prev,
                                states: prev.states.map((s) => 
                                  s.id === state.id 
                                    ? { ...s, isFinal: e.target.checked, isInitial: e.target.checked ? false : s.isInitial }
                                    : s
                                ),
                              }))
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                          />
                          <span className="text-xs font-medium">Final State</span>
                        </label>
                      </div>
                      
                      <div className="space-y-3 pt-2 border-t">
                        <Label className="text-xs font-medium text-muted-foreground">Outgoing Probabilities</Label>
                        {chain.transitions.filter((t) => t.from === state.id).length === 0 ? (
                          <div className="text-center py-3 text-muted-foreground text-xs">
                            No outgoing transitions
                          </div>
                        ) : (
                          chain.transitions
                            .filter((t) => t.from === state.id)
                            .map((t) => {
                              const to = chain.states.find((s) => s.id === t.to)
                              return (
                                <div key={t.id} className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs font-mono shrink-0 min-w-[2.5rem] justify-center">
                                    {to?.name}
                                  </Badge>
                                  <Slider
                                    value={[Number.isFinite(t.probability) ? t.probability : 0]}
                                    onValueChange={(values) => updateTransitionProbability(t.id, roundProbability(values[0] ?? 0))}
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    className="flex-1 [&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_.bg-primary]:h-1.5"
                                  />
                                  <Input
                                    type="number"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={Number.isFinite(t.probability) ? t.probability.toFixed(2) : "0.00"}
                                    onChange={(e) => {
                                      const parsed = Number.parseFloat(e.target.value)
                                      updateTransitionProbability(
                                        t.id,
                                        roundProbability(Number.isFinite(parsed) ? parsed : 0),
                                      )
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-16 h-7 text-xs font-mono text-center transition-all duration-150 focus:ring-2 focus:ring-primary/50 border-border/60"
                                  />
                                </div>
                              )
                            })
                        )}
                      </div>
                    </div>
                  </Popover.Content>
                </Popover.Root>
                  )
                })}

              {chain.states.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center animate-in fade-in-0 zoom-in-95 duration-500">
                  <Card className="p-6 sm:p-8 text-center max-w-md mx-4 shadow-xl border-primary/20 bg-card/80 backdrop-blur-sm">
                    <CardContent>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                        <Plus className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Start Building Your Chain
                      </h3>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        Click anywhere on the canvas to add your first state
                      </p>
                      <p className="text-muted-foreground text-xs sm:text-sm mt-2 opacity-75">
                        Drag to pan • Pinch/scroll to zoom
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
          </TooltipProvider>
        </main>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Design</DialogTitle>
            <DialogDescription>Give your Markov chain design a name to save it for later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="design-name">Design Name</Label>
              <Input
                id="design-name"
                placeholder="e.g., Weather Model, Random Walk..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveConfirm()
                  }
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              States: {chain.states.length} | Transitions: {chain.transitions.length}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfirm}>Save Design</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Library Dialog */}
      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Saved Designs</DialogTitle>
            <DialogDescription>Load or delete your saved Markov chain designs.</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {savedDesigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No saved designs yet</p>
                <p className="text-sm mt-1">Click Save to store your current design</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedDesigns.map((design) => (
                  <Card key={design.id} className="transition-all hover:bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{design.name}</h4>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{design.chain.states.length} states</span>
                            <span>{design.chain.transitions.length} transitions</span>
                            <span>{new Date(design.savedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => loadDesign(design)} className="transition-all duration-150">
                            Load
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Delete "${design.name}"?`)) {
                                deleteDesign(design.id)
                              }
                            }}
                            className="transition-all duration-150"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLibraryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <ToolsContent />
    </Suspense>
  )
}
