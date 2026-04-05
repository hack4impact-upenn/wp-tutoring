export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday"

export type TimeSlot =
  | "9:00 AM"
  | "10:00 AM"
  | "11:00 AM"
  | "12:00 PM"
  | "1:00 PM"
  | "2:00 PM"
  | "3:00 PM"
  | "4:00 PM"
  | "5:00 PM"
  | "6:00 PM"
  | "7:00 PM"
  | "8:00 PM"

export type AgeRange = "K-3" | "4-8" | "9-12"
export type TutoringFormat = "On-Campus" | "Off-Campus" | "Either"
export type GenderPreference = "Male" | "Female" | "No Preference"
export type SiblingPreference = "Same Section" | "Different Section" | "No Preference"

export type ApplicationStatus = "accepted" | "pending" | "waitlist"

export interface AvailabilitySlot {
  day: DayOfWeek
  time: TimeSlot
}

export interface TutorApplication {
  _id?: string
  id?: string
  firstName: string
  lastName: string
  email: string
  pennId: string
  phone: string
  year: string
  availability: AvailabilitySlot[]
  format: TutoringFormat
  subjects: string[]
  ageRanges: AgeRange[]
  previousTuteeNames: string
  additionalNotes: string
  createdAt: string
  applicationStatus?: ApplicationStatus
  updatedAt?: string
}

export interface TuteeApplication {
  _id?: string
  id?: string
  studentFirstName: string
  studentLastName: string
  studentAge: number
  studentGrade: string
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  parentPhone: string
  availability: AvailabilitySlot[]
  format: TutoringFormat
  subjects: string[]
  genderPreference: GenderPreference
  siblingNames: string
  siblingPreference: SiblingPreference
  previousTutorNames: string
  additionalNotes: string
  createdAt: string
  applicationStatus?: ApplicationStatus
  updatedAt?: string
}

export interface Match {
  id: string
  tutor: TutorApplication
  tutee: TuteeApplication
  matchedSlot: AvailabilitySlot
  score: number
  reasons: string[]
}

// --- API response types (previously in lib/actions.ts) ---

export type AdminAuthSuccess = {
  ok: boolean
  token: string
  admin: { _id: string; name: string; email: string; role: string }
}

export type AdminAccountStatus = "invited" | "created"

export interface AdminRow {
  _id: string
  name: string
  email: string
  role: string
  accountStatus: AdminAccountStatus
  invitedAt?: string | null
  createdAt?: string | null
}

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
