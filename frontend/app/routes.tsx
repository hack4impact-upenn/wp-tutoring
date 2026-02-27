import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { SignUpPage } from "./pages/SignUpPage";
import { SignInPage } from "./pages/SignInPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { TutorDashboard } from "./pages/TutorDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { TutorApplyPage } from "./pages/TutorApplyPage";
import { TuteeApplyPage } from "./pages/TuteeApplyPage";

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
      { path: "sign-up", Component: SignUpPage },
      { path: "sign-in", Component: SignInPage },
      { path: "student-dashboard", Component: StudentDashboard },
      { path: "tutor-dashboard", Component: TutorDashboard },
      { path: "admin-dashboard", Component: AdminDashboard },
    ],
  },
]);