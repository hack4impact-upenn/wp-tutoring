"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { previewIndividualMatch, APIError } from "@/lib/api"
import { useAuth } from "@/features/auth/AuthContext"
import type { IndividualMatchCandidateRow } from "@/lib/types"
import type { Tutor, Tutee } from "../types"
import { getId } from "../types"
import { matchesNameFilter } from "../helpers"
import { NameSearchInput } from "../views/dashboard-shared"
import { formatTutorName, formatTuteeStudentName } from "../utils/person-display"
import { ArrowLeft, GitCompare, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { MatchSimilaritiesView } from "./match-similarities-view"
import { matchPreviewKey } from "@/lib/query-keys"

export type MatchCandidatePickMode = "pick-tutee" | "pick-tutor"

export type MatchCandidatePickerProps = {
  /** When false, internal picker state is cleared. */
  active: boolean
  mode: MatchCandidatePickMode | null
  fixedTutor: Tutor | null
  fixedTutee: Tutee | null
  candidateTutorIds: string[]
  candidateTuteeIds: string[]
  tutors: Tutor[]
  tutees: Tutee[]
  semester: string | null
  searchInputId: string
  listTitle: string
  helperText: string
  primarySaveLabel: string
  primarySavingLabel: string
  onSave: (tutorId: string, studentId: string) => Promise<void>
  onCancel: () => void
}

export function MatchCandidatePicker({
  active,
  mode,
  fixedTutor,
  fixedTutee,
  candidateTutorIds,
  candidateTuteeIds,
  tutors,
  tutees,
  semester,
  searchInputId,
  listTitle,
  helperText,
  primarySaveLabel,
  primarySavingLabel,
  onSave,
  onCancel,
}: MatchCandidatePickerProps) {
  const { adminToken } = useAuth()
  const [selectedId, setSelectedId] = useState("")
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [panel, setPanel] = useState<"list" | "similarities">("list")
  const [comparisonCandidateId, setComparisonCandidateId] = useState<string | null>(null)

  const fixedTutorId = fixedTutor ? getId(fixedTutor) : ""
  const fixedTuteeId = fixedTutee ? getId(fixedTutee) : ""
  const tutorIdsKey = useMemo(() => [...candidateTutorIds].sort().join(","), [candidateTutorIds])
  const tuteeIdsKey = useMemo(() => [...candidateTuteeIds].sort().join(","), [candidateTuteeIds])

  const previewEnabled =
    active && !!mode && (mode === "pick-tutee" ? Boolean(fixedTutorId) : Boolean(fixedTuteeId))

  const previewQuery = useQuery({
    queryKey: [
      ...matchPreviewKey({
        mode: mode ?? "pick-tutee",
        fixedTutorId: mode === "pick-tutee" ? fixedTutorId : "",
        fixedTuteeId: mode === "pick-tutor" ? fixedTuteeId : "",
        semester: semester ?? "",
        candidateTutorIds: tutorIdsKey,
        candidateTuteeIds: tuteeIdsKey,
      }),
      Boolean(adminToken),
    ] as const,
    queryFn: async () => {
      const tok = adminToken
      if (!tok) {
        toast.error("You must be signed in.")
        return { candidates: [] as IndividualMatchCandidateRow[] }
      }
      try {
        if (mode === "pick-tutee" && fixedTutor) {
          const fid = getId(fixedTutor)
          if (!fid) return { candidates: [] as IndividualMatchCandidateRow[] }
          return await previewIndividualMatch(
            { fixed_tutor_id: fid, candidate_tutee_ids: candidateTuteeIds, semester },
            tok,
          )
        }
        if (mode === "pick-tutor" && fixedTutee) {
          const fid = getId(fixedTutee)
          if (!fid) return { candidates: [] as IndividualMatchCandidateRow[] }
          return await previewIndividualMatch(
            { fixed_tutee_id: fid, candidate_tutor_ids: candidateTutorIds, semester },
            tok,
          )
        }
        return { candidates: [] as IndividualMatchCandidateRow[] }
      } catch (e) {
        toast.error(e instanceof APIError ? e.message : "Failed to load match preview")
        return { candidates: [] as IndividualMatchCandidateRow[] }
      }
    },
    enabled: previewEnabled,
    staleTime: 15_000,
    retry: false,
  })

  const rows = previewQuery.data?.candidates ?? []
  const loading = previewQuery.isPending

  useEffect(() => {
    if (!active || !mode) {
      setSelectedId("")
      setSearch("")
      setPanel("list")
      setComparisonCandidateId(null)
      return
    }
    setSelectedId("")
    setSearch("")
    setPanel("list")
    setComparisonCandidateId(null)
  }, [active, mode, fixedTutorId, fixedTuteeId, semester, tutorIdsKey, tuteeIdsKey])

  const filteredRows = useMemo(
    () => rows.filter((r) => matchesNameFilter(search, [r.name, r.email])),
    [rows, search],
  )

  const comparisonPair = useMemo((): { tutor: Tutor; tutee: Tutee } | null => {
    if (!comparisonCandidateId || panel !== "similarities" || !mode) return null
    if (mode === "pick-tutee" && fixedTutor) {
      const tutee = tutees.find((x) => getId(x) === comparisonCandidateId) ?? null
      return tutee ? { tutor: fixedTutor, tutee } : null
    }
    if (mode === "pick-tutor" && fixedTutee) {
      const tutor = tutors.find((x) => getId(x) === comparisonCandidateId) ?? null
      return tutor ? { tutor, tutee: fixedTutee } : null
    }
    return null
  }, [comparisonCandidateId, panel, mode, fixedTutor, fixedTutee, tutees, tutors])

  const similaritiesSubtitle = useMemo(() => {
    if (!comparisonPair) return ""
    return `${formatTutorName(comparisonPair.tutor)} · ${formatTuteeStudentName(comparisonPair.tutee)}`
  }, [comparisonPair])

  const goBackToList = () => {
    setPanel("list")
    setComparisonCandidateId(null)
  }

  const openSimilarities = (row: IndividualMatchCandidateRow) => {
    setSelectedId(row.id)
    setComparisonCandidateId(row.id)
    setPanel("similarities")
  }

  const handleSave = async () => {
    const tid = mode === "pick-tutee" ? getId(fixedTutor!) : selectedId
    const sid = mode === "pick-tutee" ? selectedId : getId(fixedTutee!)
    if (!tid || !sid) return
    setSaving(true)
    try {
      await onSave(tid, sid)
    } finally {
      setSaving(false)
    }
  }

  const showTuteeCountCol = mode === "pick-tutor"

  if (!mode || (!fixedTutor && !fixedTutee)) return null

  return (
    <>
      <DialogHeader className="space-y-3 text-left">
        {panel === "similarities" ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-fit gap-1.5 px-2 -ml-2 text-muted-foreground hover:text-foreground"
              onClick={goBackToList}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              Go back
            </Button>
            <div className="space-y-1">
              <DialogTitle className="text-xl">Similarities</DialogTitle>
              {similaritiesSubtitle ? (
                <p className="text-sm font-normal text-muted-foreground">{similaritiesSubtitle}</p>
              ) : null}
            </div>
          </>
        ) : (
          <DialogTitle>{listTitle}</DialogTitle>
        )}
      </DialogHeader>

      {panel === "list" ? (
        <>
          <p className="min-w-0 text-sm text-muted-foreground">{helperText}</p>
          <div className="min-w-0 space-y-3 py-1">
            <NameSearchInput
              id={searchInputId}
              value={search}
              onChange={setSearch}
              placeholder="Search by name or email…"
            />
            <div
              className={cn(
                "max-h-[min(360px,50vh)] overflow-auto rounded-md border border-border",
                loading && "min-h-[120px]",
              )}
            >
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading…
                </div>
              ) : filteredRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {rows.length === 0 ? "No rows to show." : "No rows match your search."}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-[7rem] text-right">Correlation</TableHead>
                      {showTuteeCountCol ? (
                        <TableHead className="w-[6rem] text-right">Tutees</TableHead>
                      ) : null}
                      <TableHead className="w-[7.5rem] text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((r) => {
                      const isSel = selectedId === r.id
                      return (
                        <TableRow
                          key={r.id}
                          data-state={isSel ? "selected" : undefined}
                          className={cn(
                            "cursor-pointer border-b transition-colors",
                            !r.eligible && "text-muted-foreground",
                            isSel
                              ? "bg-primary/[0.09] hover:bg-primary/[0.12] data-[state=selected]:bg-primary/[0.09] dark:bg-primary/15 dark:hover:bg-primary/20 dark:data-[state=selected]:bg-primary/15 ring-2 ring-inset ring-primary/45 dark:ring-primary/50"
                              : "hover:bg-muted/50",
                          )}
                          onClick={() => setSelectedId(r.id)}
                        >
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="max-w-[12rem] truncate text-sm">{r.email || "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {r.eligible && r.correlation_points != null ? r.correlation_points : "Blocked"}
                          </TableCell>
                          {showTuteeCountCol ? (
                            <TableCell className="text-right tabular-nums">
                              {r.current_tutee_count != null ? r.current_tutee_count : "—"}
                            </TableCell>
                          ) : null}
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 border-primary/40 bg-background px-2.5 text-xs font-medium text-foreground shadow-none hover:border-primary/60 hover:bg-primary/10 hover:text-foreground"
                              onClick={() => openSimilarities(r)}
                            >
                              <GitCompare className="size-3.5 shrink-0 text-primary" aria-hidden />
                              Show similarities
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          <DialogFooter className="min-w-0 shrink-0 flex-wrap gap-2 sm:justify-end sm:gap-2">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving || !selectedId || loading}
              onClick={() => void handleSave()}
            >
              {saving ? primarySavingLabel : primarySaveLabel}
            </Button>
          </DialogFooter>
        </>
      ) : (
        <>
          <div className="max-h-[min(60vh,32rem)] min-h-[12rem] overflow-y-auto rounded-md border border-border bg-muted/30 p-4">
            {comparisonPair ? (
              <MatchSimilaritiesView tutor={comparisonPair.tutor} tutee={comparisonPair.tutee} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Could not load both applications for this row. Close the dialog and refresh the dashboard, or pick
                another candidate.
              </p>
            )}
          </div>
          <DialogFooter className="min-w-0 shrink-0 flex-wrap gap-2 sm:justify-end sm:gap-2">
            <Button variant="outline" type="button" onClick={goBackToList}>
              Go back
            </Button>
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
          </DialogFooter>
        </>
      )}
    </>
  )
}
