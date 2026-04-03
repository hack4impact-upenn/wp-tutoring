import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getTutors, getTutees } from "@/lib/actions"
import { toast } from "sonner"
import {
  Users,
  GraduationCap,
  Link2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { Tutor, Tutee } from "./types"
import { getId, toArray, toSlotArray } from "./types"
import {
  ExportDropdown,
  exportTutorsCsv,
  exportTutorsXls,
  exportTuteesCsv,
  exportTuteesXls,
} from "./export"

const PAGE_SIZE = 15

function PaginationControls({ page, totalPages, onPrev, onNext }: {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t pt-4">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={page >= totalPages}>
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [tutees, setTutees] = useState<Tutee[]>([])
  const [loading, setLoading] = useState(true)
  const [tutorPage, setTutorPage] = useState(1)
  const [tuteePage, setTuteePage] = useState(1)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [tutorData, tuteeData] = await Promise.all([
        getTutors(),
        getTutees(),
      ])
      setTutors(Array.isArray(tutorData) ? tutorData : [])
      setTutees(Array.isArray(tuteeData) ? tuteeData : [])
      setTutorPage(1)
      setTuteePage(1)
    } catch {
      toast.error("Failed to load data.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const tutorTotalPages = Math.max(1, Math.ceil(tutors.length / PAGE_SIZE))
  const tuteeTotalPages = Math.max(1, Math.ceil(tutees.length / PAGE_SIZE))
  const pagedTutors = tutors.slice((tutorPage - 1) * PAGE_SIZE, tutorPage * PAGE_SIZE)
  const pagedTutees = tutees.slice((tuteePage - 1) * PAGE_SIZE, tuteePage * PAGE_SIZE)

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            View all tutor and tutee applications.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tutors.length}</p>
              <p className="text-xs text-muted-foreground">Total Tutors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <GraduationCap className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tutees.length}</p>
              <p className="text-xs text-muted-foreground">Total Tutees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-chart-3/10">
              <Link2 className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Matches</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tutees.length}</p>
              <p className="text-xs text-muted-foreground">Unmatched Tutees</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Tabs */}
      <Tabs defaultValue="tutors" onValueChange={() => { setTutorPage(1); setTuteePage(1) }}>
        <TabsList>
          <TabsTrigger value="tutors">Tutors ({tutors.length})</TabsTrigger>
          <TabsTrigger value="tutees">Tutees ({tutees.length})</TabsTrigger>
        </TabsList>

        {/* Tutors Tab */}
        <TabsContent value="tutors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tutor Applications</CardTitle>
                <CardDescription>All submitted tutor applications from MongoDB.</CardDescription>
              </div>
              {tutors.length > 0 && (
                <ExportDropdown
                  label="Export Tutors"
                  onCsv={() => exportTutorsCsv(tutors)}
                  onXls={() => exportTutorsXls(tutors)}
                />
              )}
            </CardHeader>
            <CardContent>
              {tutors.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No tutor applications yet.</p>
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
                          <TableHead>Format</TableHead>
                          <TableHead>Subjects</TableHead>
                          <TableHead>Slots</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedTutors.map((t) => {
                          const subjects = toArray(t.subjects)
                          const slots = toSlotArray(t.availability)
                          return (
                            <TableRow key={getId(t)}>
                              <TableCell className="font-medium">{t.firstName} {t.lastName}</TableCell>
                              <TableCell className="text-sm">{t.email}</TableCell>
                              <TableCell className="text-sm font-mono">{t.pennId || "—"}</TableCell>
                              <TableCell>{t.year}</TableCell>
                              <TableCell><Badge variant="outline">{t.format}</Badge></TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {subjects.slice(0, 3).map((s) => (
                                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                                  ))}
                                  {subjects.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">+{subjects.length - 3}</Badge>
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
                  <PaginationControls
                    page={tutorPage}
                    totalPages={tutorTotalPages}
                    onPrev={() => setTutorPage((p) => Math.max(1, p - 1))}
                    onNext={() => setTutorPage((p) => Math.min(tutorTotalPages, p + 1))}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tutees Tab */}
        <TabsContent value="tutees">
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
                        {pagedTutees.map((t) => {
                          const subjects = toArray(t.subjects)
                          const slots = toSlotArray(t.availability)
                          return (
                            <TableRow key={getId(t)}>
                              <TableCell className="font-medium">{t.studentFirstName} {t.studentLastName}</TableCell>
                              <TableCell>{t.studentGrade}</TableCell>
                              <TableCell className="text-sm">{t.parentFirstName} {t.parentLastName}</TableCell>
                              <TableCell className="text-sm">{t.parentEmail}</TableCell>
                              <TableCell><Badge variant="outline">{t.format}</Badge></TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {subjects.slice(0, 3).map((s) => (
                                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                                  ))}
                                  {subjects.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">+{subjects.length - 3}</Badge>
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
                  <PaginationControls
                    page={tuteePage}
                    totalPages={tuteeTotalPages}
                    onPrev={() => setTuteePage((p) => Math.max(1, p - 1))}
                    onNext={() => setTuteePage((p) => Math.min(tuteeTotalPages, p + 1))}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
