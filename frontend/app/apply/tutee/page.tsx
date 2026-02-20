import { SiteHeader } from "@/components/layout/site-header"
import { TuteeApplicationForm } from "@/components/forms/tutee-application-form"

export const metadata = {
  title: "Tutee Application | WPTP",
  description: "Apply for free tutoring for your child through the West Philadelphia Tutoring Project.",
}

export default function TuteeApplyPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <TuteeApplicationForm />
      </main>
    </div>
  )
}
