import { NextResponse } from "next/server"
import { getMatches, dropMatch, clearMatches } from "@/lib/data/store"
import { runAutoMatch } from "@/lib/data/matching"

export async function GET() {
  return NextResponse.json(getMatches())
}

export async function POST() {
  const newMatches = runAutoMatch()
  return NextResponse.json({
    newMatches,
    allMatches: getMatches(),
  })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get("id")
  if (matchId === "all") {
    clearMatches()
  } else if (matchId) {
    dropMatch(matchId)
  }
  return NextResponse.json(getMatches())
}
