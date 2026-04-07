import { useMemo, useState } from "react"
import { useSearchPagination } from "../hooks/use-search-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Tutor, Tutee } from "../types"
import { getId } from "../types"
import { ExportDropdown, exportTuteesCsv, exportTuteesXls } from "../components/export"
import { NameSearchInput, PaginationControls } from "./dashboard-shared"
import {
  IndividualMatchDialog,
  type IndividualMatchMode,
} from "../components/individual-match-dialog"
import { GraduationCap, UserCircle } from "lucide-react"
import {
  formatTutorName,
  formatTuteeStudentName,
  tutorPrimaryEmail,
  tuteePrimaryEmail,
} from "../utils/person-display"

export type UnmatchedRow = { kind: "tutor"; doc: Tutor } | { kind: "tutee"; doc: Tutee }

function rowDisplayName(row: UnmatchedRow): string {
  return row.kind === "tutor" ? formatTutorName(row.doc) : formatTuteeStudentName(row.doc)
}

function rowDisplayEmail(row: UnmatchedRow): string {
  const raw = row.kind === "tutor" ? tutorPrimaryEmail(row.doc) : tuteePrimaryEmail(row.doc)
  return raw || "—"
}

function compareRows(a: UnmatchedRow, b: UnmatchedRow): number {
  const kindOrder = a.kind === b.kind ? 0 : a.kind === "tutor" ? -1 : 1
  if (kindOrder !== 0) return kindOrder
  return rowDisplayName(a).localeCompare(rowDisplayName(b), undefined, { sensitivity: "base" })
}

export type UnmatchedViewProps = {
  unmatchedTutors: Tutor[]
  unmatchedTutees: Tutee[]
  tutors: Tutor[]
  tutees: Tutee[]
  assignmentSemester: string | null
  dataRevision: number
  activeTab: string
  onAssignSuccess: () => void
  draftId: string | null
}

export function UnmatchedView({
  unmatchedTutors,
  unmatchedTutees,
  tutors,
  tutees,
  assignmentSemester,
  dataRevision,
  activeTab,
  onAssignSuccess,
  draftId,
}: UnmatchedViewProps) {
  const [roleFilter, setRoleFilter] = useState<"all" | "tutor" | "tutee">("all")
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignMode, setAssignMode] = useState<IndividualMatchMode | null>(null)
  const [fixedTutor, setFixedTutor] = useState<Tutor | null>(null)
  const [fixedTutee, setFixedTutee] = useState<Tutee | null>(null)

  const unmatchedTutorIds = useMemo(
    () => new Set(unmatchedTutors.map((t) => getId(t)).filter(Boolean)),
    [unmatchedTutors],
  )
  const unmatchedTuteeIds = useMemo(
    () => new Set(unmatchedTutees.map((t) => getId(t)).filter(Boolean)),
    [unmatchedTutees],
  )

  const mergedRows = useMemo(() => {
    const rows: UnmatchedRow[] = [
      ...unmatchedTutors.map((doc) => ({ kind: "tutor" as const, doc })),
      ...unmatchedTutees.map((doc) => ({ kind: "tutee" as const, doc })),
    ]
    rows.sort(compareRows)
    return rows
  }, [unmatchedTutors, unmatchedTutees])

  const filteredByRole = useMemo(() => {
    if (roleFilter === "all") return mergedRows
    return mergedRows.filter((r) => r.kind === roleFilter)
  }, [mergedRows, roleFilter])

  const paginationFilterDeps = useMemo(() => [roleFilter], [roleFilter])

  const { search, setSearch, filtered, paged, paginationProps } = useSearchPagination({
    items: filteredByRole,
    dataRevision,
    activeTab,
    getSearchableParts: (row) => {
      if (row.kind === "tutor") {
        const t = row.doc
        return [t.firstName, t.lastName, t.email]
      }
      const t = row.doc
      return [
        t.studentFirstName,
        t.studentLastName,
        t.parentFirstName,
        t.parentLastName,
        t.parentEmail,
      ]
    },
    filterDeps: paginationFilterDeps,
  })

  const openAssignTutee = (tutor: Tutor) => {
    setAssignMode("pick-tutee")
    setFixedTutor(tutor)
    setFixedTutee(null)
    setAssignOpen(true)
  }

  const openAssignTutor = (tutee: Tutee) => {
    setAssignMode("pick-tutor")
    setFixedTutee(tutee)
    setFixedTutor(null)
    setAssignOpen(true)
  }

  const toggleTutorFilter = () => {
    setRoleFilter((f) => (f === "tutor" ? "all" : "tutor"))
  }

  const toggleTuteeFilter = () => {
    setRoleFilter((f) => (f === "tutee" ? "all" : "tutee"))
  }

  const hasAny = mergedRows.length > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Unmatched tutors and tutees</CardTitle>
          <CardDescription>
            Tutors with no assignment this semester, and tutees with no match. Use Assign to create a manual
            pairing (same as match override).
          </CardDescription>
        </div>
        {unmatchedTutees.length > 0 && (
          <ExportDropdown
            label="Export unmatched tutees"
            onCsv={() => exportTuteesCsv(unmatchedTutees)}
            onXls={() => exportTuteesXls(unmatchedTutees)}
          />
        )}
      </CardHeader>
      <CardContent>
        {!hasAny ? (
          <p className="py-8 text-center text-muted-foreground">
            Every tutor has at least one assignment and every tutee has a match for the current semester, or
            there is no data yet.
          </p>
        ) : (
          <>
            <NameSearchInput
              id="admin-unmatched-search"
              value={search}
              onChange={setSearch}
              placeholder="Search by name or email…"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={roleFilter === "tutor" ? "default" : "outline"}
                onClick={toggleTutorFilter}
              >
                Show only tutors
              </Button>
              <Button
                type="button"
                size="sm"
                variant={roleFilter === "tutee" ? "default" : "outline"}
                onClick={toggleTuteeFilter}
              >
                Show only tutees
              </Button>
            </div>
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">
                No rows match your search or filter.
              </p>
            ) : (
              <>
                <div className="mt-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Assign</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.map((row) => {
                        const id = getId(row.doc)
                        return (
                          <TableRow key={`${row.kind}-${id}`}>
                            <TableCell className="font-medium">{rowDisplayName(row)}</TableCell>
                            <TableCell className="max-w-[14rem] truncate text-sm">
                              {rowDisplayEmail(row)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="gap-1 font-normal">
                                {row.kind === "tutor" ? (
                                  <>
                                    <UserCircle className="h-3 w-3" aria-hidden />
                                    Tutor
                                  </>
                                ) : (
                                  <>
                                    <GraduationCap className="h-3 w-3" aria-hidden />
                                    Tutee
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {row.kind === "tutor" ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => openAssignTutee(row.doc)}
                                >
                                  Assign tutee
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => openAssignTutor(row.doc)}
                                >
                                  Assign tutor
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                <PaginationControls {...paginationProps} />
              </>
            )}
          </>
        )}
      </CardContent>

      <IndividualMatchDialog
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open)
          if (!open) {
            setAssignMode(null)
            setFixedTutor(null)
            setFixedTutee(null)
          }
        }}
        mode={assignMode}
        fixedTutor={fixedTutor}
        fixedTutee={fixedTutee}
        tutors={tutors}
        tutees={tutees}
        unmatchedTutorIds={unmatchedTutorIds}
        unmatchedTuteeIds={unmatchedTuteeIds}
        semester={assignmentSemester}
        onSuccess={onAssignSuccess}
        draftId={draftId}
      />
    </Card>
  )
}
