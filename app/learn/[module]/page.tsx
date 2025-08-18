"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, CheckCircle, Lightbulb, Calculator, RotateCcw } from "lucide-react"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const lessonOrder = [
  // Foundations module
  { module: "foundations", lesson: "probability-basics" },
  { module: "foundations", lesson: "states-transitions" },
  { module: "foundations", lesson: "matrices" },
  { module: "foundations", lesson: "terminology" },
  // Core concepts module
  { module: "core-concepts", lesson: "markov-property" },
  { module: "core-concepts", lesson: "discrete-continuous" },
  { module: "core-concepts", lesson: "state-spaces" },
  { module: "core-concepts", lesson: "state-classification" },
  // Advanced topics module
  { module: "advanced-topics", lesson: "steady-state" },
  { module: "advanced-topics", lesson: "convergence" },
  { module: "advanced-topics", lesson: "ergodic-theory" },
  { module: "advanced-topics", lesson: "hmm-intro" },
]

const lessonContent = {
  // FOUNDATIONS MODULE
  "probability-basics": {
    title: "Probability Refresher",
    description: "Review fundamental probability concepts essential for understanding Markov chains",
    content: [
      {
        type: "text",
        content:
          "Probability theory forms the foundation of Markov chains. Understanding these concepts is crucial for grasping how states transition and probabilities evolve over time.",
      },
      {
        type: "definition",
        title: "Sample Space",
        content:
          "The set of all possible outcomes of an experiment, denoted as Ω (omega). For example, when flipping a coin, Ω = {Heads, Tails}.",
      },
      {
        type: "formula",
        title: "Probability Axioms (Kolmogorov)",
        content: (
          <div className="space-y-2">
            <div>For any event A in sample space Ω:</div>
            <div className="text-xl">0 ≤ P(A) ≤ 1</div>
            <div className="text-xl">P(Ω) = 1</div>
            <div>For disjoint events A and B:</div>
            <div className="text-xl">P(A ∪ B) = P(A) + P(B)</div>
          </div>
        ),
      },
      {
        type: "definition",
        title: "Conditional Probability",
        content: "The probability of event A given that event B has occurred.",
      },
      {
        type: "formula",
        title: "Conditional Probability Formula",
        content: (
          <div className="text-xl">
            P(A|B) = <span className="text-lg">P(A ∩ B)</span>/<span className="text-lg">P(B)</span> + " where P(B) &gt;
            0"
          </div>
        ),
      },
      {
        type: "formula",
        title: "Bayes' Theorem",
        content: (
          <div className="space-y-2">
            <div className="text-xl">
              P(A|B) = <span className="text-lg">P(B|A)P(A)</span>/<span className="text-lg">P(B)</span>
            </div>
            <div className="text-lg">
              = <span className="text-base">P(B|A)P(A)</span>/<span className="text-base">Σ P(B|A)P(A)</span>
            </div>
          </div>
        ),
      },
      {
        type: "formula",
        title: "Law of Total Probability",
        content: (
          <div className="space-y-2">
            <div>If B1, B2, ..., Bn is a partition of Ω, then:</div>
            <div className="text-xl">P(A) = Σ P(A|Bi)P(Bi)</div>
          </div>
        ),
      },
      {
        type: "definition",
        title: "Independence",
        content:
          "Events A and B are independent if the occurrence of one does not affect the probability of the other.",
      },
      {
        type: "formula",
        title: "Independence Condition",
        content: (
          <div className="space-y-2">
            <div className="text-xl">P(A ∩ B) = P(A) · P(B)</div>
            <div>which implies P(A|B) = P(A) when P(B) &gt; 0</div>
          </div>
        ),
      },
      {
        type: "formula",
        title: "Expected Value",
        content: (
          <div className="space-y-2">
            <div>For a discrete random variable X:</div>
            <div className="text-xl">E[X] = Σ x · P(X = x)</div>
          </div>
        ),
      },
      {
        type: "formula",
        title: "Variance",
        content: (
          <div className="space-y-2">
            <div className="text-xl">Var(X) = E[X²] - (E[X])²</div>
            <div className="text-lg">= E[(X - E[X])²]</div>
          </div>
        ),
      },
      {
        type: "definition",
        title: "Law of Large Numbers",
        content: "As the number of trials increases, the sample average converges to the expected value.",
      },
      {
        type: "formula",
        title: "Law of Large Numbers Formula",
        content: (
          <div className="space-y-2">
            <div>As n → ∞:</div>
            <div className="text-xl">
              <span className="text-lg">1</span>/<span className="text-lg">n</span> Σ Xᵢ → E[X]
            </div>
          </div>
        ),
      },
      {
        type: "interactive",
        title: "Interactive Coin Flip Simulation",
        content:
          "Observe how relative frequencies approach theoretical probabilities as the number of trials increases. This demonstrates the Law of Large Numbers in action.",
      },
    ],
  },
  "states-transitions": {
    title: "States and Transitions",
    description: "Learn about states, state spaces, and how transitions work in stochastic processes",
    content: [
      {
        type: "text",
        content:
          "In a stochastic process, a state represents a particular condition or situation at a given time. The collection of all possible states forms the state space.",
      },
      {
        type: "definition",
        title: "State Space",
        content:
          "The set S of all possible states in a stochastic process. This can be finite (like {Sunny, Rainy, Cloudy}) or infinite (like the set of non-negative integers).",
      },
      {
        type: "definition",
        title: "Transition",
        content:
          "A change from one state to another. In discrete time, we move from state i at time n to state j at time n+1.",
      },
      {
        type: "formula",
        title: "Transition Probability",
        content: "The probability of moving from state i to state j in one step: $$p_{ij} = P(X_{n+1} = j | X_n = i)$$",
      },
      {
        type: "text",
        content:
          "These transition probabilities must satisfy: $$\\sum_{j \\in S} p_{ij} = 1$$ for all states i (each row sums to 1).",
      },
      {
        type: "interactive",
        title: "Weather State Transitions",
        content: "Explore how weather states transition with different probabilities.",
      },
    ],
  },
  matrices: {
    title: "Reading Transition Matrices",
    description: "Master the interpretation and manipulation of transition matrices",
    content: [
      {
        type: "text",
        content:
          "A transition matrix P organizes all transition probabilities in a convenient format where entry (i,j) represents the probability of moving from state i to state j.",
      },
      {
        type: "definition",
        title: "Transition Matrix",
        content:
          "An n×n matrix P where P[i,j] = p_{ij} represents the probability of transitioning from state i to state j in one time step.",
      },
      {
        type: "formula",
        title: "Matrix Properties",
        content:
          "For a transition matrix P: $$P_{ij} \\geq 0$$ (non-negative entries) and $$\\sum_{j=1}^{n} P_{ij} = 1$$ (rows sum to 1)",
      },
      {
        type: "text",
        content: "Example: A simple 2-state weather model with states {Sunny, Rainy}:",
      },
      {
        type: "formula",
        title: "Weather Transition Matrix",
        content: "$$P = \\begin{pmatrix} 0.7 & 0.3 \\\\ 0.4 & 0.6 \\end{pmatrix}$$",
      },
      {
        type: "text",
        content: "This means: P(Sunny→Sunny) = 0.7, P(Sunny→Rainy) = 0.3, P(Rainy→Sunny) = 0.4, P(Rainy→Rainy) = 0.6",
      },
      {
        type: "formula",
        title: "n-Step Transitions",
        content:
          "The probability of going from state i to state j in exactly n steps is given by the (i,j) entry of $$P^n$$",
      },
    ],
  },
  terminology: {
    title: "Basic Terminology",
    description: "Essential vocabulary and notation for Markov chain theory",
    content: [
      {
        type: "definition",
        title: "Stochastic Process",
        content:
          "A collection of random variables {X_t} indexed by time t, representing the evolution of a system over time.",
      },
      {
        type: "definition",
        title: "Discrete-Time Process",
        content:
          "A stochastic process where time takes discrete values: X₀, X₁, X₂, ... (like daily weather observations).",
      },
      {
        type: "definition",
        title: "State Vector",
        content:
          "A probability distribution over states at time n: $$\\pi^{(n)} = (\\pi_1^{(n)}, \\pi_2^{(n)}, ..., \\pi_k^{(n)})$$ where $$\\pi_i^{(n)} = P(X_n = i)$$",
      },
      {
        type: "formula",
        title: "Chapman-Kolmogorov Equation",
        content: "For any states i, j and times m &lt; n: $$P_{ij}^{(n)} = \\sum_{k} P_{ik}^{(m)} P_{kj}^{(n-m)}$$",
      },
      {
        type: "definition",
        title: "Initial Distribution",
        content:
          "The probability distribution over states at time 0: $$\\pi^{(0)} = (\\pi_1^{(0)}, \\pi_2^{(0)}, ..., \\pi_k^{(0)})$$",
      },
    ],
  },

  // CORE CONCEPTS MODULE
  "markov-property": {
    title: "The Markov Property",
    description: "Understand the fundamental memoryless property that defines Markov processes",
    content: [
      {
        type: "text",
        content:
          "The Markov property is the defining characteristic of Markov chains: the future depends only on the present state, not on the past history.",
      },
      {
        type: "definition",
        title: "Markov Property",
        content:
          "A stochastic process has the Markov property if: $$P(X_{n+1} = j | X_n = i, X_{n-1} = i_{n-1}, ..., X_0 = i_0) = P(X_{n+1} = j | X_n = i)$$",
      },
      {
        type: "text",
        content: "In simple terms: 'The future is independent of the past, given the present.'",
      },
      {
        type: "definition",
        title: "Markov Chain",
        content:
          "A discrete-time stochastic process that satisfies the Markov property with a finite or countable state space.",
      },
      {
        type: "formula",
        title: "Time-Homogeneous Property",
        content:
          "Transition probabilities don't depend on time: $$P(X_{n+1} = j | X_n = i) = P(X_1 = j | X_0 = i) = p_{ij}$$",
      },
      {
        type: "text",
        content:
          "Examples of Markov processes: Random walks, queue lengths, stock prices (under certain assumptions), weather patterns.",
      },
      {
        type: "text",
        content:
          "Non-Markov examples: Stock prices with trend memory, word prediction based on entire sentence history.",
      },
    ],
  },
  "discrete-continuous": {
    title: "Discrete vs Continuous Time",
    description: "Compare discrete-time and continuous-time Markov processes",
    content: [
      {
        type: "definition",
        title: "Discrete-Time Markov Chain (DTMC)",
        content:
          "Time progresses in discrete steps: t = 0, 1, 2, 3, ... State changes occur at these fixed time points.",
      },
      {
        type: "formula",
        title: "DTMC Transition",
        content: "$$P(X_{n+1} = j | X_n = i) = p_{ij}$$",
      },
      {
        type: "definition",
        title: "Continuous-Time Markov Chain (CTMC)",
        content:
          "Time is continuous, and state changes can occur at any moment. The time spent in each state follows an exponential distribution.",
      },
      {
        type: "formula",
        title: "CTMC Generator Matrix",
        content: "Rate matrix Q where $$q_{ij} \\geq 0$$ for i ≠ j and $$q_{ii} = -\\sum_{j \\neq i} q_{ij}$$",
      },
      {
        type: "formula",
        title: "Exponential Holding Times",
        content: "Time spent in state i follows: $$T_i \\sim \\text{Exp}(\\lambda_i)$$ where $$\\lambda_i = -q_{ii}$$",
      },
      {
        type: "text",
        content: "DTMC examples: Daily weather, monthly stock prices, annual population counts.",
      },
      {
        type: "text",
        content: "CTMC examples: Phone call arrivals, machine failures, chemical reactions, birth-death processes.",
      },
    ],
  },
  "state-spaces": {
    title: "Finite vs Infinite State Spaces",
    description: "Explore different types of state spaces and their implications",
    content: [
      {
        type: "definition",
        title: "Finite State Space",
        content:
          "A state space with a finite number of states: S = {1, 2, ..., n}. Most introductory examples use finite state spaces.",
      },
      {
        type: "text",
        content: "Examples: Weather states {Sunny, Rainy, Cloudy}, game positions, discrete inventory levels.",
      },
      {
        type: "definition",
        title: "Countably Infinite State Space",
        content:
          "A state space with infinitely many states that can be put in one-to-one correspondence with natural numbers: S = {0, 1, 2, 3, ...}",
      },
      {
        type: "text",
        content: "Examples: Queue lengths, population sizes, number of customers in a system.",
      },
      {
        type: "formula",
        title: "Birth-Death Process",
        content:
          "States represent population size. From state n: $$p_{n,n+1} = \\lambda_n$$ (birth), $$p_{n,n-1} = \\mu_n$$ (death), $$p_{n,n} = 1 - \\lambda_n - \\mu_n$$",
      },
      {
        type: "definition",
        title: "Uncountable State Space",
        content:
          "Continuous state spaces like ℝ or [0,1]. These lead to more advanced topics like diffusion processes.",
      },
      {
        type: "text",
        content:
          "The size of the state space affects: computational complexity, existence of steady states, convergence properties, and analytical tractability.",
      },
    ],
  },
  "state-classification": {
    title: "Classification of States",
    description: "Learn to classify states as transient, recurrent, absorbing, and periodic",
    content: [
      {
        type: "definition",
        title: "Accessible States",
        content:
          "State j is accessible from state i if there exists n ≥ 0 such that $$P_{ij}^{(n)} > 0$$. Written as i → j.",
      },
      {
        type: "definition",
        title: "Communicating States",
        content: "States i and j communicate if i → j and j → i. This is an equivalence relation, written as i ↔ j.",
      },
      {
        type: "definition",
        title: "Irreducible Chain",
        content:
          "A Markov chain where all states communicate with each other. Every finite irreducible chain has a unique stationary distribution.",
      },
      {
        type: "definition",
        title: "Transient State",
        content:
          "A state i is transient if $$\\sum_{n=0}^{\\infty} P_{ii}^{(n)} < \\infty$$. The chain will eventually leave a transient state forever.",
      },
      {
        type: "definition",
        title: "Recurrent State",
        content:
          "A state i is recurrent if $$\\sum_{n=0}^{\\infty} P_{ii}^{(n)} = \\infty$$. The chain will return to a recurrent state infinitely often.",
      },
      {
        type: "definition",
        title: "Absorbing State",
        content: "A state i where $$p_{ii} = 1$$. Once entered, the chain never leaves. Example: 'Game Over' states.",
      },
      {
        type: "formula",
        title: "Period of a State",
        content:
          "$$d(i) = \\gcd\\{n \\geq 1 : P_{ii}^{(n)} > 0\\}$$. State i is aperiodic if d(i) = 1, periodic otherwise.",
      },
    ],
  },

  // ADVANCED TOPICS MODULE
  "steady-state": {
    title: "Steady-State Analysis",
    description: "Discover long-run behavior and stationary distributions",
    content: [
      {
        type: "text",
        content:
          "As time progresses, many Markov chains approach a steady state where the probability distribution no longer changes.",
      },
      {
        type: "definition",
        title: "Stationary Distribution",
        content:
          "A probability distribution π such that $$\\pi P = \\pi$$, where π is a row vector and P is the transition matrix.",
      },
      {
        type: "formula",
        title: "Stationary Condition",
        content: "$$\\pi_j = \\sum_{i} \\pi_i p_{ij}$$ for all states j, with $$\\sum_j \\pi_j = 1$$",
      },
      {
        type: "definition",
        title: "Limiting Distribution",
        content:
          "If $$\\lim_{n \\to \\infty} P_{ij}^{(n)} = \\pi_j$$ exists and is independent of i, then π is the limiting distribution.",
      },
      {
        type: "formula",
        title: "Fundamental Matrix",
        content: "For absorbing chains: $$N = (I - Q)^{-1}$$ where Q is the transient-to-transient submatrix.",
      },
      {
        type: "text",
        content:
          "The (i,j) entry of N gives the expected number of times the chain visits transient state j starting from transient state i.",
      },
      {
        type: "formula",
        title: "Expected Hitting Time",
        content: "Expected time to reach state j from state i: $$h_{ij} = 1 + \\sum_{k \\neq j} p_{ik} h_{kj}$$",
      },
    ],
  },
  convergence: {
    title: "Convergence Properties",
    description: "Understand when and how Markov chains converge to steady state",
    content: [
      {
        type: "definition",
        title: "Ergodic Chain",
        content:
          "A finite, irreducible, and aperiodic Markov chain. Ergodic chains have unique stationary distributions and converge to them.",
      },
      {
        type: "formula",
        title: "Ergodic Theorem",
        content:
          "For an ergodic chain: $$\\lim_{n \\to \\infty} \\frac{1}{n} \\sum_{k=0}^{n-1} \\mathbf{1}_{X_k = j} = \\pi_j$$ almost surely",
      },
      {
        type: "definition",
        title: "Mixing Time",
        content:
          "The time required for the chain to get close to its stationary distribution, measured by total variation distance.",
      },
      {
        type: "formula",
        title: "Total Variation Distance",
        content:
          "$$d_{TV}(\\mu, \\nu) = \\frac{1}{2} \\sum_i |\\mu_i - \\nu_i|$$ measures how different two distributions are.",
      },
      {
        type: "definition",
        title: "Coupling",
        content: "A technique to bound convergence rates by constructing two copies of the chain that eventually meet.",
      },
      {
        type: "formula",
        title: "Spectral Gap",
        content:
          "$$\\gamma = 1 - |\\lambda_2|$$ where λ₂ is the second-largest eigenvalue of P. Larger gaps mean faster convergence.",
      },
      {
        type: "text",
        content:
          "Convergence rate is geometric: $$||P^n - \\pi||_{TV} \\leq C \\rho^n$$ for some constants C and ρ &lt; 1.",
      },
    ],
  },
  "ergodic-theory": {
    title: "Ergodic Theory Basics",
    description: "Introduction to ergodic theory and its applications to Markov chains",
    content: [
      {
        type: "text",
        content:
          "Ergodic theory studies the long-term average behavior of dynamical systems, providing powerful tools for analyzing Markov chains.",
      },
      {
        type: "definition",
        title: "Ergodic Process",
        content: "A stationary process where time averages equal ensemble averages almost surely.",
      },
      {
        type: "formula",
        title: "Strong Law of Large Numbers",
        content:
          "For an ergodic chain: $$\\lim_{n \\to \\infty} \\frac{1}{n} \\sum_{k=0}^{n-1} f(X_k) = \\sum_i \\pi_i f(i)$$ almost surely",
      },
      {
        type: "definition",
        title: "Invariant Measure",
        content:
          "A measure μ such that μ(A) = μ(P⁻¹(A)) for all measurable sets A, where P is the transition operator.",
      },
      {
        type: "formula",
        title: "Birkhoff's Ergodic Theorem",
        content:
          "For an ergodic transformation T: $$\\lim_{n \\to \\infty} \\frac{1}{n} \\sum_{k=0}^{n-1} f(T^k x) = \\int f d\\mu$$ for μ-almost all x",
      },
      {
        type: "definition",
        title: "Mixing Property",
        content:
          "A stronger condition than ergodicity: $$\\lim_{n \\to \\infty} P(A \\cap T^{-n}B) = P(A)P(B)$$ for all measurable sets A, B.",
      },
      {
        type: "text",
        content:
          "Applications: Central limit theorems for Markov chains, large deviation principles, and statistical inference.",
      },
    ],
  },
  "hmm-intro": {
    title: "Hidden Markov Models",
    description: "Introduction to Hidden Markov Models and their applications",
    content: [
      {
        type: "text",
        content:
          "Hidden Markov Models (HMMs) extend Markov chains by adding an observation layer. The true states are hidden, but we observe emissions that depend on the current state.",
      },
      {
        type: "definition",
        title: "Hidden Markov Model",
        content:
          "A doubly stochastic process with hidden states {X_t} following a Markov chain and observable emissions {Y_t} that depend on the current hidden state.",
      },
      {
        type: "formula",
        title: "HMM Components",
        content:
          "Transition matrix A: $$a_{ij} = P(X_{t+1} = j | X_t = i)$$, Emission matrix B: $$b_{ik} = P(Y_t = k | X_t = i)$$, Initial distribution π",
      },
      {
        type: "definition",
        title: "Three Fundamental Problems",
        content:
          "1) Evaluation: P(observations|model), 2) Decoding: Most likely state sequence, 3) Learning: Estimate model parameters",
      },
      {
        type: "formula",
        title: "Forward Algorithm",
        content:
          "$$\\alpha_t(i) = P(Y_1, ..., Y_t, X_t = i | \\lambda)$$ computed recursively: $$\\alpha_{t+1}(j) = b_j(Y_{t+1}) \\sum_i \\alpha_t(i) a_{ij}$$",
      },
      {
        type: "formula",
        title: "Viterbi Algorithm",
        content: "$$\\delta_t(i) = \\max_{x_1,...,x_{t-1}} P(X_1,...,X_{t-1}, X_t = i, Y_1,...,Y_t | \\lambda)$$",
      },
      {
        type: "text",
        content:
          "Applications: Speech recognition, bioinformatics (gene finding), natural language processing, financial modeling, and signal processing.",
      },
    ],
  },
}

