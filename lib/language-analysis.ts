/**
 * Language Analysis Utilities
 * Analyze automata to determine recognized languages
 */

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

export interface LanguageProperties {
  isFinite: boolean
  isEmpty: boolean
  isUniversal: boolean
  alphabet: string[]
}

export interface LanguageAnalysis {
  languageType: "regular" | "context-free" | "unknown"
  regularExpression?: string
  acceptedExamples: string[]
  rejectedExamples: string[]
  properties: LanguageProperties
  description?: string
}

/**
 * Check if automaton is a DFA/NFA (has labeled transitions)
 */
function isFiniteAutomaton(chain: MarkovChain): boolean {
  return chain.transitions.some(
    (t) => t.label !== undefined && t.label !== null && t.label !== ""
  )
}

/**
 * Get alphabet from transitions
 */
function getAlphabet(chain: MarkovChain): string[] {
  const alphabet = new Set<string>()
  chain.transitions.forEach((t) => {
    if (t.label && t.label.length === 1) {
      alphabet.add(t.label)
    }
  })
  return Array.from(alphabet).sort()
}

/**
 * Check if language is empty (no accepting paths)
 */
function isEmptyLanguage(chain: MarkovChain): boolean {
  if (!isFiniteAutomaton(chain)) return false

  const initialStates = chain.states.filter((s) => s.isInitial)
  const finalStates = chain.states.filter((s) => s.isFinal)

  if (initialStates.length === 0 || finalStates.length === 0) {
    return true
  }

  // Check if there's a path from initial to final state
  const visited = new Set<string>()
  const queue: string[] = initialStates.map((s) => s.id)

  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)

    if (finalStates.some((s) => s.id === currentId)) {
      return false // Found path to final state
    }

    // Add reachable states
    chain.transitions
      .filter((t) => t.from === currentId && t.label)
      .forEach((t) => {
        if (!visited.has(t.to)) {
          queue.push(t.to)
        }
      })
  }

  return true // No path found
}

/**
 * Check if language is finite
 */
function isFiniteLanguage(chain: MarkovChain): boolean {
  if (!isFiniteAutomaton(chain)) return false

  // Language is finite if there are no cycles that can reach a final state
  // Simple check: if all paths to final states are acyclic, language is finite
  const finalStates = chain.states.filter((s) => s.isFinal)
  if (finalStates.length === 0) return false

  // Check for cycles that can reach final states
  const visited = new Set<string>()
  const recStack = new Set<string>()

  function hasCycleToFinal(stateId: string): boolean {
    if (recStack.has(stateId)) return true // Cycle detected
    if (visited.has(stateId)) return false

    visited.add(stateId)
    recStack.add(stateId)

    const state = chain.states.find((s) => s.id === stateId)
    if (state?.isFinal) {
      recStack.delete(stateId)
      return false // Reached final, but check if we can cycle back
    }

    const outgoing = chain.transitions.filter(
      (t) => t.from === stateId && t.label
    )

    for (const trans of outgoing) {
      if (hasCycleToFinal(trans.to)) {
        recStack.delete(stateId)
        return true
      }
    }

    recStack.delete(stateId)
    return false
  }

  const initialStates = chain.states.filter((s) => s.isInitial)
  for (const initialState of initialStates) {
    if (hasCycleToFinal(initialState.id)) {
      return false // Found cycle, language is infinite
    }
  }

  return true // No cycles found, language is finite
}

/**
 * Check if language is universal (accepts all strings)
 */
function isUniversalLanguage(chain: MarkovChain): boolean {
  if (!isFiniteAutomaton(chain)) return false

  const alphabet = getAlphabet(chain)
  if (alphabet.length === 0) return false

  const initialStates = chain.states.filter((s) => s.isInitial)
  if (initialStates.length === 0) return false

  // Check if from every state, for every symbol, we can reach a final state
  // This is a simplified check - full universality is complex
  // For now, we'll use a simpler heuristic

  // Check if all states are final and complete (every symbol has transition)
  const allFinal = chain.states.every((s) => s.isFinal)
  if (!allFinal) return false

  // Check completeness: every state has transitions for every symbol
  for (const state of chain.states) {
    const outgoingLabels = new Set(
      chain.transitions
        .filter((t) => t.from === state.id && t.label)
        .map((t) => t.label!)
    )

    if (outgoingLabels.size !== alphabet.length) {
      return false // Not complete
    }
  }

  return true
}

/**
 * Generate example strings (accepted)
 */
