import { NextResponse } from "next/server"
import { getTutors, addTutor } from "@/lib/data/store"
import type { TutorApplication } from "@/lib/types"

export async function GET() {
  return NextResponse.json(getTutors())
}

export async function POST(req: Request) {
  const data = await req.json()
  const tutor: TutorApplication = {
    ...data,
    id: `tutor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }
  addTutor(tutor)
  return NextResponse.json(tutor, { status: 201 })
}
