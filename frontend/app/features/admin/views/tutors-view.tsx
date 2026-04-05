import { useMemo, useState } from "react"
import { useSearchPagination } from "../hooks/use-search-pagination"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import type { Tutor } from "../types"
import { getId } from "../types"
import { ExportDropdown, exportTutorsCsv, exportTutorsXls } from "../components/export"
import { statusSelectTriggerClass } from "../components/application-status-ui"
import { NameSearchInput, PaginationControls } from "./dashboard-shared"
import { CheckCheck } from "lucide-react"

export type TutorsViewProps = {
  tutors: Tutor[]
  /** Bumped when parent reloads list data (e.g. Refresh) */
  dataRevision: number
  /** When any tab changes, pagination resets (matches prior dashboard behavior) */
  activeTab: string
  onOpenTutorProfile: (t: Tutor) => void
  onTutorStatusChange: (t: Tutor, status: ApplicationStatus) => void
  onAcceptAll?: () => void
}

export function TutorsView({
  tutors,
  dataRevision,
  activeTab,
  onOpenTutorProfile,
  onTutorStatusChange,
  onAcceptAll,
}: TutorsViewProps) {
  const [acceptAllOpen, setAcceptAllOpen] = useState(false)

  const nonAcceptedCount = useMemo(
    () => tutors.filter((t) => (t.applicationStatus ?? "accepted") !== "accepted").length,
    [tutors],
  )

  const { search, setSearch, filtered, paged, paginationProps } = useSearchPagination({
    items: tutors,
    dataRevision,
    activeTab,
    getSearchableParts: (t) => [t.firstName, t.lastName],
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tutor Applications</CardTitle>
          <CardDescription>All submitted tutor applications from MongoDB.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {nonAcceptedCount > 0 && onAcceptAll && (
            <Button variant="outline" size="sm" type="button" onClick={() => setAcceptAllOpen(true)}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Accept all
            </Button>
          )}
          {tutors.length > 0 && (
            <ExportDropdown
              label="Export Tutors"
              onCsv={() => exportTutorsCsv(tutors)}
              onXls={() => exportTutorsXls(tutors)}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {tutors.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No tutor applications yet.</p>
        ) : (
          <>
            <NameSearchInput
              id="admin-tutor-search"
              value={search}
              onChange={setSearch}
              placeholder="Search by tutor name…"
            />
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">No tutors match your search.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Penn ID</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead className="w-[1%] whitespace-nowrap">See profile</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.map((t) => (
                        <TableRow key={getId(t)}>
                          <TableCell className="font-medium">
                            {t.firstName} {t.lastName}
                          </TableCell>
                          <TableCell className="text-sm">{t.email}</TableCell>
                          <TableCell className="text-sm font-mono">{t.pennId || "—"}</TableCell>
                          <TableCell>{t.year}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => onOpenTutorProfile(t)}
                            >
                              See profile
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={t.applicationStatus ?? "accepted"}
                              onValueChange={(v) => {
                                void onTutorStatusChange(t, v as ApplicationStatus)
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

      <AlertDialog open={acceptAllOpen} onOpenChange={setAcceptAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept all tutors?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set {nonAcceptedCount} tutor{nonAcceptedCount === 1 ? "" : "s"} to Accepted
              status. This action can be undone individually.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onAcceptAll?.()
                setAcceptAllOpen(false)
              }}
            >
              Accept all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
