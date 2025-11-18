/**
 * Text Generation Utilities
 * Generate sequences from Markov chains
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

export interface TextGenerationOptions {
  length: number
  startStateId?: string
  mode: "probabilistic" | "deterministic"
  seed?: number
}

/**
 * Simple PRNG for reproducible generation
 */
class SimpleRNG {
  private seed: number

  constructor(seed: number = Date.now()) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }
}

/**
 * Sample a transition probabilistically
 */
function sampleTransition(
  transitions: Transition[],
  rng: SimpleRNG
): Transition | null {
  if (transitions.length === 0) return null

  const random = rng.next()
  let cumulative = 0

  for (const transition of transitions) {
    cumulative += transition.probability
    if (random <= cumulative) {
      return transition
    }
  }

  // Fallback to last transition (handles floating point errors)
  return transitions[transitions.length - 1]
}

/**
 * Sample a transition deterministically (for DFA mode)
 * Returns first matching transition or null
 */
function getDeterministicTransition(
  transitions: Transition[],
  label: string
): Transition | null {
  return transitions.find((t) => t.label === label) || null
}

/**
 * Generate a sequence of states from a Markov chain
 */
export function generateText(
  chain: MarkovChain,
  options: TextGenerationOptions
): {
  sequence: string[]
  path: Array<{ stateId: string; stateName: string; step: number }>
  success: boolean
  error?: string
} {
  const { length, startStateId, mode, seed } = options
  const rng = new SimpleRNG(seed)

  if (chain.states.length === 0) {
    return {
      sequence: [],
      path: [],
      success: false,
      error: "No states in chain",
    }
  }

  // Find starting state
  let currentStateId: string | null = null

  if (startStateId) {
    const state = chain.states.find((s) => s.id === startStateId)
    if (!state) {
      return {
        sequence: [],
        path: [],
        success: false,
        error: `Start state ${startStateId} not found`,
      }
    }
    currentStateId = startStateId
  } else {
    // Find initial state
    const initialStates = chain.states.filter((s) => s.isInitial)
    if (initialStates.length === 0) {
      // Use first state as default
      currentStateId = chain.states[0].id
    } else if (initialStates.length === 1) {
      currentStateId = initialStates[0].id
    } else {
      // Multiple initial states - pick randomly
      const randomIndex = Math.floor(rng.next() * initialStates.length)
      currentStateId = initialStates[randomIndex].id
    }
  }

  const sequence: string[] = []
  const path: Array<{ stateId: string; stateName: string; step: number }> = []

  // Add initial state
  const initialState = chain.states.find((s) => s.id === currentStateId)!
  sequence.push(initialState.name)
  path.push({
    stateId: currentStateId!,
    stateName: initialState.name,
    step: 0,
  })

  // Generate sequence
  for (let step = 1; step < length; step++) {
    if (!currentStateId) break

    // Get outgoing transitions from current state
    const outgoingTransitions = chain.transitions.filter(
      (t) => t.from === currentStateId
    )

    if (outgoingTransitions.length === 0) {
      // No outgoing transitions - stop generation
      break
    }

    let nextTransition: Transition | null = null

    if (mode === "deterministic") {
      // For deterministic mode, we need labels
      // Since we don't have input string, we'll use probabilistic sampling
      // but this is not true deterministic generation
      // In practice, deterministic generation requires input string
      nextTransition = sampleTransition(outgoingTransitions, rng)
    } else {
      // Probabilistic mode
      nextTransition = sampleTransition(outgoingTransitions, rng)
    }

    if (!nextTransition) {
      break
    }

    // Move to next state
    currentStateId = nextTransition.to
    const nextState = chain.states.find((s) => s.id === currentStateId)

    if (!nextState) {
      break
    }

    sequence.push(nextState.name)
    path.push({
      stateId: currentStateId,
      stateName: nextState.name,
      step,
    })
  }

  return {
    sequence,
    path,
    success: true,
  }
}

/**
 * Generate text as a string (concatenated state names)
 */
export function generateTextString(
  chain: MarkovChain,
  options: TextGenerationOptions
): {
  text: string
  sequence: string[]
  success: boolean
  error?: string
} {
  const result = generateText(chain, options)

  return {
    text: result.sequence.join(" "),
    sequence: result.sequence,
    success: result.success,
    error: result.error,
  }
}
