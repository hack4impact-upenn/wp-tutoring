import { createBrowserRouter } from "react-router"
import { RootLayout } from "./layouts/RootLayout"
import { HomePage } from "./features/marketing/HomePage"
import { AboutPage } from "./features/marketing/AboutPage"
import { ContactPage } from "./features/marketing/ContactPage"
import { StudentDashboard } from "./features/dashboard/StudentDashboard"
import { TutorDashboard } from "./features/dashboard/TutorDashboard"
import { AdminDashboardPage } from "./features/admin/AdminDashboardPage"
import { SignInPage } from "./features/auth/SignInPage"
import { AcceptAdminInvitePage } from "./features/admin/AcceptAdminInvitePage"
import { TutorApplyPage } from "./features/apply/TutorApplyPage"
import { TuteeApplyPage } from "./features/apply/TuteeApplyPage"

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "about", Component: AboutPage },
      { path: "contact", Component: ContactPage },
      { path: "apply/tutor", Component: TutorApplyPage },
      { path: "apply/tutee", Component: TuteeApplyPage },
      { path: "sign-in", Component: SignInPage },
      { path: "admin/invite", Component: AcceptAdminInvitePage },
      { path: "student-dashboard", Component: StudentDashboard },
      { path: "tutor-dashboard", Component: TutorDashboard },
      { path: "admin-dashboard", Component: AdminDashboardPage },
    ],
  },
])
