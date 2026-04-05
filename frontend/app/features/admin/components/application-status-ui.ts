import type { ApplicationStatus } from "@/lib/types"

function norm(s: ApplicationStatus | undefined): ApplicationStatus {
  return s ?? "accepted"
}

/** Tailwind classes for the status `<SelectTrigger>` in admin tables */
export function statusSelectTriggerClass(status: ApplicationStatus | undefined): string {
  const base = "h-8 w-[132px] shadow-none"
  const s = norm(status)
  if (s === "accepted") {
    return `${base} border-green-600/45 bg-green-50 text-green-900 hover:bg-green-100/90 focus-visible:ring-green-600/30 dark:border-green-700 dark:bg-green-950/50 dark:text-green-100 dark:hover:bg-green-950/70`
  }
  if (s === "waitlist") {
    return `${base} border-amber-500/50 bg-amber-50 text-amber-950 hover:bg-amber-100/90 focus-visible:ring-amber-500/30 dark:border-amber-700 dark:bg-amber-950/45 dark:text-amber-100 dark:hover:bg-amber-950/65`
  }
  return `${base} border-border bg-muted text-muted-foreground hover:bg-muted/80 focus-visible:ring-muted-foreground/25`
}

/** Tailwind classes for status `<Badge variant="outline">` in profile modal */
export function statusBadgeClass(status: ApplicationStatus | undefined): string {
  const s = norm(status)
  if (s === "accepted") {
    return "border-green-600/45 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950/50 dark:text-green-100"
  }
  if (s === "waitlist") {
    return "border-amber-500/50 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/45 dark:text-amber-100"
  }
  return "border-border bg-muted text-muted-foreground"
}
