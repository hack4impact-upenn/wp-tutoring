"use client"

import { useMemo } from "react"
import { useMutation } from "@tanstack/react-query"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toast } from "sonner"
import { overrideAssignment, APIError } from "@/lib/api"
import { useAuth } from "@/features/auth/AuthContext"
import type { Tutor, Tutee } from "../types"
import { getId } from "../types"
import {
  formatTutorLabel,
  formatTuteeLabel,
} from "../utils/person-display"
import {
  MatchCandidatePicker,
  type MatchCandidatePickMode,
} from "./match-candidate-picker"

function isAccepted(doc: { applicationStatus?: string }) {
  return (doc.applicationStatus ?? "accepted") === "accepted"
}

export type IndividualMatchMode = MatchCandidatePickMode

export function IndividualMatchDialog({
  open,
  onOpenChange,
  mode,
  fixedTutor,
  fixedTutee,
  tutors,
  tutees,
  unmatchedTutorIds,
  unmatchedTuteeIds,
  semester,
  onSuccess,
  draftId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: IndividualMatchMode | null
  fixedTutor: Tutor | null
  fixedTutee: Tutee | null
  tutors: Tutor[]
  tutees: Tutee[]
  unmatchedTutorIds: Set<string>
  unmatchedTuteeIds: Set<string>
  semester: string | null
  onSuccess: () => void
  draftId: string | null
}) {
  const { adminToken } = useAuth()

  const overrideMutation = useMutation({
    mutationFn: async ({ tutorId, studentId }: { tutorId: string; studentId: string }) => {
      if (!adminToken) throw new Error("no_token")
      if (!draftId) throw new Error("no_draft")
      await overrideAssignment({ tutorId, studentId, semester, draftId }, adminToken)
    },
    onSuccess: () => {
      toast.success("Match created")
      onSuccess()
      onOpenChange(false)
    },
    onError: (e) => {
      if (e instanceof Error && e.message === "no_token") {
        toast.error("You must be signed in.")
        return
      }
      toast.error(e instanceof APIError ? e.message : "Failed to create match")
    },
  })

  const tutorOptions = useMemo(() => {
    if (mode === "pick-tutor") {
      // When assigning a tutor to a tutee, only show tutors that don't already have a tutee
      return tutors.filter((t) => unmatchedTutorIds.has(getId(t)))
    }
    return tutors.filter(
      (t) => isAccepted(t) || unmatchedTutorIds.has(getId(t)),
    )
  }, [tutors, unmatchedTutorIds, mode])

  const tuteeOptions = useMemo(() => {
    if (mode === "pick-tutee") {
      // When assigning a tutee to a tutor, only show tutees that don't already have a tutor
      return tutees.filter((s) => unmatchedTuteeIds.has(getId(s)))
    }
    return tutees.filter(
      (s) => isAccepted(s) || unmatchedTuteeIds.has(getId(s)),
    )
  }, [tutees, unmatchedTuteeIds, mode])

  const candidateTuteeIds = useMemo(
    () => tuteeOptions.map((t) => getId(t)).filter(Boolean),
    [tuteeOptions],
  )
  const candidateTutorIds = useMemo(
    () => tutorOptions.map((t) => getId(t)).filter(Boolean),
    [tutorOptions],
  )

  const title =
    mode === "pick-tutee" && fixedTutor
      ? `Assign tutee to ${formatTutorLabel(fixedTutor)}`
      : mode === "pick-tutor" && fixedTutee
        ? `Assign tutor to ${formatTuteeLabel(fixedTutee)}`
        : ""

  if (!mode || (!fixedTutor && !fixedTutee)) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-0 max-w-[min(56rem,calc(100vw-2rem))] gap-4 sm:max-w-4xl">
        <MatchCandidatePicker
          active={open && !!mode}
          mode={mode}
          fixedTutor={fixedTutor}
          fixedTutee={fixedTutee}
          candidateTutorIds={candidateTutorIds}
          candidateTuteeIds={candidateTuteeIds}
          tutors={tutors}
          tutees={tutees}
          semester={semester}
          draftId={draftId}
          searchInputId="admin-individual-match-search"
          listTitle={title}
          helperText="Any other active assignment for the selected student this semester will be removed first. Rows are sorted by matcher correlation (eligible pairs first). Click a row to select."
          primarySaveLabel="Create match"
          primarySavingLabel="Creating…"
          onSave={async (tid, sid) => {
            await overrideMutation.mutateAsync({ tutorId: tid, studentId: sid })
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
