"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { reassignMatch, getAdminToken, APIError } from "@/lib/api"
import type { AssignmentRow } from "@/lib/types"
import type { Tutor, Tutee } from "../types"
import { getId } from "../types"

function isAccepted(doc: { applicationStatus?: string }) {
  return (doc.applicationStatus ?? "accepted") === "accepted"
}

function tutorLabel(t: Tutor) {
  const name = `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() || "Tutor"
  return t.email ? `${name} (${t.email})` : name
}

function tuteeLabel(t: Tutee) {
  const name = `${t.studentFirstName ?? ""} ${t.studentLastName ?? ""}`.trim() || "Student"
  return t.parentEmail ? `${name} (${t.parentEmail})` : name
}

export function ModifyMatchDialog({
  open,
  onOpenChange,
  assignment,
  tutors,
  tutees,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: AssignmentRow | null
  tutors: Tutor[]
  tutees: Tutee[]
  onSuccess: () => void
}) {
  const [tutorId, setTutorId] = useState("")
  const [studentId, setStudentId] = useState("")
  const [saving, setSaving] = useState(false)

  const tutorOptions = useMemo(() => {
    const accepted = tutors.filter(isAccepted)
    if (!assignment?.tutor_id) return accepted
    const tid = assignment.tutor_id
    if (accepted.some((t) => getId(t) === tid)) return accepted
    const current = tutors.find((t) => getId(t) === tid)
    return current ? [...accepted, current] : accepted
  }, [tutors, assignment?.tutor_id])

  const tuteeOptions = useMemo(() => {
    const accepted = tutees.filter(isAccepted)
    if (!assignment?.student_id) return accepted
    const sid = assignment.student_id
    if (accepted.some((t) => getId(t) === sid)) return accepted
    const current = tutees.find((t) => getId(t) === sid)
    return current ? [...accepted, current] : accepted
  }, [tutees, assignment?.student_id])

  useEffect(() => {
    if (open && assignment) {
      setTutorId(assignment.tutor_id ?? "")
      setStudentId(assignment.student_id ?? "")
    }
  }, [open, assignment])

  const handleSave = async () => {
    if (!assignment || !tutorId || !studentId) return
    const token = getAdminToken()
    if (!token) {
      toast.error("You must be signed in.")
      return
    }
    setSaving(true)
    try {
      await reassignMatch(
        {
          matchId: assignment.id,
          tutorId,
          studentId,
          semester: assignment.semester,
        },
        token,
      )
      toast.success("Match updated")
      onSuccess()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof APIError ? e.message : "Failed to update match")
    } finally {
      setSaving(false)
    }
  }

  if (!assignment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-0 max-w-[min(42rem,calc(100vw-2rem))] gap-4 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modify match</DialogTitle>
        </DialogHeader>
        <p className="min-w-0 text-sm text-muted-foreground">
          Select a tutor and student for this assignment. The current row is replaced; any other active
          assignment for the selected student in this semester is removed first.
        </p>
        <div className="min-w-0 space-y-4 py-2">
          <div className="min-w-0 space-y-2">
            <span className="text-sm font-medium">Tutor</span>
            <Select value={tutorId} onValueChange={setTutorId}>
              <SelectTrigger className="min-w-0 w-full max-w-full overflow-hidden [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate">
                <SelectValue placeholder="Select tutor" />
              </SelectTrigger>
              <SelectContent>
                {tutorOptions.map((t) => {
                  const id = getId(t)
                  if (!id) return null
                  return (
                    <SelectItem key={id} value={id}>
                      {tutorLabel(t)}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2">
            <span className="text-sm font-medium">Student</span>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="min-w-0 w-full max-w-full overflow-hidden [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {tuteeOptions.map((t) => {
                  const id = getId(t)
                  if (!id) return null
                  return (
                    <SelectItem key={id} value={id}>
                      {tuteeLabel(t)}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="min-w-0 shrink-0 flex-wrap gap-2 sm:justify-end sm:gap-2">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || !tutorId || !studentId}
            onClick={() => void handleSave()}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
