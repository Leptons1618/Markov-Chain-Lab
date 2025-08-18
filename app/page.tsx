import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BookOpen, Calculator, Users, Zap } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">M</span>
              </div>
              <span className="font-semibold text-lg">MarkovLearn</span>
            </div>
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
              <Button variant="outline" size="sm" className="cursor-pointer bg-transparent">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                  Master <span className="text-primary">Markov Chains</span> Through Interactive Learning
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Discover the fascinating world of stochastic processes with visual simulations, step-by-step
                  tutorials, and hands-on tools that make complex mathematics accessible.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/learn">
                  <Button size="lg" className="text-lg px-8 cursor-pointer">
                    Start Learning
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/examples">
                  <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent cursor-pointer">
                    Try Interactive Demo
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>10,000+ Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Interactive Lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Real-time Simulations</span>
                </div>
              </div>
            </div>

            {/* Interactive Visualization Preview */}
            <div className="relative">
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Simple Weather Model</CardTitle>
                  <CardDescription>A basic 2-state Markov chain showing weather transitions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Simple State Diagram */}
                  <div className="flex items-center justify-center gap-8 py-8">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                        <span className="text-sm font-medium">Sunny</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        0.7
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-primary"></div>
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span className="text-xs">0.3</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">0.4</span>
                        <ArrowRight className="h-4 w-4 text-primary rotate-180" />
                        <div className="w-8 h-0.5 bg-primary"></div>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
                        <span className="text-sm font-medium">Rainy</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center">
                        0.6
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent cursor-pointer">
                    <Calculator className="mr-2 h-4 w-4" />
                    Run Simulation
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Why Choose Interactive Learning?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform abstract mathematical concepts into tangible, visual experiences
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Real-time Simulations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Watch Markov chains evolve step-by-step with interactive controls and visual feedback.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Progressive Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Start with basics and gradually build up to advanced concepts with guided pathways.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-chart-3" />
                </div>
                <CardTitle>Hands-on Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Build your own Markov chains with drag-and-drop interfaces and instant calculations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold">Ready to Start Your Journey?</h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of students who have mastered advanced mathematics through interactive learning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/learn">
              <Button size="lg" className="text-lg px-8 cursor-pointer">
                Begin Learning Path
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/examples">
              <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent cursor-pointer">
                Explore Examples
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">M</span>
                </div>
                <span className="font-semibold">MarkovLearn</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Making advanced mathematics accessible through interactive learning.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Learn</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/learn/basics" className="hover:text-foreground transition-colors">
                    Foundations
                  </Link>
                </li>
                <li>
                  <Link href="/learn/chains" className="hover:text-foreground transition-colors">
                    Markov Chains
                  </Link>
                </li>
                <li>
                  <Link href="/learn/advanced" className="hover:text-foreground transition-colors">
                    Advanced Topics
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Tools</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/tools/builder" className="hover:text-foreground transition-colors">
                    Chain Builder
                  </Link>
                </li>
                <li>
                  <Link href="/tools/simulator" className="hover:text-foreground transition-colors">
                    Simulator
                  </Link>
                </li>
                <li>
                  <Link href="/tools/calculator" className="hover:text-foreground transition-colors">
                    Matrix Calculator
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/examples" className="hover:text-foreground transition-colors">
                    Examples
                  </Link>
                </li>
                <li>
                  <Link href="/practice" className="hover:text-foreground transition-colors">
                    Practice
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 MarkovLearn. Built with passion for mathematical education.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
