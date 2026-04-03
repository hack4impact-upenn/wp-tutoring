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

class APIError extends Error {
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
    const message = errorData?.detail || errorData?.error || `API request failed: ${response.status}`
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