function generateAcceptedExamples(
  chain: MarkovChain,
  count: number = 5
): string[] {
  if (!isFiniteAutomaton(chain)) return []

  const examples: string[] = []
  const initialStates = chain.states.filter((s) => s.isInitial)
  const finalStates = chain.states.filter((s) => s.isFinal)

  if (initialStates.length === 0 || finalStates.length === 0) {
    return []
  }

  // Simple BFS to find paths to final states
  const queue: Array<{ stateId: string; path: string[] }> = initialStates.map(
    (s) => ({ stateId: s.id, path: [] })
  )
  const visited = new Set<string>()

  while (queue.length > 0 && examples.length < count) {
    const { stateId, path } = queue.shift()!
    const key = `${stateId}-${path.join("")}`

    if (visited.has(key)) continue
    visited.add(key)

    const state = chain.states.find((s) => s.id === stateId)
    if (state?.isFinal && path.length > 0) {
      examples.push(path.join(""))
      continue
    }

    // Explore transitions
    const outgoing = chain.transitions.filter(
      (t) => t.from === stateId && t.label
    )

    for (const trans of outgoing) {
      if (path.length < 20) {
        // Limit path length
        queue.push({
          stateId: trans.to,
          path: [...path, trans.label!],
        })
      }
    }
  }

  return examples.slice(0, count)
}

/**
 * Generate example strings (rejected)
 */
function generateRejectedExamples(
  chain: MarkovChain,
  count: number = 5
): string[] {
  if (!isFiniteAutomaton(chain)) return []

  const examples: string[] = []
  const alphabet = getAlphabet(chain)
  if (alphabet.length === 0) return []

  // Generate random strings and test them
  // Simple approach: generate strings and check if they're rejected
  const testString = (str: string): boolean => {
    const initialStates = chain.states.filter((s) => s.isInitial)
    if (initialStates.length === 0) return false

    let currentStateId = initialStates[0].id

    for (const char of str) {
      const transition = chain.transitions.find(
        (t) => t.from === currentStateId && t.label === char
      )

      if (!transition) {
        return false // Rejected (no transition)
      }

      currentStateId = transition.to
    }

    const finalState = chain.states.find((s) => s.id === currentStateId)
    return finalState?.isFinal || false
  }

  // Generate random strings
  let attempts = 0
  while (examples.length < count && attempts < 100) {
    attempts++
    const length = Math.floor(Math.random() * 10) + 1
    const str = Array.from({ length }, () => {
      const randomIndex = Math.floor(Math.random() * alphabet.length)
      return alphabet[randomIndex]
    }).join("")

    if (!testString(str) && !examples.includes(str)) {
      examples.push(str)
    }
  }

  return examples
}

/**
 * Attempt to compute regular expression (simplified)
 * This is a complex problem - we'll provide a basic description
 */
function computeRegularExpression(chain: MarkovChain): string | null {
  if (!isFiniteAutomaton(chain)) return null

  // Full regular expression computation is complex
  // For now, return a description based on structure
  const alphabet = getAlphabet(chain)

  if (alphabet.length === 0) return null

  // Simple cases
  if (chain.states.length === 1) {
    const state = chain.states[0]
    if (state.isInitial && state.isFinal) {
      return alphabet.length === 1 ? `${alphabet[0]}*` : `(${alphabet.join("|")})*`
    }
  }

  // For more complex cases, we'd need proper algorithms
  // (e.g., state elimination method, Brzozowski's method)
  return null
}

/**
 * Analyze language recognized by automaton
 */
export function analyzeLanguage(chain: MarkovChain): LanguageAnalysis {
  const isFA = isFiniteAutomaton(chain)

  if (!isFA) {
    return {
      languageType: "unknown",
      acceptedExamples: [],
      rejectedExamples: [],
      properties: {
        isFinite: false,
        isEmpty: false,
        isUniversal: false,
        alphabet: [],
      },
      description: "Not a finite automaton (no transition labels)",
    }
  }

  const alphabet = getAlphabet(chain)
  const isEmpty = isEmptyLanguage(chain)
  const isFinite = isFiniteLanguage(chain)
  const isUniversal = isUniversalLanguage(chain)

  const properties: LanguageProperties = {
    isFinite,
    isEmpty,
    isUniversal,
    alphabet,
  }

  const regularExpression = computeRegularExpression(chain)
  const acceptedExamples = isEmpty ? [] : generateAcceptedExamples(chain, 5)
  const rejectedExamples = isEmpty ? [] : generateRejectedExamples(chain, 5)

  // Determine language type
  // For now, if it's a finite automaton, assume regular
  // (PDA would need stack operations, which we don't have yet)
  const languageType: "regular" | "context-free" | "unknown" = "regular"

  let description: string | undefined
  if (isEmpty) {
    description = "Empty language (no accepting paths)"
  } else if (isUniversal) {
    description = "Universal language (accepts all strings)"
  } else if (isFinite) {
    description = "Finite language (finite set of strings)"
  } else {
    description = "Infinite regular language"
  }

  return {
    languageType,
    regularExpression: regularExpression || undefined,
    acceptedExamples,
    rejectedExamples,
    properties,
    description,
  }
}
