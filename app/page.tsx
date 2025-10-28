import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BookOpen, Calculator, Users, Zap } from "lucide-react"
import Link from "next/link"
import { ThemeSwitcher } from "@/components/theme-switcher"

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
              <span className="font-semibold text-base sm:text-lg">MarkovLearn</span>
            </div>
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              <Link href="/learn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Learn
              </Link>
              <Link href="/tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Tools
              </Link>
              <Link href="/examples" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Examples
              </Link>
              <Link href="/practice" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Practice
              </Link>
              <ThemeSwitcher />
              <Button variant="outline" size="sm" className="cursor-pointer bg-transparent">
                Get Started
              </Button>
            </div>
            <div className="flex md:hidden items-center gap-2">
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-balance">
                  Master <span className="text-primary">Markov Chains</span> Through Interactive Learning
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed text-pretty">
                  Discover the fascinating world of stochastic processes with visual simulations, step-by-step
                  tutorials, and hands-on tools that make complex mathematics accessible.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/learn" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 cursor-pointer">
                    Start Learning
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
                <Link href="/examples" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 bg-transparent cursor-pointer"
                  >
                    Try Interactive Demo
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-muted-foreground">
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
            <div className="relative mt-8 lg:mt-0">
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardHeader className="pb-3 sm:pb-4 px-0 sm:px-6">
                  <CardTitle className="text-base sm:text-lg">Simple Weather Model</CardTitle>
                  <CardDescription className="text-sm">
                    A basic 2-state Markov chain showing weather transitions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-0 sm:px-6">
                  {/* Simple State Diagram */}
                  <div className="flex items-center justify-center gap-4 sm:gap-8 py-6 sm:py-8">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-medium">Sunny</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        0.7
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-6 sm:w-8 h-0.5 bg-primary"></div>
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        <span className="text-xs">0.3</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-xs">0.4</span>
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-primary rotate-180" />
                        <div className="w-6 sm:w-8 h-0.5 bg-primary"></div>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-medium">Rainy</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center">
                        0.6
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent cursor-pointer text-sm sm:text-base">
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
      <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-balance">
              Why Choose Interactive Learning?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Transform abstract mathematical concepts into tangible, visual experiences
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3 sm:pb-4 px-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto sm:mx-0 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                  <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <CardTitle className="text-center sm:text-left text-base sm:text-lg">Real-time Simulations</CardTitle>
              </CardHeader>
              <CardContent className="px-0 text-center sm:text-left">
                <p className="text-muted-foreground text-sm sm:text-base">
                  Watch Markov chains evolve step-by-step with interactive controls and visual feedback.
                </p>
              </CardContent>
            </Card>

            <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3 sm:pb-4 px-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto sm:mx-0 rounded-lg bg-accent/10 flex items-center justify-center mb-3 sm:mb-4">
                  <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
                </div>
                <CardTitle className="text-center sm:text-left text-base sm:text-lg">Progressive Learning</CardTitle>
              </CardHeader>
              <CardContent className="px-0 text-center sm:text-left">
                <p className="text-muted-foreground text-sm sm:text-base">
                  Start with basics and gradually build up to advanced concepts with guided pathways.
                </p>
              </CardContent>
            </Card>

            <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-3 sm:pb-4 px-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto sm:mx-0 rounded-lg bg-chart-3/10 flex items-center justify-center mb-3 sm:mb-4">
                  <Calculator className="h-6 w-6 sm:h-7 sm:w-7 text-chart-3" />
                </div>
                <CardTitle className="text-center sm:text-left text-base sm:text-lg">Hands-on Tools</CardTitle>
              </CardHeader>
              <CardContent className="px-0 text-center sm:text-left">
                <p className="text-muted-foreground text-sm sm:text-base">
                  Build your own Markov chains with drag-and-drop interfaces and instant calculations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-balance">Ready to Start Your Journey?</h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground text-pretty">
            Join thousands of students who have mastered advanced mathematics through interactive learning.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/learn" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 cursor-pointer">
                Begin Learning Path
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Link href="/examples" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 bg-transparent cursor-pointer"
              >
                Explore Examples
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8 sm:py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="space-y-3 sm:space-y-4 col-span-2 md:col-span-1">
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
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Learn</h3>
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
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Tools</h3>
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
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Resources</h3>
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
          <div className="border-t border-border mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-muted-foreground">
            <p>&copy; 2025 MarkovLearn. Built with passion for mathematical education.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
