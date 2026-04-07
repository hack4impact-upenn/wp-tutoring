"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { completeAdminInvite, APIError } from "@/lib/api"
import { useAuth } from "@/features/auth/AuthContext"
import { Loader2, ShieldCheck } from "lucide-react"

export function AdminInviteAcceptForm() {
  const navigate = useNavigate()
  const { signOut, setAdminSession } = useAuth()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [formError, setFormError] = useState("")
  /** Set when the invite was already completed — show as informational text, not a hard error. */
  const [alreadyCreatedNotice, setAlreadyCreatedNotice] = useState("")

  useEffect(() => {
    signOut()
  }, [signOut])

  const tokenFromUrl = useMemo(() => {
    if (typeof window === "undefined") return ""
    return new URLSearchParams(window.location.search).get("token")?.trim() ?? ""
  }, [])

  function getInviteToken(): string {
    if (typeof window === "undefined") return ""
    return new URLSearchParams(window.location.search).get("token")?.trim() ?? ""
  }

  const completeMutation = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      completeAdminInvite({ token, password }),
    onSuccess: (result) => {
      setAdminSession(result.token, result.admin)
      navigate("/admin-dashboard", { replace: true })
    },
    onError: (err) => {
      if (err instanceof APIError && err.status === 409) {
        setAlreadyCreatedNotice(err.message)
      } else {
        setFormError(err instanceof APIError ? err.message : "Could not complete invitation.")
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setAlreadyCreatedNotice("")
    const token = getInviteToken()
    if (!token) {
      setFormError("Missing invitation token. Open the link from your email.")
      return
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setFormError("Passwords do not match.")
      return
    }
    completeMutation.mutate({ token, password })
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Create admin account</CardTitle>
          <CardDescription>
            Set a password to finish accepting your invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tokenFromUrl ? (
            <p className="text-center text-sm text-muted-foreground">
              This page needs a valid <code className="text-xs">token</code> in the URL. Use the link from
              your invitation email.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-password">Password</Label>
                <Input
                  id="invite-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setAlreadyCreatedNotice("")
                    setFormError("")
                  }}
                  minLength={8}
                  required
                />
                <p className="text-xs text-muted-foreground">At least 8 characters.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-confirm">Confirm password</Label>
                <Input
                  id="invite-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value)
                    setAlreadyCreatedNotice("")
                    setFormError("")
                  }}
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={completeMutation.isPending}>
                {completeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
              {formError ? (
                <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </p>
              ) : null}
              {alreadyCreatedNotice ? (
                <p
                  className="rounded-md border border-muted-foreground/25 bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
                  role="status"
                >
                  {alreadyCreatedNotice}{" "}
                  <Link to="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
                    Go to sign in
                  </Link>
                  .
                </p>
              ) : null}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
