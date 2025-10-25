import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Mail,
  Github,
  Linkedin,
  Heart,
  Zap,
  Users,
  BookOpen,
  Target,
  Globe,
} from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
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
              <Link href="/about" className="text-foreground font-medium transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="space-y-6 mb-12 text-center">
          <div className="w-20 h-20 mx-auto bg-primary rounded-2xl flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-2xl">M</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-4">About MarkovLearn</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Making advanced mathematics accessible through interactive learning and visual exploration
            </p>
          </div>
        </div>

        {/* Mission */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              MarkovLearn was created to bridge the gap between abstract mathematical theory and practical
              understanding. We believe that complex concepts like Markov chains become intuitive when presented through
              interactive visualizations, hands-on tools, and progressive learning paths.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our platform transforms traditional textbook learning into an engaging, visual experience that helps
              students build deep understanding through exploration and experimentation.
            </p>
          </CardContent>
        </Card>

        {/* Educational Philosophy */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Educational Philosophy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Interactive Learning</h3>
                    <p className="text-sm text-muted-foreground">
                      Learn by doing with hands-on tools and real-time simulations
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Progressive Difficulty</h3>
                    <p className="text-sm text-muted-foreground">
                      Build understanding step-by-step from foundations to advanced topics
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Heart className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Visual Understanding</h3>
                    <p className="text-sm text-muted-foreground">
                      Transform abstract concepts into tangible visual experiences
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Real-World Applications</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect theory to practical applications across industries
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Platform Features</CardTitle>
            <CardDescription>Comprehensive tools and resources for learning Markov chains</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-semibold mb-2">Interactive Chain Builder</h3>
                <p className="text-sm text-muted-foreground">
                  Drag-and-drop interface for creating and simulating custom Markov chains
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-semibold mb-2">Structured Learning Path</h3>
                <p className="text-sm text-muted-foreground">
                  Progressive lessons from basic probability to advanced applications
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-semibold mb-2">Real-World Examples</h3>
                <p className="text-sm text-muted-foreground">
                  Case studies from weather prediction to Google's PageRank algorithm
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-semibold mb-2">Practice Assessments</h3>
                <p className="text-sm text-muted-foreground">
                  Interactive quizzes with immediate feedback and explanations
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-semibold mb-2">Comprehensive Resources</h3>
                <p className="text-sm text-muted-foreground">
                  Curated library of books, papers, videos, and software tools
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-semibold mb-2">Visual Simulations</h3>
                <p className="text-sm text-muted-foreground">
                  Watch Markov chains evolve in real-time with customizable parameters
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Implementation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
            <CardDescription>
              Built with modern web technologies for optimal performance and accessibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Frontend Technologies</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Next.js 15</span>
                    <Badge variant="secondary">React Framework</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>TypeScript</span>
                    <Badge variant="secondary">Type Safety</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tailwind CSS</span>
                    <Badge variant="secondary">Styling</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Radix UI</span>
                    <Badge variant="secondary">Components</Badge>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Key Features</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Responsive Design</span>
                    <Badge variant="outline">Mobile-First</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Accessibility</span>
                    <Badge variant="outline">WCAG AA</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Performance</span>
                    <Badge variant="outline">Optimized</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>SEO</span>
                    <Badge variant="outline">Optimized</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Get in Touch</CardTitle>
            <CardDescription>
              We'd love to hear from you! Reach out with questions, feedback, or collaboration ideas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Mail className="h-4 w-4" />
                Contact Us
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Github className="h-4 w-4" />
                View Source
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Linkedin className="h-4 w-4" />
                Connect
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Acknowledgments */}
        <Card>
          <CardHeader>
            <CardTitle>Acknowledgments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              This project was inspired by the need for better educational tools in mathematics and statistics. We're
              grateful to the open-source community, educational institutions, and researchers who have made their work
              freely available.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Special thanks to the creators of visualization libraries, educational content, and the broader
              mathematics education community for their contributions to making learning more accessible.
            </p>
            <div className="pt-4 border-t border-border text-center text-sm text-muted-foreground">
              <p>Built with ❤️ for the mathematics education community</p>
              <p className="mt-1">© 2024 MarkovLearn. Open source and freely available.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
