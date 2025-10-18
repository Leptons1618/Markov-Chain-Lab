# Lesson Outlines and Mapping

This document maps the current prototype lessons to structured content items and sources.

## Foundations

1. Probability Refresher
   - Topics: sample space, axioms, conditional probability, Bayes, LOTP, expectation/variance, LLN.
   - Interactive: Coin flip simulation + convergence chart.
   - Sources: Grinstead & Snell (open), MIT OCW probability notes.

2. States and Transitions
   - Topics: state space, one-step transition probabilities, row sums.
   - Interactive: Weather state transitions.
   - Sources: Norris ch.1; Levin–Peres–Wilmer ch.1.

3. Reading Transition Matrices
   - Topics: matrix properties; n-step transitions; power of P.
   - Sources: Grinstead & Snell ch.11; Kemeny–Snell.

4. Basic Terminology
   - Topics: stochastic process, state vector, initial distribution, Chapman–Kolmogorov.
   - Sources: Norris ch.1; LPW ch.1.

## Core Concepts

5. Markov Property
   - Topics: memorylessness, time-homogeneous chains, examples/non-examples.
   - Sources: Norris ch.1.

6. Discrete vs Continuous Time
   - Topics: DTMC vs CTMC; generator matrix; exponential holding times.
   - Sources: Norris ch.2; standard CTMC notes.

7. Finite vs Infinite State Spaces
   - Topics: birth–death processes; implications for convergence.
   - Sources: LPW ch.2; Norris ch.2–3.

8. Classification of States
   - Topics: accessibility, communication classes, transient/recurrent, absorbing, period.
   - Sources: Norris ch.1–2; Grinstead & Snell ch.11.

## Advanced Topics

9. Steady-State Analysis
   - Topics: stationary/limiting distributions; fundamental matrix for absorbing chains.
   - Sources: Kemeny–Snell; Norris ch.1–3.

10. Convergence Properties
    - Topics: ergodicity, mixing time, spectral gap, total variation.
    - Sources: LPW ch.4; spectral methods.

11. Ergodic Theory Basics
    - Topics: invariant measure; Birkhoff; mixing.
    - Sources: standard ergodic notes; measure-theory prerequisites.

12. Hidden Markov Models
    - Topics: components; forward/Viterbi; applications.
    - Sources: Rabiner (1989) tutorial.

## Implementation notes

- Convert each outline into an MDX file with frontmatter:
  \`\`\`
  ---
  id: probability-basics
  module: foundations
  title: Probability Refresher
  duration: 15m
  sources:
    - type: book
      title: Introduction to Probability
      author: Grinstead & Snell
      url: http://...
  ---
  \`\`\`
- Render math with KaTeX; mention sources inline where appropriate.
- Add practice links at end of lessons and deep link to tools/examples.
