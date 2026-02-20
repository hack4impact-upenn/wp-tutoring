import { NextResponse } from "next/server"
import { getTutees, addTutee } from "@/lib/data/store"
import type { TuteeApplication } from "@/lib/types"

export async function GET() {
  return NextResponse.json(getTutees())
}

export async function POST(req: Request) {
  const data = await req.json()
  const tutee: TuteeApplication = {
    ...data,
    id: `tutee-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }
  addTutee(tutee)
  return NextResponse.json(tutee, { status: 201 })
}
