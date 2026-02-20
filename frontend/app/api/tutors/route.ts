import { NextResponse } from "next/server"
import { getTutors, addTutor } from "@/lib/data/store"
import type { TutorApplication } from "@/lib/types"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8001"

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/tutors`)
    if (res.ok) {
      const tutors = await res.json()
      return NextResponse.json(tutors)
    }
  } catch {
    // Backend unreachable; fall back to in-memory store
  }
  return NextResponse.json(getTutors())
}

export async function POST(req: Request) {
  const data = await req.json()

  // Map form fields to backend API shape
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ").trim()
  const backendPayload = {
    name: name || data.name,
    email: data.email ?? "",
    phone: data.phone ?? "",
    availability: Array.isArray(data.availability)
      ? JSON.stringify(data.availability)
      : (data.availability ?? ""),
    subjects: data.subjects ?? [],
    grade_levels: data.ageRanges ?? [],
    previous_student_ids: data.previousTuteeNames ?? "",
    preferences: [data.format, data.year, data.additionalNotes]
      .filter(Boolean)
      .join("; ") || "",
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/tutors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backendPayload),
    })
    const responseData = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: responseData.error ?? "Failed to submit" },
        { status: res.status }
      )
    }
    // Optionally keep in-memory store in sync for local state
    const tutor: TutorApplication = {
      ...data,
      id: String(responseData.id ?? `tutor-${Date.now()}`),
      createdAt: new Date().toISOString(),
    }
    addTutor(tutor)
    return NextResponse.json(
      { id: responseData.id, message: responseData.message ?? "Application submitted." },
      { status: 201 }
    )
  } catch {
    // Backend unreachable: fall back to in-memory so form still works offline
    const tutor: TutorApplication = {
      ...data,
      id: `tutor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    }
    addTutor(tutor)
    return NextResponse.json(tutor, { status: 201 })
  }
}
