"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { reassignMatch, APIError } from "@/lib/api"
import { useAuth } from "@/features/auth/AuthContext"
import type { AssignmentRow } from "@/lib/types"
import type { Tutor, Tutee } from "../types"
import { getId } from "../types"
import {
  resolveTutorSnapshot,
  resolveTuteeSnapshot,
  resolveAssignmentNames,
} from "../helpers"
import { formatTutorLabel, formatTuteeLabel } from "../utils/person-display"
import { ArrowLeft } from "lucide-react"
import {
  MatchCandidatePicker,
  type MatchCandidatePickMode,
} from "./match-candidate-picker"

function isAccepted(doc: { applicationStatus?: string }) {
  return (doc.applicationStatus ?? "accepted") === "accepted"
}

type Step = "choose" | "pick"

export function ChangeMatchDialog({
  open,
  onOpenChange,
  assignment,
  tutors,
  tutees,
  onSuccess,
  draftId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: AssignmentRow | null
  tutors: Tutor[]
  tutees: Tutee[]
  onSuccess: () => void
  draftId: string | null
}) {
  const { adminToken } = useAuth()

  const reassignMutation = useMutation({
    mutationFn: async ({
      tutorId,
      studentId,
      matchId,
      semester: sem,
    }: {
      tutorId: string
      studentId: string
      matchId: string
      semester: string | undefined
    }) => {
      if (!adminToken) throw new Error("no_token")
      if (!draftId) throw new Error("no_draft")
      await reassignMatch({ matchId, tutorId, studentId, semester: sem, draftId }, adminToken)
    },
    onSuccess: () => {
      toast.success("Match updated")
      onSuccess()
      onOpenChange(false)
    },
    onError: (e) => {
      if (e instanceof Error && e.message === "no_token") {
        toast.error("You must be signed in.")
        return
      }
      toast.error(e instanceof APIError ? e.message : "Failed to update match")
    },
  })

  const [step, setStep] = useState<Step>("choose")
  const [changeMode, setChangeMode] = useState<MatchCandidatePickMode | null>(null)

  useEffect(() => {
    if (open && assignment) {
      setStep("choose")
      setChangeMode(null)
    }
  }, [open, assignment?.id])

  const tutorDoc = assignment ? resolveTutorSnapshot(assignment, tutors) : undefined
  const tuteeDoc = assignment ? resolveTuteeSnapshot(assignment, tutees) : undefined

  const { tutorName, studentName } = assignment
    ? resolveAssignmentNames(assignment, tutors, tutees)
    : { tutorName: "", studentName: "" }

  const tutorOptions = useMemo(() => {
    if (!assignment) return []
    const accepted = tutors.filter(isAccepted)
    if (!assignment.tutor_id) return accepted
    const tid = assignment.tutor_id
    if (accepted.some((t) => getId(t) === tid)) return accepted
    const current = tutors.find((t) => getId(t) === tid)
    return current ? [...accepted, current] : accepted
  }, [tutors, assignment])

  const tuteeOptions = useMemo(() => {
    if (!assignment) return []
    const accepted = tutees.filter(isAccepted)
    if (!assignment.student_id) return accepted
    const sid = assignment.student_id
    if (accepted.some((t) => getId(t) === sid)) return accepted
    const current = tutees.find((t) => getId(t) === sid)
    return current ? [...accepted, current] : accepted
  }, [tutees, assignment])

  const candidateTutorIds = useMemo(
    () => tutorOptions.map((t) => getId(t)).filter(Boolean),
    [tutorOptions],
  )
  const candidateTuteeIds = useMemo(
    () => tuteeOptions.map((t) => getId(t)).filter(Boolean),
    [tuteeOptions],
  )

  if (!assignment) return null

  const semester = assignment.semester ?? null
  const canPickTutee = Boolean(tutorDoc && assignment.tutor_id)
  const canPickTutor = Boolean(tuteeDoc && assignment.student_id)

  const listTitle =
    changeMode === "pick-tutee" && tutorDoc
      ? `Choose tutee for ${formatTutorLabel(tutorDoc)}`
      : changeMode === "pick-tutor" && tuteeDoc
        ? `Choose tutor for ${formatTuteeLabel(tuteeDoc)}`
        : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-0 max-w-[min(56rem,calc(100vw-2rem))] gap-4 sm:max-w-4xl">
        {step === "choose" ? (
          <>
            <DialogHeader>
              <DialogTitle>Change match</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Do you want to change <span className="font-medium text-foreground">{tutorName || "this tutor"}</span>
              &apos;s tutee, or change{" "}
              <span className="font-medium text-foreground">{studentName || "this student"}</span>&apos;s tutor?
              The assignment row is updated; any other active assignment for the selected student this semester is
              removed first.
            </p>
            <div className="flex flex-col gap-3 py-2">
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 w-full justify-start whitespace-normal px-4 py-3 text-left"
                disabled={!canPickTutee}
                onClick={() => {
                  setChangeMode("pick-tutee")
                  setStep("pick")
                }}
              >
                Change <span className="font-semibold">{tutorName || "this tutor"}</span>&apos;s tutee
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 w-full justify-start whitespace-normal px-4 py-3 text-left"
                disabled={!canPickTutor}
                onClick={() => {
                  setChangeMode("pick-tutor")
                  setStep("pick")
                }}
              >
                Change <span className="font-semibold">{studentName || "this student"}</span>&apos;s tutor
              </Button>
            </div>
            {(!canPickTutee || !canPickTutor) && (
              <p className="text-xs text-muted-foreground">
                {!canPickTutee && !canPickTutor
                  ? "Tutor and student records are missing from the loaded data. Refresh the dashboard."
                  : !canPickTutee
                    ? "Tutor record missing; you can still change this student’s tutor."
                    : "Student record missing; you can still change this tutor’s tutee."}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="shrink-0 -mt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-fit gap-1.5 px-2 -ml-2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStep("choose")
                  setChangeMode(null)
                }}
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                Go back
              </Button>
            </div>
            <MatchCandidatePicker
              active={open && step === "pick"}
              mode={changeMode}
              fixedTutor={changeMode === "pick-tutee" ? tutorDoc ?? null : null}
              fixedTutee={changeMode === "pick-tutor" ? tuteeDoc ?? null : null}
              candidateTutorIds={candidateTutorIds}
              candidateTuteeIds={candidateTuteeIds}
              tutors={tutors}
              tutees={tutees}
              semester={semester}
              draftId={draftId}
              searchInputId="admin-change-match-search"
              listTitle={listTitle}
              helperText="Rows are sorted by matcher correlation (eligible pairs first). Click a row to select, then update the match."
              primarySaveLabel="Update match"
              primarySavingLabel="Updating…"
              onSave={async (tid, sid) => {
                await reassignMutation.mutateAsync({
                  matchId: assignment.id,
                  tutorId: tid,
                  studentId: sid,
                  semester: assignment.semester,
                })
              }}
              onCancel={() => onOpenChange(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
