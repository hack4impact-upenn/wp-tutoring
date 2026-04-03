import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AvailabilityPicker } from "@/components/forms/availability-picker"
import { SUBJECTS, GRADE_OPTIONS } from "@/lib/constants"
import type {
  AvailabilitySlot,
  TutoringFormat,
  GenderPreference,
  SiblingPreference,
  TuteeApplication,
} from "@/lib/types"
import { createTutee } from "@/lib/actions"
import { toast } from "sonner"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

interface TuteeApplicationFormProps {
  initialData?: Partial<TuteeApplication>
}

export function TuteeApplicationForm({ initialData }: TuteeApplicationFormProps = {}) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSuccess, setModalSuccess] = useState(false)
  const [modalMessage, setModalMessage] = useState("")

  // Student info
  const [studentFirstName, setStudentFirstName] = useState(initialData?.studentFirstName ?? "")
  const [studentLastName, setStudentLastName] = useState(initialData?.studentLastName ?? "")
  const [studentAge, setStudentAge] = useState(
    typeof initialData?.studentAge === "number" ? String(initialData.studentAge) : ""
  )
  const [studentGrade, setStudentGrade] = useState(initialData?.studentGrade ?? "")

  // Parent/guardian
  const [parentFirstName, setParentFirstName] = useState(initialData?.parentFirstName ?? "")
  const [parentLastName, setParentLastName] = useState(initialData?.parentLastName ?? "")
  const [parentEmail, setParentEmail] = useState(initialData?.parentEmail ?? "")
  const [parentPhone, setParentPhone] = useState(initialData?.parentPhone ?? "")

  // Preferences
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(
    initialData?.availability ?? []
  )
  const [format, setFormat] = useState<TutoringFormat>(initialData?.format ?? "Either")
  const [subjects, setSubjects] = useState<string[]>(initialData?.subjects ?? [])
  const [genderPreference, setGenderPreference] =
    useState<GenderPreference>(initialData?.genderPreference ?? "No Preference")
  const [siblingNames, setSiblingNames] = useState(initialData?.siblingNames ?? "")
  const [siblingPreference, setSiblingPreference] =
    useState<SiblingPreference>(initialData?.siblingPreference ?? "No Preference")
  const [previousTutorNames, setPreviousTutorNames] = useState(initialData?.previousTutorNames ?? "")
  const [additionalNotes, setAdditionalNotes] = useState(initialData?.additionalNotes ?? "")

  const toggleSubject = (s: string) => {
    setSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (
      !studentFirstName ||
      !studentLastName ||
      !studentGrade ||
      !parentFirstName ||
      !parentLastName ||
      !parentEmail
    ) {
      toast.error("Please fill in all required fields.")
      return
    }
    if (availability.length === 0) {
      toast.error("Please select at least one availability slot.")
      return
    }
    if (subjects.length === 0) {
      toast.error("Please select at least one subject.")
      return
    }

    setSubmitting(true)
    try {
      await createTutee({
        studentFirstName,
        studentLastName,
        studentAge: studentAge ? parseInt(studentAge) : 0,
        studentGrade,
        parentFirstName,
        parentLastName,
        parentEmail,
        parentPhone,
        availability,
        format,
        subjects,
        genderPreference,
        siblingNames,
        siblingPreference,
        previousTutorNames,
        additionalNotes,
      })
      setModalSuccess(true)
      setModalMessage("Your tutee application has been submitted successfully!")
      setModalOpen(true)
    } catch (err) {
      console.error("[TuteeForm] Error:", err)
      setModalSuccess(false)
      setModalMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      )
      setModalOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl space-y-6 px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Tutee Application
        </h1>
        <p className="mt-2 text-muted-foreground">
          Apply for free tutoring for your child. A parent or guardian must
          complete this form.
        </p>
      </div>

      {/* Student Info */}
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>
            Details about the student who will receive tutoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sFirstName">
              Student First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sFirstName"
              value={studentFirstName}
              onChange={(e) => setStudentFirstName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sLastName">
              Student Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sLastName"
              value={studentLastName}
              onChange={(e) => setStudentLastName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sAge">Student Age</Label>
            <Input
              id="sAge"
              type="number"
              min={4}
              max={19}
              value={studentAge}
              onChange={(e) => setStudentAge(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sGrade">
              Grade <span className="text-destructive">*</span>
            </Label>
            <Select value={studentGrade} onValueChange={setStudentGrade}>
              <SelectTrigger id="sGrade">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_OPTIONS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Parent/Guardian */}
      <Card>
        <CardHeader>
          <CardTitle>Parent / Guardian Information</CardTitle>
          <CardDescription>
            We will use this info for all communications.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pFirstName">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pFirstName"
              value={parentFirstName}
              onChange={(e) => setParentFirstName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pLastName">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pLastName"
              value={parentLastName}
              onChange={(e) => setParentLastName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pEmail">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pEmail"
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pPhone">Phone</Label>
            <Input
              id="pPhone"
              type="tel"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability</CardTitle>
          <CardDescription>
            Select all time slots when your child is available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityPicker value={availability} onChange={setAvailability} />
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Tutoring Preferences</CardTitle>
          <CardDescription>
            Help us find the best tutor match.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Format */}
          <div className="space-y-3">
            <Label>Tutoring Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as TutoringFormat)}
              className="flex flex-wrap gap-4"
            >
              {(["On-Campus", "Off-Campus", "Either"] as TutoringFormat[]).map(
                (f) => (
                  <div key={f} className="flex items-center gap-2">
                    <RadioGroupItem value={f} id={`tformat-${f}`} />
                    <Label htmlFor={`tformat-${f}`} className="font-normal">
                      {f}
                    </Label>
                  </div>
                )
              )}
            </RadioGroup>
          </div>

          {/* Subjects */}
          <div className="space-y-3">
            <Label>
              Subjects Needed <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-3">
              {SUBJECTS.map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <Checkbox
                    id={`tsubj-${s}`}
                    checked={subjects.includes(s)}
                    onCheckedChange={() => toggleSubject(s)}
                  />
                  <Label
                    htmlFor={`tsubj-${s}`}
                    className="text-sm font-normal"
                  >
                    {s}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Tutor gender preference */}
          <div className="space-y-3">
            <Label>Tutor Gender Preference</Label>
            <RadioGroup
              value={genderPreference}
              onValueChange={(v) => setGenderPreference(v as GenderPreference)}
              className="flex flex-wrap gap-4"
            >
              {(
                ["Male", "Female", "No Preference"] as GenderPreference[]
              ).map((g) => (
                <div key={g} className="flex items-center gap-2">
                  <RadioGroupItem value={g} id={`gender-${g}`} />
                  <Label htmlFor={`gender-${g}`} className="font-normal">
                    {g}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Siblings */}
          <div className="space-y-3">
            <Label htmlFor="siblingNames">
              Sibling Name(s) Also Applying
            </Label>
            <Input
              id="siblingNames"
              value={siblingNames}
              onChange={(e) => setSiblingNames(e.target.value)}
              placeholder="Enter sibling names, if applicable"
            />
          </div>

          {siblingNames && (
            <div className="space-y-3">
              <Label>Sibling Section Preference</Label>
              <RadioGroup
                value={siblingPreference}
                onValueChange={(v) =>
                  setSiblingPreference(v as SiblingPreference)
                }
                className="flex flex-wrap gap-4"
              >
                {(
                  [
                    "Same Section",
                    "Different Section",
                    "No Preference",
                  ] as SiblingPreference[]
                ).map((sp) => (
                  <div key={sp} className="flex items-center gap-2">
                    <RadioGroupItem value={sp} id={`sib-${sp}`} />
                    <Label htmlFor={`sib-${sp}`} className="font-normal">
                      {sp}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Previous tutor */}
          <div className="space-y-2">
            <Label htmlFor="prevTutor">Previous Tutor Name(s)</Label>
            <Textarea
              id="prevTutor"
              value={previousTutorNames}
              onChange={(e) => setPreviousTutorNames(e.target.value)}
              placeholder="If previously matched, enter the name(s) of your tutor(s) to request re-pairing."
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="tNotes">Additional Notes</Label>
            <Textarea
              id="tNotes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Anything else we should know?"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full font-semibold"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Application"
        )}
      </Button>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open && modalSuccess) navigate("/")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-2">
              {modalSuccess ? (
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              ) : (
                <XCircle className="h-10 w-10 text-destructive" />
              )}
            </div>
            <DialogTitle className="text-center">
              {modalSuccess ? "Application Submitted" : "Submission Failed"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {modalMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={() => {
                setModalOpen(false)
                if (modalSuccess) navigate("/")
              }}
            >
              {modalSuccess ? "Back to Home" : "Try Again"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
