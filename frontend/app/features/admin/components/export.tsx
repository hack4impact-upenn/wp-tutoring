import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import type { AssignmentRow, AdminRow } from "@/lib/types"
import type { Tutor, Tutee } from "../types"
import { toArray, toSlotArray } from "../types"
import { resolveTutorSnapshot, resolveTuteeSnapshot, resolveAssignmentNames } from "../helpers"

const TUTOR_COLUMNS = [
  "Name", "Status", "Email", "Penn ID", "Phone", "Year", "Format",
  "Subjects", "Age Ranges", "Availability Slots",
  "Previous Tutees", "Notes", "Created At",
] as const

const TUTEE_COLUMNS = [
  "Student Name", "Status", "Age", "Grade", "Parent Name", "Parent Email",
  "Parent Phone", "Format", "Subjects", "Gender Preference",
  "Sibling Names", "Sibling Preference", "Previous Tutors",
  "Availability Slots", "Notes", "Created At",
] as const

const MATCH_COLUMNS = [
  "Tutor Name",
  "Student Name",
  "Tutor Email",
  "Student Email",
  "Tutor ID",
  "Student ID",
  "Section ID",
  "Semester",
  "Pair Score",
  "Manual Override",
  "Reason",
  "Score Summary",
] as const

const ADMIN_COLUMNS = [
  "Name",
  "Email",
  "Role",
  "Account Status",
  "Invited At",
  "Created At",
] as const

function tutorToRow(t: Tutor): string[] {
  const subjects = toArray(t.subjects)
  const slots = toSlotArray(t.availability)
  return [
    `${t.firstName || ""} ${t.lastName || ""}`.trim(),
    t.applicationStatus ?? "accepted",
    t.email || "",
    t.pennId || "",
    t.phone || "",
    t.year || "",
    t.format || "",
    subjects.join(", "),
    toArray(t.ageRanges).join(", "),
    slots.map((s: { day: string; time: string }) => `${s.day} ${s.time}`).join("; "),
    t.previousTuteeNames || "",
    t.additionalNotes || "",
    t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "",
  ]
}

function matchToRow(a: AssignmentRow, tutors: Tutor[], tutees: Tutee[]): string[] {
  const t = resolveTutorSnapshot(a, tutors)
  const s = resolveTuteeSnapshot(a, tutees)
  const { tutorName, studentName } = resolveAssignmentNames(a, tutors, tutees)
  const tutorEmail = t?.email ?? a.tutor_email ?? ""
  const studentEmail = s?.parentEmail ?? a.student_email ?? ""
  return [
    tutorName,
    studentName,
    tutorEmail,
    studentEmail,
    a.tutor_id ?? "",
    a.student_id ?? "",
    a.section_id ?? "",
    a.semester ?? "",
    a.pairScore != null ? String(a.pairScore) : "",
    a.manual_override != null ? String(a.manual_override) : "",
    a.reason ?? "",
    a.scoreExplanation?.summary ?? "",
  ]
}

function adminToRow(a: AdminRow): string[] {
  return [
    a.name ?? "",
    a.email ?? "",
    a.role ?? "",
    a.accountStatus === "invited" ? "Invited" : "Created",
    a.invitedAt ? new Date(a.invitedAt).toLocaleString() : "",
    a.createdAt ? new Date(a.createdAt).toLocaleString() : "",
  ]
}

function tuteeToRow(t: Tutee): string[] {
  const subjects = toArray(t.subjects)
  const slots = toSlotArray(t.availability)
  return [
    `${t.studentFirstName || ""} ${t.studentLastName || ""}`.trim(),
    t.applicationStatus ?? "accepted",
    t.studentAge ? String(t.studentAge) : "",
    t.studentGrade || "",
    `${t.parentFirstName || ""} ${t.parentLastName || ""}`.trim(),
    t.parentEmail || "",
    t.parentPhone || "",
    t.format || "",
    subjects.join(", "),
    t.genderPreference || "",
    t.siblingNames || "",
    t.siblingPreference || "",
    t.previousTutorNames || "",
    slots.map((s: { day: string; time: string }) => `${s.day} ${s.time}`).join("; "),
    t.additionalNotes || "",
    t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "",
  ]
}

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function exportCsv(columns: readonly string[], rows: string[][], filename: string) {
  const header = columns.map(c => escapeCsv(c)).join(",")
  const body = rows.map(row => row.map(escapeCsv).join(",")).join("\n")
  downloadFile(`${header}\n${body}`, filename, "text/csv;charset=utf-8;")
}

function exportXls(columns: readonly string[], rows: string[][], filename: string) {
  const headerCells = columns.map(c => `<th>${c}</th>`).join("")
  const bodyRows = rows
    .map(row => `<tr>${row.map(v => `<td>${v}</td>`).join("")}</tr>`)
    .join("")
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`
  downloadFile(html, filename, "application/vnd.ms-excel")
}

export function exportTutorsCsv(tutors: Tutor[]) {
  exportCsv(TUTOR_COLUMNS, tutors.map(tutorToRow), "tutors.csv")
}

export function exportTutorsXls(tutors: Tutor[]) {
  exportXls(TUTOR_COLUMNS, tutors.map(tutorToRow), "tutors.xls")
}

export function exportTuteesCsv(tutees: Tutee[]) {
  exportCsv(TUTEE_COLUMNS, tutees.map(tuteeToRow), "tutees.csv")
}

export function exportTuteesXls(tutees: Tutee[]) {
  exportXls(TUTEE_COLUMNS, tutees.map(tuteeToRow), "tutees.xls")
}

export function exportMatchesCsv(assignments: AssignmentRow[], tutors: Tutor[], tutees: Tutee[]) {
  exportCsv(
    MATCH_COLUMNS,
    assignments.map((a) => matchToRow(a, tutors, tutees)),
    "matches.csv",
  )
}

export function exportMatchesXls(assignments: AssignmentRow[], tutors: Tutor[], tutees: Tutee[]) {
  exportXls(
    MATCH_COLUMNS,
    assignments.map((a) => matchToRow(a, tutors, tutees)),
    "matches.xls",
  )
}

export function exportAdminsCsv(admins: AdminRow[]) {
  exportCsv(ADMIN_COLUMNS, admins.map(adminToRow), "admins.csv")
}

export function exportAdminsXls(admins: AdminRow[]) {
  exportXls(ADMIN_COLUMNS, admins.map(adminToRow), "admins.xls")
}

export function ExportDropdown({ label, onCsv, onXls }: {
  label: string
  onCsv: () => void
  onXls: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onCsv}>
          <FileText className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onXls}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as XLS
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
