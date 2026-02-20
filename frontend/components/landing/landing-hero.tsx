import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  GraduationCap,
  CalendarCheck,
  ArrowRight,
  Heart,
  BookOpen,
  Shuffle,
} from "lucide-react"

const stats = [
  { label: "Active Tutors", value: "200+", icon: Users },
  { label: "K-12 Students Served", value: "250+", icon: GraduationCap },
  { label: "Years Running", value: "30+", icon: CalendarCheck },
]

const steps = [
  {
    step: "01",
    title: "Apply Online",
    description:
      "Tutors and tutees fill out a brief application with their availability, subjects, and preferences.",
    icon: BookOpen,
  },
  {
    step: "02",
    title: "Auto-Matching",
    description:
      "Our system matches tutors and tutees based on schedule, subjects, age range, and past pairings.",
    icon: Shuffle,
  },
  {
    step: "03",
    title: "Start Tutoring",
    description:
      "Matched pairs begin weekly sessions on-campus at Civic House or off-campus in local schools.",
    icon: Heart,
  },
]

export function LandingHero() {
  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-primary px-4 py-20 md:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_60%)]" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary-foreground/70">
            University of Pennsylvania
          </p>
          <h1 className="text-balance font-serif text-4xl font-bold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
            West Philadelphia Tutoring Project
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-primary-foreground/85 md:text-xl">
            Free, weekly tutoring for K-12 students in West Philadelphia.
            Powered by Penn undergraduates and graduates building meaningful
            community connections.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/apply/tutor">
              <Button
                size="lg"
                variant="secondary"
                className="w-full gap-2 text-base font-semibold sm:w-auto"
              >
                Become a Tutor
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/apply/tutee">
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 border-primary-foreground/30 bg-transparent text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
              >
                Find a Tutor
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card px-4 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
              How It Works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Getting started is easy for both tutors and families.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((item) => (
              <Card key={item.step} className="relative border-border">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    Step {item.step}
                  </p>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="border-t border-border bg-card px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
            About WPTP
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            The West Philadelphia Tutoring Project is the largest community
            engagement organization at the University of Pennsylvania, housed
            within Civic House and led by a student executive board and Program
            Coordinator. We provide free tutoring services to K-12 students in
            the West Philadelphia area both on-campus at Civic House and
            off-campus in our local public schools.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            WPTP aims to promote mutually beneficial relationships between
            students at the university and within the community through tutoring
            sessions, community events, and educational conversations. For our
            tutors, WPTP provides opportunities to engage with our neighbors,
            gain a greater understanding of education-related issues, and develop
            a sense of civic responsibility.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-bold text-primary-foreground">
            Ready to Make a Difference?
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Whether you want to tutor or need tutoring for your child,
            applications are open now.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/apply/tutor">
              <Button
                size="lg"
                variant="secondary"
                className="w-full gap-2 font-semibold sm:w-auto"
              >
                Apply as Tutor
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/apply/tutee">
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 border-primary-foreground/30 bg-transparent font-semibold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
              >
                Apply as Tutee
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>West Philadelphia Tutoring Project &middot; University of Pennsylvania</p>
          <p>Housed within Civic House</p>
        </div>
      </footer>
    </div>
  )
}
