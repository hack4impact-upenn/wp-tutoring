import { useEffect, useState, useCallback, type ReactNode } from "react"
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
import {
  getTutors,
  getTutees,
  getAssignments,
  runMatching,
  APIError,
  type AssignmentRow,
  type RunMatchingResult,
} from "@/lib/actions"
import { toast } from "sonner"
import {
  Users,
  GraduationCap,
  Link2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from "lucide-react"

interface Tutor {
  _id?: string
  id?: string
  firstName?: string
  lastName?: string
  email?: string
  pennId?: string
  year?: string
  format?: string
  subjects?: string[]
  availability?: { day: string; time: string }[]
  ageRanges?: string[]
  phone?: string
  createdAt?: string
  maxCapacity?: number
  tutorGender?: string
  apIbReady?: boolean
  returningStudentIds?: string[]
  subjectList?: string[]
  gradePrefs?: string[]
}

interface Tutee {
  _id?: string
  id?: string
  studentFirstName?: string
  studentLastName?: string
  studentGrade?: string
  studentAge?: number
  parentFirstName?: string
  parentLastName?: string
  parentEmail?: string
  format?: string
  subjects?: string[]
  availability?: { day: string; time: string }[]
  createdAt?: string
  genderPreference?: string
  siblingPreference?: string
  siblingNames?: string
  familyId?: string | null
  requiredGender?: string
  returningStatus?: string
  subjectNeeds?: string[]
  grade?: string
  preferredTimeSlots?: { day: string; time: string }[]
  requiredTutorId?: string | null
  preferredTutorId?: string | null
}

function getId(doc: { _id?: string; id?: string }): string {
  return doc._id || doc.id || ''
}

function toArray(val: unknown): string[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string' && val) return val.split(',').map(s => s.trim()).filter(Boolean)
  return []
}

function toSlotArray(val: unknown): { day: string; time: string }[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
  }
  return []
}

function resolveTutorSnapshot(a: AssignmentRow, tutors: Tutor[]): Tutor | undefined {
  if (a.tutorDetail) return a.tutorDetail as Tutor
  if (a.tutor_id) return tutors.find((t) => getId(t) === a.tutor_id)
  return undefined
}

function resolveTuteeSnapshot(a: AssignmentRow, tutees: Tutee[]): Tutee | undefined {
  if (a.tuteeDetail) return a.tuteeDetail as Tutee
  if (a.student_id) return tutees.find((t) => getId(t) === a.student_id)
  return undefined
}

function slotSummary(slots: { day?: string; time?: string }[], maxShow = 5): string {
  if (!slots.length) return "—"
  const head = slots.slice(0, maxShow).map((s) => `${s.day ?? "?"} ${s.time ?? ""}`.trim())
  const tail = slots.length > maxShow ? ` (+${slots.length - maxShow} more)` : ""
  return head.join(" · ") + tail
}

function MatchAttributeRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-x-2 gap-y-0.5 text-xs sm:grid-cols-[7rem_1fr] sm:text-sm">
      <dt className="shrink-0 font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-foreground">{children}</dd>
    </div>
  )
}

function MatchChipList({ items, max = 10 }: { items: string[]; max?: number }) {
  if (!items.length) return <span className="text-muted-foreground">—</span>
  const shown = items.slice(0, max)
  const rest = items.length - max
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((s) => (
        <Badge key={s} variant="secondary" className="max-w-full truncate text-xs font-normal">
          {s}
        </Badge>
      ))}
      {rest > 0 ? (
        <Badge variant="outline" className="text-xs">
          +{rest}
        </Badge>
      ) : null}
    </div>
  )
}

