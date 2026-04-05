import type {
  AdminWorkspacePayload,
  AssignmentRow,
  IndividualMatchResponse,
  MatchingDraft,
  RunMatchingResult,
} from "@/lib/types"
import { apiFetch } from "./client"

// ── Admin workspace (bundled) ───────────────────────────────────────

export async function getAdminWorkspace(
  token: string,
  draftId?: string | null,
): Promise<AdminWorkspacePayload> {
  const params = new URLSearchParams()
  if (draftId) params.set("draft_id", draftId)
  const q = params.toString()
  return apiFetch<AdminWorkspacePayload>(
    `/api/admin/dashboard/workspace${q ? `?${q}` : ""}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
}

// ── Bulk operations ────────────────────────────────────────────────

export async function acceptAll(
  collection: "tutors" | "tutees",
  draftId: string,
  token: string,
): Promise<{ ok: boolean; modifiedCount: number }> {
  return apiFetch<{ ok: boolean; modifiedCount: number }>("/api/applications/accept-all", {
    method: "POST",
    body: JSON.stringify({ draft_id: draftId, collection }),
    headers: { Authorization: `Bearer ${token}` },
  })
}

// ── Drafts ─────────────────────────────────────────────────────────

export async function getDrafts(semester?: string): Promise<MatchingDraft[]> {
  const q = semester ? `?semester=${encodeURIComponent(semester)}` : ""
  return apiFetch<MatchingDraft[]>(`/api/drafts${q}`)
}

export async function createDraft(
  name: string,
  token: string,
  semester?: string,
): Promise<MatchingDraft> {
  return apiFetch<MatchingDraft>("/api/drafts", {
    method: "POST",
    body: JSON.stringify({ name, semester: semester ?? null }),
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function renameDraft(
  draftId: string,
  name: string,
  token: string,
): Promise<MatchingDraft> {
  return apiFetch<MatchingDraft>(`/api/drafts/${encodeURIComponent(draftId)}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function deleteDraft(draftId: string, token: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/drafts/${encodeURIComponent(draftId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function duplicateDraft(
  draftId: string,
  name: string,
  token: string,
): Promise<MatchingDraft> {
  return apiFetch<MatchingDraft>(`/api/drafts/${encodeURIComponent(draftId)}/duplicate`, {
    method: "POST",
    body: JSON.stringify({ name }),
    headers: { Authorization: `Bearer ${token}` },
  })
}

// ── Assignments ────────────────────────────────────────────────────

export async function getAssignments(draftId: string, semester?: string): Promise<AssignmentRow[]> {
  const params = new URLSearchParams({ draft_id: draftId })
  if (semester) params.set("semester", semester)
  return apiFetch<AssignmentRow[]>(`/api/assignments?${params}`)
}

export async function runMatching(
  payload: { semester?: string; draftId: string },
): Promise<RunMatchingResult> {
  return apiFetch<RunMatchingResult>("/api/run-matching", {
    method: "POST",
    body: JSON.stringify({ semester: payload.semester ?? null, draft_id: payload.draftId }),
  })
}

export async function reassignMatch(
  params: { matchId: string; tutorId: string; studentId: string; semester?: string; draftId: string },
  token: string,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/api/assignments/reassign", {
    method: "POST",
    body: JSON.stringify({
      match_id: params.matchId,
      tutor_id: params.tutorId,
      student_id: params.studentId,
      semester: params.semester ?? null,
      draft_id: params.draftId,
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
    draft_id: string
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
      draft_id: body.draft_id,
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
    draftId: string
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
      draft_id: params.draftId,
    }),
    headers: { Authorization: `Bearer ${token}` },
  })
}
