// Barrel re-export for all API modules
export { APIError, apiFetch, getAdminToken } from "./client"
export { getTutors, createTutor, lookupTutorByPennId, patchTutorStatus } from "./tutors"
export { getTutees, lookupTuteeByParentEmail, createTutee, patchTuteeStatus } from "./tutees"
export { adminLogin, adminMe, getAdmins, inviteAdmin, completeAdminInvite, deleteAdminInvite } from "./admin"
export {
  getAssignments,
  runMatching,
  reassignMatch,
  overrideAssignment,
  previewIndividualMatch,
} from "./matching"

// Re-export types for convenience (consumers can also import from @/lib/types directly)
export type {
  AdminAuthSuccess,
  AdminAccountStatus,
  AdminRow,
  AssignmentTutorDetail,
  AssignmentTuteeDetail,
  AssignmentRow,
  IndividualMatchCandidateRow,
  IndividualMatchResponse,
  RunMatchingResult,
  RunMatchingResultAssignmentExplanation,
} from "@/lib/types"
