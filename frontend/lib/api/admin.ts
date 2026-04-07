import type { AdminAuthSuccess, AdminRow } from "@/lib/types"
import { apiFetch } from "./client"

export async function adminLogin(email: string, password: string): Promise<AdminAuthSuccess> {
  return apiFetch<AdminAuthSuccess>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function adminMe(token: string): Promise<{
  _id: string; name: string; email: string; role: string
}> {
  return apiFetch("/api/admin/me", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getAdmins(token: string): Promise<AdminRow[]> {
  return apiFetch<AdminRow[]>("/api/admins", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function inviteAdmin(
  params: { name: string; email: string },
  token: string,
): Promise<AdminRow & { emailSent?: boolean; inviteUrl?: string }> {
  return apiFetch<AdminRow & { emailSent?: boolean; inviteUrl?: string }>("/api/admins/invite", {
    method: "POST",
    body: JSON.stringify(params),
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function completeAdminInvite(params: {
  token: string
  password: string
}): Promise<AdminAuthSuccess> {
  return apiFetch<AdminAuthSuccess>("/api/admin/complete-invite", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

/** Removes an admin record. Used from the dashboard only for pending invites (`DELETE /api/admins/{id}`). */
export async function deleteAdminInvite(
  adminId: string,
  token: string,
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/admins/${encodeURIComponent(adminId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
}
