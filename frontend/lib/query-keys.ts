/** Central React Query keys for the frontend. */

export const adminKeys = {
  all: ["admin"] as const,
  /** Empty string = server picks first draft for current semester. */
  workspace: (draftKey: string) => [...adminKeys.all, "workspace", draftKey] as const,
  adminsList: () => [...adminKeys.all, "admins-list"] as const,
}

export const authKeys = {
  all: ["auth"] as const,
  /** Session validation for stored JWT; include token so login/logout swap cache. */
  me: (token: string) => [...authKeys.all, "me", token] as const,
}

export const applyKeys = {
  all: ["apply"] as const,
  tuteeLookup: (parentEmail: string) => [...applyKeys.all, "tutee-lookup", parentEmail] as const,
  tutorLookup: (pennId: string) => [...applyKeys.all, "tutor-lookup", pennId] as const,
}

/** Pairwise preview for individual match / change match pickers. */
export function matchPreviewKey(args: {
  mode: "pick-tutee" | "pick-tutor"
  fixedTutorId: string
  fixedTuteeId: string
  semester: string
  draftId: string
  candidateTutorIds: string
  candidateTuteeIds: string
}) {
  return [
    "match-preview",
    args.mode,
    args.fixedTutorId,
    args.fixedTuteeId,
    args.semester,
    args.draftId,
    args.candidateTutorIds,
    args.candidateTuteeIds,
  ] as const
}
