import { useState, type Dispatch, type SetStateAction } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

interface AddDownloadDialogProps {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  onAdd: (download: {
    url: string
    filename: string
    segments: number
    allowInsecure: boolean
  }) => void
}

export function AddDownloadDialog({ open, onOpenChange, onAdd }: AddDownloadDialogProps) {
  const [url, setUrl] = useState("")
  const [filename, setFilename] = useState("")
  const [segments, setSegments] = useState(8)
  const [allowInsecure, setAllowInsecure] = useState(false)

  const handleSubmit = () => {
    if (!url.trim()) return
    onAdd({
      url: url.trim(),
      filename: filename.trim() || extractFilename(url),
      segments,
      allowInsecure,
    })
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setUrl("")
    setFilename("")
    setSegments(8)
    setAllowInsecure(false)
  }

  const extractFilename = (url: string): string => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const name = pathname.split("/").pop() || "download"
      return decodeURIComponent(name)
    } catch {
      return "download"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Add Download</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder="https://example.com/file.zip"
              value={url}
              onChange={(e) => setUrl(e.currentTarget.value)}
              className="w-full"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="filename">Save as (optional)</Label>
            <Input
              id="filename"
              placeholder="Filename will be extracted from URL"
              value={filename}
              onChange={(e) => setFilename(e.currentTarget.value)}
              className="w-full"
            />
          </div>

          <Separator />

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="segments">Segments: {segments}</Label>
            </div>
            <Slider
              id="segments"
              value={segments}
              min={1}
              max={32}
              step={1}
              onValueChange={(val) => setSegments(val)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              More segments = faster download (1-32)
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="insecure">Allow insecure SSL</Label>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Skip certificate verification
              </p>
            </div>
            <Switch
              id="insecure"
              checked={allowInsecure}
              onCheckedChange={setAllowInsecure}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!url.trim()}>
            Start Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
