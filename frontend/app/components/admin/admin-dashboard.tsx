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
import { toast } from "sonner"
import type { TutorApplication, TuteeApplication, Match } from "@/lib/types"
import {
  Users,
  GraduationCap,
  Link2,
  AlertCircle,
  Shuffle,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react"

export function AdminDashboard() {
  const [tutors, setTutors] = useState<TutorApplication[]>([])
  const [tutees, setTutees] = useState<TuteeApplication[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [matching, setMatching] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [tutorRes, tuteeRes, matchRes] = await Promise.all([
        fetch("/api/tutors"),
        fetch("/api/tutees"),
        fetch("/api/matches"),
      ])
      setTutors(await tutorRes.json())
      setTutees(await tuteeRes.json())
      setMatches(await matchRes.json())
    } catch {
      toast.error("Failed to load data.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function handleSeed() {
    setSeeding(true)
    try {
      await fetch("/api/seed", { method: "POST" })
      await fetchAll()
      toast.success("Sample data loaded!")
    } catch {
      toast.error("Failed to seed data.")
    } finally {
      setSeeding(false)
    }
  }

  async function handleAutoMatch() {
    setMatching(true)
    try {
      const res = await fetch("/api/matches", { method: "POST" })
      const data = await res.json()
      setMatches(data.allMatches)
      toast.success(
        `Matching complete! ${data.newMatches.length} new match(es) created.`
      )
    } catch {
      toast.error("Auto-matching failed.")
    } finally {
      setMatching(false)
    }
  }

  async function handleDropMatch(matchId: string) {
    try {
      const res = await fetch(`/api/matches?id=${matchId}`, {
        method: "DELETE",
      })
      setMatches(await res.json())
      toast.success("Match dropped.")
    } catch {
      toast.error("Failed to drop match.")
    }
  }

  async function handleClearAll() {
    try {
      const res = await fetch(`/api/matches?id=all`, { method: "DELETE" })
      setMatches(await res.json())
      toast.success("All matches cleared.")
    } catch {
      toast.error("Failed to clear matches.")
    }
  }

  const matchedTutorIds = new Set(matches.map((m) => m.tutor.id))
  const matchedTuteeIds = new Set(matches.map((m) => m.tutee.id))
  const unmatchedTutors = tutors.filter((t) => !matchedTutorIds.has(t.id))
  const unmatchedTutees = tutees.filter((t) => !matchedTuteeIds.has(t.id))

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pt-24 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage tutor-tutee matching for the current semester.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {tutors.length === 0 && tutees.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Users className="mr-2 h-4 w-4" />
              )}
              Load Sample Data
            </Button>
          )}
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
              <p className="text-2xl font-bold text-foreground">
                {matches.length}
              </p>
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
              <p className="text-2xl font-bold text-foreground">
                {unmatchedTutees.length}
              </p>
              <p className="text-xs text-muted-foreground">Unmatched Tutees</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Matching Actions</CardTitle>
          <CardDescription>
            Run the auto-matcher to pair unmatched tutors and tutees. You can
            drop individual matches and re-run.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handleAutoMatch} disabled={matching}>
            {matching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="mr-2 h-4 w-4" />
            )}
            Run Auto-Match
          </Button>
          {matches.length > 0 && (
            <Button variant="destructive" onClick={handleClearAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Matches
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Data Tabs */}
      <Tabs defaultValue="matches">
        <TabsList>
          <TabsTrigger value="matches">
            Matches ({matches.length})
          </TabsTrigger>
          <TabsTrigger value="tutors">
            Tutors ({tutors.length})
          </TabsTrigger>
          <TabsTrigger value="tutees">
            Tutees ({tutees.length})
          </TabsTrigger>
        </TabsList>

        {/* Matches Tab */}
        <TabsContent value="matches">
          <Card>
            <CardContent className="pt-6">
              {matches.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No matches yet. Run the auto-matcher to create pairings.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tutor</TableHead>
                        <TableHead>Tutee</TableHead>
                        <TableHead>Slot</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Reasons</TableHead>
                        <TableHead className="w-20" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">
                            {m.tutor.firstName} {m.tutor.lastName}
                          </TableCell>
                          <TableCell>
                            {m.tutee.studentFirstName}{" "}
                            {m.tutee.studentLastName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {m.matchedSlot.day} {m.matchedSlot.time}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {m.score}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {m.reasons.map((r, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {r}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDropMatch(m.id)}
                              aria-label="Drop match"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tutors Tab */}
        <TabsContent value="tutors">
          <Card>
            <CardContent className="pt-6">
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
                        <TableHead>Year</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead>Slots</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tutors.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">
                            {t.firstName} {t.lastName}
                          </TableCell>
                          <TableCell className="text-sm">
                            {t.email}
                          </TableCell>
                          <TableCell>{t.year}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{t.format}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {t.subjects.slice(0, 3).map((s) => (
                                <Badge
                                  key={s}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {s}
                                </Badge>
                              ))}
                              {t.subjects.length > 3 && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  +{t.subjects.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {t.availability.length}
                          </TableCell>
                          <TableCell>
                            {matchedTutorIds.has(t.id) ? (
                              <Badge className="bg-chart-3 text-card">
                                Matched
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
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
            <CardContent className="pt-6">
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
                        <TableHead>Format</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead>Slots</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tutees.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">
                            {t.studentFirstName} {t.studentLastName}
                          </TableCell>
                          <TableCell>{t.studentGrade}</TableCell>
                          <TableCell className="text-sm">
                            {t.parentFirstName} {t.parentLastName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{t.format}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {t.subjects.slice(0, 3).map((s) => (
                                <Badge
                                  key={s}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {s}
                                </Badge>
                              ))}
                              {t.subjects.length > 3 && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  +{t.subjects.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {t.availability.length}
                          </TableCell>
                          <TableCell>
                            {matchedTuteeIds.has(t.id) ? (
                              <Badge className="bg-chart-3 text-card">
                                Matched
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
