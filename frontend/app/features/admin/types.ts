import type { ApplicationStatus } from "@/lib/types"

export interface Tutor {
  _id?: string
  id?: string
  applicationStatus?: ApplicationStatus
  firstName?: string
  lastName?: string
  email?: string
  pennId?: string
  year?: string
  format?: string
  subjects?: string[]
  /** Populated on assignment snapshots from the matcher */
  subjectList?: string[]
  gradePrefs?: string[]
  availability?: { day: string; time: string }[]
  ageRanges?: string[]
  maxCapacity?: number
  tutorGender?: string
  apIbReady?: boolean
  returningStudentIds?: string[]
  phone?: string
  previousTuteeNames?: string
  additionalNotes?: string
  createdAt?: string
  updatedAt?: string
}

export interface Tutee {
  _id?: string
  id?: string
  applicationStatus?: ApplicationStatus
  studentFirstName?: string
  studentLastName?: string
  studentGrade?: string
  grade?: string
  studentAge?: number
  parentFirstName?: string
  parentLastName?: string
  parentEmail?: string
  parentPhone?: string
  format?: string
  subjects?: string[]
  subjectNeeds?: string[]
  availability?: { day: string; time: string }[]
  preferredTimeSlots?: { day: string; time: string }[]
  genderPreference?: string
  requiredGender?: string
  siblingNames?: string
  siblingPreference?: string
  familyId?: string | null
  requiredTutorId?: string | null
  preferredTutorId?: string | null
  returningStatus?: string
  previousTutorNames?: string
  additionalNotes?: string
  createdAt?: string
  updatedAt?: string
}

export function getId(doc: { _id?: string; id?: string }): string {
  return doc._id || doc.id || ""
}

export function toArray(val: unknown): string[] {
  if (Array.isArray(val)) return val
  if (typeof val === "string" && val) return val.split(",").map(s => s.trim()).filter(Boolean)
  return []
}

export function toSlotArray(val: unknown): { day: string; time: string }[] {
  if (Array.isArray(val)) return val
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  }
  return []
}
