"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import type { Grammar, GrammarAnalysis } from "@/lib/grammar"
import { formatGrammar, analyzeGrammar } from "@/lib/grammar"
import { Copy, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/hooks/use-toast"

interface GrammarDisplayProps {
  grammar: Grammar
  automatonType?: "markov" | "dfa" | "nfa"
}

export function GrammarDisplay({ grammar, automatonType }: GrammarDisplayProps) {
  const { toast } = useToast()
  const [copied, setCopied] = React.useState(false)
  const analysis = analyzeGrammar(grammar)
  const grammarNotation = formatGrammar(grammar)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(grammarNotation)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Grammar notation copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Grammar Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grammar Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Grammar Type:</Label>
            <Badge variant={analysis.type === "regular" ? "default" : "secondary"}>
              {analysis.type === "regular" ? "Regular" : "Context-Free"}
            </Badge>
            {analysis.isAmbiguous && (
              <Badge variant="destructive" className="ml-2">
                <AlertCircle className="h-3 w-3 mr-1" />
                Ambiguous
              </Badge>
            )}
            {!analysis.isAmbiguous && (
              <Badge variant="outline" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Unambiguous
              </Badge>
            )}
          </div>
          
          {analysis.description && (
            <p className="text-xs text-muted-foreground">{analysis.description}</p>
          )}
          
          <div className="pt-2 border-t">
            <Label className="text-xs text-muted-foreground mb-2 block">Language</Label>
            <p className="text-sm font-medium">{analysis.language}</p>
          </div>
        </CardContent>
      </Card>

      {/* Grammar Notation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Grammar Notation</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-md font-mono text-sm whitespace-pre-wrap break-words">
            {grammarNotation || "No grammar generated"}
          </div>
        </CardContent>
      </Card>

      {/* Variables and Terminals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-sm">Variables (Non-terminals)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {grammar.variables.length > 0 ? (
                grammar.variables.map((variable) => (
                  <Badge
                    key={variable}
                    variant={variable === grammar.startVariable ? "default" : "outline"}
                    className="text-xs"
                  >
                    {variable}
                    {variable === grammar.startVariable && (
                      <span className="ml-1 text-[10px]">(start)</span>
                    )}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No variables</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-sm">Terminals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {grammar.terminals.length > 0 ? (
                grammar.terminals.map((terminal) => (
                  <Badge key={terminal} variant="secondary" className="text-xs">
                    {terminal}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No terminals</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Production Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {grammar.productions.length > 0 ? (
            grammar.productions.map((production, idx) => (
              <div key={idx} className="p-3 bg-muted rounded-md">
                <div className="flex items-start gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs font-mono">
                    {production.variable}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <div className="flex flex-wrap gap-2">
                    {production.alternatives.map((alt, altIdx) => (
                      <React.Fragment key={altIdx}>
                        {altIdx > 0 && (
                          <span className="text-muted-foreground">|</span>
                        )}
                        <div className="flex gap-1 flex-wrap">
                          {alt.length === 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              ε
                            </Badge>
                          ) : (
                            alt.map((symbol, symIdx) => (
                              <Badge
                                key={symIdx}
                                variant={
                                  grammar.variables.includes(symbol)
                                    ? "outline"
                                    : "secondary"
                                }
                                className="text-xs font-mono"
                              >
                                {symbol}
                              </Badge>
                            ))
                          )}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No production rules</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
