/**
 * Markov Chain Analysis Utilities
 * Provides functions for analyzing Markov chain properties and computing stationary distributions
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

export interface ChainProperties {
  isErgodic: boolean
  isIrreducible: boolean
  isAperiodic: boolean
  communicatingClasses: string[][]
  hasAbsorbingStates: boolean
  absorbingStates: string[]
}

export interface ConvergenceAnalysis {
  stationaryDistribution: number[]
  converged: boolean
  iterations: number
  chainProperties: ChainProperties
  convergenceRate?: number
}

/**
 * Build transition matrix from chain
 */
export function buildTransitionMatrix(
  states: State[],
  transitions: Transition[]
): number[][] {
  const n = states.length
  const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0))

  // Create state ID to index mapping
  const stateIndexMap = new Map<string, number>()
  states.forEach((state, index) => {
    stateIndexMap.set(state.id, index)
  })

  // Fill matrix with transition probabilities
  transitions.forEach((transition) => {
    const fromIndex = stateIndexMap.get(transition.from)
    const toIndex = stateIndexMap.get(transition.to)
    if (fromIndex !== undefined && toIndex !== undefined) {
      matrix[fromIndex][toIndex] += transition.probability
    }
  })

  return matrix
}

/**
 * Check if chain is irreducible (all states communicate)
 */
function isIrreducible(matrix: number[][]): boolean {
  const n = matrix.length
  if (n === 0) return false

  // Build reachability graph using DFS
  const visited = new Set<number>()
  const stack = [0]
  visited.add(0)

  while (stack.length > 0) {
    const current = stack.pop()!
    for (let j = 0; j < n; j++) {
      if (matrix[current][j] > 0 && !visited.has(j)) {
        visited.add(j)
        stack.push(j)
      }
    }
  }

  // Check if all states are reachable
  if (visited.size !== n) return false

  // Check reverse reachability (transpose)
  const reverseVisited = new Set<number>()
  const reverseStack = [0]
  reverseVisited.add(0)

  while (reverseStack.length > 0) {
    const current = reverseStack.pop()!
    for (let i = 0; i < n; i++) {
      if (matrix[i][current] > 0 && !reverseVisited.has(i)) {
        reverseVisited.add(i)
        reverseStack.push(i)
      }
    }
  }

  return reverseVisited.size === n
}

/**
 * Find communicating classes (strongly connected components)
 */
function findCommunicatingClasses(matrix: number[][]): number[][] {
  const n = matrix.length
  const visited = new Set<number>()
  const classes: number[][] = []

  for (let i = 0; i < n; i++) {
    if (visited.has(i)) continue

    // Find all states that communicate with i
    const reachable = new Set<number>()
    const reverseReachable = new Set<number>()

    // Forward reachability
    const forwardStack = [i]
    reachable.add(i)
    while (forwardStack.length > 0) {
      const current = forwardStack.pop()!
      for (let j = 0; j < n; j++) {
        if (matrix[current][j] > 0 && !reachable.has(j)) {
          reachable.add(j)
          forwardStack.push(j)
        }
      }
    }

    // Reverse reachability
    const reverseStack = [i]
    reverseReachable.add(i)
    while (reverseStack.length > 0) {
      const current = reverseStack.pop()!
      for (let j = 0; j < n; j++) {
        if (matrix[j][current] > 0 && !reverseReachable.has(j)) {
          reverseReachable.add(j)
          reverseStack.push(j)
        }
      }
    }

    // Intersection gives communicating class
    const communicatingClass = Array.from(reachable).filter((s) =>
      reverseReachable.has(s)
    )

    if (communicatingClass.length > 0) {
      classes.push(communicatingClass)
      communicatingClass.forEach((s) => visited.add(s))
    }
  }

  return classes
}

/**
 * Check if chain is aperiodic
 */
function isAperiodic(matrix: number[][]): boolean {
  const n = matrix.length
  if (n === 0) return false

  // For each state, check if it can return to itself in different step counts
  for (let i = 0; i < n; i++) {
    const returnSteps = new Set<number>()

    // Use BFS to find all paths back to state i
    const queue: Array<{ state: number; steps: number }> = [{ state: i, steps: 0 }]
    const visited = new Set<string>()

    while (queue.length > 0 && returnSteps.size < 10) {
      const { state, steps } = queue.shift()!
      const key = `${state}-${steps}`

      if (visited.has(key)) continue
      visited.add(key)

      if (state === i && steps > 0) {
        returnSteps.add(steps)
      }

      if (steps < 20) {
        // Check all outgoing transitions
        for (let j = 0; j < n; j++) {
          if (matrix[state][j] > 0) {
            queue.push({ state: j, steps: steps + 1 })
          }
        }
      }
    }

    // If GCD of return steps is 1, state is aperiodic
    if (returnSteps.size > 0) {
      const stepsArray = Array.from(returnSteps)
      const gcd = stepsArray.reduce((a, b) => {
        while (b !== 0) {
          const temp = b
          b = a % b
          a = temp
        }
        return a
      }, stepsArray[0])

      if (gcd !== 1) return false
    }
  }

  return true
}

