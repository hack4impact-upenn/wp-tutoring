import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChevronDown, Copy, Edit2, Plus, Trash2 } from "lucide-react"
import type { MatchingDraft } from "@/lib/types"

interface DraftSelectorProps {
  drafts: MatchingDraft[]
  selectedDraftId: string | null
  onSelect: (draftId: string) => void
  /** Warm workspace cache before the user clicks a draft (hover). */
  onPrefetchDraft?: (draftId: string) => void
  onCreateDraft: (name: string) => void
  onDeleteDraft: (draftId: string) => void
  onRenameDraft: (draftId: string, name: string) => void
  onDuplicateDraft: (draftId: string) => void
  isLoading: boolean
}

export function DraftSelector({
  drafts,
  selectedDraftId,
  onSelect,
  onPrefetchDraft,
  onCreateDraft,
  onDeleteDraft,
  onRenameDraft,
  onDuplicateDraft,
  isLoading,
}: DraftSelectorProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [targetDraft, setTargetDraft] = useState<MatchingDraft | null>(null)
  const [nameInput, setNameInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedDraft = drafts.find((d) => d._id === selectedDraftId) ?? null

  const handleCreate = useCallback(() => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    onCreateDraft(trimmed)
    setNameInput("")
    setCreateOpen(false)
  }, [nameInput, onCreateDraft])

  const handleRename = useCallback(() => {
    const trimmed = nameInput.trim()
    if (!trimmed || !targetDraft) return
    onRenameDraft(targetDraft._id, trimmed)
    setNameInput("")
    setTargetDraft(null)
    setRenameOpen(false)
  }, [nameInput, targetDraft, onRenameDraft])

  const handleDelete = useCallback(() => {
    if (!targetDraft) return
    onDeleteDraft(targetDraft._id)
    setTargetDraft(null)
    setDeleteOpen(false)
  }, [targetDraft, onDeleteDraft])

  if (isLoading) return null

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Draft:</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="min-w-[160px] justify-between">
              <span className="truncate">{selectedDraft?.name ?? "Select draft..."}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[280px]">
            {drafts.map((draft) => (
              <DropdownMenuItem
                key={draft._id}
                className="flex items-center justify-between gap-2"
                onPointerEnter={() => onPrefetchDraft?.(draft._id)}
                onSelect={() => {
                  onSelect(draft._id)
                }}
              >
                <span className={`truncate ${draft._id === selectedDraftId ? "font-semibold" : ""}`}>
                  {draft.name}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      setTargetDraft(draft)
                      setNameInput(draft.name)
                      setRenameOpen(true)
                    }}
                    title="Rename"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDuplicateDraft(draft._id)
                    }}
                    title="Duplicate"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {drafts.length > 1 && (
                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTargetDraft(draft)
                        setDeleteOpen(true)
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setNameInput("")
                setCreateOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New draft
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create dialog */}
      <AlertDialog open={createOpen} onOpenChange={setCreateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New draft</AlertDialogTitle>
            <AlertDialogDescription>
              Create a new empty matching draft. You can then run matching or manually assign pairs
              within it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            ref={inputRef}
            placeholder="Draft name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNameInput("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreate} disabled={!nameInput.trim()}>
              Create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename dialog */}
      <AlertDialog open={renameOpen} onOpenChange={setRenameOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename draft</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for &ldquo;{targetDraft?.name}&rdquo;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="New name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setNameInput(""); setTargetDraft(null) }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRename} disabled={!nameInput.trim()}>
              Rename
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{targetDraft?.name}&rdquo; and all its matches.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTargetDraft(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
