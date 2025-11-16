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
import { MainNav } from "@/components/main-nav"

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
  // Free Textbooks & Books
  {
    id: "grinstead-snell",
    title: "Introduction to Probability (Grinstead & Snell)",
    description: "Free probability textbook covering foundations, random variables, and Markov chains",
    type: "book",
    category: "theory",
    difficulty: "beginner",
    url: "https://math.dartmouth.edu/~prob/prob/prob.pdf",
    author: "Charles M. Grinstead & J. Laurie Snell",
    year: 1997,
    rating: 4.8,
    free: true,
  },
  // Free Courses
  {
    id: "mit-stochastic",
    title: "MIT 6.262: Discrete Stochastic Processes",
    description: "Complete MIT course materials including video lectures, assignments, and solutions",
    type: "course",
    category: "theory",
    difficulty: "advanced",
    url: "https://ocw.mit.edu/courses/6-262-discrete-stochastic-processes-spring-2011/",
    author: "MIT OpenCourseWare",
    year: 2011,
    rating: 4.9,
    free: true,
  },
  {
    id: "stanford-probability",
    title: "CS109: Probability for Computer Scientists",
    description: "Stanford's free probability course with Markov chains and applications",
    type: "course",
    category: "theory",
    difficulty: "intermediate",
    url: "https://web.stanford.edu/class/archive/cs/cs109/cs109.1218/",
    author: "Stanford University",
    year: 2021,
    rating: 4.8,
    free: true,
  },
  {
    id: "coursera-stochastic",
    title: "Stochastic Processes (Coursera)",
    description: "Free course on stochastic processes including Markov chains and applications",
    type: "course",
    category: "theory",
    difficulty: "intermediate",
    url: "https://www.coursera.org/learn/stochasticprocesses",
    author: "National Research University",
    rating: 4.7,
    free: true,
  },
  // Open Source Software
  {
    id: "pymc",
    title: "PyMC: Probabilistic Programming in Python",
    description: "Open-source Python library for Bayesian statistical modeling and MCMC",
    type: "software",
    category: "software",
    difficulty: "intermediate",
    url: "https://www.pymc.io/",
    rating: 4.8,
    free: true,
  },
  {
    id: "pymc-github",
    title: "PyMC GitHub Repository",
    description: "Source code and documentation for PyMC probabilistic programming library",
    type: "software",
    category: "software",
    difficulty: "intermediate",
    url: "https://github.com/pymc-devs/pymc",
    rating: 4.8,
    free: true,
  },
  {
    id: "markovchain-r",
    title: "markovchain R Package",
    description: "Open-source R package for analyzing and visualizing discrete-time Markov chains",
    type: "software",
    category: "software",
    difficulty: "beginner",
    url: "https://cran.r-project.org/package=markovchain",
    rating: 4.6,
    free: true,
  },
  {
    id: "markovchain-github",
    title: "markovchain GitHub Repository",
    description: "Source code for the markovchain R package with examples and documentation",
    type: "software",
    category: "software",
    difficulty: "beginner",
    url: "https://github.com/spedygiorgio/markovchain",
    rating: 4.6,
    free: true,
  },
  {
    id: "networkx",
    title: "NetworkX: Network Analysis in Python",
    description: "Open-source Python library for network analysis including PageRank and Markov chains",
    type: "software",
    category: "software",
    difficulty: "intermediate",
    url: "https://networkx.org/",
    rating: 4.7,
    free: true,
  },
  {
    id: "networkx-github",
    title: "NetworkX GitHub Repository",
    description: "Source code for NetworkX with graph algorithms and Markov chain implementations",
    type: "software",
    category: "software",
    difficulty: "intermediate",
    url: "https://github.com/networkx/networkx",
    rating: 4.7,
    free: true,
  },
  {
    id: "scipy",
    title: "SciPy: Scientific Computing in Python",
    description: "Open-source library with statistical functions and Markov chain utilities",
    type: "software",
    category: "software",
    difficulty: "intermediate",
    url: "https://scipy.org/",
    rating: 4.8,
    free: true,
  },
  {
    id: "stan",
    title: "Stan: Probabilistic Programming Language",
    description: "Open-source platform for statistical modeling with advanced MCMC algorithms",
    type: "software",
    category: "software",
    difficulty: "advanced",
    url: "https://mc-stan.org/",
    rating: 4.9,
    free: true,
  },
  {
    id: "julia-markov",
    title: "MarkovChainHammer.jl",
    description: "Julia package for Markov chain analysis and simulation",
    type: "software",
    category: "software",
    difficulty: "intermediate",
    url: "https://github.com/pevnak/MarkovChainHammer.jl",
    rating: 4.5,
    free: true,
  },
  // Free Papers
  {
    id: "pagerank-paper",
    title: "The PageRank Citation Ranking: Bringing Order to the Web",
    description: "Original paper describing Google's PageRank algorithm using Markov chains",
    type: "paper",
    category: "applications",
    difficulty: "advanced",
    url: "https://ilpubs.stanford.edu:8090/422/1/1999-66.pdf",
    author: "Page, Brin, Motwani, Winograd",
    year: 1999,
    rating: 4.9,
    free: true,
  },
  {
    id: "metropolis-paper",
    title: "Equation of State Calculations by Fast Computing Machines",
    description: "Original Metropolis-Hastings MCMC algorithm paper (1953)",
    type: "paper",
    category: "applications",
    difficulty: "advanced",
    url: "https://doi.org/10.1063/1.1699114",
    author: "Metropolis, Rosenbluth, Rosenbluth, Teller, Teller",
    year: 1953,
    rating: 4.8,
    free: true,
  },
  {
    id: "hmm-tutorial",
    title: "A Tutorial on Hidden Markov Models",
    description: "Comprehensive tutorial on HMMs with applications to speech recognition",
    type: "paper",
    category: "applications",
    difficulty: "advanced",
    url: "https://www.cs.ubc.ca/~murphyk/Bayes/rabiner.pdf",
    author: "Rabiner & Juang",
    year: 1986,
    rating: 4.7,
    free: true,
  },
  // Free Videos
  {
    id: "3b1b-markov",
    title: "Markov Chains - 3Blue1Brown",
    description: "Beautiful visual explanation of Markov chains with animations",
    type: "video",
    category: "theory",
    difficulty: "beginner",
    url: "https://www.youtube.com/watch?v=i3AkTO9HLXo",
    author: "3Blue1Brown",
    year: 2022,
    rating: 4.9,
    free: true,
  },
  {
    id: "khan-probability",
    title: "Khan Academy: Probability and Statistics",
    description: "Free video series covering probability foundations and stochastic processes",
    type: "video",
    category: "theory",
    difficulty: "beginner",
    url: "https://www.khanacademy.org/math/statistics-probability",
    author: "Khan Academy",
    rating: 4.7,
    free: true,
  },
  {
    id: "mit-videos",
    title: "MIT 6.262 Video Lectures",
    description: "Complete video lecture series for discrete stochastic processes",
    type: "video",
    category: "theory",
    difficulty: "advanced",
    url: "https://ocw.mit.edu/courses/6-262-discrete-stochastic-processes-spring-2011/video_galleries/video-lectures/",
    author: "MIT OpenCourseWare",
    rating: 4.9,
    free: true,
  },
  // Free Websites & Tools
  {
    id: "wolfram-demo",
    title: "Wolfram Demonstrations: Markov Chains",
    description: "Interactive demonstrations and visualizations of Markov chain concepts",
    type: "website",
    category: "applications",
    difficulty: "beginner",
    url: "https://demonstrations.wolfram.com/topic.html?topic=Markov+Chains",
    rating: 4.5,
    free: true,
  },
  {
    id: "desmos-markov",
    title: "Desmos: Markov Chain Calculator",
    description: "Interactive Markov chain calculator and visualizer",
    type: "website",
    category: "applications",
    difficulty: "beginner",
    url: "https://www.desmos.com/calculator",
    rating: 4.6,
    free: true,
  },
  {
    id: "jupyter-notebooks",
    title: "Jupyter Notebooks for Markov Chains",
    description: "Collection of free Jupyter notebooks demonstrating Markov chain concepts",
    type: "website",
    category: "applications",
    difficulty: "intermediate",
    url: "https://github.com/topics/markov-chains",
    rating: 4.5,
    free: true,
  },
  // Community Resources
  {
    id: "stackoverflow-markov",
    title: "Stack Overflow - Markov Chains",
    description: "Community Q&A for Markov chain programming and implementation questions",
    type: "website",
    category: "community",
    difficulty: "intermediate",
    url: "https://stackoverflow.com/questions/tagged/markov-chains",
    rating: 4.6,
    free: true,
  },
  {
    id: "math-stackexchange",
    title: "Mathematics Stack Exchange - Markov Chains",
    description: "Mathematical Q&A community for Markov chain theory questions",
    type: "website",
    category: "community",
    difficulty: "intermediate",
    url: "https://math.stackexchange.com/questions/tagged/markov-chains",
    rating: 4.7,
    free: true,
  },
  {
    id: "stats-stackexchange",
    title: "Cross Validated - Stochastic Processes",
    description: "Statistics Q&A community for stochastic processes and MCMC questions",
    type: "website",
    category: "community",
    difficulty: "intermediate",
    url: "https://stats.stackexchange.com/questions/tagged/stochastic-processes",
    rating: 4.7,
    free: true,
  },
  {
    id: "reddit-statistics",
    title: "r/statistics - Markov Chains",
    description: "Reddit community discussion on statistics and Markov chains",
    type: "website",
    category: "community",
    difficulty: "intermediate",
    url: "https://www.reddit.com/r/statistics/",
    rating: 4.5,
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
      <MainNav currentPath="/resources" />

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
                      <span>Mathematics Stack Exchange</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://math.stackexchange.com/questions/tagged/markov-chains" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Cross Validated (Stats)</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://stats.stackexchange.com/questions/tagged/stochastic-processes" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Stack Overflow</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://stackoverflow.com/questions/tagged/markov-chains" target="_blank" rel="noopener noreferrer">
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
                      <span>PyMC (Python)</span>
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
                      <span>NetworkX (Python)</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://github.com/networkx/networkx" target="_blank" rel="noopener noreferrer">
                          <Github className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Stan (C++)</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://github.com/stan-dev/stan" target="_blank" rel="noopener noreferrer">
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
                    Free Video Channels
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
                    <div className="flex items-center justify-between">
                      <span>StatQuest</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://youtube.com/@statquest" target="_blank" rel="noopener noreferrer">
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
                    <Code className="h-5 w-5" />
                    Free Software Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Python + NumPy + SciPy</span>
                      <Badge variant="secondary" className="text-xs">
                        Free & Open Source
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>R + markovchain</span>
                      <Badge variant="secondary" className="text-xs">
                        Free & Open Source
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Julia + MarkovChainHammer</span>
                      <Badge variant="secondary" className="text-xs">
                        Free & Open Source
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Jupyter Notebooks</span>
                      <Badge variant="secondary" className="text-xs">
                        Free & Open Source
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