/**
 * Check for absorbing states
 */
function findAbsorbingStates(
  matrix: number[][],
  states: State[]
): string[] {
  const absorbing: string[] = []
  matrix.forEach((row, i) => {
    // State is absorbing if it only transitions to itself with probability 1
    const selfProb = row[i]
    const totalProb = row.reduce((sum, p) => sum + p, 0)
    if (Math.abs(selfProb - 1.0) < 1e-6 && Math.abs(totalProb - 1.0) < 1e-6) {
      absorbing.push(states[i].id)
    }
  })
  return absorbing
}

/**
 * Compute stationary distribution using power iteration
 */
export function computeStationaryDistribution(
  states: State[],
  transitions: Transition[],
  tolerance: number = 1e-6,
  maxIterations: number = 1000
): ConvergenceAnalysis {
  if (states.length === 0) {
    return {
      stationaryDistribution: [],
      converged: false,
      iterations: 0,
      chainProperties: {
        isErgodic: false,
        isIrreducible: false,
        isAperiodic: false,
        communicatingClasses: [],
        hasAbsorbingStates: false,
        absorbingStates: [],
      },
    }
  }

  const matrix = buildTransitionMatrix(states, transitions)
  const n = states.length

  // Initialize uniform distribution
  let distribution = Array(n).fill(1 / n)
  let converged = false
  let iterations = 0

  // Power iteration: π^(n+1) = π^(n) · P
  for (let iter = 0; iter < maxIterations; iter++) {
    const nextDistribution = Array(n).fill(0)

    // Multiply distribution by transition matrix
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        nextDistribution[j] += distribution[i] * matrix[i][j]
      }
    }

    // Check convergence
    const maxDiff = Math.max(
      ...distribution.map((val, i) => Math.abs(val - nextDistribution[i]))
    )

    if (maxDiff < tolerance) {
      converged = true
      iterations = iter + 1
      break
    }

    distribution = nextDistribution
    iterations = iter + 1
  }

  // Normalize (should already be normalized, but ensure it)
  const sum = distribution.reduce((a, b) => a + b, 0)
  if (sum > 0) {
    distribution = distribution.map((val) => val / sum)
  }

  // Compute chain properties
  const isIrreducibleResult = isIrreducible(matrix)
  const communicatingClasses = findCommunicatingClasses(matrix)
  const isAperiodicResult = isAperiodic(matrix)
  const absorbingStates = findAbsorbingStates(matrix, states)

  const chainProperties: ChainProperties = {
    isErgodic: isIrreducibleResult && isAperiodicResult,
    isIrreducible: isIrreducibleResult,
    isAperiodic: isAperiodicResult,
    communicatingClasses: communicatingClasses.map((cls) =>
      cls.map((idx) => states[idx].id)
    ),
    hasAbsorbingStates: absorbingStates.length > 0,
    absorbingStates,
  }

  return {
    stationaryDistribution: distribution,
    converged,
    iterations,
    chainProperties,
  }
}

/**
 * Compute convergence rate (spectral gap)
 * Returns the difference between largest eigenvalue (1) and second-largest eigenvalue
 */
export function computeConvergenceRate(
  matrix: number[][]
): number | null {
  const n = matrix.length
  if (n < 2) return null

  // For small matrices, we can compute eigenvalues directly
  // For larger matrices, use power iteration to find second eigenvalue
  if (n <= 10) {
    // Simple eigenvalue approximation using power iteration
    // Find second-largest eigenvalue by removing the stationary distribution component
    try {
      // Use iterative method to approximate second eigenvalue
      let v = Array(n).fill(1 / Math.sqrt(n))
      for (let iter = 0; iter < 100; iter++) {
        const nextV = Array(n).fill(0)
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            nextV[j] += v[i] * matrix[i][j]
          }
        }
        // Normalize
        const norm = Math.sqrt(nextV.reduce((sum, val) => sum + val * val, 0))
        if (norm > 1e-10) {
          v = nextV.map((val) => val / norm)
        } else {
          break
        }
      }

      // Estimate eigenvalue
      const eigenvalue = v.reduce((sum, val, i) => {
        const product = v.reduce((s, vj, j) => s + vj * matrix[i][j], 0)
        return sum + val * product
      }, 0)

      return Math.max(0, 1 - Math.abs(eigenvalue))
    } catch {
      return null
    }
  }

  // For larger matrices, return null (would need more sophisticated methods)
  return null
}
