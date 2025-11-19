/**
 * Grammar Parser
 * Parse grammar notation strings into Grammar objects
 */

import type { Grammar, ProductionRule } from "./grammar"

export interface ParseError {
  line: number
  column: number
  message: string
}

export interface ParseResult {
  grammar: Grammar | null
  errors: ParseError[]
}

/**
 * Parse grammar from text notation
 * Format: S → aA | bB
 *         A → aA | ε
 */
export function parseGrammar(text: string): ParseResult {
  const errors: ParseError[] = []
  const lines = text.split("\n").map((line, idx) => ({ line: line.trim(), number: idx + 1 }))
  
  const variables = new Set<string>()
  const terminals = new Set<string>()
  const productions: ProductionRule[] = []
  let startVariable: string | null = null

  // Track which variables have productions
  const productionMap = new Map<string, string[][]>()

  for (const { line, number } of lines) {
    if (!line || line.startsWith("#") || line.startsWith("//")) {
      continue // Skip empty lines and comments
    }

    // Parse production rule: Variable → Alternative1 | Alternative2
    const arrowMatch = line.match(/^(\w+)\s*→\s*(.+)$/)
    if (!arrowMatch) {
      errors.push({
        line: number,
        column: 0,
        message: `Invalid production rule format. Expected: Variable → alternatives`,
      })
      continue
    }

    const variable = arrowMatch[1].trim()
    const alternativesStr = arrowMatch[2].trim()

    // Validate variable name (should be uppercase or single letter)
    if (!/^[A-Z][A-Z0-9]*$/.test(variable)) {
      errors.push({
        line: number,
        column: 0,
        message: `Invalid variable name "${variable}". Variables should be uppercase letters (e.g., S, A, B)`,
      })
      continue
    }

    variables.add(variable)
    if (!startVariable) {
      startVariable = variable
    }

    // Parse alternatives (separated by |)
    const alternatives: string[][] = []
    const altStrings = alternativesStr.split("|").map(alt => alt.trim())

    for (const altStr of altStrings) {
      if (altStr === "ε" || altStr === "epsilon" || altStr === "") {
        alternatives.push([]) // Epsilon production
        continue
      }

      // Parse symbols in alternative
      const symbols: string[] = []
      let currentSymbol = ""
      
      for (let i = 0; i < altStr.length; i++) {
        const char = altStr[i]
        
        // Check if current character starts a new symbol
        if (/[A-Z]/.test(char)) {
          // Uppercase = variable
          if (currentSymbol) {
            symbols.push(currentSymbol)
            currentSymbol = ""
          }
          currentSymbol = char
          
          // Check for multi-character variable (e.g., S1, A2)
          let j = i + 1
          while (j < altStr.length && /[A-Z0-9]/.test(altStr[j])) {
            currentSymbol += altStr[j]
            j++
          }
          i = j - 1
          symbols.push(currentSymbol)
          variables.add(currentSymbol)
          currentSymbol = ""
        } else if (/[a-z0-9]/.test(char) || /[^A-Za-z0-9\s]/.test(char)) {
          // Lowercase, digit, or special character = terminal
          if (currentSymbol && /[A-Z]/.test(currentSymbol[0])) {
            // Previous was variable, push it
            symbols.push(currentSymbol)
            currentSymbol = ""
          }
          currentSymbol += char
          terminals.add(char)
        } else if (/\s/.test(char)) {
          // Whitespace - end current symbol if exists
          if (currentSymbol) {
            symbols.push(currentSymbol)
            currentSymbol = ""
          }
        }
      }

      // Push remaining symbol
      if (currentSymbol) {
        if (/[A-Z]/.test(currentSymbol[0])) {
          variables.add(currentSymbol)
        } else {
          for (const char of currentSymbol) {
            terminals.add(char)
          }
        }
        symbols.push(currentSymbol)
      }

      alternatives.push(symbols)
    }

    // Store production
    if (!productionMap.has(variable)) {
      productionMap.set(variable, [])
    }
    productionMap.get(variable)!.push(...alternatives)
  }

  // Convert production map to array
  for (const [variable, alternatives] of productionMap.entries()) {
    productions.push({
      variable,
      alternatives,
    })
  }

  // Sort productions (start variable first)
  productions.sort((a, b) => {
    if (a.variable === startVariable) return -1
    if (b.variable === startVariable) return 1
    return a.variable.localeCompare(b.variable)
  })

  if (errors.length > 0) {
    return {
      grammar: null,
      errors,
    }
  }

  const grammar: Grammar = {
    variables: Array.from(variables),
    terminals: Array.from(terminals),
    startVariable: startVariable || "S",
    productions,
  }

  return {
    grammar,
    errors: [],
  }
}

