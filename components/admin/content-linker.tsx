"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LinkIcon, Unlink } from "lucide-react"

interface LinkedContent {
  id: string
  title: string
  type: "course" | "lesson" | "example"
  url: string
}

interface ContentLinkerProps {
  onLink?: (content: LinkedContent) => void
  linkedContent?: LinkedContent[]
}

export function ContentLinker({ onLink, linkedContent = [] }: ContentLinkerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<LinkedContent[]>([
    {
      id: "1",
      title: "Probability Refresher",
      type: "lesson",
      url: "/learn/foundations/probability",
    },
    {
      id: "2",
      title: "Markov Chain Basics",
      type: "course",
      url: "/learn/chains",
    },
    {
      id: "3",
      title: "Weather Prediction Example",
      type: "example",
      url: "/examples/weather",
    },
  ])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    // Filter results based on search term
    const filtered = searchResults.filter((item) => item.title.toLowerCase().includes(term.toLowerCase()))
    setSearchResults(filtered)
  }

  const handleLink = (content: LinkedContent) => {
    onLink?.(content)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Link Existing Content
        </CardTitle>
        <CardDescription>Connect related courses, lessons, and examples</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            placeholder="Search content to link..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="cursor-text"
          />
        </div>

        {/* Search Results */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {searchResults.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.url}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {item.type}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleLink(item)}
                  className="cursor-pointer bg-transparent"
                >
                  <LinkIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Linked Content */}
        {linkedContent.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium mb-3">Linked Content</p>
            <div className="space-y-2">
              {linkedContent.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {item.type}
                    </Badge>
                  </div>
                  <Button size="sm" variant="ghost" className="cursor-pointer">
                    <Unlink className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
