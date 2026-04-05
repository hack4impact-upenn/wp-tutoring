import type { AssignmentRow, RunMatchingResult } from "@/lib/types"
import { apiFetch } from "./client"

export async function getAssignments(semester?: string): Promise<AssignmentRow[]> {
  const q = semester ? `?semester=${encodeURIComponent(semester)}` : ""
  return apiFetch<AssignmentRow[]>(`/api/assignments${q}`)
}

export async function runMatching(payload: { semester?: string } = {}): Promise<RunMatchingResult> {
  return apiFetch<RunMatchingResult>("/api/run-matching", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function reassignMatch(
  params: { matchId: string; tutorId: string; studentId: string; semester?: string },
  token: string,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/api/assignments/reassign", {
    method: "POST",
    body: JSON.stringify({
      match_id: params.matchId,
      tutor_id: params.tutorId,
      student_id: params.studentId,
      semester: params.semester ?? null,
    }),
    headers: { Authorization: `Bearer ${token}` },
  })
}
