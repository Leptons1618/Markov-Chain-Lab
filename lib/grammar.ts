/**
 * Grammar Data Structures and Utilities
 * Support for Context-Free Grammars (CFG) and Regular Grammars
 */

export interface Grammar {
  variables: string[]  // Non-terminals (e.g., ["S", "A", "B"])
  terminals: string[] // Terminals (e.g., ["a", "b", "(", ")"])
  startVariable: string  // Start symbol (e.g., "S")
  productions: ProductionRule[]
}

export interface ProductionRule {
  variable: string  // Left side (non-terminal)
  alternatives: string[][]  // Right side alternatives
  // Example: S → aA | bB becomes:
  // { variable: "S", alternatives: [["a", "A"], ["b", "B"]] }
}

export interface GrammarAnalysis {
  type: "regular" | "context-free" | "context-sensitive" | "unknown"
  isAmbiguous: boolean
  language: string
  description?: string
}

/**
 * Validate grammar structure
 */
export function validateGrammar(grammar: Grammar): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check start variable exists
  if (!grammar.variables.includes(grammar.startVariable)) {
    errors.push(`Start variable "${grammar.startVariable}" not found in variables`)
  }

  // Check all production variables exist
  for (const production of grammar.productions) {
    if (!grammar.variables.includes(production.variable)) {
      errors.push(`Production variable "${production.variable}" not found in variables`)
    }

    // Check alternatives
    for (const alt of production.alternatives) {
      for (const symbol of alt) {
        // Symbol must be either a variable or terminal
        if (!grammar.variables.includes(symbol) && !grammar.terminals.includes(symbol)) {
          errors.push(`Symbol "${symbol}" in production "${production.variable}" is neither a variable nor terminal`)
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Format grammar as string notation
 */
export function formatGrammar(grammar: Grammar): string {
  const lines: string[] = []

  for (const production of grammar.productions) {
    const alternatives = production.alternatives
      .map(alt => alt.join(""))
      .join(" | ")
    lines.push(`${production.variable} → ${alternatives}`)
  }

  return lines.join("\n")
}

/**
 * Get all symbols used in grammar
 */
export function getAllSymbols(grammar: Grammar): { variables: Set<string>; terminals: Set<string> } {
  const variables = new Set<string>(grammar.variables)
  const terminals = new Set<string>(grammar.terminals)

  // Extract from productions
  for (const production of grammar.productions) {
    for (const alt of production.alternatives) {
      for (const symbol of alt) {
        if (grammar.variables.includes(symbol)) {
          variables.add(symbol)
        } else if (grammar.terminals.includes(symbol)) {
          terminals.add(symbol)
        }
      }
    }
  }

  return { variables, terminals }
}

/**
 * Check if grammar is regular (right-linear or left-linear)
 */
export function isRegularGrammar(grammar: Grammar): boolean {
  for (const production of grammar.productions) {
    for (const alt of production.alternatives) {
      // Regular grammar: A → aB or A → Ba or A → a
      // At most one variable, at the end (right-linear) or beginning (left-linear)
      let variableCount = 0
      let variablePosition = -1

      for (let i = 0; i < alt.length; i++) {
        if (grammar.variables.includes(alt[i])) {
          variableCount++
          variablePosition = i
        }
      }

      // More than one variable = not regular
      if (variableCount > 1) {
        return false
      }

      // If variable exists, it must be at the end (right-linear) or beginning (left-linear)
      if (variableCount === 1) {
        const isRightLinear = variablePosition === alt.length - 1
        const isLeftLinear = variablePosition === 0
        if (!isRightLinear && !isLeftLinear) {
          return false
        }
      }
    }
  }

  return true
}

/**
 * Analyze grammar properties
 */
export function analyzeGrammar(grammar: Grammar): GrammarAnalysis {
  const validation = validateGrammar(grammar)
  if (!validation.valid) {
    return {
      type: "unknown",
      isAmbiguous: false,
      language: "Invalid grammar",
      description: validation.errors.join("; "),
    }
  }

  const isRegular = isRegularGrammar(grammar)

  // Simple ambiguity check: multiple productions with same left side
  const productionMap = new Map<string, number>()
  for (const production of grammar.productions) {
    productionMap.set(
      production.variable,
      (productionMap.get(production.variable) || 0) + production.alternatives.length
    )
  }

  const isAmbiguous = Array.from(productionMap.values()).some(count => count > 1)

  let language = ""
  if (isRegular) {
    language = "Regular Language"
  } else {
    language = "Context-Free Language"
  }

  return {
    type: isRegular ? "regular" : "context-free",
    isAmbiguous,
    language,
    description: isRegular
      ? "Right-linear or left-linear regular grammar"
      : "Context-free grammar (may require pushdown automaton)",
  }
}
