import { type NextRequest, NextResponse } from "next/server"

// Shared in-memory storage (replace with database in production)
export const courses: any[] = [
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

// GET all courses
export async function GET() {
  try {
    return NextResponse.json({ success: true, data: courses })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch courses" }, { status: 500 })
  }
}

// POST create new course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, slug } = body

    if (!title || !description) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const newCourse = {
      id: slug || title.toLowerCase().replace(/\s+/g, "-"),
      title,
      description,
      slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
      lessons: 0,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    courses.push(newCourse)
    return NextResponse.json({ success: true, data: newCourse }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create course" }, { status: 500 })
  }
}
