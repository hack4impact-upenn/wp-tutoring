"use client"

import type { ReactNode } from "react"
import type { Tutor, Tutee } from "../types"
import { toArray, toSlotArray } from "../types"
import { formatTutorName, formatTuteeStudentName } from "../utils/person-display"

function SimilarityField({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null
  return (
    <div className="min-w-0 space-y-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap break-words text-sm">{value}</dd>
    </div>
  )
}

function joinList(val: unknown): string | null {
  const arr = toArray(val)
  return arr.length ? arr.join(", ") : null
}

/** One slot per line for side-by-side readability. */
function preferredTimesText(slots: unknown): string | null {
  const s = toSlotArray(slots)
  if (!s.length) return null
  return s
    .map((x) => `${x.day} ${x.time}`.trim())
    .filter(Boolean)
    .join("\n")
}

export function MatchSimilaritiesView({ tutor, tutee }: { tutor: Tutor; tutee: Tutee }) {
  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-2 md:gap-6">
      <section className="min-w-0 space-y-3 rounded-lg border border-border bg-background p-4">
        <h3 className="border-b border-border pb-2 text-sm font-semibold text-foreground">Tutor</h3>
        <p className="text-sm font-medium leading-snug">{formatTutorName(tutor)}</p>
        <dl className="space-y-3">
          <SimilarityField
            label="Subjects they can teach"
            value={joinList(tutor.subjects ?? tutor.subjectList)}
          />
          <SimilarityField label="Session format" value={tutor.format} />
          <SimilarityField label="Preferred times" value={preferredTimesText(tutor.availability)} />
          <SimilarityField label="Grade levels comfortable with" value={joinList(tutor.gradePrefs)} />
          <SimilarityField label="Student age ranges" value={joinList(tutor.ageRanges)} />
          <SimilarityField label="Tutor gender" value={tutor.tutorGender} />
          <SimilarityField
            label="AP / IB ready"
            value={tutor.apIbReady == null ? null : tutor.apIbReady ? "Yes" : "No"}
          />
        </dl>
      </section>
      <section className="min-w-0 space-y-3 rounded-lg border border-border bg-background p-4">
        <h3 className="border-b border-border pb-2 text-sm font-semibold text-foreground">Tutee</h3>
        <p className="text-sm font-medium leading-snug">{formatTuteeStudentName(tutee)}</p>
        <dl className="space-y-3">
          <SimilarityField
            label="Subjects they need help with"
            value={joinList(tutee.subjectNeeds ?? tutee.subjects)}
          />
          <SimilarityField label="Session format" value={tutee.format} />
          <SimilarityField
            label="Preferred times"
            value={preferredTimesText(tutee.availability ?? tutee.preferredTimeSlots)}
          />
          <SimilarityField label="Grade" value={tutee.studentGrade ?? tutee.grade} />
          <SimilarityField
            label="Tutor gender preference"
            value={tutee.genderPreference ?? tutee.requiredGender}
          />
        </dl>
      </section>
    </div>
  )
}