/**
 * Convert grammar to chain (automaton)
 * For regular grammars, creates DFA/NFA
 */
export function grammarToChain(
  grammar: Grammar,
  targetType: "dfa" | "nfa" = "dfa"
): {
  chain: {
    states: Array<{ id: string; name: string; x: number; y: number; color: string; isInitial?: boolean; isFinal?: boolean }>
    transitions: Array<{ id: string; from: string; to: string; probability: number; label?: string }>
  }
  errors: string[]
} {
  const errors: string[] = []
  
  // Early detection: Check if grammar is context-free (CFG) rather than regular
  // A grammar is regular if every production has at most one variable, and it's at the end
  let isCFG = false
  const cfgProductions: string[] = []
  
  for (const production of grammar.productions) {
    for (const alternative of production.alternatives) {
      if (alternative.length === 0) continue // Skip epsilon
      
      const variables = alternative.filter(s => grammar.variables.includes(s))
      const variableCount = variables.length
      
      // Check if variables appear in the middle (not just at the end)
      if (variableCount > 1) {
        isCFG = true
        cfgProductions.push(`${production.variable} → ${alternative.join("")}`)
      } else if (variableCount === 1) {
        // Check if variable is not at the end
        const lastSymbol = alternative[alternative.length - 1]
        if (!grammar.variables.includes(lastSymbol)) {
          isCFG = true
          cfgProductions.push(`${production.variable} → ${alternative.join("")}`)
        }
      }
    }
  }
  
  if (isCFG) {
    return {
      chain: { states: [], transitions: [] },
      errors: [
        `This grammar is context-free (CFG), not regular. Regular grammars can only be converted to finite automata (DFA/NFA).`,
        `CFG productions found: ${cfgProductions.slice(0, 3).join(", ")}${cfgProductions.length > 3 ? "..." : ""}`,
        `To convert a CFG, you would need a Pushdown Automaton (PDA), which is not currently supported.`,
        `Please use a regular grammar where each production has the form: Variable → terminal(s) + optional Variable (at end)`
      ]
    }
  }
  
  const states: Array<{ id: string; name: string; x: number; y: number; color: string; isInitial?: boolean; isFinal?: boolean }> = []
  const transitions: Array<{ id: string; from: string; to: string; probability: number; label?: string }> = []

  // Color palette for states
  const colors = [
    "#059669", "#10b981", "#d97706", "#be123c", "#ec4899",
    "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4", "#84cc16",
  ]

  // Map variables to state IDs
  const variableToStateId = new Map<string, string>()
  const stateIdToVariable = new Map<string, string>()
  let stateCounter = 0

  // Canvas dimensions (default desktop size - will be adjusted by parent)
  const CANVAS_WIDTH = 2000
  const CANVAS_HEIGHT = 1500
  const NODE_RADIUS = 30
  const MIN_DISTANCE = 150 // Minimum distance between nodes
  
  // Start from center
  const centerX = CANVAS_WIDTH / 2
  const centerY = CANVAS_HEIGHT / 2
  
  // Layout nodes in a circle or grid pattern to avoid overlap
  const nodeCount = grammar.variables.length
  const nonInitialCount = nodeCount - 1 // Exclude initial state from circle
  const angleStep = nonInitialCount > 0 ? (2 * Math.PI) / nonInitialCount : 0
  const radius = Math.min(300, Math.max(200, nonInitialCount * 40)) // Adaptive radius
  
  // Create states from variables
  let nonInitialIndex = 0
  for (let i = 0; i < grammar.variables.length; i++) {
    const variable = grammar.variables[i]
    const stateId = `state-${stateCounter++}`
    variableToStateId.set(variable, stateId)
    stateIdToVariable.set(stateId, variable)

    const isInitial = variable === grammar.startVariable
    const isFinal = grammar.productions.some(p => 
      p.variable === variable && 
      p.alternatives.some(alt => alt.length === 0) // Has epsilon production
    )

    // Layout: initial state at center, others in circle
    let x: number, y: number
    if (isInitial) {
      // Place initial state at center
      x = centerX
      y = centerY
    } else {
      // Place other states in a circle around center
      // Skip the initial state in the circle calculation
      const angle = nonInitialIndex * angleStep
      x = centerX + Math.cos(angle) * radius
      y = centerY + Math.sin(angle) * radius
      
      // Ensure nodes stay within canvas bounds
      x = Math.max(NODE_RADIUS + 50, Math.min(CANVAS_WIDTH - NODE_RADIUS - 50, x))
      y = Math.max(NODE_RADIUS + 50, Math.min(CANVAS_HEIGHT - NODE_RADIUS - 50, y))
      nonInitialIndex++
    }

    states.push({
      id: stateId,
      name: variable,
      x,
      y,
      color: colors[(stateCounter - 1) % colors.length],
      isInitial,
      isFinal,
    })
  }

  // Create transitions from productions
  let transitionCounter = 0
  for (const production of grammar.productions) {
    const fromStateId = variableToStateId.get(production.variable)
    if (!fromStateId) continue

    for (const alternative of production.alternatives) {
      if (alternative.length === 0) {
        // Epsilon production - mark state as final if not already
        const state = states.find(s => s.id === fromStateId)
        if (state && !state.isFinal) {
          state.isFinal = true
        }
        continue
      }

      // Parse alternative: should be terminal(s) followed by optional variable
      // For regular grammar: terminal + optional variable (at end)
      // For CFG: variable can appear anywhere
      let terminal = ""
      let toVariable: string | null = null
      let variableCount = 0

      for (let i = 0; i < alternative.length; i++) {
        const symbol = alternative[i]
        if (grammar.terminals.includes(symbol)) {
          terminal += symbol
        } else if (grammar.variables.includes(symbol)) {
          variableCount++
          // For regular grammar, variable should be at the end
          // For CFG, we can have multiple variables
          if (!toVariable) {
            toVariable = symbol
          }
        }
      }

      // This check is redundant now (we check early), but keep for safety
      // Regular grammar check: at most one variable, and it must be at the end
      const isRegular = variableCount <= 1 && (
        alternative.length === 0 || 
        variableCount === 0 ||
        grammar.variables.includes(alternative[alternative.length - 1])
      )

      if (!isRegular) {
        // This should have been caught earlier, but add error for safety
        if (variableCount > 1) {
          errors.push(`Production ${production.variable} → ${alternative.join("")} contains multiple variables. Regular grammars can only have one variable per alternative, and it must be at the end.`)
        } else if (variableCount === 1 && !grammar.variables.includes(alternative[alternative.length - 1])) {
          errors.push(`Production ${production.variable} → ${alternative.join("")} has a variable not at the end. In regular grammars, variables must be at the end of alternatives.`)
        }
        continue
      }

      if (!terminal && !toVariable) {
        errors.push(`Invalid alternative in production ${production.variable}: ${alternative.join("")}`)
        continue
      }

      // For regular grammar, we expect: terminal + optional variable
      if (toVariable) {
        const toStateId = variableToStateId.get(toVariable)
        if (!toStateId) {
          errors.push(`Variable ${toVariable} not found in states`)
          continue
        }

        // Use first character of terminal as label (for DFA/NFA)
        const label = terminal.length > 0 ? terminal[0] : undefined

        transitions.push({
          id: `trans-${transitionCounter++}`,
          from: fromStateId,
          to: toStateId,
          probability: 1.0,
          label,
        })
      } else {
        // Terminal only - create transition to final state or mark current as final
        const state = states.find(s => s.id === fromStateId)
        if (state) {
          state.isFinal = true
        }
      }
    }
  }

  return {
    chain: {
      states,
      transitions,
    },
    errors,
  }
}
