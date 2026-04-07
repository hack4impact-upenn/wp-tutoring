import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getAdmins,
  inviteAdmin,
  deleteAdminInvite,
  APIError,
  type AdminRow,
} from "@/lib/api"
import { adminKeys } from "@/lib/query-keys"
import { useAuth } from "@/features/auth/AuthContext"
import { toast } from "sonner"
import { Loader2, Shield, Copy, MailWarning, Trash2 } from "lucide-react"
import { ExportDropdown, exportAdminsCsv, exportAdminsXls } from "../components/export"

export type AdminsViewProps = {
  isActive: boolean
}

export function AdminsView({ isActive }: AdminsViewProps) {
  const queryClient = useQueryClient()
  const { adminToken } = useAuth()
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [manualInviteUrl, setManualInviteUrl] = useState<string | null>(null)

  const adminsQuery = useQuery({
    queryKey: adminKeys.adminsList(),
    queryFn: async () => {
      if (!adminToken) return [] as AdminRow[]
      const rows = await getAdmins(adminToken)
      return Array.isArray(rows) ? rows : []
    },
    enabled: isActive && !!adminToken,
    retry: false,
  })

  const admins = adminsQuery.data ?? []
  const adminsLoading = adminsQuery.isPending && isActive

  const inviteMutation = useMutation({
    mutationFn: async ({ name, email }: { name: string; email: string }) => {
      if (!adminToken) throw new Error("no_token")
      return inviteAdmin({ name, email }, adminToken)
    },
    onSuccess: (res, { email }) => {
      setManualInviteUrl(null)
      console.info("[admin invite] API response", {
        emailSent: res.emailSent,
        hasInviteUrl: Boolean(res.inviteUrl),
        recipient: email.trim(),
        adminId: res._id,
        hint: res.emailSent
          ? "Check inbox/spam for the recipient."
          : "Server did not report a sent message — see terminal where uvicorn runs (look for invite_email:).",
      })
      if (res.emailSent) {
        toast.success("Invitation email sent.")
      } else if (res.inviteUrl) {
        setManualInviteUrl(res.inviteUrl)
        toast("Invite saved — email not sent", {
          description: "Use the yellow box above to copy the signup link.",
        })
      } else {
        toast.success("Invitation saved.")
      }
      setInviteName("")
      setInviteEmail("")
      void queryClient.invalidateQueries({ queryKey: adminKeys.adminsList() })
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "no_token") {
        toast.error("You need a valid admin session to send invitations.")
        return
      }
      toast.error(err instanceof APIError ? err.message : "Failed to send invitation.")
    },
  })

  const deleteInviteMutation = useMutation({
    mutationFn: async (adminId: string) => {
      if (!adminToken) throw new Error("no_token")
      await deleteAdminInvite(adminId, adminToken)
    },
    onSuccess: () => {
      toast.success("Invitation removed.")
      void queryClient.invalidateQueries({ queryKey: adminKeys.adminsList() })
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "no_token") {
        toast.error("Sign in again to manage invitations.")
        return
      }
      toast.error(err instanceof APIError ? err.message : "Failed to remove invitation.")
    },
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Administrators</CardTitle>
            <CardDescription>
              The API sends email when SMTP (<code className="text-xs">SMTP_USER</code>,{" "}
              <code className="text-xs">SMTP_PASSWORD</code>,{" "}
              <code className="text-xs">EMAIL_FROM</code>) are set. Otherwise the invite is saved and
              you copy the link here.
            </CardDescription>
          </div>
        </div>
        {admins.length > 0 && (
          <ExportDropdown
            label="Export Admins"
            onCsv={() => exportAdminsCsv(admins)}
            onXls={() => exportAdminsXls(admins)}
          />
        )}
      </CardHeader>
      <CardContent className="space-y-8">
        {manualInviteUrl ? (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <MailWarning className="h-5 w-5 text-amber-800 dark:text-amber-200" />
            <AlertTitle>No email was sent from the server</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                The invite is saved, but the API did not send email (SMTP not configured).
                Copy this link and send it securely (expires in 7 days):
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all rounded border bg-background px-2 py-1.5 text-xs">
                  {manualInviteUrl}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    void navigator.clipboard.writeText(manualInviteUrl).then(
                      () => toast.success("Invite link copied."),
                      () => toast.error("Could not copy to clipboard."),
                    )
                  }}
                >
                  <Copy className="mr-1.5 h-4 w-4" />
                  Copy link
                </Button>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setManualInviteUrl(null)}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="mb-3 text-sm font-medium">Invite admin</h3>
          <form
            className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
            onSubmit={(e) => {
              e.preventDefault()
              const name = inviteName.trim()
              const email = inviteEmail.trim()
              if (!name || !email) {
                toast.error("Enter name and email.")
                return
              }
              inviteMutation.mutate({ name, email })
            }}
          >
            <div className="min-w-0 flex-1 space-y-2 sm:min-w-[12rem]">
              <Label htmlFor="admin-invite-name">Name</Label>
              <Input
                id="admin-invite-name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                autoComplete="name"
                placeholder="Full name"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2 sm:min-w-[14rem]">
              <Label htmlFor="admin-invite-email">Email</Label>
              <Input
                id="admin-invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoComplete="email"
                placeholder="email@school.edu"
              />
            </div>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send invitation"
              )}
            </Button>
          </form>
        </div>

        {adminsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : adminsQuery.isError ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <p className="max-w-md text-center text-sm text-destructive">
              {adminsQuery.error instanceof APIError
                ? adminsQuery.error.message
                : "Could not load the administrator list."}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void adminsQuery.refetch()}>
              Try again
            </Button>
          </div>
        ) : !adminToken ? (
          <p className="py-6 text-center text-muted-foreground">
            Sign in through the app sign-in page so your session includes an API token; then you can list and
            invite administrators.
          </p>
        ) : admins.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">No administrator records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead className="w-[1%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => {
                  const accountStatusLabel = a.accountStatus === "invited" ? "Invited" : "Created"
                  const removeId = String(a._id)
                  return (
                    <TableRow key={a._id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-sm">{a.email}</TableCell>
                      <TableCell>
                        {a.accountStatus === "invited" ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500/60 bg-amber-500/10 text-amber-950 dark:text-amber-100"
                          >
                            {accountStatusLabel}
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                            {accountStatusLabel}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {a.accountStatus === "invited" ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            disabled={deleteInviteMutation.isPending && deleteInviteMutation.variables === removeId}
                            title="Remove invitation"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (
                                !window.confirm(
                                  `Remove the pending invitation for ${a.email}? They will not be able to use the invite link.`,
                                )
                              ) {
                                return
                              }
                              deleteInviteMutation.mutate(removeId)
                            }}
                          >
                            {deleteInviteMutation.isPending && deleteInviteMutation.variables === removeId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
