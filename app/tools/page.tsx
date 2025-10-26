"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect, Suspense } from "react"
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
import { Plus, Play, RotateCcw, Download, Upload, Trash2, ArrowRight, Info, Pause, Save, FolderOpen, ChevronLeft, ChevronRight, FileText, FilePlus } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [simulationSpeed, setSimulationSpeed] = useState(500) // milliseconds
  const [simulationMetrics, setSimulationMetrics] = useState<SimulationMetrics>({
    stateVisits: {},
    transitionUsage: {},
    pathHistory: [],
  })
  const [isPanning, setIsPanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [sidebarWidth, setSidebarWidth] = useState(550)
  const [isResizing, setIsResizing] = useState(false)
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const autoRunIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [draggingStateId, setDraggingStateId] = useState<string | null>(null)
  const didDragRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([])
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [pathHistoryLimit, setPathHistoryLimit] = useState<number | "all">(10)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

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
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])
  
  // Load from example URL parameter on mount and fetch saved designs from API
  useEffect(() => {
    // Check if loading from example
    const exampleId = searchParams.get("example")
    if (exampleId) {
      // Load example from API
      fetch(`/api/examples`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const example = data.data.find((ex: any) => ex.id === exampleId)
            if (example?.design) {
              setChain(example.design)
                            setHasUnsavedChanges(false)
              return
            }
          }
        })
        .catch(err => console.error("Failed to load example:", err))
    }
    
    // Load saved designs from API
    fetch("/api/designs")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSavedDesigns(data.data)
        }
      })
      .catch(err => console.error("Failed to load designs:", err))
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

  const CANVAS_WIDTH = 2000
  const CANVAS_HEIGHT = 1500
  const MAX_PAN_X = 200
  const MAX_PAN_Y = 200

  const addState = useCallback(
    (x: number, y: number) => {
      const newState: State = {
        id: `state-${Date.now()}`,
        name: `S${chain.states.length + 1}`,
        x,
        y,
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
  }, [])

  const deleteTransition = useCallback((transitionId: string) => {
    setChain((prev) => {
      const target = prev.transitions.find((t) => t.id === transitionId)
      const filtered = prev.transitions.filter((t) => t.id !== transitionId)
      const balanced = target ? equalizeOutgoing(filtered, target.from) : filtered
      return { ...prev, transitions: balanced }
    })
    setSelectedTransition(null)
  }, [equalizeOutgoing])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPanning || isResizing) return
      
      // Don't add nodes if clicking on a state node (they have their own click handlers)
      const target = e.target as HTMLElement
      if (target.closest('[data-node-id]')) return

      if (!canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - panOffset.x - rect.width / 2 + CANVAS_WIDTH / 2
      const y = e.clientY - rect.top - panOffset.y - rect.height / 2 + CANVAS_HEIGHT / 2

      const boundedX = Math.max(50, Math.min(CANVAS_WIDTH - 50, x))
      const boundedY = Math.max(50, Math.min(CANVAS_HEIGHT - 50, y))
      addState(boundedX, boundedY)
      setSelectedState(null)
    },
    [addState, isPanning, isResizing, panOffset],
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
      const response = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: saveName.trim(), 
          chain: {
            states: chain.states,
            transitions: chain.transitions,
          }
        }),
      })
      const data = await response.json()
      if (data.success) {
        setSavedDesigns(prev => [...prev, data.data])
          setHasUnsavedChanges(false)
        setSaveDialogOpen(false)
        setSaveName("")
      } else {
        alert("Failed to save design. Please try again.")
      }
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
    },
    [resetSimulation],
  )

  const deleteDesign = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/designs/${id}`, { method: "DELETE" })
      const data = await response.json()
      if (data.success) {
        setSavedDesigns(prev => prev.filter((d) => d.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete design:", error)
      alert("Failed to delete design. Please try again.")
    }
  }, [])

  const newDesign = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Do you want to save before creating a new design?"
      )
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
      simulation: isSimulating ? {
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
          mostVisitedState: Object.entries(simulationMetrics.stateVisits)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || null,
        },
      } : null,
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

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {
      e.preventDefault()
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPanning) {
        e.preventDefault()
        const deltaX = e.clientX - lastPanPoint.x
        const deltaY = e.clientY - lastPanPoint.y
        setPanOffset((prev) => ({
          x: Math.max(-MAX_PAN_X, Math.min(MAX_PAN_X, prev.x + deltaX)),
          y: Math.max(-MAX_PAN_Y, Math.min(MAX_PAN_Y, prev.y + deltaY)),
        }))
        setLastPanPoint({ x: e.clientX, y: e.clientY })
      } else if (draggingStateId) {
        e.preventDefault()
        didDragRef.current = true
        if (!canvasRef.current) return
        const rect = canvasRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left - panOffset.x - rect.width / 2 + CANVAS_WIDTH / 2
        const y = e.clientY - rect.top - panOffset.y - rect.height / 2 + CANVAS_HEIGHT / 2
        const boundedX = Math.max(50, Math.min(CANVAS_WIDTH - 50, x))
        const boundedY = Math.max(50, Math.min(CANVAS_HEIGHT - 50, y))
        setChain((prev) => ({
          ...prev,
          states: prev.states.map((s) => (s.id === draggingStateId ? { ...s, x: boundedX, y: boundedY } : s)),
        }))
      }
    },
    [isPanning, lastPanPoint, draggingStateId, panOffset],
  )

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) {
      setIsPanning(false)
    }
    if (e.button === 0 && draggingStateId) {
      setDraggingStateId(null)
      // Defer reset so any click event following mouseup gets ignored
      setTimeout(() => {
        didDragRef.current = false
      }, 0)
    }
  }, [draggingStateId])

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

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">M</span>
                </div>
                <span className="font-semibold text-lg">MarkovLearn</span>
              </Link>
            </div>
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
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button variant="outline" size="sm" onClick={newDesign}>
                <FilePlus className="mr-2 h-4 w-4" />
                New Design
              </Button>
              <Button variant="outline" size="sm" onClick={saveDesign}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={() => setLibraryOpen(true)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Library
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportClick}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={exportChain}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={exportReport}>
                <FileText className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)]">
        <aside
          className={`border-r border-border bg-card/50 p-6 overflow-y-auto relative transition-all duration-300 ease-in-out ${isResizing ? "select-none" : ""}`}
          style={{ 
            width: isSidebarMinimized ? '0px' : `${sidebarWidth}px`,
            padding: isSidebarMinimized ? '0' : undefined,
            opacity: isSidebarMinimized ? 0 : 1,
          }}
        >
          <div
            className="absolute right-0 top-0 w-1 h-full cursor-col-resize bg-border hover:bg-primary/20 transition-colors"
            onMouseDown={handleSidebarResize}
            style={{ display: isSidebarMinimized ? 'none' : 'block' }}
          />

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Chain Builder</h2>
              <p className="text-sm text-muted-foreground">
                Create your own Markov chain by adding states and transitions
              </p>
            </div>

            <Tabs defaultValue="build" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="build">Build</TabsTrigger>
                <TabsTrigger value="simulate">Simulate</TabsTrigger>
                <TabsTrigger value="analyze">Analyze</TabsTrigger>
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
                            <li>• Middle-click and drag to pan the canvas</li>
                          </ul>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {selectedState && (
                  <Card className="transition-all duration-200 animate-in fade-in-0 slide-in-from-top-2">
                    <CardHeader>
                      <CardTitle className="text-base">State Properties</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="state-name">Name</Label>
                        <Input
                          id="state-name"
                          value={chain.states.find((s) => s.id === selectedState)?.name || ""}
                          onChange={(e) => {
                            setChain((prev) => ({
                              ...prev,
                              states: prev.states.map((s) =>
                                s.id === selectedState ? { ...s, name: e.target.value } : s,
                              ),
                            }))
                          }}
                          className="transition-all duration-150"
                        />
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => deleteState(selectedState)}
                        className="transition-all duration-150 hover:scale-105"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete State
                      </Button>
                    </CardContent>
                  </Card>
                )}

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
                                onChange={(e) =>
                                  updateTransitionProbability(transition.id, Number.parseFloat(e.target.value))
                                }
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
                      <Button 
                        onClick={startSimulation} 
                        disabled={chain.states.length === 0 || isSimulating} 
                        size="sm"
                        className="transition-all duration-150"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start
                      </Button>
                      <Button 
                        onClick={stepSimulation} 
                        disabled={!isSimulating || isAutoRunning} 
                        size="sm"
                        className="transition-all duration-150"
                      >
                        Step
                      </Button>
                      <Button 
                        onClick={toggleAutoRun} 
                        disabled={chain.states.length === 0} 
                        variant={isAutoRunning ? "default" : "secondary"}
                        size="sm"
                        className="transition-all duration-150"
                      >
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
                      <Button 
                        onClick={resetSimulation} 
                        variant="outline" 
                        size="sm"
                        className="transition-all duration-150"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                    </div>

                    {isSimulating && (
                      <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Speed: {simulationSpeed}ms</Label>
                        </div>
                        <Slider
                          value={[simulationSpeed]}
                          onValueChange={(values) => setSimulationSpeed(values[0])}
                          min={50}
                          max={2000}
                          step={50}
                          className="w-full"
                        />
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
                  <Card className="animate-in fade-in-0 slide-in-from-bottom-2">
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
                              const percentage = ((count / (simulationStep + 1)) * 100).toFixed(1)
                              return (
                                <div key={stateId} className="flex items-center gap-2">
                                  <span className="text-sm font-medium w-12">{state?.name}</span>
                                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary transition-all duration-300"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-16 text-right">
                                    {count} ({percentage}%)
                                  </span>
                                </div>
                              )
                            })}
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs text-muted-foreground">Recent Path</Label>
                          <Select
                            value={pathHistoryLimit.toString()}
                            onValueChange={(value) => setPathHistoryLimit(value === "all" ? "all" : Number.parseInt(value))}
                          >
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
                          {(pathHistoryLimit === "all"
                            ? simulationMetrics.pathHistory
                            : simulationMetrics.pathHistory.slice(-pathHistoryLimit)
                          ).map((stateId, idx, arr) => {
                            const state = chain.states.find((s) => s.id === stateId)
                            return (
                              <span key={idx} className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {state?.name}
                                </Badge>
                                {idx < arr.length - 1 && (
                                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                )}
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
                                  // Color intensity based on probability
                                  const intensity = prob > 0 ? Math.max(0.15, prob) : 0
                                  const bgColor = prob > 0 
                                    ? `rgba(5, 150, 105, ${intensity})`
                                    : 'transparent'
                                  return (
                                    <td 
                                      key={j} 
                                      className="border border-border p-2 text-center font-medium transition-all duration-200 hover:scale-105"
                                      style={{ backgroundColor: bgColor }}
                                    >
                                      {prob > 0 ? prob.toFixed(2) : '—'}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(5, 150, 105, 0.2)' }} />
                            <span>Low</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(5, 150, 105, 0.6)' }} />
                            <span>Medium</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(5, 150, 105, 1)' }} />
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
                          const totalProb = chain.transitions
                            .filter((t) => t.from === state.id)
                            .reduce((sum, t) => sum + t.probability, 0)
                          const isValid = Math.abs(totalProb - 1.0) < 0.01 || outgoing === 0
                          return (
                            <div key={state.id} className="flex items-center justify-between text-sm">
                              <span className="font-medium">{state.name}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant={isValid ? "secondary" : "destructive"} className="text-xs">
                                  {outgoing} ({totalProb.toFixed(2)})
                                </Badge>
                                {!isValid && (
                                  <span className="text-xs text-destructive">⚠ Invalid</span>
                                )}
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
                                    <div
                                      className="h-full bg-primary transition-all duration-300"
                                      style={{ width: `${transition.probability * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-muted-foreground w-12 text-right">
                                    {(transition.probability * 100).toFixed(0)}%
                                  </span>
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
          </div>
        </aside>

        {/* Minimize/Maximize Toggle Button */}
        <button
          onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
          className="absolute left-0 top-20 z-50 bg-card border border-border rounded-r-lg p-2 hover:bg-muted transition-all duration-200 shadow-md"
          style={{
            transform: isSidebarMinimized ? 'translateX(0)' : `translateX(${sidebarWidth}px)`,
            transition: 'transform 0.3s ease-in-out',
          }}
          title={isSidebarMinimized ? 'Show sidebar' : 'Hide sidebar'}
        >
          {isSidebarMinimized ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        <main className="flex-1 relative">
          <div
            ref={canvasRef}
            className={`w-full h-full bg-muted/10 relative overflow-hidden select-none ${
              isPanning ? "cursor-grabbing" : draggingStateId ? "cursor-move" : "cursor-crosshair"
            }`}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: -CANVAS_WIDTH / 2,
                marginTop: -CANVAS_HEIGHT / 2,
              }}
            >
              <div className="absolute inset-0 border-2 border-dashed border-border/30 rounded-lg" />

              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                    linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                  `,
                  backgroundSize: "20px 20px",
                }}
              />

              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {chain.transitions.map((transition) => {
                  const fromState = chain.states.find((s) => s.id === transition.from)
                  const toState = chain.states.find((s) => s.id === transition.to)
                  if (!fromState || !toState) return null

                  const isSelfLoop = fromState.id === toState.id

                  if (isSelfLoop) {
                    // Choose a loop orientation (top/right/bottom/left) to reduce overlap
                    const radius = 32
                    const loopRadius = 28
                    const s = fromState
                    const margin = 80

                    // Count connections by quadrant to pick a less busy side
                    const counts = { top: 0, right: 0, bottom: 0, left: 0 }
                    for (const t of chain.transitions) {
                      if (t.id === transition.id) continue
                      if (t.from !== s.id && t.to !== s.id) continue
                      const otherId = t.from === s.id ? t.to : t.from
                      const other = chain.states.find((st) => st.id === otherId)
                      if (!other) continue
                      const dx = other.x - s.x
                      const dy = other.y - s.y
                      if (Math.abs(dy) > Math.abs(dx)) {
                        if (dy < 0) counts.top++
                        else counts.bottom++
                      } else {
                        if (dx > 0) counts.right++
                        else counts.left++
                      }
                    }

                    // Preferred orientation based on position (push outward)
                    let preferred: 'top' | 'right' | 'bottom' | 'left' = 'top'
                    const centerX = CANVAS_WIDTH / 2
                    const centerY = CANVAS_HEIGHT / 2
                    const dxC = s.x - centerX
                    const dyC = s.y - centerY
                    if (Math.abs(dyC) > Math.abs(dxC)) preferred = dyC > 0 ? 'bottom' : 'top'
                    else preferred = dxC > 0 ? 'right' : 'left'

                    // Avoid edges
                    const avoid = new Set<string>()
                    if (s.y < margin) avoid.add('top')
                    if (s.y > CANVAS_HEIGHT - margin) avoid.add('bottom')
                    if (s.x < margin) avoid.add('left')
                    if (s.x > CANVAS_WIDTH - margin) avoid.add('right')

                    const orientations: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left']
                    // Start from preferred, then choose least busy not avoided
                    const ordered = [preferred, ...orientations.filter((o) => o !== preferred)]
                    let orientation = ordered
                      .filter((o) => !avoid.has(o))
                      .sort((a, b) => counts[a] - counts[b])[0]
                    if (!orientation) orientation = preferred

                    let pathData = ''
                    let labelX = s.x
                    let labelY = s.y
                    if (orientation === 'top') {
                      const cx = s.x
                      const cy = s.y - radius - loopRadius
                      const startX = s.x - radius * 0.7
                      const startY = s.y - radius * 0.7
                      const endX = s.x + radius * 0.7
                      const endY = s.y - radius * 0.7
                      pathData = `M ${startX} ${startY} Q ${cx - loopRadius} ${cy} ${cx} ${cy} Q ${cx + loopRadius} ${cy} ${endX} ${endY}`
                      labelX = cx
                      labelY = cy - 8
                    } else if (orientation === 'bottom') {
                      const cx = s.x
                      const cy = s.y + radius + loopRadius
                      const startX = s.x + radius * 0.7
                      const startY = s.y + radius * 0.7
                      const endX = s.x - radius * 0.7
                      const endY = s.y + radius * 0.7
                      pathData = `M ${startX} ${startY} Q ${cx + loopRadius} ${cy} ${cx} ${cy} Q ${cx - loopRadius} ${cy} ${endX} ${endY}`
                      labelX = cx
                      labelY = cy + 12
                    } else if (orientation === 'right') {
                      const cx = s.x + radius + loopRadius
                      const cy = s.y
                      const startX = s.x + radius * 0.7
                      const startY = s.y - radius * 0.7
                      const endX = s.x + radius * 0.7
                      const endY = s.y + radius * 0.7
                      pathData = `M ${startX} ${startY} Q ${cx} ${cy - loopRadius} ${cx} ${cy} Q ${cx} ${cy + loopRadius} ${endX} ${endY}`
                      labelX = cx + 10
                      labelY = cy
                    } else if (orientation === 'left') {
                      const cx = s.x - radius - loopRadius
                      const cy = s.y
                      const startX = s.x - radius * 0.7
                      const startY = s.y + radius * 0.7
                      const endX = s.x - radius * 0.7
                      const endY = s.y - radius * 0.7
                      pathData = `M ${startX} ${startY} Q ${cx} ${cy + loopRadius} ${cx} ${cy} Q ${cx} ${cy - loopRadius} ${endX} ${endY}`
                      labelX = cx - 10
                      labelY = cy
                    }

                    return (
                      <g key={transition.id}>
                        <path d={pathData} stroke="white" strokeWidth="5" fill="none" opacity="0.92" />
                        <path d={pathData} stroke="#059669" strokeWidth="2.25" fill="none" markerEnd="url(#arrowhead)" />
                        <text x={labelX} y={labelY} textAnchor="middle" className="text-xs fill-foreground font-medium select-none">
                          {transition.probability.toFixed(2)}
                        </text>
                      </g>
                    )
                  }

                  // Determine if there is a reverse transition so we can draw distinct curved paths
                  const reverseTransition = chain.transitions.find(
                    (t) => t.from === transition.to && t.to === transition.from,
                  )
                  const isBidirectional = !!reverseTransition

                  const radius = 32
                  const dx = toState.x - fromState.x
                  const dy = toState.y - fromState.y
                  const distance = Math.sqrt(dx * dx + dy * dy)

                  const fromX = fromState.x + (dx / distance) * radius
                  const fromY = fromState.y + (dy / distance) * radius
                  const toX = toState.x - (dx / distance) * radius
                  const toY = toState.y - (dy / distance) * radius

                  if (isBidirectional) {
                    // Compute a canonical orientation for the pair to derive a stable perpendicular.
                    const canonicalFrom = fromState.id < toState.id ? fromState : toState
                    const canonicalTo = canonicalFrom.id === fromState.id ? toState : fromState
                    const baseDx = canonicalTo.x - canonicalFrom.x
                    const baseDy = canonicalTo.y - canonicalFrom.y
                    const baseDist = Math.sqrt(baseDx * baseDx + baseDy * baseDy) || 1
                    const perpXUnit = -baseDy / baseDist
                    const perpYUnit = baseDx / baseDist

                    // Current direction sign relative to canonical orientation
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

                    const labelX = controlX + perpXUnit * 10 * sign
                    const labelY = controlY + perpYUnit * 10 * sign - 4

                    return (
                      <g key={transition.id}>
                        <path d={pathData} stroke="white" strokeWidth="5" fill="none" opacity="0.92" />
                        <path
                          d={pathData}
                          stroke="#059669"
                          strokeWidth="2.25"
                          fill="none"
                          markerEnd="url(#arrowhead)"
                        />
                        <text x={labelX} y={labelY} textAnchor="middle" className="text-xs fill-foreground font-medium select-none">
                          {transition.probability.toFixed(2)}
                        </text>
                      </g>
                    )
                  } else {
                    return (
                      <g key={transition.id}>
                        <line x1={fromX} y1={fromY} x2={toX} y2={toY} stroke="white" strokeWidth="4" opacity="0.8" />
                        <line
                          x1={fromX}
                          y1={fromY}
                          x2={toX}
                          y2={toY}
                          stroke="#059669"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                          opacity="1"
                        />
                        <text
                          x={(fromX + toX) / 2}
                          y={(fromY + toY) / 2 - 10}
                          textAnchor="middle"
                          className="text-xs fill-foreground font-medium"
                        >
                          {transition.probability.toFixed(2)}
                        </text>
                      </g>
                    )
                  }
                })}

                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#059669" />
                  </marker>
                </defs>
              </svg>

              {chain.states.map((state) => (
                <Popover.Root key={state.id}>
                  <Popover.Trigger asChild>
                    <div
                      data-node-id={state.id}
                      className={`
                        absolute w-16 h-16 rounded-full border-2 flex items-center justify-center
                        text-sm font-medium cursor-pointer transition-all transform -translate-x-8 -translate-y-8 select-none
                        ${selectedState === state.id ? "ring-2 ring-primary ring-offset-2" : ""}
                        ${currentState === state.id ? "ring-2 ring-accent ring-offset-2 scale-110" : ""}
                      `}
                      style={{
                        left: state.x,
                        top: state.y,
                        backgroundColor: state.color + "20",
                        borderColor: state.color,
                        color: state.color,
                      }}
                      onMouseDown={(e) => {
                        if (e.button !== 0) return
                        e.stopPropagation()
                        e.preventDefault()
                        didDragRef.current = false
                        setDraggingStateId(state.id)
                        setLastPanPoint({ x: e.clientX, y: e.clientY })
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
                  <Popover.Content side="top" sideOffset={10} className="z-50 rounded-lg border bg-card p-3 shadow-md">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{state.name}</span>
                        <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); deleteState(state.id) }}>
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </div>
                      <div className="space-y-2">
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
              ))}

              {chain.states.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Card className="p-6 text-center">
                    <CardContent>
                      <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Start Building Your Chain</h3>
                      <p className="text-muted-foreground">Click anywhere on the canvas to add your first state</p>
                      <p className="text-muted-foreground text-xs mt-2">Middle-click and drag to pan the canvas</p>
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
                          <Button
                            size="sm"
                            onClick={() => loadDesign(design)}
                            className="transition-all duration-150"
                          >
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
