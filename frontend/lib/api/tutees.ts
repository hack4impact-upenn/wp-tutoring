import type {
  TuteeApplication,
  AvailabilitySlot,
  TutoringFormat,
  GenderPreference,
  SiblingPreference,
  ApplicationStatus,
} from "@/lib/types"
import { apiFetch } from "./client"

export async function getTutees(): Promise<TuteeApplication[]> {
  return apiFetch<TuteeApplication[]>("/api/tutees")
}

export async function lookupTuteeByParentEmail(
  parentEmail: string
): Promise<TuteeApplication | null> {
  try {
    return await apiFetch<TuteeApplication>(
      `/api/tutees/lookup?parentEmail=${encodeURIComponent(parentEmail)}`
    )
  } catch (err) {
    if (err instanceof Error && "status" in err && (err as { status: number }).status === 404) {
      return null
    }
    throw err
  }
}

export async function createTutee(payload: {
  studentFirstName: string
  studentLastName: string
  studentAge: number
  studentGrade: string
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  parentPhone?: string
  availability: AvailabilitySlot[]
  format: TutoringFormat
  subjects: string[]
  genderPreference: GenderPreference
  siblingNames?: string
  siblingPreference: SiblingPreference
  previousTutorNames?: string
  additionalNotes?: string
}): Promise<TuteeApplication> {
  return apiFetch<TuteeApplication>("/api/tutees", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function patchTuteeStatus(
  tuteeId: string,
  applicationStatus: ApplicationStatus,
  token: string,
  draftId: string,
): Promise<TuteeApplication> {
  return apiFetch<TuteeApplication>(`/api/tutees/${encodeURIComponent(tuteeId)}`, {
    method: "PATCH",
    body: JSON.stringify({ applicationStatus, draft_id: draftId }),
    headers: { Authorization: `Bearer ${token}` },
  })
}
