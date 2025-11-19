# Grammar Feature Plan

## Overview

This document outlines the plan for adding Context-Free Grammar (CFG) support to the Tools page, including variables, terminals, production rules, and two-way conversion between grammars and automata.

## Features to Implement

### 1. Grammar Components

#### Variables (Non-terminals)
- Represented as uppercase letters (A, B, C, ...) or custom names
- Can be used in production rules
- Visual representation in the chain builder

#### Terminals
- Represented as lowercase letters (a, b, c, ...) or symbols
- Cannot be expanded further
- Used in production rules

#### Production Rules
- Format: `A → α | β | γ`
- Left side: Variable (non-terminal)
- Right side: Sequence of variables and terminals
- Multiple alternatives separated by `|`

### 2. Grammar Tab/Section

Add a new tab or expand Analyze tab to show:
- **Grammar Display**: Show the grammar in standard notation
- **Language Description**: Describe what language the grammar generates
- **Production Rules**: List all production rules
- **Variables & Terminals**: List all variables and terminals used
- **Parse Tree Visualization**: (Future) Show parse trees for example strings

### 3. Two-Way Conversion

#### Grammar → Chain (Automaton)
- Parse CFG and convert to:
  - Pushdown Automaton (PDA) - for CFG
  - Finite Automaton (DFA/NFA) - for regular grammars
- Automatically create states and transitions
- Handle left-recursive and right-recursive grammars

#### Chain → Grammar
- Generate CFG from existing automaton:
  - For DFA/NFA: Generate regular grammar
  - For Markov chains: Generate probabilistic grammar
- Extract production rules from transitions
- Identify variables and terminals

### 4. UI Components

#### Grammar Editor
- Text-based editor for writing grammars
- Syntax highlighting
- Validation
- Auto-formatting

#### Visual Grammar Builder
- Drag-and-drop interface
- Visual representation of production rules
- Tree view of grammar structure

#### Grammar Examples Library
- Pre-built grammars:
  - Arithmetic expressions
  - Balanced parentheses
  - Simple programming language constructs
  - Natural language patterns

## Implementation Plan

### Phase 1: Basic Grammar Support (Week 1)

1. **Add Grammar Tab**
   - Create new tab in Analyze section
   - Display grammar notation
   - Show variables and terminals

2. **Chain → Grammar Conversion**
   - Implement function to convert DFA/NFA to regular grammar
   - Display production rules
   - Show grammar notation

3. **Basic UI**
   - Grammar display component
   - Variables/terminals list
   - Production rules list

### Phase 2: Grammar Editor (Week 2)

1. **Grammar Editor Component**
   - Text editor with syntax highlighting
   - Grammar validation
   - Error highlighting

2. **Grammar → Chain Conversion**
   - Parse CFG
   - Convert regular grammar to DFA/NFA
   - Handle basic CFG to PDA conversion

3. **Grammar Examples**
   - Add example grammars
   - Load examples into editor

### Phase 3: Advanced Features (Week 3)

1. **Visual Grammar Builder**
   - Drag-and-drop interface
   - Visual production rule editor

2. **Parse Tree Visualization**
   - Generate parse trees
   - Visual tree display

3. **Grammar Analysis**
   - Check for ambiguity
   - Identify grammar type (regular, context-free, etc.)
   - Optimize grammar

## Technical Architecture

### Data Structures

```typescript
interface Grammar {
  variables: string[]  // Non-terminals (e.g., ["S", "A", "B"])
  terminals: string[] // Terminals (e.g., ["a", "b", "(", ")"])
  startVariable: string  // Start symbol (e.g., "S")
  productions: ProductionRule[]
}

interface ProductionRule {
  variable: string  // Left side (non-terminal)
  alternatives: string[][]  // Right side alternatives
  // Example: S → aA | bB becomes:
  // { variable: "S", alternatives: [["a", "A"], ["b", "B"]] }
}
```

### Conversion Functions

```typescript
// Chain → Grammar
function chainToGrammar(chain: MarkovChain, type: "dfa" | "nfa" | "markov"): Grammar

// Grammar → Chain
function grammarToChain(grammar: Grammar, targetType: "dfa" | "nfa" | "pda"): MarkovChain

// Grammar validation
function validateGrammar(grammar: Grammar): { valid: boolean; errors: string[] }

// Grammar analysis
function analyzeGrammar(grammar: Grammar): {
  type: "regular" | "context-free" | "context-sensitive"
  isAmbiguous: boolean
  language: string
}
```

## UI/UX Design

### Grammar Tab Layout

```
┌─────────────────────────────────────┐
│ Grammar                             │
├─────────────────────────────────────┤
│ [Editor Mode] [Visual Mode]        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Grammar Notation                │ │
│ │ S → aA | bB                     │ │
│ │ A → aA | b                      │ │
│ │ B → bB | a                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Variables: S, A, B                  │
│ Terminals: a, b                     │
│                                     │
│ [Convert to Chain] [Load Example]  │
└─────────────────────────────────────┘
```

### Integration Points

1. **Build Tab**: Add "Grammar Mode" toggle
2. **Analyze Tab**: Add "Grammar" section
3. **New Tab**: "Grammar" tab (optional)

## Benefits

1. **Educational Value**: Students can see the relationship between grammars and automata
2. **Flexibility**: Users can define languages using grammar notation
3. **Power**: CFG support enables more complex language recognition
4. **Completeness**: Covers the full spectrum from regular to context-free languages

## Future Enhancements

1. **PDA Builder**: Visual pushdown automaton builder
2. **Turing Machine**: Full Turing machine support
3. **Grammar Optimization**: Minimize grammar, remove useless productions
4. **LL/LR Parsing**: Implement parsing algorithms
5. **Grammar Inference**: Learn grammar from examples

## Files to Create

1. `lib/grammar.ts` - Grammar data structures and utilities
2. `lib/grammar-conversion.ts` - Conversion functions
3. `lib/grammar-analysis.ts` - Grammar analysis functions
4. `components/grammar-editor.tsx` - Grammar editor component
5. `components/grammar-display.tsx` - Grammar display component
6. `app/tools/page.tsx` - Integration

## Testing

1. Test Chain → Grammar conversion with various automata
2. Test Grammar → Chain conversion with various grammars
3. Test grammar validation
4. Test grammar analysis
5. Test UI components on mobile/tablet/desktop