export default function LessonPage({ params }: { params: { module: string } }) {
  const [currentSection, setCurrentSection] = useState(0)
  const [isLessonCompleted, setIsLessonCompleted] = useState(false) // Added lesson completion state
  const [coinFlips, setCoinFlips] = useState({
    heads: 0,
    tails: 0,
    total: 0,
    currentResult: null as string | null,
    isFlipping: false,
    history: [] as { flip: number; headsPercent: number; tailsPercent: number }[],
  })

  const lesson = lessonContent[params.module] || lessonContent["probability-basics"]

  const getCurrentLessonIndex = () => {
    return lessonOrder.findIndex((item) => item.lesson === params.module)
  }

  const getNextLesson = () => {
    const currentIndex = getCurrentLessonIndex()
    if (currentIndex >= 0 && currentIndex < lessonOrder.length - 1) {
      return lessonOrder[currentIndex + 1]
    }
    return null
  }

  const getPreviousLesson = () => {
    const currentIndex = getCurrentLessonIndex()
    if (currentIndex > 0) {
      return lessonOrder[currentIndex - 1]
    }
    return null
  }

  const nextLesson = getNextLesson()
  const previousLesson = getPreviousLesson()

  const currentLessonIndex = getCurrentLessonIndex()
  const totalLessons = lessonOrder.length
  const progressPercentage = currentLessonIndex >= 0 ? ((currentLessonIndex + 1) / totalLessons) * 100 : 0

  const markLessonComplete = () => {
    setIsLessonCompleted(true)
  }

  const flipCoin = () => {
    setCoinFlips((prev) => ({ ...prev, isFlipping: true }))

    setTimeout(() => {
      const isHeads = Math.random() < 0.5
      const result = isHeads ? "heads" : "tails"
      const newTotal = coinFlips.total + 1
      const newHeads = coinFlips.heads + (isHeads ? 1 : 0)
      const newTails = coinFlips.tails + (isHeads ? 0 : 1)

      const headsPercent = (newHeads / newTotal) * 100
      const tailsPercent = (newTails / newTotal) * 100

      setCoinFlips((prev) => ({
        heads: newHeads,
        tails: newTails,
        total: newTotal,
        currentResult: result,
        isFlipping: false,
        history: [...prev.history, { flip: newTotal, headsPercent, tailsPercent }].slice(-50),
      }))
    }, 200)
  }

  const resetCoinFlips = () => {
    setCoinFlips({ heads: 0, tails: 0, total: 0, currentResult: null, isFlipping: false, history: [] })
  }

  const headsPercentage = coinFlips.total > 0 ? ((coinFlips.heads / coinFlips.total) * 100).toFixed(1) : "0.0"
  const tailsPercentage = coinFlips.total > 0 ? ((coinFlips.tails / coinFlips.total) * 100).toFixed(1) : "0.0"

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/learn" className="flex items-center gap-2 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back to Learn</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Progress value={progressPercentage} className="w-32" />
              <span className="text-sm text-muted-foreground">
                {currentLessonIndex + 1} of {totalLessons}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
        <div className="space-y-4">
          <Badge variant="outline">{params.module.charAt(0).toUpperCase() + params.module.slice(1)}</Badge>
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
          <p className="text-lg text-muted-foreground">{lesson.description}</p>
        </div>

        <div className="space-y-8">
          {lesson.content.map((section, index) => (
            <Card key={index} className="p-6">
              {section.type === "text" && <p className="text-lg leading-relaxed">{section.content}</p>}

              {section.type === "definition" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                  </div>
                  <p className="text-muted-foreground bg-muted/50 p-4 rounded-lg">{section.content}</p>
                </div>
              )}

              {section.type === "formula" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-accent" />
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                  </div>
                  <div className="bg-card border border-border p-6 rounded-lg text-center">
                    <div className="font-mono">{section.content}</div>
                  </div>
                </div>
              )}

              {section.type === "interactive" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  <p className="text-muted-foreground">{section.content}</p>
                  <Card className="p-6 bg-primary/5 border-primary/20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="text-center space-y-6">
                        <div className="flex justify-center">
                          <div className="w-20 h-20 flex items-center justify-center bg-primary/10 rounded-full border-2 border-primary/20 relative overflow-hidden">
                            <div
                              className={`text-4xl absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                                coinFlips.isFlipping ? "" : coinFlips.currentResult ? "scale-110" : "scale-100"
                              }`}
                              style={{
                                transformStyle: "preserve-3d",
                                animation: coinFlips.isFlipping ? "flipCoin 0.2s ease-in-out" : "none",
                              }}
                            >
                              {coinFlips.isFlipping
                                ? "🪙"
                                : coinFlips.currentResult === "heads"
                                  ? "👑"
                                  : coinFlips.currentResult === "tails"
                                    ? "🪙"
                                    : "🪙"}
                            </div>
                          </div>
                        </div>

                        <style jsx>{`
                          @keyframes flipCoin {
                            0% { transform: rotateY(0deg) scale(1); }
                            50% { transform: rotateY(90deg) scale(0.8); }
                            100% { transform: rotateY(180deg) scale(1); }
                          }
                        `}</style>

                        <div className="h-8 flex items-center justify-center">
                          {coinFlips.currentResult && !coinFlips.isFlipping && (
                            <div className="text-lg font-semibold capitalize text-primary animate-pulse">
                              {coinFlips.currentResult}!
                            </div>
                          )}
                        </div>

                        <div className="flex gap-4 justify-center">
                          <Button
                            onClick={flipCoin}
                            size="lg"
                            className="cursor-pointer"
                            disabled={coinFlips.isFlipping}
                          >
                            {coinFlips.isFlipping ? "Flipping..." : "Flip Coin"}
                          </Button>
                          <Button
                            onClick={resetCoinFlips}
                            variant="outline"
                            size="lg"
                            className="cursor-pointer bg-transparent"
                            disabled={coinFlips.isFlipping}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                          </Button>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          Total Flips: {coinFlips.total}
                          {coinFlips.total > 0 && (
                            <div className="mt-2 space-y-1">
                              <div className="text-blue-600">
                                Heads: {coinFlips.heads} ({headsPercentage}%)
                              </div>
                              <div className="text-orange-600">
                                Tails: {coinFlips.tails} ({tailsPercentage}%)
                              </div>
                            </div>
                          )}
                          {coinFlips.total > 10 && (
                            <div className="mt-2 text-xs text-primary">
                              Notice how the percentages approach 50% as you flip more coins!
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-center">Convergence to 50%</h4>
                        {coinFlips.history.length > 0 ? (
                          <div className="h-64 w-full bg-transparent rounded-lg border border-border/30 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={coinFlips.history} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={1.5} />
                                <XAxis
                                  dataKey="flip"
                                  label={{ value: "Number of Flips", position: "insideBottom", offset: -10 }}
                                  stroke="#6b7280"
                                  fontSize={11}
                                  strokeWidth={1.5}
                                />
                                <YAxis
                                  domain={[0, 100]}
                                  label={{ value: "Percentage", angle: -90, position: "insideLeft" }}
                                  stroke="#6b7280"
                                  fontSize={11}
                                  strokeWidth={1.5}
                                />
                                <Tooltip
                                  formatter={(value: number, name: string) => [
                                    `${value.toFixed(1)}%`,
                                    name === "headsPercent" ? "Heads" : "Tails",
                                  ]}
                                  contentStyle={{
                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "6px",
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                    backdropFilter: "blur(4px)",
                                  }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="headsPercent"
                                  stroke="#2563eb"
                                  strokeWidth={3}
                                  dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                                  name="headsPercent"
                                />
                                <Line
                                  type="monotone"
                                  dataKey="tailsPercent"
                                  stroke="#ea580c"
                                  strokeWidth={3}
                                  dot={{ fill: "#ea580c", strokeWidth: 2, r: 4 }}
                                  name="tailsPercent"
                                />
                                <Line
                                  type="monotone"
                                  dataKey={() => 50}
                                  stroke="#6b7280"
                                  strokeWidth={2}
                                  strokeDasharray="8 4"
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-64 flex items-center justify-center text-muted-foreground border border-dashed border-border/50 rounded-lg bg-transparent">
                            Start flipping to see the convergence chart!
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground text-center">
                          The dashed line shows the theoretical 50% probability. Watch how the actual percentages
                          converge to this line!
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </Card>
          ))}
        </div>

        {!isLessonCompleted && (
          <div className="flex justify-center pt-4">
            <Button onClick={markLessonComplete} size="lg" className="cursor-pointer">
              Mark Lesson Complete
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between pt-8 border-t border-border">
          {previousLesson ? (
            <Link href={`/learn/${previousLesson.lesson}`}>
              <Button variant="outline" className="cursor-pointer bg-transparent">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            </Link>
          ) : (
            <Button variant="outline" disabled className="cursor-not-allowed bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}

          <div className="flex items-center gap-2">
            {isLessonCompleted ? (
              <>
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-sm">Lesson Complete</span>
              </>
            ) : (
              <>
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                <span className="text-sm text-muted-foreground">In Progress</span>
              </>
            )}
          </div>

          {nextLesson ? (
            <Link href={`/learn/${nextLesson.lesson}`}>
              <Button className="cursor-pointer" disabled={!isLessonCompleted}>
                Next Lesson
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button disabled className="cursor-not-allowed">
              Course Complete!
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
