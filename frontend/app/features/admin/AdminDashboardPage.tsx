import { Navigate } from "react-router"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/features/auth/AuthContext"
import { AdminDashboard as AdminDashboardComponent } from "./components/admin-dashboard"

export function AdminDashboardPage() {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/sign-in" replace />
  }

  return <AdminDashboardComponent />
}
