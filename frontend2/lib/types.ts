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

export interface AvailabilitySlot {
  day: DayOfWeek
  time: TimeSlot
}

export interface TutorApplication {
  id: string
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
}

export interface TuteeApplication {
  id: string
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
}

export interface Match {
  id: string
  tutor: TutorApplication
  tutee: TuteeApplication
  matchedSlot: AvailabilitySlot
  score: number
  reasons: string[]
}

