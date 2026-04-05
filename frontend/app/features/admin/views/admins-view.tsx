import { useCallback, useEffect, useState } from "react"
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
  getAdminToken,
  getAdmins,
  inviteAdmin,
  deleteAdminInvite,
  APIError,
  type AdminRow,
} from "@/lib/api"
import { toast } from "sonner"
import { Loader2, Shield, Copy, MailWarning, Trash2 } from "lucide-react"
import { ExportDropdown, exportAdminsCsv, exportAdminsXls } from "../components/export"

export type AdminsViewProps = {
  isActive: boolean
  /** Increment when parent reloads dashboard data (initial load, Refresh, matching) */
  dataRevision: number
  onAdminCountChange?: (count: number) => void
}

export function AdminsView({ isActive, dataRevision, onAdminCountChange }: AdminsViewProps) {
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [adminsLoading, setAdminsLoading] = useState(false)
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [manualInviteUrl, setManualInviteUrl] = useState<string | null>(null)
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null)

  const fetchAdmins = useCallback(async (opts?: { silent?: boolean }) => {
    const token = getAdminToken()
    if (!token) return
    const silent = opts?.silent === true
    if (!silent) setAdminsLoading(true)
    try {
      const rows = await getAdmins(token)
      if (Array.isArray(rows)) {
        setAdmins(rows)
      } else if (!silent) {
        setAdmins([])
      }
    } catch (err) {
      if (!silent) {
        toast.error(err instanceof APIError ? err.message : "Failed to load admins.")
      }
    } finally {
      if (!silent) setAdminsLoading(false)
    }
  }, [])

  useEffect(() => {
    onAdminCountChange?.(admins.length)
  }, [admins, onAdminCountChange])

  useEffect(() => {
    if (!isActive) return
    void fetchAdmins()
  }, [isActive, fetchAdmins])

  useEffect(() => {
    if (dataRevision < 1) return
    const token = getAdminToken()
    if (!token) return
    void fetchAdmins({ silent: true })
  }, [dataRevision, fetchAdmins])

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
              <code className="text-xs">SMTP_PASSWORD</code>) or Resend (<code className="text-xs">
                RESEND_API_KEY
              </code>
              ) plus <code className="text-xs">EMAIL_FROM</code> are set. Otherwise the invite is saved and
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
            <MailWarning className="text-amber-800 dark:text-amber-200" />
            <AlertTitle>No email was sent from the server</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                The invite is saved, but the API did not send email (missing Resend credentials or
                misconfiguration). Copy this link and send it securely (expires in 7 days):
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
              const token = getAdminToken()
              if (!token) {
                toast.error("You need a valid admin session to send invitations.")
                return
              }
              const name = inviteName.trim()
              const email = inviteEmail.trim()
              if (!name || !email) {
                toast.error("Enter name and email.")
                return
              }
              setInviting(true)
              void (async () => {
                try {
                  const res = await inviteAdmin({ name, email }, token)
                  console.info("[admin invite] API response", {
                    emailSent: res.emailSent,
                    hasInviteUrl: Boolean(res.inviteUrl),
                    recipient: email.trim(),
                    adminId: res._id,
                    hint: res.emailSent
                      ? "Check inbox/spam for the recipient."
                      : "Server did not report a sent message — see terminal where uvicorn runs (look for invite_email:).",
                  })
                  setManualInviteUrl(null)
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
                  await fetchAdmins()
                } catch (err) {
                  toast.error(err instanceof APIError ? err.message : "Failed to send invitation.")
                } finally {
                  setInviting(false)
                }
              })()
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
            <Button type="submit" disabled={inviting}>
              {inviting ? (
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
        ) : !getAdminToken() ? (
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
                            disabled={deletingInviteId === String(a._id)}
                            title="Remove invitation"
                            onClick={async (e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (
                                !window.confirm(
                                  `Remove the pending invitation for ${a.email}? They will not be able to use the invite link.`,
                                )
                              ) {
                                return
                              }
                              const tok = getAdminToken()
                              if (!tok) {
                                toast.error("Sign in again to manage invitations.")
                                return
                              }
                              const removeId = String(a._id)
                              setDeletingInviteId(removeId)
                              try {
                                await deleteAdminInvite(removeId, tok)
                                setAdmins((prev) => prev.filter((row) => String(row._id) !== removeId))
                                toast.success("Invitation removed.")
                                void fetchAdmins({ silent: true })
                              } catch (err) {
                                toast.error(
                                  err instanceof APIError ? err.message : "Failed to remove invitation.",
                                )
                              } finally {
                                setDeletingInviteId(null)
                              }
                            }}
                          >
                            {deletingInviteId === String(a._id) ? (
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
