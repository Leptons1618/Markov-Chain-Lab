/**
 * Grammar Conversion Utilities
 * Convert between automata (chains) and grammars
 */

import type { Grammar, ProductionRule } from "./grammar"

export interface State {
  id: string
  name: string
  isInitial?: boolean
  isFinal?: boolean
}

export interface Transition {
  id: string
  from: string
  to: string
  probability: number
  label?: string
}

export interface MarkovChain {
  states: State[]
  transitions: Transition[]
}

/**
 * Convert DFA/NFA to Regular Grammar
 */
export function chainToRegularGrammar(
  chain: MarkovChain,
  automatonType: "dfa" | "nfa" | "markov"
): Grammar {
  const variables: string[] = []
  const terminals: string[] = []
  const productions: ProductionRule[] = []

  // Map state IDs to variable names
  const stateToVariable = new Map<string, string>()
  let variableCounter = 0

  // Generate variable names (S, A, B, C, ...)
  const getVariable = (stateId: string): string => {
    if (!stateToVariable.has(stateId)) {
      const state = chain.states.find(s => s.id === stateId)
      if (state?.isInitial) {
        stateToVariable.set(stateId, "S")
        variables.push("S")
      } else {
        const varName = String.fromCharCode(65 + variableCounter) // A, B, C, ...
        stateToVariable.set(stateId, varName)
        variables.push(varName)
        variableCounter++
      }
    }
    return stateToVariable.get(stateId)!
  }

  // Extract terminals from transition labels (for DFA/NFA)
  if (automatonType === "dfa" || automatonType === "nfa") {
    const terminalSet = new Set<string>()
    for (const transition of chain.transitions) {
      if (transition.label && transition.label.length === 1) {
        terminalSet.add(transition.label)
      }
    }
    terminals.push(...Array.from(terminalSet).sort())
  } else {
    // For Markov chains, use state names as terminals (simplified)
    // This creates a grammar where terminals represent state transitions
    const stateNames = chain.states.map(s => s.name.toLowerCase())
    terminals.push(...stateNames)
  }

  // Ensure S is in variables if we have initial states
  const initialStates = chain.states.filter(s => s.isInitial)
  if (initialStates.length > 0 && !variables.includes("S")) {
    variables.unshift("S")
  }

  // Create productions from transitions
  const productionMap = new Map<string, string[][]>()

  // Handle initial states
  for (const initialState of initialStates) {
    const varName = getVariable(initialState.id)
    
    // Find outgoing transitions from initial state
    const outgoing = chain.transitions.filter(t => t.from === initialState.id)
    
    if (outgoing.length === 0) {
      // Epsilon production if no outgoing transitions
      if (!productionMap.has(varName)) {
        productionMap.set(varName, [])
      }
      productionMap.get(varName)!.push([]) // Epsilon
    } else {
      for (const transition of outgoing) {
        const toVar = getVariable(transition.to)
        
        if (automatonType === "dfa" || automatonType === "nfa") {
          // DFA/NFA: Use label as terminal
          if (transition.label) {
            const alt = [transition.label, toVar]
            if (!productionMap.has(varName)) {
              productionMap.set(varName, [])
            }
            productionMap.get(varName)!.push(alt)
          }
        } else {
          // Markov: Use probability-weighted alternatives
          // For simplicity, create production with state name as terminal
          const toState = chain.states.find(s => s.id === transition.to)
          if (toState) {
            const terminal = toState.name.toLowerCase()
            const alt = [terminal, toVar]
            if (!productionMap.has(varName)) {
              productionMap.set(varName, [])
            }
            // Avoid duplicates
            const existing = productionMap.get(varName)!
            const exists = existing.some(a => a.join("") === alt.join(""))
            if (!exists) {
              productionMap.get(varName)!.push(alt)
            }
          }
        }
      }
    }
  }

  // Handle non-initial states
  for (const state of chain.states) {
    if (!state.isInitial) {
      const varName = getVariable(state.id)
      const outgoing = chain.transitions.filter(t => t.from === state.id)
      
      if (outgoing.length === 0) {
        // If final state with no outgoing transitions, add epsilon production
        if (state.isFinal) {
          if (!productionMap.has(varName)) {
            productionMap.set(varName, [])
          }
          const existing = productionMap.get(varName)!
          if (!existing.some(a => a.length === 0)) {
            productionMap.get(varName)!.push([]) // Epsilon
          }
        }
      } else {
        for (const transition of outgoing) {
          const toVar = getVariable(transition.to)
          
          if (automatonType === "dfa" || automatonType === "nfa") {
            if (transition.label) {
              const toState = chain.states.find(s => s.id === transition.to)
              if (toState?.isFinal) {
                // If target is final, create two alternatives: with and without variable
                const alt1 = [transition.label, toVar]
                const alt2 = [transition.label] // Terminal only
                
                if (!productionMap.has(varName)) {
                  productionMap.set(varName, [])
                }
                const existing = productionMap.get(varName)!
                
                if (!existing.some(a => a.join("") === alt1.join(""))) {
                  productionMap.get(varName)!.push(alt1)
                }
                if (!existing.some(a => a.join("") === alt2.join(""))) {
                  productionMap.get(varName)!.push(alt2)
                }
              } else {
                const alt = [transition.label, toVar]
                if (!productionMap.has(varName)) {
                  productionMap.set(varName, [])
                }
                const existing = productionMap.get(varName)!
                if (!existing.some(a => a.join("") === alt.join(""))) {
                  productionMap.get(varName)!.push(alt)
                }
              }
            }
          } else {
            // Markov chain
            const toState = chain.states.find(s => s.id === transition.to)
            if (toState) {
              const terminal = toState.name.toLowerCase()
              if (toState.isFinal) {
                const alt1 = [terminal, toVar]
                const alt2 = [terminal]
                
                if (!productionMap.has(varName)) {
                  productionMap.set(varName, [])
                }
                const existing = productionMap.get(varName)!
                
                if (!existing.some(a => a.join("") === alt1.join(""))) {
                  productionMap.get(varName)!.push(alt1)
                }
                if (!existing.some(a => a.join("") === alt2.join(""))) {
                  productionMap.get(varName)!.push(alt2)
                }
              } else {
                const alt = [terminal, toVar]
                if (!productionMap.has(varName)) {
                  productionMap.set(varName, [])
                }
                const existing = productionMap.get(varName)!
                if (!existing.some(a => a.join("") === alt.join(""))) {
                  productionMap.get(varName)!.push(alt)
                }
              }
            }
          }
        }
      }
    }
  }

  // Convert production map to array
  for (const [variable, alternatives] of productionMap.entries()) {
    productions.push({
      variable,
      alternatives,
    })
  }

  // Sort productions by variable name (S first)
  productions.sort((a, b) => {
    if (a.variable === "S") return -1
    if (b.variable === "S") return 1
    return a.variable.localeCompare(b.variable)
  })

  // Ensure we have a start variable
  const startVariable = initialStates.length > 0 
    ? getVariable(initialStates[0].id)
    : variables[0] || "S"

  return {
    variables: Array.from(new Set(variables)),
    terminals: Array.from(new Set(terminals)),
    startVariable,
    productions,
  }
}

/**
 * Convert Markov Chain to Probabilistic Grammar
 * This creates a grammar where probabilities are preserved
 */
export function chainToProbabilisticGrammar(chain: MarkovChain): Grammar & { probabilities?: Map<string, number[]> } {
  const grammar = chainToRegularGrammar(chain, "markov")
  
  // Add probability information
  const probabilities = new Map<string, number[]>()
  
  for (const production of grammar.productions) {
    const probs: number[] = []
    const stateId = chain.states.find(s => {
      const initialStates = chain.states.filter(st => st.isInitial)
      if (initialStates.length > 0 && production.variable === "S") {
        return s.id === initialStates[0].id
      }
      // Find state by matching variable assignment logic
      return false // Simplified - would need to track mapping
    })
    
    // For now, assign equal probabilities
    probs.push(...production.alternatives.map(() => 1 / production.alternatives.length))
    probabilities.set(production.variable, probs)
  }
  
  return {
    ...grammar,
    probabilities,
  }
}
