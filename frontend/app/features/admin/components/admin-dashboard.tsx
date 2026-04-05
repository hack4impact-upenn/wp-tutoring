import { useCallback, useEffect, useMemo, useState } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  acceptAll,
  getAdminWorkspace,
  getAdmins,
  createDraft,
  renameDraft,
  deleteDraft,
  duplicateDraft,
  runMatching,
  patchTutorStatus,
  patchTuteeStatus,
  APIError,
  type AssignmentRow,
  type RunMatchingResult,
} from "@/lib/api"
import { adminKeys } from "@/lib/query-keys"
import { useAuth } from "@/features/auth/AuthContext"
import type { AdminWorkspacePayload, ApplicationStatus } from "@/lib/types"
import { toast } from "sonner"
import {
  Users,
  GraduationCap,
  Link2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react"
import type { Tutor, Tutee } from "../types"
import { getId } from "../types"
import { ApplicationProfileDialog } from "./application-profile-dialog"
import { MatchDetailDialog } from "./match-detail-dialog"
import { ChangeMatchDialog } from "./change-match-dialog"
import { DraftSelector } from "./draft-selector"
import { TutorsView } from "../views/tutors-view"
import { TuteesView } from "../views/tutees-view"
import { MatchesView } from "../views/matches-view"
import { UnmatchedView } from "../views/unmatched-view"
import { AdminsView } from "../views/admins-view"

export function AdminDashboard() {
  const queryClient = useQueryClient()
  const { adminToken } = useAuth()
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null)
  const [lastMatchResult, setLastMatchResult] = useState<RunMatchingResult | null>(null)
  const [activeTab, setActiveTab] = useState("tutors")
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileTutor, setProfileTutor] = useState<Tutor | null>(null)
  const [profileTutee, setProfileTutee] = useState<Tutee | null>(null)
  const [matchDetailOpen, setMatchDetailOpen] = useState(false)
  const [matchDetailAssignment, setMatchDetailAssignment] = useState<AssignmentRow | null>(null)
  const [modifyMatchOpen, setModifyMatchOpen] = useState(false)
  const [modifyMatchAssignment, setModifyMatchAssignment] = useState<AssignmentRow | null>(null)
  const [matchConfirmOpen, setMatchConfirmOpen] = useState(false)

  const workspaceDraftKey = selectedDraftId ?? ""

  const workspaceQuery = useQuery({
    queryKey: adminKeys.workspace(workspaceDraftKey),
    queryFn: async (): Promise<AdminWorkspacePayload> => {
      if (!adminToken) {
        return { drafts: [], tutors: [], tutees: [], assignments: [], activeDraftId: null }
      }
      return getAdminWorkspace(adminToken, selectedDraftId || undefined)
    },
    enabled: !!adminToken,
    placeholderData: keepPreviousData,
  })

  const ws = workspaceQuery.data
  const drafts = ws?.drafts ?? []
  const tutors = ws?.tutors ?? []
  const tutees = ws?.tutees ?? []
  const assignments = ws?.assignments ?? []
  const activeDraftId = selectedDraftId ?? ws?.activeDraftId ?? null
  const selectedDraft = activeDraftId ? drafts.find((d) => d._id === activeDraftId) ?? null : null

  useEffect(() => {
    if (drafts.length === 0) {
      if (selectedDraftId) setSelectedDraftId(null)
      return
    }
    if (selectedDraftId && !drafts.some((d) => d._id === selectedDraftId)) {
      setSelectedDraftId(null)
    }
  }, [drafts, selectedDraftId])

  const invalidateWorkspace = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [...adminKeys.all, "workspace"] })
  }, [queryClient])

  const createDraftMutation = useMutation({
    mutationFn: (name: string) => {
      if (!adminToken) throw new Error("no_token")
      return createDraft(name, adminToken)
    },
    onSuccess: (newDraft) => {
      invalidateWorkspace()
      setSelectedDraftId(newDraft._id)
      toast.success(`Draft "${newDraft.name}" created`)
    },
    onError: (err) => {
      toast.error(err instanceof APIError ? err.message : "Failed to create draft")
    },
  })

  const renameDraftMutation = useMutation({
    mutationFn: ({ draftId, name }: { draftId: string; name: string }) => {
      if (!adminToken) throw new Error("no_token")
      return renameDraft(draftId, name, adminToken)
    },
    onSuccess: () => {
      invalidateWorkspace()
      toast.success("Draft renamed")
    },
    onError: (err) => {
      toast.error(err instanceof APIError ? err.message : "Failed to rename draft")
    },
  })

  const deleteDraftMutation = useMutation({
    mutationFn: (draftId: string) => {
      if (!adminToken) throw new Error("no_token")
      return deleteDraft(draftId, adminToken)
    },
    onSuccess: (_, deletedId) => {
      invalidateWorkspace()
      if (selectedDraftId === deletedId) setSelectedDraftId(null)
      toast.success("Draft deleted")
    },
    onError: (err) => {
      toast.error(err instanceof APIError ? err.message : "Failed to delete draft")
    },
  })

  const duplicateDraftMutation = useMutation({
    mutationFn: (draftId: string) => {
      if (!adminToken) throw new Error("no_token")
      const source = drafts.find((d) => d._id === draftId)
      const name = source ? `${source.name} (copy)` : "Draft (copy)"
      return duplicateDraft(draftId, name, adminToken)
    },
    onSuccess: (newDraft) => {
      invalidateWorkspace()
      setSelectedDraftId(newDraft._id)
      toast.success(`Draft "${newDraft.name}" created`)
    },
    onError: (err) => {
      toast.error(err instanceof APIError ? err.message : "Failed to duplicate draft")
    },
  })

  const adminsListQuery = useQuery({
    queryKey: adminKeys.adminsList(),
    queryFn: async () => {
      if (!adminToken) return []
      try {
        const rows = await getAdmins(adminToken)
        return Array.isArray(rows) ? rows : []
      } catch {
        return []
      }
    },
    enabled: !!adminToken,
  })

  const isInitialLoading = !adminToken ? false : workspaceQuery.isPending

  const dataRevision = useMemo(
    () =>
      (workspaceQuery.dataUpdatedAt || 0) + (adminsListQuery.dataUpdatedAt || 0),
    [workspaceQuery.dataUpdatedAt, adminsListQuery.dataUpdatedAt],
  )

  const adminsTabCount = adminsListQuery.data?.length ?? 0

  const invalidateAssignments = useCallback(() => {
    invalidateWorkspace()
  }, [invalidateWorkspace])

  const runMatchMutation = useMutation({
    mutationFn: () => {
      const bundle = queryClient.getQueryData<AdminWorkspacePayload>(
        adminKeys.workspace(selectedDraftId ?? ""),
      )
      const id = selectedDraftId ?? bundle?.activeDraftId
      if (!id) throw new Error("no_draft")
      return runMatching({ draftId: id })
    },
    onSuccess: async (result) => {
      setLastMatchResult(result)
      if (adminToken) {
        const fresh = await getAdminWorkspace(adminToken, selectedDraftId || undefined)
        queryClient.setQueryData(adminKeys.workspace(workspaceDraftKey), fresh)
      }
      const status = result.solverStatus || "UNKNOWN"
      if (status === "OPTIMAL" || status === "FEASIBLE") {
        toast.success(
          `Matching complete: ${result.assignmentsCount} assignment(s). Solver: ${status}.`,
        )
      } else {
        toast.warning(`Matching finished with status ${status}. Check logs below if needed.`)
      }
    },
    onError: (err) => {
      const msg = err instanceof APIError ? err.message : "Failed to run matching."
      toast.error(msg)
    },
  })

  const runMatchingJob = useCallback(() => {
    runMatchMutation.mutate()
  }, [runMatchMutation])

  const pendingTutorCount = tutors.filter((t) => t.applicationStatus === "pending").length
  const pendingTuteeCount = tutees.filter((t) => t.applicationStatus === "pending").length

  const onRunMatchingClick = useCallback(() => {
    if (!activeDraftId) {
      toast.error("Please select or create a draft first.")
      return
    }
    if (pendingTutorCount > 0 || pendingTuteeCount > 0) {
      setMatchConfirmOpen(true)
      return
    }
    void runMatchingJob()
  }, [activeDraftId, pendingTutorCount, pendingTuteeCount, runMatchingJob])

  const patchTutorMutation = useMutation({
    mutationFn: async ({
      t,
      status,
      draftId,
    }: {
      t: Tutor
      status: ApplicationStatus
      draftId: string
    }) => {
      if (!adminToken) throw new Error("no_token")
      return patchTutorStatus(getId(t), status, adminToken, draftId)
    },
    onSuccess: () => {
      invalidateWorkspace()
      toast.success("Status updated")
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "no_token") {
        toast.error("You must be signed in to update status.")
        return
      }
      toast.error(err instanceof APIError ? err.message : "Failed to update status")
    },
  })

  const patchTuteeMutation = useMutation({
    mutationFn: async ({
      t,
      status,
      draftId,
    }: {
      t: Tutee
      status: ApplicationStatus
      draftId: string
    }) => {
      if (!adminToken) throw new Error("no_token")
      return patchTuteeStatus(getId(t), status, adminToken, draftId)
    },
    onSuccess: () => {
      invalidateWorkspace()
      toast.success("Status updated")
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "no_token") {
        toast.error("You must be signed in to update status.")
        return
      }
      toast.error(err instanceof APIError ? err.message : "Failed to update status")
    },
  })

  const acceptAllMutation = useMutation({
    mutationFn: (collection: "tutors" | "tutees") => {
      if (!adminToken) throw new Error("no_token")
      if (!activeDraftId) throw new Error("no_draft")
      return acceptAll(collection, activeDraftId, adminToken)
    },
    onSuccess: (result, collection) => {
      invalidateWorkspace()
      toast.success(
        `${result.modifiedCount} ${collection === "tutors" ? "tutor" : "tutee"}(s) accepted`,
      )
    },
    onError: (err) => {
      toast.error(err instanceof APIError ? err.message : "Failed to accept all")
    },
  })

  const handleAcceptAllTutors = useCallback(() => {
    if (!adminToken) { toast.error("You must be signed in."); return }
    if (!activeDraftId) { toast.error("Select a draft first."); return }
    acceptAllMutation.mutate("tutors")
  }, [adminToken, activeDraftId, acceptAllMutation])

  const handleAcceptAllTutees = useCallback(() => {
    if (!adminToken) { toast.error("You must be signed in."); return }
    if (!activeDraftId) { toast.error("Select a draft first."); return }
    acceptAllMutation.mutate("tutees")
  }, [adminToken, activeDraftId, acceptAllMutation])

  const handleTutorStatusChange = useCallback(
    (t: Tutor, status: ApplicationStatus) => {
      if (!adminToken) {
        toast.error("You must be signed in to update status.")
        return
      }
      if (!activeDraftId) {
        toast.error("Select a draft before changing application status.")
        return
      }
      patchTutorMutation.mutate({ t, status, draftId: activeDraftId })
    },
    [adminToken, activeDraftId, patchTutorMutation],
  )

  const handleTuteeStatusChange = useCallback(
    (t: Tutee, status: ApplicationStatus) => {
      if (!adminToken) {
        toast.error("You must be signed in to update status.")
        return
      }
      if (!activeDraftId) {
        toast.error("Select a draft before changing application status.")
        return
      }
      patchTuteeMutation.mutate({ t, status, draftId: activeDraftId })
    },
    [adminToken, activeDraftId, patchTuteeMutation],
  )

  const matchedStudentIds = new Set(
    assignments.map((a) => a.student_id).filter(Boolean) as string[],
  )
  const matchedTutorIds = new Set(assignments.map((a) => a.tutor_id).filter(Boolean) as string[])
  const unmatchedTutees = tutees.filter((t) => !matchedStudentIds.has(getId(t)))
  const unmatchedTutors = tutors.filter((t) => !matchedTutorIds.has(getId(t)))
  const assignmentSemester = assignments[0]?.semester ?? selectedDraft?.semester ?? null
  const totalUnmatchedCount = unmatchedTutors.length + unmatchedTutees.length

  const coreLoadFailed = workspaceQuery.isError && !isInitialLoading

  if (isInitialLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (coreLoadFailed) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 pt-24 text-center">
        <p className="text-muted-foreground">Could not load dashboard data.</p>
        <Button
          type="button"
          onClick={() => void queryClient.invalidateQueries({ queryKey: adminKeys.all })}
        >
          Try again
        </Button>
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
          <Button
            size="sm"
            onClick={onRunMatchingClick}
            disabled={runMatchMutation.isPending || !activeDraftId}
          >
            {runMatchMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Run matching
          </Button>
        </div>
      </div>

      {/* Draft selector */}
      <DraftSelector
        drafts={drafts}
        selectedDraftId={activeDraftId}
        onSelect={setSelectedDraftId}
        onCreateDraft={(name) => createDraftMutation.mutate(name)}
        onDeleteDraft={(id) => deleteDraftMutation.mutate(id)}
        onRenameDraft={(id, name) => renameDraftMutation.mutate({ draftId: id, name })}
        onDuplicateDraft={(id) => duplicateDraftMutation.mutate(id)}
        isLoading={workspaceQuery.isPending}
      />

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
              <p className="text-xs text-muted-foreground">Matches (this draft)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalUnmatchedCount}</p>
              <p className="text-xs text-muted-foreground">Unmatched (tutors + tutees)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {lastMatchResult && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Last run</CardTitle>
            <CardDescription>
              Mode {lastMatchResult.matchingMode ?? "---"} · Semester {lastMatchResult.semester} · Solver{" "}
              {lastMatchResult.solverStatus ?? "---"}
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
          <TabsTrigger value="unmatched">Unmatched ({totalUnmatchedCount})</TabsTrigger>
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
            onAcceptAll={handleAcceptAllTutors}
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
            onAcceptAll={handleAcceptAllTutees}
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
            unmatchedTutors={unmatchedTutors}
            unmatchedTutees={unmatchedTutees}
            tutors={tutors}
            tutees={tutees}
            assignmentSemester={assignmentSemester}
            dataRevision={dataRevision}
            activeTab={activeTab}
            onAssignSuccess={invalidateAssignments}
            draftId={activeDraftId}
          />
        </TabsContent>

        <TabsContent value="admins">
          <AdminsView isActive={activeTab === "admins"} />
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

      <ChangeMatchDialog
        open={modifyMatchOpen}
        onOpenChange={(open) => {
          setModifyMatchOpen(open)
          if (!open) setModifyMatchAssignment(null)
        }}
        assignment={modifyMatchAssignment}
        tutors={tutors}
        tutees={tutees}
        onSuccess={invalidateAssignments}
        draftId={activeDraftId}
      />

      <AlertDialog open={matchConfirmOpen} onOpenChange={setMatchConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run matching with pending applications?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-muted-foreground text-sm">
                <p>
                  You have{" "}
                  {pendingTutorCount > 0 && pendingTuteeCount > 0 ? (
                    <>
                      <strong className="text-foreground">
                        {pendingTutorCount} {pendingTutorCount === 1 ? "tutor" : "tutors"}
                      </strong>{" "}
                      and{" "}
                      <strong className="text-foreground">
                        {pendingTuteeCount} {pendingTuteeCount === 1 ? "tutee" : "tutees"}
                      </strong>
                    </>
                  ) : pendingTutorCount > 0 ? (
                    <strong className="text-foreground">
                      {pendingTutorCount} {pendingTutorCount === 1 ? "tutor" : "tutors"}
                    </strong>
                  ) : (
                    <strong className="text-foreground">
                      {pendingTuteeCount} {pendingTuteeCount === 1 ? "tutee" : "tutees"}
                    </strong>
                  )}{" "}
                  in Pending status. They will not be included in matching unless you change their status
                  to Accepted.
                </p>
                <p>Are you sure you want to run matching?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                runMatchingJob()
              }}
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
