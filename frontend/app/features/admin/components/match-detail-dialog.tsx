"use client"

import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { AssignmentRow } from "@/lib/types"
import type { Tutor, Tutee } from "../types"
import { toArray, toSlotArray } from "../types"
import { resolveTutorSnapshot, resolveTuteeSnapshot } from "../helpers"

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border py-2 text-sm last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{value ?? "—"}</dd>
    </div>
  )
}

function slotSummary(slots: { day?: string; time?: string }[], maxShow = 5): string {
  if (!slots.length) return "—"
  const head = slots.slice(0, maxShow).map((s) => `${s.day ?? "?"} ${s.time ?? ""}`.trim())
  const tail = slots.length > maxShow ? ` (+${slots.length - maxShow} more)` : ""
  return head.join(" · ") + tail
}

function ellipsisJoin(items: string[], maxChars = 44): string {
  const s = items.join(", ")
  if (!s) return "—"
  if (s.length <= maxChars) return s
  return `${s.slice(0, Math.max(0, maxChars - 1))}…`
}

export function MatchDetailDialog({
  open,
  onOpenChange,
  assignment,
  tutors,
  tutees,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: AssignmentRow | null
  tutors: Tutor[]
  tutees: Tutee[]
}) {
  if (!assignment) return null

  const tutor = resolveTutorSnapshot(assignment, tutors)
  const tutee = resolveTuteeSnapshot(assignment, tutees)

  const tutorName =
    [tutor?.firstName, tutor?.lastName].filter(Boolean).join(" ").trim() ||
    assignment.tutor_name ||
    "—"
  const studentName =
    [tutee?.studentFirstName, tutee?.studentLastName].filter(Boolean).join(" ").trim() ||
    assignment.student_name ||
    "—"

  const tutorSubjects = toArray(
    tutor?.subjectList?.length ? tutor.subjectList : tutor?.subjects,
  )
  const tuteeSubjects = toArray(
    tutee?.subjectNeeds?.length ? tutee.subjectNeeds : tutee?.subjects,
  )
  const tutorSlots = toSlotArray(tutor?.availability)
  const prefSlots = toSlotArray(tutee?.preferredTimeSlots)
  const tuteeSlots = prefSlots.length > 0 ? prefSlots : toSlotArray(tutee?.availability)
  const gradeDisplay = tutee?.grade || tutee?.studentGrade || "—"
  const parentEmail = tutee?.parentEmail || assignment.student_email || "—"
  const formats = `${tutor?.format ?? "—"} → ${tutee?.format ?? "—"}`
  const subjectsCombined = `${ellipsisJoin(tutorSubjects, 40)} → ${ellipsisJoin(tuteeSubjects, 40)}`
  const soft = assignment.scoreExplanation?.totalSoftScore
  const scoreText =
    assignment.pairScore != null
      ? soft != null
        ? `${assignment.pairScore} (soft ${soft})`
        : String(assignment.pairScore)
      : "—"
  const notes =
    [assignment.reason, assignment.scoreExplanation?.summary].filter(Boolean).join(" · ") || "—"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Match details</DialogTitle>
        </DialogHeader>

        <dl className="space-y-0">
          <Row label="Tutor" value={tutorName} />
          <Row label="Student" value={studentName} />
          <Row label="Semester" value={assignment.semester} />
          <Row
            label="Manual override"
            value={
              assignment.manual_override ? (
                <Badge variant="destructive">Yes</Badge>
              ) : (
                <span className="text-muted-foreground">No</span>
              )
            }
          />
          <Row label="Score" value={scoreText} />
          <Row label="Reason / algorithm" value={assignment.reason} />
          <Row label="Summary" value={notes} />
          {assignment.scoreExplanation?.breakdown?.length ? (
            <Row
              label="Score breakdown"
              value={
                <div className="flex flex-wrap gap-1">
                  {assignment.scoreExplanation.breakdown.map((b, i) => (
                    <Badge key={`${b.code}-${i}`} variant="outline" className="text-xs font-normal">
                      {(b.label || b.code || "item") + (b.points != null ? `: +${b.points}` : "")}
                    </Badge>
                  ))}
                </div>
              }
            />
          ) : null}
          <Row label="Tutor email" value={tutor?.email || assignment.tutor_email} />
          <Row label="Parent email" value={parentEmail} />
          <Row label="Student grade" value={gradeDisplay} />
          <Row label="Formats" value={formats} />
          <Row label="Subjects (tutor → student)" value={subjectsCombined} />
          <Row
            label="Tutor slots"
            value={`${tutorSlots.length} · ${slotSummary(tutorSlots, 8)}`}
          />
          <Row
            label="Student slots"
            value={`${tuteeSlots.length} · ${slotSummary(tuteeSlots, 8)}`}
          />
        </dl>
      </DialogContent>
    </Dialog>
  )
}
