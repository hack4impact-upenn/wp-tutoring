"use client"

import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { statusBadgeClass } from "./application-status-ui"
import type { Tutor, Tutee } from "../types"
import { toArray, toSlotArray } from "../types"

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border py-2 text-sm last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{value ?? "—"}</dd>
    </div>
  )
}

function formatSlots(t: Tutor | Tutee) {
  const slots = toSlotArray(t.availability)
  if (!slots.length) return "—"
  return slots.map((s) => `${s.day} ${s.time}`).join("; ")
}

function statusLabel(s?: string) {
  if (!s) return "Accepted"
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function ApplicationProfileDialog({
  open,
  onOpenChange,
  tutor,
  tutee,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tutor: Tutor | null
  tutee: Tutee | null
}) {
  const title =
    tutor != null
      ? `${tutor.firstName ?? ""} ${tutor.lastName ?? ""}`.trim() || "Tutor profile"
      : tutee != null
        ? `${tutee.studentFirstName ?? ""} ${tutee.studentLastName ?? ""}`.trim() || "Tutee profile"
        : "Profile"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {tutor != null && (
          <dl className="space-y-0">
            <Row
              label="Status"
              value={
                <Badge variant="outline" className={statusBadgeClass(tutor.applicationStatus)}>
                  {statusLabel(tutor.applicationStatus)}
                </Badge>
              }
            />
            <Row label="Email" value={tutor.email} />
            <Row label="Penn ID" value={tutor.pennId} />
            <Row label="Phone" value={tutor.phone} />
            <Row label="Year" value={tutor.year} />
            <Row label="Format" value={tutor.format} />
            <Row label="Subjects" value={toArray(tutor.subjects).join(", ") || "—"} />
            <Row label="Age ranges" value={toArray(tutor.ageRanges).join(", ") || "—"} />
            <Row label="Availability" value={formatSlots(tutor)} />
            <Row label="Max capacity" value={tutor.maxCapacity != null ? String(tutor.maxCapacity) : "—"} />
            <Row label="Tutor gender" value={tutor.tutorGender} />
            <Row
              label="AP / IB ready"
              value={
                tutor.apIbReady === true ? "Yes" : tutor.apIbReady === false ? "No" : "—"
              }
            />
            <Row label="Subject list (matcher)" value={toArray(tutor.subjectList).join(", ") || "—"} />
            <Row label="Grade preferences" value={toArray(tutor.gradePrefs).join(", ") || "—"} />
            <Row
              label="Returning student IDs"
              value={tutor.returningStudentIds?.length ? tutor.returningStudentIds.join(", ") : "—"}
            />
            <Row label="Previous tutees" value={tutor.previousTuteeNames} />
            <Row label="Additional notes" value={tutor.additionalNotes} />
            <Row label="Created" value={tutor.createdAt} />
            <Row label="Updated" value={tutor.updatedAt} />
          </dl>
        )}

        {tutee != null && tutor == null && (
          <dl className="space-y-0">
            <Row
              label="Status"
              value={
                <Badge variant="outline" className={statusBadgeClass(tutee.applicationStatus)}>
                  {statusLabel(tutee.applicationStatus)}
                </Badge>
              }
            />
            <Row label="Student grade" value={tutee.studentGrade ?? tutee.grade} />
            <Row label="Student age" value={tutee.studentAge != null ? String(tutee.studentAge) : "—"} />
            <Row
              label="Parent"
              value={`${tutee.parentFirstName ?? ""} ${tutee.parentLastName ?? ""}`.trim() || "—"}
            />
            <Row label="Parent email" value={tutee.parentEmail} />
            <Row label="Parent phone" value={tutee.parentPhone} />
            <Row label="Format" value={tutee.format} />
            <Row label="Subjects" value={toArray(tutee.subjects).join(", ") || "—"} />
            <Row label="Subject needs (matcher)" value={toArray(tutee.subjectNeeds).join(", ") || "—"} />
            <Row label="Gender preference" value={tutee.genderPreference} />
            <Row label="Required gender" value={tutee.requiredGender} />
            <Row label="Sibling names" value={tutee.siblingNames} />
            <Row label="Sibling preference" value={tutee.siblingPreference} />
            <Row label="Previous tutor names" value={tutee.previousTutorNames} />
            <Row label="Availability" value={formatSlots(tutee)} />
            <Row
              label="Preferred time slots"
              value={
                toSlotArray(tutee.preferredTimeSlots).length
                  ? toSlotArray(tutee.preferredTimeSlots)
                      .map((s) => `${s.day} ${s.time}`)
                      .join("; ")
                  : "—"
              }
            />
            <Row label="Required tutor ID" value={tutee.requiredTutorId ?? "—"} />
            <Row label="Preferred tutor ID" value={tutee.preferredTutorId ?? "—"} />
            <Row label="Family ID" value={tutee.familyId ?? "—"} />
            <Row label="Returning status" value={tutee.returningStatus} />
            <Row label="Additional notes" value={tutee.additionalNotes} />
            <Row label="Created" value={tutee.createdAt} />
            <Row label="Updated" value={tutee.updatedAt} />
          </dl>
        )}
      </DialogContent>
    </Dialog>
  )
}
