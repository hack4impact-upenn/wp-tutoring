import type {
  TutorApplication,
  TuteeApplication,
  Match,
  AvailabilitySlot,
  AgeRange,
} from "@/lib/types"
import { getTutors, getTutees, getMatches, addMatches } from "./store"

function gradeToAgeRange(grade: string): AgeRange {
  const g = grade.toLowerCase()
  if (
    g.includes("kindergarten") ||
    g.includes("1st") ||
    g.includes("2nd") ||
    g.includes("3rd")
  )
    return "K-3"
  if (
    g.includes("4th") ||
    g.includes("5th") ||
    g.includes("6th") ||
    g.includes("7th") ||
    g.includes("8th")
  )
    return "4-8"
  return "9-12"
}

function getOverlappingSlots(
  a: AvailabilitySlot[],
  b: AvailabilitySlot[]
): AvailabilitySlot[] {
  return a.filter((slotA) =>
    b.some((slotB) => slotA.day === slotB.day && slotA.time === slotB.time)
  )
}

function computeScore(
  tutor: TutorApplication,
  tutee: TuteeApplication,
  overlappingSlots: AvailabilitySlot[]
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // 1. Previous pairing (highest priority)
  if (
    tutor.previousTuteeNames &&
    tutee.previousTutorNames &&
    (tutor.previousTuteeNames
      .toLowerCase()
      .includes(tutee.studentFirstName.toLowerCase()) ||
      tutee.previousTutorNames
        .toLowerCase()
        .includes(tutor.firstName.toLowerCase()))
  ) {
    score += 100
    reasons.push("Previous pairing match")
  }

  // 2. Time overlap score
  score += overlappingSlots.length * 10
  if (overlappingSlots.length > 0) {
    reasons.push(`${overlappingSlots.length} overlapping time slot(s)`)
  }

  // 3. Format compatibility
  if (
    tutor.format === tutee.format ||
    tutor.format === "Either" ||
    tutee.format === "Either"
  ) {
    score += 15
    reasons.push("Format preference match")
  }

  // 4. Age range match
  const tuteeAgeRange = gradeToAgeRange(tutee.studentGrade)
  if (tutor.ageRanges.includes(tuteeAgeRange)) {
    score += 20
    reasons.push(`Age range match (${tuteeAgeRange})`)
  }

  // 5. Subject overlap
  const subjectOverlap = tutor.subjects.filter((s) =>
    tutee.subjects.includes(s)
  )
  if (subjectOverlap.length > 0) {
    score += subjectOverlap.length * 5
    reasons.push(`${subjectOverlap.length} subject(s) in common`)
  }

  return { score, reasons }
}

export function runAutoMatch(): Match[] {
  const tutors = getTutors()
  const tutees = getTutees()
  const matches = getMatches()

  const matchedTutorIds = new Set(matches.map((m) => m.tutor.id))
  const matchedTuteeIds = new Set(matches.map((m) => m.tutee.id))

  const availableTutors = tutors.filter((t) => !matchedTutorIds.has(t.id))
  const availableTutees = tutees.filter((t) => !matchedTuteeIds.has(t.id))

  // Score all potential pairs
  const candidates: {
    tutor: TutorApplication
    tutee: TuteeApplication
    slot: AvailabilitySlot
    score: number
    reasons: string[]
  }[] = []

  for (const tutor of availableTutors) {
    for (const tutee of availableTutees) {
      const overlappingSlots = getOverlappingSlots(
        tutor.availability,
        tutee.availability
      )
      if (overlappingSlots.length === 0) continue

      const { score, reasons } = computeScore(tutor, tutee, overlappingSlots)
      candidates.push({
        tutor,
        tutee,
        slot: overlappingSlots[0],
        score,
        reasons,
      })
    }
  }

  // Sort by score descending (greedy matching)
  candidates.sort((a, b) => b.score - a.score)

  const newlyMatchedTutors = new Set<string>()
  const newlyMatchedTutees = new Set<string>()
  const newMatches: Match[] = []

  for (const c of candidates) {
    if (
      newlyMatchedTutors.has(c.tutor.id) ||
      newlyMatchedTutees.has(c.tutee.id)
    )
      continue

    const match: Match = {
      id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tutor: c.tutor,
      tutee: c.tutee,
      matchedSlot: c.slot,
      score: c.score,
      reasons: c.reasons,
    }

    newMatches.push(match)
    newlyMatchedTutors.add(c.tutor.id)
    newlyMatchedTutees.add(c.tutee.id)
  }

  addMatches(newMatches)
  return newMatches
}

