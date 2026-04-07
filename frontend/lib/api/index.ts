// Barrel re-export for all API modules
export { APIError, apiFetch, getAdminToken } from "./client"
export { getTutors, createTutor, lookupTutorByPennId, patchTutorStatus } from "./tutors"
export { getTutees, lookupTuteeByParentEmail, createTutee, patchTuteeStatus } from "./tutees"
export { adminLogin, adminMe, getAdmins, inviteAdmin, completeAdminInvite, deleteAdminInvite } from "./admin"
export {
  acceptAll,
  getAdminWorkspace,
  getDrafts,
  createDraft,
  renameDraft,
  deleteDraft,
  duplicateDraft,
  getAssignments,
  runMatching,
  reassignMatch,
  overrideAssignment,
  previewIndividualMatch,
} from "./matching"

// Re-export types for convenience (consumers can also import from @/lib/types directly)
export type {
  AdminWorkspacePayload,
  AdminAuthSuccess,
  AdminAccountStatus,
  AdminRow,
  AssignmentTutorDetail,
  AssignmentTuteeDetail,
  AssignmentRow,
  IndividualMatchCandidateRow,
  IndividualMatchResponse,
  MatchingDraft,
  RunMatchingResult,
  RunMatchingResultAssignmentExplanation,
} from "@/lib/types"
