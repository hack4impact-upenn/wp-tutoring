import { SiteHeader } from "@/components/layout/site-header"
import { TutorApplicationForm } from "@/components/forms/tutor-application-form"

export const metadata = {
  title: "Tutor Application | WPTP",
  description: "Apply to become a tutor with the West Philadelphia Tutoring Project.",
}

export default function TutorApplyPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <TutorApplicationForm />
      </main>
    </div>
  )
}
