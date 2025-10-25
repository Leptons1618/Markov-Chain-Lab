// Centralized store for courses and lessons used by API routes.
// In dev/local, we persist to a JSON file (data/lms.json) and also keep an in-memory singleton via globalThis.
// This avoids state loss on server restarts while keeping things lightweight.

import fs from "node:fs"
import { promises as fsp } from "node:fs"
import path from "node:path"

export type Course = {
  id: string
  title: string
  description: string
  slug: string
  lessons: number
  status: "draft" | "published"
  createdAt: Date
  updatedAt: Date
}

export type Lesson = {
  id: string
  courseId: string
  title: string
  description: string
  content: string
  status: "draft" | "published"
  order: number
  createdAt: Date
  updatedAt: Date
}

type Store = {
  courses: Course[]
  lessons: Lesson[]
}

declare global {
  // eslint-disable-next-line no-var
  var __lmsStore: Store | undefined
  // Track last known mtime of data file to allow hot-reloading when the JSON is edited manually
  // eslint-disable-next-line no-var
  var __lmsStoreMtime: number | undefined
}

function seedStore(): Store {
  const courses: Course[] = [
    {
      id: "foundations",
      title: "Foundations",
      description: "Basic probability and mathematical concepts",
      slug: "foundations",
      lessons: 4,
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "chains",
      title: "Markov Chain Basics",
      description: "Introduction to Markov chains and state transitions",
      slug: "markov-chain-basics",
      lessons: 5,
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const lessons: Lesson[] = [
    {
      id: "1",
      courseId: "chains",
      title: "What is a Markov Chain?",
      description: "Understanding the fundamental concept",
      content: `# Markov Chains Explained\n\nA Markov chain is a stochastic model describing a sequence of possible events in which the probability of each event depends only on the state attained in the previous event.\n\n## Key Properties\n\n1. **Memoryless Property**: The future state depends only on the current state, not on the sequence of events that preceded it.\n2. **State Space**: The set of all possible states the system can be in.\n3. **Transition Probabilities**: The probability of moving from one state to another.\n\n## Mathematical Definition\n\nA Markov chain is defined by:\n- A finite set of states S = {s₁, s₂, ..., sₙ}\n- A transition matrix P where P(i,j) represents the probability of transitioning from state i to state j\n- An initial state distribution\n\n## Example: Weather Model\n\nConsider a simple weather model with two states:\n- Sunny (S)\n- Rainy (R)\n\nThe transition probabilities might be:\n- P(S→S) = 0.7 (70% chance sunny day follows sunny day)\n- P(S→R) = 0.3 (30% chance rainy day follows sunny day)\n- P(R→S) = 0.4 (40% chance sunny day follows rainy day)\n- P(R→R) = 0.6 (60% chance rainy day follows rainy day)`,
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
      content: `# State Transitions\n\nState transitions are the core mechanism of Markov chains. They define how the system moves from one state to another over time.\n\n## Transition Probabilities\n\nEach transition has an associated probability that must satisfy:\n- 0 ≤ P(i,j) ≤ 1 for all i, j\n- Σ P(i,j) = 1 for all i (rows sum to 1)\n\n## Transition Matrix\n\nThe transition matrix P is a square matrix where:\n- Rows represent current states\n- Columns represent next states\n- P(i,j) = probability of transitioning from state i to state j`,
      status: "published",
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  return { courses, lessons }
}

// ---------- Persistence helpers (JSON file) ----------
const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "lms.json")

type PersistedCourse = Omit<Course, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}
type PersistedLesson = Omit<Lesson, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}
type PersistedStore = {
  courses: PersistedCourse[]
  lessons: PersistedLesson[]
}

function reviveDates(store: PersistedStore): Store {
  return {
    courses: store.courses.map((c) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
    })),
    lessons: store.lessons.map((l) => ({
      ...l,
      createdAt: new Date(l.createdAt),
      updatedAt: new Date(l.updatedAt),
    })),
  }
}

async function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    await fsp.mkdir(DATA_DIR, { recursive: true })
  }
}

function computeLessonCounts(store: Store) {
  store.courses.forEach((course) => {
    course.lessons = store.lessons.filter((l) => l.courseId === course.id).length
  })
}

function loadFromDiskSync(): Store | null {
  try {
    if (!fs.existsSync(DATA_FILE)) return null
    const stat = fs.statSync(DATA_FILE)
    const raw = fs.readFileSync(DATA_FILE, "utf8")
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedStore
    const revived = reviveDates(parsed)
    computeLessonCounts(revived)
    // remember mtime
    globalThis.__lmsStoreMtime = stat.mtimeMs
    return revived
  } catch {
    // Fallback to seed if file is corrupt
    return null
  }
}

export async function saveStore() {
  try {
    const store = getStore()
    // Recompute counts to be safe before saving
    computeLessonCounts(store)
    const serializable: PersistedStore = {
      courses: store.courses.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      lessons: store.lessons.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
    }
    await ensureDataDir()
    await fsp.writeFile(DATA_FILE, JSON.stringify(serializable, null, 2), "utf8")
    // update mtime cache
    try {
      const stat = await fsp.stat(DATA_FILE)
      globalThis.__lmsStoreMtime = stat.mtimeMs
    } catch {}
  } catch {
    // Swallow write errors in dev; state remains in-memory
  }
}

export function getStore(): Store {
  // Initialize from disk or seed on first access
  if (!globalThis.__lmsStore) {
    const loaded = loadFromDiskSync()
    globalThis.__lmsStore = loaded ?? seedStore()
    // Best-effort: write initial state if file didn't exist
    void saveStore()
  } else {
    // If file exists and has been modified externally, hot-reload it into memory
    try {
      if (fs.existsSync(DATA_FILE)) {
        const stat = fs.statSync(DATA_FILE)
        if (!globalThis.__lmsStoreMtime || stat.mtimeMs > globalThis.__lmsStoreMtime) {
          const reloaded = loadFromDiskSync()
          if (reloaded) {
            globalThis.__lmsStore = reloaded
          }
        }
      }
    } catch {
      // Ignore reload errors; keep current in-memory state
    }
  }
  return globalThis.__lmsStore
}

export function updateCourseLessonCounts() {
  const store = getStore()
  computeLessonCounts(store)
}
