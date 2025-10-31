"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  ExternalLink,
  Search,
  Download,
  Video,
  Code,
  Users,
  FileText,
  Calculator,
  Globe,
  Github,
  Youtube,
  Star,
} from "lucide-react"
import Link from "next/link"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { MobileNav } from "@/components/mobile-nav"

interface Resource {
  id: string
  title: string
  description: string
  type: "book" | "paper" | "video" | "software" | "website" | "course"
  category: "theory" | "applications" | "software" | "community"
  difficulty: "beginner" | "intermediate" | "advanced"
  url?: string
  author?: string
  year?: number
  rating?: number
  free?: boolean
}

const resources: Resource[] = [
  {
    id: "norris-book",
    title: "Markov Chains",
    description: "Comprehensive textbook covering theory and applications of Markov chains",
    type: "book",
    category: "theory",
    difficulty: "intermediate",
    author: "J.R. Norris",
    year: 1997,
    rating: 4.8,
    free: false,
  },
  {
    id: "mit-course",
    title: "MIT 6.262: Discrete Stochastic Processes",
    description: "Complete course materials including lectures, assignments, and solutions",
    type: "course",
    category: "theory",
    difficulty: "advanced",
    url: "https://ocw.mit.edu",
    author: "MIT OpenCourseWare",
    year: 2023,
    rating: 4.9,
    free: true,
  },
  {
    id: "python-markov",
    title: "PyMC: Probabilistic Programming in Python",
    description: "Python library for Bayesian statistical modeling and probabilistic machine learning",
    type: "software",
    category: "software",
    difficulty: "intermediate",
    url: "https://pymc.io",
    rating: 4.7,
    free: true,
  },
  {
    id: "r-markov",
    title: "markovchain R Package",
    description: "R package for analyzing and visualizing Markov chains",
    type: "software",
    category: "software",
    difficulty: "beginner",
    url: "https://cran.r-project.org",
    rating: 4.5,
    free: true,
  },
  {
    id: "youtube-series",
    title: "Markov Chains Explained Visually",
    description: "Video series explaining Markov chain concepts with animations",
    type: "video",
    category: "theory",
    difficulty: "beginner",
    url: "https://youtube.com",
    author: "3Blue1Brown",
    year: 2022,
    rating: 4.9,
    free: true,
  },
  {
    id: "pagerank-paper",
    title: "The PageRank Citation Ranking: Bringing Order to the Web",
    description: "Original paper describing Google's PageRank algorithm using Markov chains",
    type: "paper",
    category: "applications",
    difficulty: "advanced",
    author: "Page, Brin, Motwani, Winograd",
    year: 1999,
    rating: 4.8,
    free: true,
  },
  {
    id: "stackoverflow",
    title: "Stack Overflow - Markov Chains Tag",
    description: "Community Q&A for Markov chain programming and implementation questions",
    type: "website",
    category: "community",
    difficulty: "intermediate",
    url: "https://stackoverflow.com",
    rating: 4.6,
    free: true,
  },
  {
    id: "wolfram-demo",
    title: "Wolfram Demonstrations: Markov Chains",
    description: "Interactive demonstrations and visualizations of Markov chain concepts",
    type: "website",
    category: "applications",
    difficulty: "beginner",
    url: "https://demonstrations.wolfram.com",
    rating: 4.4,
    free: true,
  },
]

