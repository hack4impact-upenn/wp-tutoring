import type { Tutor, Tutee } from "../types"

export function formatTutorName(t: Tutor): string {
  return `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() || "—"
}

/** Student (child) name on a tutee application. */
export function formatTuteeStudentName(t: Tutee): string {
  return `${t.studentFirstName ?? ""} ${t.studentLastName ?? ""}`.trim() || "—"
}

export function tutorPrimaryEmail(t: Tutor): string {
  return t.email ?? ""
}

export function tuteePrimaryEmail(t: Tutee): string {
  return t.parentEmail ?? ""
}

/** Single-line label for selects and dialogs (name + email when present). */
export function formatTutorLabel(t: Tutor): string {
  const name = formatTutorName(t)
  const em = tutorPrimaryEmail(t)
  return em ? `${name} (${em})` : name
}

export function formatTuteeLabel(t: Tutee): string {
  const name = formatTuteeStudentName(t)
  const em = tuteePrimaryEmail(t)
  return em ? `${name} (${em})` : name
}
