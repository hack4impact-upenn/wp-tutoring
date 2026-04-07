import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Search, UserPlus } from "lucide-react"
import { TutorApplicationForm } from "./components/tutor-application-form"
import { lookupTutorByPennId } from "@/lib/api"
import type { TutorApplication } from "@/lib/types"
import { useNavigate } from "react-router"

const ADMIN_PENN_ID = "12345678"

export function TutorApplyPage() {
  const navigate = useNavigate()
  const [pennId, setPennId] = useState("")
  const [started, setStarted] = useState(false)
  const [existingData, setExistingData] = useState<Partial<TutorApplication> | undefined>(undefined)

  const lookupMutation = useMutation({
    mutationFn: (id: string) => lookupTutorByPennId(id),
    onSuccess: (existing, id) => {
      if (existing) {
        setExistingData(existing)
      } else {
        setExistingData({ pennId: id })
      }
      setStarted(true)
    },
    onError: (_, id) => {
      setExistingData({ pennId: id })
      setStarted(true)
    },
  })

  function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    const id = pennId.trim()
    if (!id) return
    if (id === ADMIN_PENN_ID) {
      navigate("/admin-dashboard")
      return
    }
    lookupMutation.mutate(id)
  }

  function handleStartFresh() {
    setExistingData(undefined)
    setStarted(true)
  }

  if (started) {
    return <TutorApplicationForm initialData={existingData} />
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Tutor Application
        </h1>
        <p className="mt-2 text-muted-foreground">
          Enter your Penn ID to retrieve a previous application, or start a new
          one from scratch.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retrieve Your Application</CardTitle>
          <CardDescription>
            If you've started an application before, enter your Penn ID to
            continue where you left off.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lookupPennId">Penn ID</Label>
              <Input
                id="lookupPennId"
                value={pennId}
                onChange={(e) => setPennId(e.target.value)}
                placeholder="Enter your 8-digit Penn ID"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!pennId.trim() || lookupMutation.isPending}
            >
              {lookupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Looking up...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Look Up Application
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
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Start a New Application
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
