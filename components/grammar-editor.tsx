"use client"

import React, { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { parseGrammar } from "@/lib/grammar-parser"
import type { Grammar } from "@/lib/grammar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface GrammarEditorProps {
  initialGrammar?: Grammar | null
  onConvertToChain?: (grammar: Grammar) => void
}

const EXAMPLE_GRAMMARS = {
  "even-a": `S → aA | bS
A → aS | bA | ε`,
  "balanced": `S → (S) | SS | ε`,
  "simple": `S → aA | bB
A → aA | a
B → bB | b`,
  "arithmetic": `E → E + T | T
T → T * F | F
F → (E) | id`,
}

export function GrammarEditor({ initialGrammar, onConvertToChain }: GrammarEditorProps) {
  const [text, setText] = useState(() => {
    if (initialGrammar) {
      // Convert grammar to text format
      return initialGrammar.productions
        .map(p => {
          const alts = p.alternatives
            .map(alt => alt.length === 0 ? "ε" : alt.join(""))
            .join(" | ")
          return `${p.variable} → ${alts}`
        })
        .join("\n")
    }
    return ""
  })
  const [parseResult, setParseResult] = useState<{ grammar: Grammar | null; errors: any[] } | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [selectedExample, setSelectedExample] = useState<string>("")
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Parse initial grammar on mount - only if we have initial text
  React.useEffect(() => {
    if (text && !parseResult) {
      const result = parseGrammar(text)
      setParseResult(result)
      // Don't call onGrammarChange here to avoid infinite loop
      // It will be called when user types
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only on mount

  const handleTextChange = useCallback((newText: string) => {
    setText(newText)
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Debounce parsing
    setIsParsing(true)
    timeoutRef.current = setTimeout(() => {
      const result = parseGrammar(newText)
      setParseResult(result)
      setIsParsing(false)
      // Don't call onGrammarChange to avoid infinite loops
      // Grammar is only used when converting to chain
    }, 300)
  }, [])
  
  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleLoadExample = (exampleName: keyof typeof EXAMPLE_GRAMMARS) => {
    const example = EXAMPLE_GRAMMARS[exampleName]
    setText(example)
    setSelectedExample(exampleName)
    handleTextChange(example)
  }

  const handleConvertToChain = () => {
    if (parseResult?.grammar && onConvertToChain) {
      onConvertToChain(parseResult.grammar)
    }
  }

  return (
    <div className="space-y-4">
      {/* Example Grammars */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Example Grammars</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="example-select" className="text-xs text-muted-foreground">Load Example</Label>
            <Select
              value={selectedExample}
              onValueChange={(value) => {
                if (value && value in EXAMPLE_GRAMMARS) {
                  handleLoadExample(value as keyof typeof EXAMPLE_GRAMMARS)
                }
              }}
            >
              <SelectTrigger id="example-select" className="w-full">
                <SelectValue placeholder="Select an example grammar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="even-a">Even a's</SelectItem>
                <SelectItem value="balanced">Balanced Parentheses</SelectItem>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="arithmetic">Arithmetic (CFG - Not Regular)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grammar Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Grammar Editor</CardTitle>
            {parseResult && (
              <div className="flex items-center gap-2">
                {parseResult.grammar ? (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Valid
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Invalid
                  </Badge>
                )}
                {isParsing && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Enter grammar in standard notation. Format: Variable → alternative1 | alternative2
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grammar-text">Grammar Notation</Label>
            <Textarea
              id="grammar-text"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`S → aA | bB
A → aA | ε
B → bB | b`}
              className="font-mono text-sm min-h-[200px] resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Use uppercase for variables (S, A, B), lowercase for terminals (a, b), ε for epsilon
            </p>
          </div>

          {/* Parse Errors */}
          {parseResult && parseResult.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Parse Errors</AlertTitle>
              <AlertDescription>
                <div className="space-y-1 mt-2">
                  {parseResult.errors.map((error, idx) => (
                    <p key={idx} className="text-xs">
                      Line {error.line}: {error.message}
                    </p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Convert Button - Always show if onConvertToChain is provided */}
          {onConvertToChain && (
            <Button
              onClick={handleConvertToChain}
              className="w-full"
              variant="default"
              disabled={!parseResult?.grammar || isParsing}
            >
              {isParsing ? "Parsing..." : parseResult?.grammar ? "Convert to Chain" : "Enter Valid Grammar"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
