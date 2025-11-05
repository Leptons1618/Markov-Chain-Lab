"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect, Suspense, memo } from "react"
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
import { ThemeSwitcher } from "@/components/theme-switcher"
import { MobileNav } from "@/components/mobile-nav"

interface State {
  id: string
  name: string
  x: number
  y: number
  color: string
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

function ToolsContent() {
  const searchParams = useSearchParams()
  const [chain, setChain] = useState<MarkovChain>({ states: [], transitions: [] })
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
  const MIN_SCALE = 0.2
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
              setChain(example.design)
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

    // Load saved designs from localStorage
    try {
      const savedDesignsData = localStorage.getItem('markov-saved-designs')
      if (savedDesignsData) {
        const designs = JSON.parse(savedDesignsData)
        setSavedDesigns(designs)
      }
    } catch (err) {
      console.error("Failed to load designs from localStorage:", err)
    }
  }, [searchParams])

  // Helpers: probability normalization
  const equalizeOutgoing = useCallback((transitions: Transition[], fromId: string) => {
    const outgoing = transitions.filter((t) => t.from === fromId)
    const n = outgoing.length
    if (n === 0) return transitions
    const equal = 1 / n
    return transitions.map((t) => (t.from === fromId ? { ...t, probability: equal } : t))
  }, [])

  const normalizeWithAnchor = useCallback(
    (transitions: Transition[], fromId: string, anchorId: string, anchorValue: number) => {
      const clamped = Math.max(0, Math.min(1, anchorValue))
      const outgoing = transitions.filter((t) => t.from === fromId)
      const others = outgoing.filter((t) => t.id !== anchorId)
      if (others.length === 0) {
        // Only one transition from this state
        return transitions.map((t) => (t.id === anchorId ? { ...t, probability: 1 } : t))
      }
      const otherSum = others.reduce((acc, t) => acc + t.probability, 0)
      const remaining = Math.max(0, 1 - clamped)
      return transitions.map((t) => {
        if (t.id === anchorId) return { ...t, probability: clamped }
        if (t.from !== fromId) return t
        if (otherSum > 0) {
          return { ...t, probability: (t.probability / otherSum) * remaining }
        }
        // If all others were zero, spread equally
        return { ...t, probability: remaining / others.length }
      })
    },
    [],
  )

  // Device-specific canvas bounds
  const getDeviceType = () => {
    if (typeof window !== 'undefined') {
      const w = window.innerWidth
      if (w < 640) return 'phone'
      if (w < 1024) return 'tablet'
      return 'desktop'
    }
    return 'desktop'
  }

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
      setChain((prev) => {
        const target = prev.transitions.find((t) => t.id === transitionId)
        if (!target) return prev
        const normalized = normalizeWithAnchor(prev.transitions, target.from, transitionId, probability)
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

      // CRITICAL: Prevent node placement on double-tap/double-click
      // Check if this click is part of a double-tap sequence (within 300ms of last tap)
      const now = Date.now()
      if (now - lastTapTimeRef.current < 350) {
        // This is a double-tap, don't add a node
        return
      }

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

  const handleSaveConfirm = useCallback(() => {
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
      setHasUnsavedChanges(false)
      setSaveDialogOpen(false)
      setSaveName("")
    } catch (error) {
      console.error("Failed to save design:", error)
      alert("Failed to save design. Please try again.")
    }
  }, [saveName, chain])

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

  const deleteDesign = useCallback((id: string) => {
    try {
      const savedDesignsData = localStorage.getItem('markov-saved-designs')
      if (savedDesignsData) {
        const designs = JSON.parse(savedDesignsData)
        const updatedDesigns = designs.filter((d: SavedDesign) => d.id !== id)
        localStorage.setItem('markov-saved-designs', JSON.stringify(updatedDesigns))
        setSavedDesigns(updatedDesigns)
      }
    } catch (error) {
      console.error("Failed to delete design:", error)
      alert("Failed to delete design. Please try again.")
    }
  }, [])

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
        <TabsTrigger value="build" className="data-[state=active]:bg-background transition-all duration-200">
          Build
        </TabsTrigger>
        <TabsTrigger value="simulate" className="data-[state=active]:bg-background transition-all duration-200">
          Simulate
        </TabsTrigger>
        <TabsTrigger value="analyze" className="data-[state=active]:bg-background transition-all duration-200">
          Analyze
        </TabsTrigger>
      </TabsList>

      <TabsContent value="build" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Chain Builder</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-transparent focus-visible:ring-0">
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

        {chain.transitions.length > 0 && (
          <Card className="transition-all duration-200">
            <CardHeader>
              <CardTitle className="text-base">Transitions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {chain.transitions.map((transition) => {
                const fromState = chain.states.find((s) => s.id === transition.from)
                const toState = chain.states.find((s) => s.id === transition.to)
                return (
                  <div
                    key={transition.id}
                    className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors duration-150"
                  >
                    <span className="font-medium w-10 truncate">{fromState?.name}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 mx-1" />
                    <span className="font-medium w-10 truncate">{toState?.name}</span>
                    <div className="flex items-center gap-2 flex-1">
                      <Slider
                        value={[Number.isFinite(transition.probability) ? transition.probability : 0]}
                        onValueChange={(values) => updateTransitionProbability(transition.id, values[0])}
                        min={0}
                        max={1}
                        step={0.01}
                        className="w-40"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={Number.isFinite(transition.probability) ? transition.probability : 0}
                        onChange={(e) => updateTransitionProbability(transition.id, Number.parseFloat(e.target.value))}
                        className="w-20 h-7 text-xs transition-all duration-150 focus:ring-2"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTransition(transition.id)}
                      className="transition-all duration-150 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
            <div className="flex gap-2">
              <Button onClick={() => { setActiveTab("simulate"); startSimulation() }} disabled={chain.states.length === 0 || isSimulating} size="sm" className="transition-all duration-150">
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
              <Button onClick={() => { setActiveTab("simulate"); stepSimulation() }} disabled={!isSimulating || isAutoRunning} size="sm" className="transition-all duration-150">
                Step
              </Button>
              <Button onClick={() => { setActiveTab("simulate"); toggleAutoRun() }} disabled={chain.states.length === 0} variant={isAutoRunning ? "default" : "secondary"} size="sm" className="transition-all duration-150">
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
              <Button onClick={resetSimulation} variant="outline" size="sm" className="transition-all duration-150 bg-transparent">
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

  // Reset pan/zoom to defaults
  const resetView = useCallback(() => {
    scheduleViewUpdate({ pan: { x: 0, y: 0 }, scale: 1 })
  }, [scheduleViewUpdate])

  const onCanvasDoubleClick = useCallback(() => {
    resetView()
  }, [resetView])

  // Double-tap support for touch
  const onCanvasPointerUpForTap = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only primary or middle button
      if (!(e.button === 0 || e.button === 1)) return
      // If a node drag occurred, skip double-tap reset
      if (didDragRef.current) return
      
      // Ignore if tap is on a node or interactive element
      const target = e.target as HTMLElement
      if (target.closest("[data-node-id]") || 
          target.closest('button') || 
          target.closest('[role="dialog"]') ||
          target.closest('[data-radix-popper-content-wrapper]') ||
          target.closest('[data-radix-portal]')) {
        return
      }
      
      const now = Date.now()
      if (now - lastTapTimeRef.current < 300) {
        // Double-tap detected - reset view
        resetView()
        // Prevent handleCanvasClick from being called
        e.preventDefault()
        e.stopPropagation()
      }
      lastTapTimeRef.current = now
    },
    [resetView],
  )

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

  // Helper to get state position (use refs only to avoid re-renders)
  const getStatePosition = useCallback(
    (state: State) => {
      // Check refs for drag position (no state dependency = no unnecessary re-renders)
      if (currentDragPosRef.current && currentDragPosRef.current.id === state.id) {
        return { x: currentDragPosRef.current.x, y: currentDragPosRef.current.y }
      }
      if (pendingDragPosRef.current && pendingDragPosRef.current.id === state.id) {
        return { x: pendingDragPosRef.current.x, y: pendingDragPosRef.current.y }
      }
      return { x: state.x, y: state.y }
    },
    [], // No dependencies - stable function
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
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm z-50 flex-shrink-0">
        <div className="max-w-full px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">M</span>
                </div>
                <span className="font-semibold text-lg">MarkovLearn</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6">
                <Link href="/learn" className="text-muted-foreground hover:text-foreground transition-colors">
                  Learn
                </Link>
                <Link href="/tools" className="text-foreground font-medium transition-colors">
                  Tools
                </Link>
                <Link href="/examples" className="text-muted-foreground hover:text-foreground transition-colors">
                  Examples
                </Link>
                <Link href="/practice" className="text-muted-foreground hover:text-foreground transition-colors">
                  Practice
                </Link>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
                <ThemeSwitcher />
              </div>
              <MobileNav currentPath="/tools" />
            </div>
          </div>
        </div>
      </nav>

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
              <h2 className="text-lg font-semibold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Chain Builder
              </h2>
              <p className="text-sm text-muted-foreground">
                Create your own Markov chain by adding states and transitions
              </p>
            </div>

            <SidebarTabs value={activeTab} onChange={setActiveTab} />
          </div>
        </aside>

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
                    className="justify-start"
                    onClick={() => {
                      resetView()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset View
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
          {/* Floating Toolbox Button */}
          <div className="hidden lg:block absolute top-4 right-4 z-[60]">
            <Popover.Root open={toolboxOpen} onOpenChange={setToolboxOpen}>
              <Popover.Trigger asChild>
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-primary/90 to-primary hover:from-primary hover:to-primary/90 border border-primary/20 hover:scale-105"
                  aria-label="Toggle toolbox"
                >
                  {toolboxOpen ? (
                    <X className="h-5 w-5 stroke-[2.5]" />
                  ) : (
                    <Wrench className="h-5 w-5 stroke-[2.5]" />
                  )}
                </Button>
              </Popover.Trigger>
              <Popover.Content
                side="bottom"
                align="end"
                className="z-[70] w-auto rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl p-4 shadow-2xl animate-in fade-in-0 slide-in-from-top-2 duration-300"
                sideOffset={8}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 pb-2 border-b">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Canvas Toolbox</span>
                    <Badge variant="secondary" className="text-[10px]">Quick Actions</Badge>
                  </div>
                  <TooltipProvider delayDuration={150}>
                    <div className="grid grid-cols-4 gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl border border-border/60 bg-background/70 hover:bg-primary/10"
                        onClick={newDesign}
                      >
                        <FilePlus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">New Chain</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl border border-border/60 bg-background/70 hover:bg-primary/10"
                        onClick={saveDesign}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Save</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl border border-border/60 bg-background/70 hover:bg-primary/10"
                        onClick={() => setLibraryOpen(true)}
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Library</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl border border-border/60 bg-background/70 hover:bg-primary/10"
                        onClick={handleImportClick}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Import JSON</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl border border-border/60 bg-background/70 hover:bg-primary/10"
                        onClick={exportChain}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Export JSON</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl border border-border/60 bg-background/70 hover:bg-primary/10"
                        onClick={exportReport}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Export Report</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl border border-border/60 bg-background/70 hover:bg-primary/10"
                        onClick={resetView}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Reset View</TooltipContent>
                  </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
                <Popover.Arrow className="fill-card/95" />
              </Popover.Content>
            </Popover.Root>
          </div>
          <div
            ref={canvasRef}
            className={`w-full h-full bg-gradient-to-br from-muted/5 via-background to-muted/10 relative overflow-hidden select-none ${
              isPanning ? "cursor-grabbing" : draggingStateId ? "cursor-move" : "cursor-crosshair"
            }`}
            onClick={handleCanvasClick}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={(e) => {
              onCanvasPointerUp(e)
              onCanvasPointerUpForTap(e)
            }}
            onWheel={onCanvasWheel}
            onDoubleClick={onCanvasDoubleClick}
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
                      `}
                      style={{
                        left: pos.x,
                        top: pos.y,
                        backgroundColor: state.color + "20",
                        borderColor: state.color,
                        color: state.color,
                        willChange: draggingStateId === state.id ? 'transform' : 'auto',
                        contain: 'layout style paint',
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
                        if (draggingStateId) {
                          setDraggingStateId(null)
                          dragStartPosRef.current = null // Clear drag start position
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
                      {state.name}
                    </div>
                  </Popover.Trigger>
                  <Popover.Content side="top" sideOffset={10} className="z-50 rounded-lg border bg-card p-3 shadow-md w-auto min-w-[280px] max-w-[90vw]">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            id={`state-name-${state.id}`}
                            value={state.name}
                            onChange={(e) => {
                              setChain((prev) => ({
                                ...prev,
                                states: prev.states.map((s) => (s.id === state.id ? { ...s, name: e.target.value } : s)),
                              }))
                            }}
                            onPointerDown={(e) => {
                              e.stopPropagation()
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                            placeholder="State name"
                            className="h-8 text-sm"
                            autoFocus={false}
                            readOnly
                            onFocus={(e) => {
                              // Remove readOnly when user explicitly focuses
                              e.target.readOnly = false
                            }}
                          />
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
                      <div className="space-y-2 pt-1 border-t">
                        <Label className="text-xs text-muted-foreground">Outgoing Probabilities</Label>
                        {chain.transitions
                          .filter((t) => t.from === state.id)
                          .map((t) => {
                            const to = chain.states.find((s) => s.id === t.to)
                            return (
                              <div key={t.id} className="flex items-center gap-2 text-xs">
                                <span className="w-10 font-medium">{to?.name}</span>
                                <Slider
                                  value={[Number.isFinite(t.probability) ? t.probability : 0]}
                                  onValueChange={(values) => updateTransitionProbability(t.id, values[0])}
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  className="w-40"
                                />
                                <Input
                                  type="number"
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  value={Number.isFinite(t.probability) ? t.probability : 0}
                                  onChange={(e) => updateTransitionProbability(t.id, Number.parseFloat(e.target.value))}
                                  className="w-16 h-7"
                                />
                              </div>
                            )
                          })}
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
                        Drag to pan • Pinch/scroll to zoom • Double‑tap/double‑click to reset
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
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
