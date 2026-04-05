import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getTutors,
  getTutees,
  getAssignments,
  getAdmins,
  runMatching,
  patchTutorStatus,
  patchTuteeStatus,
  getAdminToken,
  APIError,
  type AssignmentRow,
  type RunMatchingResult,
} from "@/lib/api"
import type { ApplicationStatus } from "@/lib/types"
import { toast } from "sonner"
import {
  Users,
  GraduationCap,
  Link2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import type { Tutor, Tutee } from "../types"
import { getId } from "../types"
import { ApplicationProfileDialog } from "./application-profile-dialog"
import { MatchDetailDialog } from "./match-detail-dialog"
import { ModifyMatchDialog } from "./modify-match-dialog"
import { TutorsView } from "../views/tutors-view"
import { TuteesView } from "../views/tutees-view"
import { MatchesView } from "../views/matches-view"
import { UnmatchedView } from "../views/unmatched-view"
import { AdminsView } from "../views/admins-view"

export function AdminDashboard() {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [tutees, setTutees] = useState<Tutee[]>([])
  const [assignments, setAssignments] = useState<AssignmentRow[]>([])
  const [lastMatchResult, setLastMatchResult] = useState<RunMatchingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [matchRunning, setMatchRunning] = useState(false)
  const [dataRevision, setDataRevision] = useState(0)
  const [activeTab, setActiveTab] = useState("tutors")
  const [adminsTabCount, setAdminsTabCount] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileTutor, setProfileTutor] = useState<Tutor | null>(null)
  const [profileTutee, setProfileTutee] = useState<Tutee | null>(null)
  const [matchDetailOpen, setMatchDetailOpen] = useState(false)
  const [matchDetailAssignment, setMatchDetailAssignment] = useState<AssignmentRow | null>(null)
  const [modifyMatchOpen, setModifyMatchOpen] = useState(false)
  const [modifyMatchAssignment, setModifyMatchAssignment] = useState<AssignmentRow | null>(null)

  const bumpDataRevision = useCallback(() => {
    setDataRevision((r) => r + 1)
  }, [])

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
      const tok = getAdminToken()
      if (tok) {
        try {
          const adminRows = await getAdmins(tok)
          setAdminsTabCount(Array.isArray(adminRows) ? adminRows.length : 0)
        } catch {
          /* Cookie-only or expired JWT — AdminsView will sync count when possible */
        }
      } else {
        setAdminsTabCount(0)
      }
      bumpDataRevision()
    } catch {
      toast.error("Failed to load data.")
    } finally {
      setLoading(false)
    }
  }, [bumpDataRevision])

  const handleRunMatching = useCallback(async () => {
    setMatchRunning(true)
    try {
      const result = await runMatching({})
      setLastMatchResult(result)
      const next = await getAssignments(result.semester)
      setAssignments(Array.isArray(next) ? next : [])
      bumpDataRevision()
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
  }, [bumpDataRevision])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleTutorStatusChange = useCallback(async (t: Tutor, status: ApplicationStatus) => {
    const token = getAdminToken()
    if (!token) {
      toast.error("You must be signed in to update status.")
      return
    }
    try {
      const updated = await patchTutorStatus(getId(t), status, token)
      setTutors((prev) =>
        prev.map((row) => (getId(row) === getId(t) ? { ...row, ...updated } : row)),
      )
      toast.success("Status updated")
    } catch (err) {
      toast.error(err instanceof APIError ? err.message : "Failed to update status")
    }
  }, [])

  const handleTuteeStatusChange = useCallback(async (t: Tutee, status: ApplicationStatus) => {
    const token = getAdminToken()
    if (!token) {
      toast.error("You must be signed in to update status.")
      return
    }
    try {
      const updated = await patchTuteeStatus(getId(t), status, token)
      setTutees((prev) =>
        prev.map((row) => (getId(row) === getId(t) ? { ...row, ...updated } : row)),
      )
      toast.success("Status updated")
    } catch (err) {
      toast.error(err instanceof APIError ? err.message : "Failed to update status")
    }
  }, [])

  const matchedStudentIds = new Set(
    assignments.map((a) => a.student_id).filter(Boolean) as string[],
  )
  const unmatchedTutees = tutees.filter((t) => !matchedStudentIds.has(getId(t)))
  const unmatchedTuteeCount = unmatchedTutees.length

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-8 pt-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Admin Dashboard</h1>
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
              <p className="text-2xl font-bold text-foreground">{unmatchedTuteeCount}</p>
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
                Relaxations: {lastMatchResult.relaxationLog.length} message(s). Open browser devtools Network
                tab for full JSON if needed.
              </p>
            ) : null}
            <p>
              Assigned {lastMatchResult.assignmentsCount} pair(s). Unassigned tutors:{" "}
              {lastMatchResult.unassignedTutors}, unassigned students: {lastMatchResult.unassignedStudents}.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="tutors">Tutors ({tutors.length})</TabsTrigger>
          <TabsTrigger value="tutees">Tutees ({tutees.length})</TabsTrigger>
          <TabsTrigger value="matches">Matches ({assignments.length})</TabsTrigger>
          <TabsTrigger value="unmatched">Unmatched ({unmatchedTuteeCount})</TabsTrigger>
          <TabsTrigger value="admins">Admins ({adminsTabCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="tutors">
          <TutorsView
            tutors={tutors}
            dataRevision={dataRevision}
            activeTab={activeTab}
            onOpenTutorProfile={(t) => {
              setProfileTutor(t)
              setProfileTutee(null)
              setProfileOpen(true)
            }}
            onTutorStatusChange={handleTutorStatusChange}
          />
        </TabsContent>

        <TabsContent value="tutees">
          <TuteesView
            tutees={tutees}
            dataRevision={dataRevision}
            activeTab={activeTab}
            onOpenTuteeProfile={(t) => {
              setProfileTutee(t)
              setProfileTutor(null)
              setProfileOpen(true)
            }}
            onTuteeStatusChange={handleTuteeStatusChange}
          />
        </TabsContent>

        <TabsContent value="matches">
          <MatchesView
            assignments={assignments}
            tutors={tutors}
            tutees={tutees}
            dataRevision={dataRevision}
            activeTab={activeTab}
            onOpenMatchDetail={(a) => {
              setMatchDetailAssignment(a)
              setMatchDetailOpen(true)
            }}
            onOpenModifyMatch={(a) => {
              setModifyMatchAssignment(a)
              setModifyMatchOpen(true)
            }}
          />
        </TabsContent>

        <TabsContent value="unmatched">
          <UnmatchedView
            unmatchedTutees={unmatchedTutees}
            dataRevision={dataRevision}
            activeTab={activeTab}
          />
        </TabsContent>

        <TabsContent value="admins">
          <AdminsView
            isActive={activeTab === "admins"}
            dataRevision={dataRevision}
            onAdminCountChange={setAdminsTabCount}
          />
        </TabsContent>
      </Tabs>

      <ApplicationProfileDialog
        open={profileOpen}
        onOpenChange={(open) => {
          setProfileOpen(open)
          if (!open) {
            setProfileTutor(null)
            setProfileTutee(null)
          }
        }}
        tutor={profileTutor}
        tutee={profileTutee}
      />

      <MatchDetailDialog
        open={matchDetailOpen}
        onOpenChange={(open) => {
          setMatchDetailOpen(open)
          if (!open) setMatchDetailAssignment(null)
        }}
        assignment={matchDetailAssignment}
        tutors={tutors}
        tutees={tutees}
      />

      <ModifyMatchDialog
        open={modifyMatchOpen}
        onOpenChange={(open) => {
          setModifyMatchOpen(open)
          if (!open) setModifyMatchAssignment(null)
        }}
        assignment={modifyMatchAssignment}
        tutors={tutors}
        tutees={tutees}
        onSuccess={() => {
          void fetchAll()
        }}
      />
    </div>
  )
}
