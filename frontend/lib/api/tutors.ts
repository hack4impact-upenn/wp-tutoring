import type {
  TutorApplication,
  AvailabilitySlot,
  TutoringFormat,
  AgeRange,
  ApplicationStatus,
} from "@/lib/types"
import { apiFetch } from "./client"

export async function getTutors(): Promise<TutorApplication[]> {
  return apiFetch<TutorApplication[]>("/api/tutors")
}

export async function createTutor(payload: {
  firstName: string
  lastName: string
  email: string
  pennId?: string
  phone?: string
  year: string
  availability: AvailabilitySlot[]
  format: TutoringFormat
  subjects: string[]
  ageRanges: AgeRange[]
  previousTuteeNames?: string
  additionalNotes?: string
}): Promise<TutorApplication> {
  return apiFetch<TutorApplication>("/api/tutors", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function lookupTutorByPennId(pennId: string): Promise<TutorApplication | null> {
  try {
    return await apiFetch<TutorApplication>(
      `/api/tutors/lookup?pennId=${encodeURIComponent(pennId)}`
    )
  } catch (err) {
    if (err instanceof Error && "status" in err && (err as { status: number }).status === 404) {
      return null
    }
    throw err
  }
}

export async function patchTutorStatus(
  tutorId: string,
  applicationStatus: ApplicationStatus,
  token: string,
): Promise<TutorApplication> {
  return apiFetch<TutorApplication>(`/api/tutors/${encodeURIComponent(tutorId)}`, {
    method: "PATCH",
    body: JSON.stringify({ applicationStatus }),
    headers: { Authorization: `Bearer ${token}` },
  })
}
