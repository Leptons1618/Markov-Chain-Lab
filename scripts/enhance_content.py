#!/usr/bin/env python3
"""
Content enhancement script for Markov Learning Lab
Removes emoji icons, adds depth, pedagogical terminology, and pop culture references
"""

import json
import re

def remove_emoji_lines(content):
    """Remove lines that start with emoji icons"""
    lines = content.split('\n')
    cleaned = []
    for line in lines:
        # Skip lines starting with common emojis
        if not re.match(r'^\s*[🌦️🏭💰🤖🌐📞🧬🎮🔍🩺🎲🎯🎨🔗📝✨]\s', line):
            cleaned.append(line)
    return '\n'.join(cleaned)

def fix_html_divs(content):
    """Convert problematic HTML divs to proper blockquotes or callouts"""
    # Replace div placeholders with proper blockquotes
    content = re.sub(
        r'<div style="padding: 20px;[^>]*>\s*<strong>📊\s*([^<]+)</strong><br/>\s*<em>([^<]+)</em>\s*</div>',
        r'> **💡 \1**\n> \n> *\2*',
        content,
        flags=re.DOTALL
    )
    return content

def enhance_lesson_1(content):
    """Enhance Foundations Lesson 1 with depth and pop culture"""
    enhanced = """# The Language of Uncertainty

Imagine you're Neo from *The Matrix*, standing at a crossroads. You don't know which path leads where, but you need to make a decision. This is the essence of **epistemic uncertainty** — and probability theory is your map through this stochastic landscape.

Welcome to your first lesson in probability theory! Here, we'll construct the **mathematical infrastructure** for reasoning about randomness, which will later empower us to explore how dynamical systems evolve through Markov chains.

## The Philosophical Foundation

Every decision we make operates under **incomplete information**. Consider these scenarios:

- Will it rain tomorrow? (Meteorological forecasting)
- Will your team win the championship? (Sports analytics)
- What's the probability a new startup disrupts an industry? (Risk assessment)

**Probability theory** provides us with a *rigorous axiomatic framework* to quantify these uncertainties and construct rational decision-making systems.

## The Fundamental Constructs

### Sample Space: The Universe of Possibilities

The **sample space** (denoted $\\Omega$, capital omega) represents the set of all *mutually exclusive* and *collectively exhaustive* outcomes of a random experiment.

**Formal Definition:**
```math
\\Omega = \\{\\omega_1, \\omega_2, \\ldots, \\omega_n\\}
```

where each $\\omega_i$ represents an atomic outcome.

**Example:** Rolling a standard six-sided die yields:
```math
\\Omega = \\{1, 2, 3, 4, 5, 6\\}
```

Each outcome is **equiprobable** under the assumption of fairness, embodying the **principle of indifference** (also called the **principle of insufficient reason**, attributed to Laplace).

### Events: Measurable Subsets

An **event** $A$ is a subset of the sample space — formally, an element of the **sigma-algebra** $\\mathcal{F}$ defined on $\\Omega$.

**Definition:**
```math
A \\subseteq \\Omega, \\quad A \\in \\mathcal{F}
```

**Example:** Define event $A$ = "rolling an even number"

Then:
```math
A = \\{2, 4, 6\\} \\subset \\Omega
```

Events can be:
- **Elementary** (singleton sets): $\\{3\\}$
- **Compound** (multiple outcomes): $\\{2, 4, 6\\}$
- **Certain** (the entire sample space): $\\Omega$
- **Impossible** (the empty set): $\\emptyset$

### Kolmogorov's Axioms: The Rules of the Game

In 1933, Andrey Kolmogorov established the **axiomatic foundation** of modern probability theory. Think of these as the "rules of reality" — like the laws of physics in *Star Trek*, even in alternate universes, these axioms hold.

Given a sample space $\\Omega$ and a sigma-algebra $\\mathcal{F}$, a probability measure $P: \\mathcal{F} \\to [0,1]$ satisfies:

**Axiom 1 (Non-negativity):**
```math
P(A) \\geq 0, \\quad \\forall A \\in \\mathcal{F}
```

Probabilities are never negative. This ensures **physical realizability**.

**Axiom 2 (Normalization):**
```math
P(\\Omega) = 1
```

Something must happen. The total probability mass equals unity. Like in *The Hitchhiker's Guide*, the answer may be 42, but certainty is always 1.

**Axiom 3 (Countable Additivity):**

For any countable collection of **mutually disjoint** events $\\{A_1, A_2, \\ldots\\}$:

```math
P\\left(\\bigcup_{i=1}^{\\infty} A_i\\right) = \\sum_{i=1}^{\\infty} P(A_i)
```

This is the **additivity principle** — probabilities of disjoint events sum.

> **Historical Note:** These axioms resolved centuries of philosophical debate about probability. Before Kolmogorov, probability was a mess of intuitions and paradoxes — like trying to define "time" before Einstein gave us special relativity.

## The Classical Probability Model

Under the assumption of **equally likely outcomes** (the **classical model**), we have:

```math
P(A) = \\frac{|A|}{|\\Omega|} = \\frac{\\text{favorable outcomes}}{\\text{total outcomes}}
```

where $|A|$ denotes the **cardinality** of set $A$.

### Worked Example: The Fair Coin

Consider flipping a fair coin. The sample space is:

```math
\\Omega = \\{H, T\\}
```

Assuming fairness (symmetry):
```math
P(H) = P(T) = \\frac{1}{2}
```

Verify Axiom 2:
```math
P(\\Omega) = P(H) + P(T) = \\frac{1}{2} + \\frac{1}{2} = 1 \\quad \\checkmark
```

The axioms are consistent! This simple experiment is the **prototype** for countless probability models, from quantum mechanics (spin measurements) to computer science (random bit generation).

### Worked Example: The Lucky Die

**Problem:** What is $P(A)$ where $A$ = "rolling less than 4"?

**Solution:**

Define the event explicitly:
```math
A = \\{1, 2, 3\\}
```

Since all outcomes are equiprobable under the classical model:
```math
P(A) = \\frac{|A|}{|\\Omega|} = \\frac{3}{6} = \\frac{1}{2} = 0.5
```

**Answer:** There is a 50% probability of rolling less than 4.

> **💡 Interactive Visualization Coming Soon!**
> 
> *Explore probability with dynamic Venn diagrams — drag events, adjust probabilities, and watch the axioms come to life in real-time. Like the holodeck from Star Trek, but for mathematics!*

## Applications Across Disciplines

Probability theory is not merely abstract mathematics — it's the **lingua franca** of uncertainty quantification.

**Meteorology:** Weather forecasting relies on probabilistic models to predict atmospheric dynamics. The "30% chance of rain" is a **conditional probability** statement given current observations.

**Quality Control:** Manufacturing processes use **statistical process control** (SPC) to estimate defect rates via probability distributions, minimizing Type I and Type II errors.

**Finance:** Modern portfolio theory (Markowitz, 1952) uses probability to model expected returns and risk (variance), enabling optimal asset allocation.

**Machine Learning:** Every classification algorithm — from logistic regression to deep neural networks — fundamentally computes conditional probabilities $P(y|x)$ where $y$ is the label and $x$ is the input feature vector.

**Quantum Mechanics:** The **Born rule** interprets the wavefunction $|\\psi\\rangle$ as encoding probability amplitudes, with $|\\langle x|\\psi\\rangle|^2$ giving the probability density of measuring position $x$.

## Practice Problems

> **Problem 1:** Roll a fair six-sided die. Compute $P(B)$ where $B$ = "rolling greater than 4".
> 
> **Problem 2:** A bag contains 3 red, 2 blue, and 5 green marbles. Using the classical model, calculate $P(\\text{green})$.
> 
> **Problem 3 (Challenging):** Can two mutually exclusive events $A$ and $B$ (where $A \\cap B = \\emptyset$) also be statistically independent? Prove or provide a counterexample. *Hint: Recall that independence requires $P(A \\cap B) = P(A) \\cdot P(B)$.*

## The Conceptual Map

You've now acquired the fundamental **vocabulary** of probability:

1. **Sample spaces** ($\\Omega$) define the universe of possibilities
2. **Events** ($A \\subseteq \\Omega$) represent measurable outcomes
3. **Probability measures** ($P$) satisfy Kolmogorov's three axioms
4. **Classical model** assumes equiprobable outcomes

These concepts form the **algebraic structure** upon which all of stochastic analysis rests. Like learning the alphabet before reading Shakespeare, you now have the symbols to construct probabilistic narratives.

## The Road Ahead

In our next lesson, we'll explore **conditional probability** and **Bayes' theorem** — the mathematical machinery that updates beliefs when new evidence arrives. Think of it as the "plot twist" mechanism in probability theory.

As Sherlock Holmes might say: *"When you have eliminated the impossible, whatever remains, however improbable, must be the truth."* Bayes' theorem gives us the mathematical framework to actually compute those probabilities!
"""
    return enhanced

# Load current JSON
with open('/home/lept0n5/Git/Markov-Learning-Lab/data/lms.json', 'r') as f:
    data = json.load(f)

# Enhance lessons
for lesson in data['lessons']:
    if lesson['id'] == 'foundations-1':
        lesson['content'] = enhance_lesson_1('')
        lesson['description'] = "Master the axiomatic foundation of probability: sample spaces, events, and Kolmogorov's three elegant axioms."
    
    # Remove emoji icons from all content
    lesson['content'] = remove_emoji_lines(lesson['content'])
    lesson['content'] = fix_html_divs(lesson['content'])

# Save
with open('/home/lept0n5/Git/Markov-Learning-Lab/data/lms.json', 'w') as f:
    json.dump(data, f, indent=2)

print("✅ Content enhancement complete!")
print("  - Removed emoji icons")
print("  - Enhanced Lesson 1 with depth and references")
print("  - Fixed HTML rendering issues")