const formulaReference = [
  {
    title: "Transition Matrix",
    formula: "P = [p_{ij}] where p_{ij} = P(X_{n+1} = j | X_n = i)",
    description: "Matrix where each element represents the probability of transitioning from state i to state j",
  },
  {
    title: "Chapman-Kolmogorov Equation",
    formula: "P^{(n+m)} = P^{(n)} × P^{(m)}",
    description: "Fundamental equation relating transition probabilities over different time periods",
  },
  {
    title: "Steady-State Distribution",
    formula: "π = πP, where Σπ_i = 1",
    description: "Long-run probability distribution that remains unchanged by the transition matrix",
  },
  {
    title: "First-Step Analysis",
    formula: "h_i = Σ_j p_{ij} × (1 + h_j)",
    description: "Method for calculating expected hitting times and absorption probabilities",
  },
]

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory
    const matchesType = selectedType === "all" || resource.type === selectedType
    return matchesSearch && matchesCategory && matchesType
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "book":
        return BookOpen
      case "paper":
        return FileText
      case "video":
        return Video
      case "software":
        return Code
      case "website":
        return Globe
      case "course":
        return Calculator
      default:
        return BookOpen
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">M</span>
                </div>
                <span className="font-semibold text-lg">MarkovLearn</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6">
                <Link href="/learn" className="text-muted-foreground hover:text-foreground transition-colors">
                  Learn
                </Link>
                <Link href="/tools" className="text-muted-foreground hover:text-foreground transition-colors">
                  Tools
                </Link>
                <Link href="/examples" className="text-muted-foreground hover:text-foreground transition-colors">
                  Examples
                </Link>
                <Link href="/practice" className="text-muted-foreground hover:text-foreground transition-colors">
                  Practice
                </Link>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
                <ThemeSwitcher />
              </div>
              <MobileNav currentPath="/resources" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-bold">Learning Resources</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Curated collection of books, papers, videos, and tools to deepen your understanding of Markov chains
          </p>
        </div>

        <Tabs defaultValue="library" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="reference">Reference</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                className="px-3 py-2 border border-input rounded-md bg-background"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="theory">Theory</option>
                <option value="applications">Applications</option>
                <option value="software">Software</option>
                <option value="community">Community</option>
              </select>
              <select
                className="px-3 py-2 border border-input rounded-md bg-background"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="book">Books</option>
                <option value="paper">Papers</option>
                <option value="video">Videos</option>
                <option value="software">Software</option>
                <option value="course">Courses</option>
              </select>
            </div>

            {/* Resources Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => {
                const TypeIcon = getTypeIcon(resource.type)
                return (
                  <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-5 w-5 text-primary" />
                          <Badge variant="outline" className="text-xs capitalize">
                            {resource.type}
                          </Badge>
                        </div>
                        {resource.free && (
                          <Badge variant="secondary" className="text-xs">
                            Free
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg leading-tight">{resource.title}</CardTitle>
                      {resource.author && (
                        <CardDescription className="text-sm">
                          by {resource.author} {resource.year && `(${resource.year})`}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{resource.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getDifficultyColor(resource.difficulty)}`}>
                            {resource.difficulty}
                          </Badge>
                          {resource.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-muted-foreground">{resource.rating}</span>
                            </div>
                          )}
                        </div>
                        {resource.url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {filteredResources.length === 0 && (
              <Card className="p-8 text-center">
                <CardContent>
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No resources found</h3>
                  <p className="text-muted-foreground">Try adjusting your search terms or filters</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reference" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Mathematical Reference</h2>
              <p className="text-muted-foreground">Quick reference for key formulas and mathematical concepts</p>
            </div>

            <div className="grid gap-6">
              {formulaReference.map((item, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg font-mono text-center text-lg">{item.formula}</div>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Notation Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-mono">X_n</span>
                      <span>State at time n</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono">P</span>
                      <span>Transition matrix</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono">{"p_{ij}"}</span>
                      <span>Transition probability from state i to state j</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono">π</span>
                      <span>Steady-state distribution</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-mono">{"P^{(n)}"}</span>
                      <span>n-step transition matrix</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono">τ_A</span>
                      <span>Hitting time of set A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono">E[·]</span>
                      <span>Expected value</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono">P(·)</span>
                      <span>Probability</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Community & Support</h2>
              <p className="text-muted-foreground">Connect with other learners and get help from the community</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Discussion Forums
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Math Stack Exchange</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://math.stackexchange.com" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Reddit r/statistics</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://reddit.com/r/statistics" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Cross Validated</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://stats.stackexchange.com" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    Open Source Projects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>PyMC</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://github.com/pymc-devs/pymc" target="_blank" rel="noopener noreferrer">
                          <Github className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>markovchain (R)</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://github.com/spedygiorgio/markovchain" target="_blank" rel="noopener noreferrer">
                          <Github className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>NetworkX</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://github.com/networkx/networkx" target="_blank" rel="noopener noreferrer">
                          <Github className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Youtube className="h-5 w-5" />
                    Video Channels
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>3Blue1Brown</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://youtube.com/@3blue1brown" target="_blank" rel="noopener noreferrer">
                          <Youtube className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Khan Academy</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://youtube.com/@khanacademy" target="_blank" rel="noopener noreferrer">
                          <Youtube className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>MIT OpenCourseWare</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://youtube.com/@mitocw" target="_blank" rel="noopener noreferrer">
                          <Youtube className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Software Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Python + NumPy</span>
                      <Badge variant="secondary" className="text-xs">
                        Free
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>R + markovchain</span>
                      <Badge variant="secondary" className="text-xs">
                        Free
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>MATLAB</span>
                      <Badge variant="outline" className="text-xs">
                        Paid
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Mathematica</span>
                      <Badge variant="outline" className="text-xs">
                        Paid
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
