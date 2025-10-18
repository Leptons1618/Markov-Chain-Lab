import { type NextRequest, NextResponse } from "next/server"
import { courses } from "../courses/route"

// Shared lesson storage
export const lessons: any[] = [
  {
    id: "1",
    courseId: "chains",
    title: "What is a Markov Chain?",
    description: "Understanding the fundamental concept",
    content: `# Markov Chains Explained

A Markov chain is a stochastic model describing a sequence of possible events in which the probability of each event depends only on the state attained in the previous event.

## Key Properties

1. **Memoryless Property**: The future state depends only on the current state, not on the sequence of events that preceded it.
2. **State Space**: The set of all possible states the system can be in.
3. **Transition Probabilities**: The probability of moving from one state to another.

## Mathematical Definition

A Markov chain is defined by:
- A finite set of states S = {s₁, s₂, ..., sₙ}
- A transition matrix P where P(i,j) represents the probability of transitioning from state i to state j
- An initial state distribution

## Example: Weather Model

Consider a simple weather model with two states:
- Sunny (S)
- Rainy (R)

The transition probabilities might be:
- P(S→S) = 0.7 (70% chance sunny day follows sunny day)
- P(S→R) = 0.3 (30% chance rainy day follows sunny day)
- P(R→S) = 0.4 (40% chance sunny day follows rainy day)
- P(R→R) = 0.6 (60% chance rainy day follows rainy day)`,
    status: "published",
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    courseId: "chains",
    title: "State Transitions",
    description: "How states change over time",
    content: `# State Transitions

State transitions are the core mechanism of Markov chains. They define how the system moves from one state to another over time.

## Transition Probabilities

Each transition has an associated probability that must satisfy:
- 0 ≤ P(i,j) ≤ 1 for all i, j
- Σ P(i,j) = 1 for all i (rows sum to 1)

## Transition Matrix

The transition matrix P is a square matrix where:
- Rows represent current states
- Columns represent next states
- P(i,j) = probability of transitioning from state i to state j`,
    status: "published",
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Update course lesson counts
function updateCourseLessonCounts() {
  courses.forEach(course => {
    const courseLessons = lessons.filter(l => l.courseId === course.id)
    course.lessons = courseLessons.length
  })
}

// GET all lessons or filter by courseId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")

    let filtered = lessons
    if (courseId) {
      filtered = lessons.filter((l) => l.courseId === courseId)
    }

    return NextResponse.json({ success: true, data: filtered })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch lessons" }, { status: 500 })
  }
}

// POST create new lesson
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, title, description, content } = body

    if (!courseId || !title || !description) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Verify course exists
    const course = courses.find(c => c.id === courseId)
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 })
    }

    const newLesson = {
      id: Date.now().toString(),
      courseId,
      title,
      description,
      content: content || "",
      status: "draft",
      order: lessons.filter((l) => l.courseId === courseId).length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    lessons.push(newLesson)
    updateCourseLessonCounts()
    
    return NextResponse.json({ success: true, data: newLesson }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create lesson" }, { status: 500 })
  }
}
