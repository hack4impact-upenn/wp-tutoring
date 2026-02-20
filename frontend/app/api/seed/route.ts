import { NextResponse } from "next/server"
import { getTutors, getTutees } from "@/lib/data/store"
import { seedData } from "@/lib/data/seed"

export async function POST() {
  seedData()
  return NextResponse.json({
    tutors: getTutors().length,
    tutees: getTutees().length,
  })
}
