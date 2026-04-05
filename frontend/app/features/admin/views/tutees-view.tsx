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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ApplicationStatus } from "@/lib/types"
import type { Tutee } from "../types"
import { getId } from "../types"
import { ExportDropdown, exportTuteesCsv, exportTuteesXls } from "../components/export"
import { statusSelectTriggerClass } from "../components/application-status-ui"
import { NameSearchInput, PaginationControls } from "./dashboard-shared"

export type TuteesViewProps = {
  tutees: Tutee[]
  dataRevision: number
  activeTab: string
  onOpenTuteeProfile: (t: Tutee) => void
  onTuteeStatusChange: (t: Tutee, status: ApplicationStatus) => void
}

export function TuteesView({
  tutees,
  dataRevision,
  activeTab,
  onOpenTuteeProfile,
  onTuteeStatusChange,
}: TuteesViewProps) {
  const { search, setSearch, filtered, paged, paginationProps } = useSearchPagination({
    items: tutees,
    dataRevision,
    activeTab,
    getSearchableParts: (t) => [t.studentFirstName, t.studentLastName],
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tutee Applications</CardTitle>
          <CardDescription>All submitted tutee applications from MongoDB.</CardDescription>
        </div>
        {tutees.length > 0 && (
          <ExportDropdown
            label="Export Tutees"
            onCsv={() => exportTuteesCsv(tutees)}
            onXls={() => exportTuteesXls(tutees)}
          />
        )}
      </CardHeader>
      <CardContent>
        {tutees.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No tutee applications yet.</p>
        ) : (
          <>
            <NameSearchInput
              id="admin-tutee-search"
              value={search}
              onChange={setSearch}
              placeholder="Search by student name…"
            />
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">No tutees match your search.</p>
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
                        <TableHead className="w-[1%] whitespace-nowrap">See profile</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.map((t) => (
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
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => onOpenTuteeProfile(t)}
                            >
                              See profile
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={t.applicationStatus ?? "accepted"}
                              onValueChange={(v) => {
                                void onTuteeStatusChange(t, v as ApplicationStatus)
                              }}
                            >
                              <SelectTrigger
                                className={statusSelectTriggerClass(t.applicationStatus)}
                                size="sm"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="waitlist">Waitlist</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
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
