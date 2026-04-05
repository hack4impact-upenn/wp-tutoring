import { useSearchPagination } from "../hooks/use-search-pagination"
import { Badge } from "@/components/ui/badge"
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
import type { Tutee } from "../types"
import { getId, toArray, toSlotArray } from "../types"
import { ExportDropdown, exportTuteesCsv, exportTuteesXls } from "../components/export"
import { NameSearchInput, PaginationControls } from "./dashboard-shared"

export type UnmatchedViewProps = {
  unmatchedTutees: Tutee[]
  dataRevision: number
  activeTab: string
}

export function UnmatchedView({ unmatchedTutees, dataRevision, activeTab }: UnmatchedViewProps) {
  const { search, setSearch, filtered, paged, paginationProps } = useSearchPagination({
    items: unmatchedTutees,
    dataRevision,
    activeTab,
    getSearchableParts: (t) => [t.studentFirstName, t.studentLastName],
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Unmatched tutees</CardTitle>
          <CardDescription>
            Tutee applications with no match in the current assignments list. Run matching again after adding
            tutors or relaxing constraints.
          </CardDescription>
        </div>
        {unmatchedTutees.length > 0 && (
          <ExportDropdown
            label="Export unmatched"
            onCsv={() => exportTuteesCsv(unmatchedTutees)}
            onXls={() => exportTuteesXls(unmatchedTutees)}
          />
        )}
      </CardHeader>
      <CardContent>
        {unmatchedTutees.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            Every tutee has a match for the current semester, or there are no tutees yet.
          </p>
        ) : (
          <>
            <NameSearchInput
              id="admin-unmatched-search"
              value={search}
              onChange={setSearch}
              placeholder="Search by student name…"
            />
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">
                No unmatched tutees match your search.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Parent Email</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead>Slots</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.map((t) => {
                        const subjects = toArray(t.subjects)
                        const slots = toSlotArray(t.availability)
                        return (
                          <TableRow key={getId(t)}>
                            <TableCell className="font-medium">
                              {t.studentFirstName} {t.studentLastName}
                            </TableCell>
                            <TableCell>{t.studentGrade}</TableCell>
                            <TableCell className="text-sm">
                              {t.parentFirstName} {t.parentLastName}
                            </TableCell>
                            <TableCell className="text-sm">{t.parentEmail}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{t.format}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {subjects.slice(0, 3).map((s) => (
                                  <Badge key={s} variant="secondary" className="text-xs">
                                    {s}
                                  </Badge>
                                ))}
                                {subjects.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{subjects.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{slots.length}</TableCell>
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
