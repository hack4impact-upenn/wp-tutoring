import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Search, UserPlus } from "lucide-react"
import { TuteeApplicationForm } from "../components/forms/tutee-application-form"
import { lookupTuteeByParentEmail } from "@/lib/actions"
import type { TuteeApplication } from "@/lib/types"

export function TuteeApplyPage() {
  const [parentEmail, setParentEmail] = useState("")
  const [looking, setLooking] = useState(false)
  const [started, setStarted] = useState(false)
  const [existingData, setExistingData] = useState<Partial<TuteeApplication> | undefined>(undefined)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (!parentEmail.trim()) return

    setLooking(true)
    try {
      const existing = await lookupTuteeByParentEmail(parentEmail.trim())
      if (existing) {
        setExistingData(existing)
      } else {
        setExistingData({ parentEmail: parentEmail.trim() })
      }
      setStarted(true)
    } catch {
      setExistingData({ parentEmail: parentEmail.trim() })
      setStarted(true)
    } finally {
      setLooking(false)
    }
  }

  function handleStartFresh() {
    setExistingData({ parentEmail: parentEmail.trim() })
    setStarted(true)
  }

  if (started) {
    return <TuteeApplicationForm initialData={existingData} />
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Parent Access
        </h1>
        <p className="mt-2 text-muted-foreground">
          Enter your email to continue to your child application form.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find Your Form</CardTitle>
          <CardDescription>
            We will check if you already submitted before and prefill your latest application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parentEmailLookup">Parent Email</Label>
              <Input
                id="parentEmailLookup"
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="Enter your email"
                autoFocus
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!parentEmail.trim() || looking}
            >
              {looking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Looking up...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Continue with Email
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleStartFresh}
            disabled={!parentEmail.trim()}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Start New Form
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
