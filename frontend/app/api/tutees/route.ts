import { NextResponse } from "next/server"
import { getTutees, addTutee } from "@/lib/data/store"
import { getDb } from "@/lib/mongodb"
import type { TuteeApplication } from "@/lib/types"


export async function GET() {
  try {
    const db = await getDb("Users")
    const tutors = await db.collection("Tutees").find({}).toArray()
    return NextResponse.json(tutors)
  } catch (err) {
    console.error("Failed to fetch tutors:", err)
    return NextResponse.json({ error: "Failed to fetch tutors" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    const tutee: TuteeApplication = {
      ...data,
      id: `tutee-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    }

    const db = await getDb("Users")
    await db.collection("Tutees").insertOne(tutee)

    return NextResponse.json(tutee, { status: 201 })
  } catch (err) {
    console.error("Failed to save tutor:", err)
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 })
  }
}
