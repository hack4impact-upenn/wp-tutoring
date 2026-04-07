import type { AssignmentRow } from "@/lib/types"
import type { Tutor, Tutee } from "./types"
import { getId } from "./types"

export const PAGE_SIZE = 15

export function matchesNameFilter(query: string, parts: (string | undefined | null)[]) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const hay = parts.map((p) => String(p ?? "").toLowerCase()).join(" ").trim()
  return hay.includes(q)
}

export function resolveTutorSnapshot(a: AssignmentRow, tutors: Tutor[]): Tutor | undefined {
  if (a.tutorDetail) return a.tutorDetail as Tutor
  if (a.tutor_id) return tutors.find((t) => getId(t) === a.tutor_id)
  return undefined
}

export function resolveTuteeSnapshot(a: AssignmentRow, tutees: Tutee[]): Tutee | undefined {
  if (a.tuteeDetail) return a.tuteeDetail as Tutee
  if (a.student_id) return tutees.find((t) => getId(t) === a.student_id)
  return undefined
}

/** Tutor/student display strings for an assignment (search + table). Use `|| "—"` in UI when empty. */
export function resolveAssignmentNames(
  a: AssignmentRow,
  tutors: Tutor[],
  tutees: Tutee[],
): { tutorName: string; studentName: string } {
  const t = resolveTutorSnapshot(a, tutors)
  const s = resolveTuteeSnapshot(a, tutees)
  const tutorName =
    [t?.firstName, t?.lastName].filter(Boolean).join(" ").trim() || a.tutor_name || ""
  const studentName =
    [s?.studentFirstName, s?.studentLastName].filter(Boolean).join(" ").trim() || a.student_name || ""
  return { tutorName, studentName }
}
