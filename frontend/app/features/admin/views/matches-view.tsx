import { useSearchPagination } from "../hooks/use-search-pagination"
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
import type { AssignmentRow } from "@/lib/types"
import type { Tutor, Tutee } from "../types"
import { NameSearchInput, PaginationControls } from "./dashboard-shared"
import { resolveAssignmentNames } from "../helpers"
import { ExportDropdown, exportMatchesCsv, exportMatchesXls } from "../components/export"
import { ArrowLeftRight, GitCompare } from "lucide-react"

export type MatchesViewProps = {
  assignments: AssignmentRow[]
  tutors: Tutor[]
  tutees: Tutee[]
  dataRevision: number
  activeTab: string
  onOpenMatchDetail: (a: AssignmentRow) => void
  onOpenModifyMatch: (a: AssignmentRow) => void
}

export function MatchesView({
  assignments,
  tutors,
  tutees,
  dataRevision,
  activeTab,
  onOpenMatchDetail,
  onOpenModifyMatch,
}: MatchesViewProps) {
  const { search, setSearch, filtered, paged, paginationProps } = useSearchPagination({
    items: assignments,
    dataRevision,
    activeTab,
    filterDeps: [tutors, tutees],
    getSearchableParts: (a) => {
      const { tutorName, studentName } = resolveAssignmentNames(a, tutors, tutees)
      return [tutorName, studentName]
    },
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Matches</CardTitle>
          <CardDescription>
            Active pairs for the current semester. Use &quot;Show similarities&quot; to compare tutor and student
            applications side by side; &quot;Change match&quot; to replace the tutor or the student on a row
            (admin only).
          </CardDescription>
        </div>
        {assignments.length > 0 && (
          <ExportDropdown
            label="Export Matches"
            onCsv={() => exportMatchesCsv(assignments, tutors, tutees)}
            onXls={() => exportMatchesXls(assignments, tutors, tutees)}
          />
        )}
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No assignments yet. Click &quot;Run matching&quot; after you have tutors and tutees in the database.
          </p>
        ) : (
          <>
            <NameSearchInput
              id="admin-match-search"
              value={search}
              onChange={setSearch}
              placeholder="Search by tutor or student name…"
            />
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">No matches match your search.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tutor</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead className="min-w-[8.5rem] whitespace-nowrap">See similarities</TableHead>
                        <TableHead className="min-w-[8.5rem] whitespace-nowrap">Change match</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.map((a) => {
                        const { tutorName, studentName } = resolveAssignmentNames(a, tutors, tutees)
                        const tutorDisplay = tutorName || "—"
                        const studentDisplay = studentName || "—"

                        return (
                          <TableRow key={a.id}>
                            <TableCell className="max-w-[12rem] truncate font-medium" title={tutorDisplay}>
                              {tutorDisplay}
                            </TableCell>
                            <TableCell className="max-w-[12rem] truncate font-medium" title={studentDisplay}>
                              {studentDisplay}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                className="h-7 gap-1 border-primary/40 bg-background px-2.5 text-xs font-medium text-foreground shadow-none hover:border-primary/60 hover:bg-primary/10 hover:text-foreground"
                                onClick={() => onOpenMatchDetail(a)}
                              >
                                <GitCompare className="size-3.5 shrink-0 text-primary" aria-hidden />
                                Show similarities
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                className="h-7 gap-1 border-primary/40 bg-background px-2.5 text-xs font-medium text-foreground shadow-none hover:border-primary/60 hover:bg-primary/10 hover:text-foreground"
                                onClick={() => onOpenModifyMatch(a)}
                              >
                                <ArrowLeftRight className="size-3.5 shrink-0 text-primary" aria-hidden />
                                Change match
                              </Button>
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
    </Card>
  )
}
