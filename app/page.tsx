import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Calculator, Users } from "lucide-react"
import Link from "next/link"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { MobileNav } from "@/components/mobile-nav"

export default function HomePage() {
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
                <Link href="/learn" className="text-muted-foreground hover:text-foreground hover:underline hover:cursor-pointer transition-colors">
                  Learn
                </Link>
                <Link href="/tools" className="text-muted-foreground hover:text-foreground hover:underline hover:cursor-pointer transition-colors">
                  Tools
                </Link>
                <Link href="/examples" className="text-muted-foreground hover:text-foreground hover:underline hover:cursor-pointer transition-colors">
                  Examples
                </Link>
                <Link href="/practice" className="text-muted-foreground hover:text-foreground hover:underline hover:cursor-pointer transition-colors">
                  Practice
                </Link>
                <Link href="/about" className="text-muted-foreground hover:text-foreground hover:underline hover:cursor-pointer transition-colors">
                  About
                </Link>
                <ThemeSwitcher />
              </div>
              <MobileNav currentPath="/" />
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
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground border border-dashed border-border/60 rounded-md px-3 py-2">
                <Users className="h-4 w-4" />
                <span>This is a prototype preview — final metrics and content are still in progress.</span>
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
                  <Link href="/tools?example=weather">
                    <Button variant="outline" className="w-full bg-transparent cursor-pointer text-sm sm:text-base">
                      <Calculator className="mr-2 h-4 w-4" />
                      Run Simulation
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Prototype Note */}
      <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl font-semibold text-balance">Prototype Status</h2>
          <p className="text-sm sm:text-base text-muted-foreground text-pretty">
            We&apos;re actively shaping MarkovLearn. Expect rapid iterations on lessons, tools, and dashboards as we
            gather feedback. Let us know what would help you understand stochastic processes faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/learn" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 cursor-pointer">
                Explore Lessons
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Link href="/tools" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 bg-transparent cursor-pointer"
              >
                Open Builder
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
                  <Link href="/learn/foundations-1" className="hover:text-foreground transition-colors">
                    Foundations
                  </Link>
                </li>
                <li>
                  <Link href="/learn/chains-1" className="hover:text-foreground transition-colors">
                    Markov Chains
                  </Link>
                </li>
                <li>
                  <Link href="/learn/stochastic-advanced-1" className="hover:text-foreground transition-colors">
                    Advanced Topics
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Tools</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/tools" className="hover:text-foreground transition-colors">
                    Chain Builder
                  </Link>
                </li>
                <li>
                  <Link href="/tools" className="hover:text-foreground transition-colors">
                    Simulator
                  </Link>
                </li>
                <li>
                  <Link href="/tools" className="hover:text-foreground transition-colors">
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
