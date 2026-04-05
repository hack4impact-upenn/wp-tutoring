"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { AssignmentRow } from "@/lib/types"
import type { Tutor, Tutee } from "../types"
import { resolveTutorSnapshot, resolveTuteeSnapshot } from "../helpers"
import { formatTutorName, formatTuteeStudentName } from "../utils/person-display"
import { MatchSimilaritiesView } from "./match-similarities-view"

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

  const similaritiesSubtitle = [
    tutor ? formatTutorName(tutor) : assignment.tutor_name,
    tutee ? formatTuteeStudentName(tutee) : assignment.student_name,
  ]
    .filter((s): s is string => Boolean(s && String(s).trim()))
    .join(" · ")

  const canShowSimilarities = Boolean(tutor && tutee)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-[min(56rem,calc(100vw-2rem))] flex-col gap-4 overflow-hidden sm:max-w-4xl">
        <DialogHeader className="shrink-0 space-y-1 text-left">
          <DialogTitle>Similarities</DialogTitle>
          {similaritiesSubtitle ? (
            <p className="text-sm font-normal text-muted-foreground">{similaritiesSubtitle}</p>
          ) : null}
        </DialogHeader>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">
          <div className="max-h-[min(60vh,32rem)] min-h-[12rem] overflow-y-auto rounded-md border border-border bg-muted/30 p-4">
            {canShowSimilarities ? (
              <MatchSimilaritiesView tutor={tutor!} tutee={tutee!} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Application details for this pair are not fully loaded (missing tutor or student record). Try
                refreshing the dashboard.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
