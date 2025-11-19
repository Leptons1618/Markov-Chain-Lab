/**
 * Smart equation wrapper for LaTeX equations
 * Splits long equations at operators and indents continuation lines properly
 */

export interface WrappedEquation {
  lines: string[]
  original: string
}

/**
 * Smart wrap LaTeX equation by splitting at operators
 * Prioritizes splitting at: =, +, -, \pm, \mp, \times, \cdot, \div, \sum, \prod, \int
 */
export function smartWrapEquation(latex: string, maxWidth: number = 80): WrappedEquation {
  // If equation is short enough, return as-is
  if (latex.length <= maxWidth) {
    return { lines: [latex], original: latex }
  }

  // Operators to split on (in order of preference, longer ones first to avoid partial matches)
  const operators = [
    '\\pm',        // Plus-minus
    '\\mp',        // Minus-plus
    '\\times',     // Times
    '\\cdot',      // Dot
    '\\div',       // Division
    '\\sum',       // Sum
    '\\prod',      // Product
    '\\int',       // Integral
    '\\leq',       // Less than or equal
    '\\geq',       // Greater than or equal
    '\\neq',       // Not equal
    '\\approx',    // Approximately
    '\\equiv',     // Equivalent
    '=',           // Equals
    '+',           // Plus
    '-',           // Minus (but check it's not part of a number or command)
  ]

  const lines: string[] = []
  let remaining = latex.trim()
  let indentLevel = 0
  const indentSize = 2 // spaces per indent level

  while (remaining.length > maxWidth) {
    // Try to find a good split point
    let bestSplit = -1
    let bestOperator = ''
    let bestIndex = -1

    // Look for operators from right to left (prefer splitting near the end)
    const searchStart = Math.max(0, remaining.length - maxWidth)
    const searchEnd = remaining.length
    
    for (let i = searchEnd - 1; i >= searchStart; i--) {
      for (const op of operators) {
        // Check if operator appears at this position
        if (remaining.substring(i).startsWith(op)) {
          // Make sure it's not part of a longer command
          const before = i > 0 ? remaining[i - 1] : ''
          const after = remaining[i + op.length]
          
          // Check if it's a standalone operator
          // For backslash commands, make sure we're at the start
          if (op.startsWith('\\')) {
            // Must be at start of string or after space/operator
            if (i === 0 || /[\s=+\-*/\{\}\(\)\[\],;]/.test(before)) {
              // Check after is space, operator, or end
              if (!after || /[\s=+\-*/\{\}\(\)\[\],;]/.test(after)) {
                if (i > bestIndex) {
                  bestIndex = i
                  bestOperator = op
                  bestSplit = i + op.length
                }
                break
              }
            }
          } else {
            // For single char operators (=, +, -), check context
            if (op === '-') {
              // Don't split if it's part of a number (e.g., -5, 3-5)
              const beforeChar = i > 0 ? remaining[i - 1] : ''
              const afterChar = remaining[i + 1]
              if (/[0-9]/.test(beforeChar) && /[0-9]/.test(afterChar)) {
                continue // Skip, it's part of a number
              }
            }
            
            // Check if it's a standalone operator
            if (!before || /[\s=+\-*/\{\}\(\)\[\],;]/.test(before)) {
              if (!after || /[\s=+\-*/\{\}\(\)\[\],;]/.test(after)) {
                if (i > bestIndex) {
                  bestIndex = i
                  bestOperator = op
                  bestSplit = i + op.length
                }
                break
              }
            }
          }
        }
      }
    }

    // If no operator found, try splitting at spaces or commas
    if (bestSplit === -1) {
      for (let i = searchEnd - 1; i >= searchStart; i--) {
        if (/[\s,]/.test(remaining[i])) {
          bestSplit = i + 1
          break
        }
      }
    }

    // If still no split found, try splitting at any safe character
    if (bestSplit === -1) {
      for (let i = searchEnd - 1; i >= searchStart; i--) {
        // Don't split in the middle of LaTeX commands
        if (remaining[i] === '}' || remaining[i] === ')') {
          bestSplit = i + 1
          break
        }
      }
    }

    // If still no split found, force split at maxWidth (but try to avoid breaking commands)
    if (bestSplit === -1) {
      // Try to find a safe spot near maxWidth
      for (let i = maxWidth; i >= maxWidth - 10 && i >= 0; i--) {
        if (/[\s,}]/.test(remaining[i])) {
          bestSplit = i + 1
          break
        }
      }
      if (bestSplit === -1) {
        bestSplit = maxWidth
      }
    }

    // Extract the line
    const line = remaining.substring(0, bestSplit).trim()
    if (line) {
      // Add proper indentation for continuation lines
      const indent = ' '.repeat(indentLevel * indentSize)
      lines.push(indent + line)
      
      // Increase indent for next line if we split at certain operators
      if (bestOperator && ['=', '\\sum', '\\prod', '\\int'].includes(bestOperator)) {
        indentLevel++
      }
    }

    // Remove processed part
    remaining = remaining.substring(bestSplit).trim()
    
    // If we split at an operator, include it at the start of next line with proper spacing
    if (bestOperator && remaining && !remaining.startsWith(bestOperator)) {
      // Add space after operator for readability
      remaining = bestOperator + ' ' + remaining.trim()
    }
  }

  // Add remaining part
  if (remaining) {
    const indent = ' '.repeat(indentLevel * indentSize)
    lines.push(indent + remaining)
  }

  return { lines, original: latex }
}

/**
 * Wrap equation for display in pre/code blocks
 */
export function formatWrappedEquation(wrapped: WrappedEquation): string {
  return wrapped.lines.join('\n')
}
