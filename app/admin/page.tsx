import { SiteHeader } from "@/components/layout/site-header"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata = {
  title: "Admin Dashboard | WPTP",
  description: "Manage tutor-tutee matching for the West Philadelphia Tutoring Project.",
}

export default function AdminPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <AdminDashboard />
      </main>
    </div>
  )
}
