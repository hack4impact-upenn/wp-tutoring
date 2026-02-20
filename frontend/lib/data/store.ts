import type { TutorApplication, TuteeApplication, Match } from "@/lib/types"

// In-memory store (replace with a DB integration later)
let tutors: TutorApplication[] = []
let tutees: TuteeApplication[] = []
let matches: Match[] = []

export function getTutors() {
  return tutors
}
export function getTutees() {
  return tutees
}
export function getMatches() {
  return matches
}

export function setTutors(data: TutorApplication[]) {
  tutors = data
}
export function setTutees(data: TuteeApplication[]) {
  tutees = data
}
export function setMatches(data: Match[]) {
  matches = data
}

export function addTutor(tutor: TutorApplication) {
  tutors.push(tutor)
}
export function addTutee(tutee: TuteeApplication) {
  tutees.push(tutee)
}

export function addMatches(newMatches: Match[]) {
  matches = [...matches, ...newMatches]
}

export function dropMatch(matchId: string) {
  matches = matches.filter((m) => m.id !== matchId)
}

export function clearMatches() {
  matches = []
}
