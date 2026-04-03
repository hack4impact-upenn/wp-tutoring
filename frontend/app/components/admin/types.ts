export interface Tutor {
  _id?: string
  id?: string
  firstName?: string
  lastName?: string
  email?: string
  pennId?: string
  year?: string
  format?: string
  subjects?: string[]
  availability?: { day: string; time: string }[]
  ageRanges?: string[]
  phone?: string
  previousTuteeNames?: string
  additionalNotes?: string
  createdAt?: string
}

export interface Tutee {
  _id?: string
  id?: string
  studentFirstName?: string
  studentLastName?: string
  studentGrade?: string
  studentAge?: number
  parentFirstName?: string
  parentLastName?: string
  parentEmail?: string
  parentPhone?: string
  format?: string
  subjects?: string[]
  availability?: { day: string; time: string }[]
  genderPreference?: string
  siblingNames?: string
  siblingPreference?: string
  previousTutorNames?: string
  additionalNotes?: string
  createdAt?: string
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
