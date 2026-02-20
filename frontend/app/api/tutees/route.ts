import { NextResponse } from "next/server"
import { getTutees, addTutee } from "@/lib/data/store"
import type { TuteeApplication } from "@/lib/types"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8001"

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/students`)
    if (res.ok) {
      const students = await res.json()
      return NextResponse.json(students)
    }
  } catch {
    // Backend unreachable; fall back to in-memory store
  }
  return NextResponse.json(getTutees())
}

export async function POST(req: Request) {
  const data = await req.json()

  // Map form fields to backend API shape (Student)
  const studentName = [data.studentFirstName, data.studentLastName]
    .filter(Boolean)
    .join(" ")
    .trim()
  const gradeLevel = data.studentGrade
  const parsedGrade =
    gradeLevel !== undefined && gradeLevel !== "" && gradeLevel !== null
      ? parseInt(String(gradeLevel), 10)
      : null
  const backendPayload = {
    name: studentName || data.name,
    email: data.parentEmail ?? "",
    phone: data.parentPhone ?? "",
    grade_level: Number.isNaN(parsedGrade) ? null : parsedGrade,
    subjects_needed: data.subjects ?? [],
    sibling_ids: data.siblingNames ?? "",
    previous_tutor_id: null as number | null, // Form has names, not IDs
    availability: Array.isArray(data.availability)
      ? JSON.stringify(data.availability)
      : (data.availability ?? ""),
    constraints: [data.format, data.genderPreference, data.siblingPreference, data.additionalNotes]
      .filter(Boolean)
      .join("; ") || "",
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/students`, {
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
    const tutee: TuteeApplication = {
      ...data,
      id: String(responseData.id ?? `tutee-${Date.now()}`),
      createdAt: new Date().toISOString(),
    }
    addTutee(tutee)
    return NextResponse.json(
      {
        id: responseData.id,
        message: responseData.message ?? "Application submitted.",
      },
      { status: 201 }
    )
  } catch {
    // Backend unreachable: fall back to in-memory
    const tutee: TuteeApplication = {
      ...data,
      id: `tutee-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    }
    addTutee(tutee)
    return NextResponse.json(tutee, { status: 201 })
  }
}
