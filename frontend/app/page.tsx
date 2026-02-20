import { SiteHeader } from "@/components/layout/site-header"
import { LandingHero } from "@/components/landing/landing-hero"

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <LandingHero />
      </main>
    </div>
  )
}
