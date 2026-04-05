import type { AssignmentRow, IndividualMatchResponse, RunMatchingResult } from "@/lib/types"
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

export async function previewIndividualMatch(
  body: {
    fixed_tutor_id?: string | null
    fixed_tutee_id?: string | null
    candidate_tutor_ids?: string[]
    candidate_tutee_ids?: string[]
    semester?: string | null
  },
  token: string,
): Promise<IndividualMatchResponse> {
  return apiFetch<IndividualMatchResponse>("/api/assignments/individual-match", {
    method: "POST",
    body: JSON.stringify({
      fixed_tutor_id: body.fixed_tutor_id ?? null,
      fixed_tutee_id: body.fixed_tutee_id ?? null,
      candidate_tutor_ids: body.candidate_tutor_ids ?? [],
      candidate_tutee_ids: body.candidate_tutee_ids ?? [],
      semester: body.semester ?? null,
    }),
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function overrideAssignment(
  params: {
    tutorId: string
    studentId: string
    semester?: string | null
    sectionId?: string | null
  },
  token: string,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/api/assignments/override", {
    method: "POST",
    body: JSON.stringify({
      tutor_id: params.tutorId,
      student_id: params.studentId,
      semester: params.semester ?? null,
      section_id: params.sectionId ?? null,
    }),
    headers: { Authorization: `Bearer ${token}` },
  })
}
