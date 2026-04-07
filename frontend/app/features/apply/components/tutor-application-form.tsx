import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { AvailabilityPicker } from "./availability-picker"
import { SUBJECTS } from "@/lib/constants"
import type { AvailabilitySlot, AgeRange, TutoringFormat, TutorApplication } from "@/lib/types"
import { createTutor } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

const AGE_RANGES: AgeRange[] = ["K-3", "4-8", "9-12"]
const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"]

interface TutorApplicationFormProps {
  initialData?: Partial<TutorApplication>
}

export function TutorApplicationForm({ initialData }: TutorApplicationFormProps = {}) {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSuccess, setModalSuccess] = useState(false)
  const [modalMessage, setModalMessage] = useState("")

  const [firstName, setFirstName] = useState(initialData?.firstName ?? "")
  const [lastName, setLastName] = useState(initialData?.lastName ?? "")
  const [email, setEmail] = useState(initialData?.email ?? "")
  const [pennId, setPennId] = useState(initialData?.pennId ?? "")
  const [phone, setPhone] = useState(initialData?.phone ?? "")
  const [year, setYear] = useState(initialData?.year ?? "")
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(initialData?.availability ?? [])
  const [format, setFormat] = useState<TutoringFormat>(initialData?.format ?? "Either")
  const [subjects, setSubjects] = useState<string[]>(initialData?.subjects ?? [])
  const [ageRanges, setAgeRanges] = useState<AgeRange[]>(initialData?.ageRanges ?? [])
  const [previousTuteeNames, setPreviousTuteeNames] = useState(initialData?.previousTuteeNames ?? "")
  const [additionalNotes, setAdditionalNotes] = useState(initialData?.additionalNotes ?? "")

  const toggleSubject = (s: string) => {
    setSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  const toggleAge = (a: AgeRange) => {
    setAgeRanges((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    )
  }

  const submitMutation = useMutation({
    mutationFn: createTutor,
    onSuccess: () => {
      setModalSuccess(true)
      setModalMessage("Your tutor application has been submitted successfully!")
      setModalOpen(true)
    },
    onError: (err) => {
      console.error("[TutorForm] Error:", err)
      setModalSuccess(false)
      setModalMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      )
      setModalOpen(true)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!firstName || !lastName || !email || !year) {
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
    if (ageRanges.length === 0) {
      toast.error("Please select at least one age range.")
      return
    }

    submitMutation.mutate({
      firstName,
      lastName,
      email,
      pennId,
      phone,
      year,
      availability,
      format,
      subjects,
      ageRanges,
      previousTuteeNames,
      additionalNotes,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Tutor Application
        </h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for your interest in becoming a WPTP tutor. Please fill out
          the form below.
        </p>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your basic contact details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">
              Penn Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pennkey@upenn.edu"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pennId">Penn ID</Label>
            <Input
              id="pennId"
              value={pennId}
              onChange={(e) => setPennId(e.target.value)}
              placeholder="8-digit ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">
              Year <span className="text-destructive">*</span>
            </Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger id="year">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability</CardTitle>
          <CardDescription>
            Select all time slots when you are available for a weekly tutoring
            session.
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
            Help us find the best match for you.
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
                    <RadioGroupItem value={f} id={`format-${f}`} />
                    <Label htmlFor={`format-${f}`} className="font-normal">
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
              Subjects <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-3">
              {SUBJECTS.map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <Checkbox
                    id={`subj-${s}`}
                    checked={subjects.includes(s)}
                    onCheckedChange={() => toggleSubject(s)}
                  />
                  <Label htmlFor={`subj-${s}`} className="text-sm font-normal">
                    {s}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Age Ranges */}
          <div className="space-y-3">
            <Label>
              Preferred Age Ranges <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-4">
              {AGE_RANGES.map((a) => (
                <div key={a} className="flex items-center gap-2">
                  <Checkbox
                    id={`age-${a}`}
                    checked={ageRanges.includes(a)}
                    onCheckedChange={() => toggleAge(a)}
                  />
                  <Label htmlFor={`age-${a}`} className="text-sm font-normal">
                    Grades {a}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Previous pairing */}
          <div className="space-y-2">
            <Label htmlFor="prevTutees">Previous Tutee Name(s)</Label>
            <Textarea
              id="prevTutees"
              value={previousTuteeNames}
              onChange={(e) => setPreviousTuteeNames(e.target.value)}
              placeholder="If you were previously matched, enter the name(s) of your tutee(s) to request re-pairing."
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Anything else we should know?"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full font-semibold" disabled={submitMutation.isPending}>
        {submitMutation.isPending ? (
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
