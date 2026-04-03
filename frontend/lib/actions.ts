import type {
  TutorApplication,
  TuteeApplication,
  AvailabilitySlot,
  TutoringFormat,
  AgeRange,
  GenderPreference,
  SiblingPreference,
} from "@/lib/types"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

export class APIError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const detail = errorData?.detail
    const message =
      (typeof detail === "string" ? detail : Array.isArray(detail) ? JSON.stringify(detail) : detail?.message) ||
      errorData?.error ||
      `API request failed: ${response.status}`
    throw new APIError(message, response.status)
  }

  return response.json()
}

// ------------------------------------------------------------
// Tutors
// ------------------------------------------------------------

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
    if (err instanceof APIError && err.status === 404) {
      return null
    }
    throw err
  }
}

// ------------------------------------------------------------
// Tutees
// ------------------------------------------------------------

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
    if (err instanceof APIError && err.status === 404) {
      return null
    }
    throw err
  }
}

// ------------------------------------------------------------
// Admin Auth
// ------------------------------------------------------------

export async function adminLogin(email: string, password: string): Promise<{
  ok: boolean
  token: string
  admin: { _id: string; name: string; email: string; role: string }
}> {
  return apiFetch("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function adminMe(token: string): Promise<{
  _id: string; name: string; email: string; role: string
}> {
  return apiFetch("/api/admin/me", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// ------------------------------------------------------------
// Matching & assignments
// ------------------------------------------------------------

export type AssignmentTutorDetail = Partial<TutorApplication> & {
  _id?: string
  maxCapacity?: number
  tutorGender?: string
  apIbReady?: boolean
  returningStudentIds?: string[]
  subjectList?: string[]
  gradePrefs?: string[]
}

export type AssignmentTuteeDetail = Partial<TuteeApplication> & {
  _id?: string
  requiredTutorId?: string | null
  preferredTutorId?: string | null
  familyId?: string | null
  requiredGender?: string
  returningStatus?: string
  subjectNeeds?: string[]
  grade?: string
  preferredTimeSlots?: AvailabilitySlot[]
}

export interface AssignmentRow {
  id: string
  tutor_id?: string | null
  student_id?: string | null
  section_id?: string | null
  semester?: string
  manual_override?: boolean
  pairScore?: number | null
  scoreExplanation?: {
    totalSoftScore?: number
    summary?: string
    breakdown?: Array<{ code?: string; points?: number; label?: string }>
  } | null
  reason?: string | null
  tutor_name?: string
  student_name?: string
  tutor_email?: string
  student_email?: string
  tutorDetail?: AssignmentTutorDetail | null
  tuteeDetail?: AssignmentTuteeDetail | null
}

export interface RunMatchingResult {
  semester: string
  assignmentsCount: number
  matchingMode?: string
  assignedStudentCount?: number
  totalStudentCount?: number
  assignments?: Array<{
    tutorId: string | null
    studentId: string | null
    tutorIndex?: number | null
    studentIndex?: number | null
    pairScore?: number | null
    reason?: string
    explanation?: RunMatchingResultAssignmentExplanation
  }>
  unassignedTutors: number
  unassignedStudents: number
  log: string[]
  relaxationLog: string[]
  solverStatus: string | null
  objectiveValue: number | null
}

export interface RunMatchingResultAssignmentExplanation {
  totalSoftScore?: number
  summary?: string
  breakdown?: Array<{ code?: string; points?: number; label?: string }>
}

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