export function AdminDashboard() {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [tutees, setTutees] = useState<Tutee[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [lastMatchResult, setLastMatchResult] = useState<RunMatchingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [matchRunning, setMatchRunning] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [tutorData, tuteeData, assignmentData] = await Promise.all([
        getTutors(),
        getTutees(),
        getAssignments(),
      ])
      setTutors(Array.isArray(tutorData) ? tutorData : [])
      setTutees(Array.isArray(tuteeData) ? tuteeData : [])
      setAssignments(Array.isArray(assignmentData) ? assignmentData : [])
    } catch {
      toast.error("Failed to load data.")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRunMatching = useCallback(async () => {
    setMatchRunning(true)
    try {
      const result = await runMatching({})
      setLastMatchResult(result)
      const next = await getAssignments(result.semester)
      setAssignments(Array.isArray(next) ? next : [])
      const status = result.solverStatus || "UNKNOWN"
      if (status === "OPTIMAL" || status === "FEASIBLE") {
        toast.success(
          `Matching complete: ${result.assignmentsCount} assignment(s). Solver: ${status}.`,
        )
      } else {
        toast.warning(`Matching finished with status ${status}. Check logs below if needed.`)
      }
    } catch (err) {
      const msg = err instanceof APIError ? err.message : "Failed to run matching."
      toast.error(msg)
    } finally {
      setMatchRunning(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const matchedStudentIds = new Set(
    assignments.map((a) => a.student_id).filter(Boolean) as string[],
  )
  const unmatchedTuteeCount = Math.max(0, tutees.length - matchedStudentIds.size)

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-8 pt-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            View applications and run CP-SAT matching against the live database.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleRunMatching} disabled={matchRunning}>
            {matchRunning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Run matching
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={matchRunning}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {tutors.length}
              </p>
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
              <p className="text-2xl font-bold text-foreground">
                {tutees.length}
              </p>
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
              <p className="text-2xl font-bold text-foreground">{assignments.length}</p>
              <p className="text-xs text-muted-foreground">Matches (this semester)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {unmatchedTuteeCount}
              </p>
              <p className="text-xs text-muted-foreground">Unmatched Tutees</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {lastMatchResult && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Last run</CardTitle>
            <CardDescription>
              Mode {lastMatchResult.matchingMode ?? "—"} · Semester {lastMatchResult.semester} · Solver{" "}
              {lastMatchResult.solverStatus ?? "—"}
              {lastMatchResult.assignedStudentCount != null &&
                lastMatchResult.totalStudentCount != null &&
                ` · Students ${lastMatchResult.assignedStudentCount}/${lastMatchResult.totalStudentCount} assigned`}
              {lastMatchResult.objectiveValue != null &&
                ` · Objective ${Math.round(lastMatchResult.objectiveValue)}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {lastMatchResult.relaxationLog?.length ? (
              <p className="mb-2">
                Relaxations: {lastMatchResult.relaxationLog.length} message(s). Open browser devtools
                Network tab for full JSON if needed.
              </p>
            ) : null}
            <p>
              Assigned {lastMatchResult.assignmentsCount} pair(s). Unassigned tutors:{" "}
              {lastMatchResult.unassignedTutors}, unassigned students:{" "}
              {lastMatchResult.unassignedStudents}.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Data Tabs */}
      <Tabs defaultValue="tutors">
        <TabsList>
          <TabsTrigger value="tutors">
            Tutors ({tutors.length})
          </TabsTrigger>
          <TabsTrigger value="tutees">
            Tutees ({tutees.length})
          </TabsTrigger>
          <TabsTrigger value="matches">
            Matches ({assignments.length})
          </TabsTrigger>
        </TabsList>

        {/* Tutors Tab */}
        <TabsContent value="tutors">
          <Card>
            <CardHeader>
              <CardTitle>Tutor Applications</CardTitle>
              <CardDescription>All submitted tutor applications from MongoDB.</CardDescription>
            </CardHeader>
            <CardContent>
              {tutors.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No tutor applications yet.
                </p>
              ) : (
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
                      {tutors.map((t) => {
                        const subjects = toArray(t.subjects)
                        const slots = toSlotArray(t.availability)
                        return (
                          <TableRow key={getId(t)}>
                            <TableCell className="font-medium">
                              {t.firstName} {t.lastName}
                            </TableCell>
                            <TableCell className="text-sm">{t.email}</TableCell>
                            <TableCell className="text-sm font-mono">{t.pennId || '—'}</TableCell>
                            <TableCell>{t.year}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{t.format}</Badge>
                            </TableCell>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tutees Tab */}
        <TabsContent value="tutees">
          <Card>
            <CardHeader>
              <CardTitle>Tutee Applications</CardTitle>
              <CardDescription>All submitted tutee applications from MongoDB.</CardDescription>
            </CardHeader>
            <CardContent>
              {tutees.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No tutee applications yet.
                </p>
              ) : (
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
                      {tutees.map((t) => {
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current assignments</CardTitle>
              <CardDescription>
                Active matches for the current semester in MongoDB (updated when you run matching). Each row
                shows tutor and student side-by-side with the fields the matcher uses.
              </CardDescription>
            </CardHeader>
          </Card>
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <p className="text-center text-muted-foreground">
                  No assignments yet. Click &quot;Run matching&quot; after you have tutors and tutees in the
                  database.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assignments.map((a) => {
                const t = resolveTutorSnapshot(a, tutors)
                const s = resolveTuteeSnapshot(a, tutees)
                const tutorName =
                  [t?.firstName, t?.lastName].filter(Boolean).join(" ").trim() || a.tutor_name || "—"
                const studentName =
                  [s?.studentFirstName, s?.studentLastName].filter(Boolean).join(" ").trim() ||
                  a.student_name ||
                  "—"
                const tutorSubjects = toArray(
                  t?.subjectList?.length ? t.subjectList : t?.subjects,
                )
                const tuteeSubjects = toArray(
                  s?.subjectNeeds?.length ? s.subjectNeeds : s?.subjects,
                )
                const tutorSlots = toSlotArray(t?.availability)
                const prefSlots = toSlotArray(s?.preferredTimeSlots)
                const tuteeSlots =
                  prefSlots.length > 0 ? prefSlots : toSlotArray(s?.availability)
                const gradeDisplay = s?.grade || s?.studentGrade || "—"
                return (
                  <Card key={a.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
                        <div className="flex flex-col rounded-lg border bg-card p-4 shadow-sm">
                          <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                              <GraduationCap className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Tutor
                              </p>
                              <p className="truncate font-semibold text-foreground">{tutorName}</p>
                            </div>
                          </div>
                          <dl className="mt-auto space-y-2">
                            <MatchAttributeRow label="Email">
                              {t?.email || a.tutor_email || "—"}
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Penn ID">
                              <span className="font-mono text-xs">{t?.pennId || "—"}</span>
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Year">{t?.year || "—"}</MatchAttributeRow>
                            <MatchAttributeRow label="Format">
                              {t?.format ? (
                                <Badge variant="outline" className="text-xs">
                                  {t.format}
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Subjects">
                              <MatchChipList items={tutorSubjects} />
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Grades">
                              <MatchChipList items={toArray(t?.gradePrefs)} max={12} />
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Age bands">
                              <MatchChipList items={toArray(t?.ageRanges)} max={6} />
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Slots">
                              <span className="break-words text-xs text-muted-foreground">
                                {tutorSlots.length
                                  ? `${tutorSlots.length} · ${slotSummary(tutorSlots)}`
                                  : "—"}
                              </span>
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Capacity">
                              {t?.maxCapacity != null ? String(t.maxCapacity) : "—"}
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Gender">{t?.tutorGender || "—"}</MatchAttributeRow>
                            <MatchAttributeRow label="AP / IB">
                              {t?.apIbReady === true ? "Yes" : t?.apIbReady === false ? "No" : "—"}
                            </MatchAttributeRow>
                          </dl>
                        </div>

                        <div className="hidden items-center justify-center text-muted-foreground lg:flex">
                          <ArrowRight className="h-6 w-6 shrink-0" aria-hidden />
                        </div>
                        <div className="flex items-center justify-center gap-2 text-muted-foreground lg:hidden">
                          <div className="h-px flex-1 bg-border" />
                          <Link2 className="h-4 w-4 shrink-0" aria-hidden />
                          <div className="h-px flex-1 bg-border" />
                        </div>

                        <div className="flex flex-col rounded-lg border bg-card p-4 shadow-sm">
                          <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/15">
                              <Users className="h-4 w-4 text-accent" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Student
                              </p>
                              <p className="truncate font-semibold text-foreground">{studentName}</p>
                            </div>
                          </div>
                          <dl className="mt-auto space-y-2">
                            <MatchAttributeRow label="Grade">{gradeDisplay}</MatchAttributeRow>
                            <MatchAttributeRow label="Parent">
                              {[s?.parentFirstName, s?.parentLastName].filter(Boolean).join(" ").trim() ||
                                "—"}
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Email">
                              {s?.parentEmail || a.student_email || "—"}
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Format">
                              {s?.format ? (
                                <Badge variant="outline" className="text-xs">
                                  {s.format}
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Subjects">
                              <MatchChipList items={tuteeSubjects} />
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Pref. gender">
                              {s?.genderPreference || s?.requiredGender || "—"}
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Siblings">
                              {s?.siblingPreference
                                ? `${s.siblingPreference}${s.siblingNames ? ` · ${s.siblingNames}` : ""}`
                                : "—"}
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Family ID">
                              <span className="font-mono text-xs">{s?.familyId || "—"}</span>
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Returning">
                              {s?.returningStatus || "—"}
                            </MatchAttributeRow>
                            <MatchAttributeRow label="Slots">
                              <span className="break-words text-xs text-muted-foreground">
                                {tuteeSlots.length
                                  ? `${tuteeSlots.length} · ${slotSummary(tuteeSlots)}`
                                  : "—"}
                              </span>
                            </MatchAttributeRow>
                          </dl>
                        </div>
                      </div>

                      <div className="space-y-2 border-t bg-muted/30 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="font-mono text-xs">
                            Score {a.pairScore != null ? a.pairScore : "—"}
                          </Badge>
                          {a.scoreExplanation?.totalSoftScore != null ? (
                            <Badge variant="secondary" className="text-xs">
                              Soft total {a.scoreExplanation.totalSoftScore}
                            </Badge>
                          ) : null}
                          {a.reason ? (
                            <Badge variant="outline" className="text-xs">
                              {a.reason}
                            </Badge>
                          ) : null}
                          {a.manual_override ? (
                            <Badge variant="destructive" className="text-xs">
                              Manual override
                            </Badge>
                          ) : null}
                        </div>
                        {a.scoreExplanation?.summary ? (
                          <p className="text-sm text-muted-foreground">{a.scoreExplanation.summary}</p>
                        ) : null}
                        {a.scoreExplanation?.breakdown?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {a.scoreExplanation.breakdown.map((b, i) => (
                              <Badge key={`${b.code}-${i}`} variant="outline" className="text-xs font-normal">
                                {(b.label || b.code || "item") +
                                  (b.points != null ? `: +${b.points}` : "")}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
