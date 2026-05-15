import { useState } from "react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

export interface DownloadItemData {
  id: string
  url: string
  filename: string
  totalBytes: number
  downloadedBytes: number
  status: "pending" | "downloading" | "paused" | "completed" | "error"
  speed?: string
  error?: string
}

interface DownloadItemProps {
  item: DownloadItemData
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onCancel?: (id: string) => void
  onRetry?: (id: string) => void
  onRemove?: (id: string) => void
  onOpenFolder?: (id: string) => void
}

export function DownloadItem({
  item,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onRemove,
  onOpenFolder,
}: DownloadItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const progress = item.totalBytes > 0 ? (item.downloadedBytes / item.totalBytes) * 100 : 0

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const statusColors: Record<DownloadItemData["status"], string> = {
    pending: "text-[hsl(var(--muted-foreground))]",
    downloading: "text-[hsl(var(--foreground))]",
    paused: "text-[hsl(var(--muted-foreground))]",
    completed: "text-[hsl(var(--foreground))]",
    error: "text-[hsl(var(--destructive))]",
  }

  const statusLabels: Record<DownloadItemData["status"], string> = {
    pending: "Pending",
    downloading: "Downloading",
    paused: "Paused",
    completed: "Completed",
    error: "Failed",
  }

  return (
    <div
      className={cn(
        "group flex flex-col gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 transition-colors",
        isHovered && "bg-[hsl(var(--muted))]/30"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium">{item.filename}</p>
          <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{item.url}</p>
        </div>
        
        {/* Actions - visible on hover or always on mobile */}
        <div className={cn(
          "flex items-center gap-0.5 shrink-0 transition-opacity",
          isHovered ? "opacity-100" : "opacity-0 md:opacity-0"
        )}>
          {item.status === "downloading" && (
            <ActionButton onClick={() => onPause?.(item.id)} title="Pause">
              <PauseIcon className="h-4 w-4" />
            </ActionButton>
          )}
          {item.status === "paused" && (
            <ActionButton onClick={() => onResume?.(item.id)} title="Resume">
              <PlayIcon className="h-4 w-4" />
            </ActionButton>
          )}
          {item.status === "error" && (
            <ActionButton onClick={() => onRetry?.(item.id)} title="Retry">
              <RetryIcon className="h-4 w-4" />
            </ActionButton>
          )}
          {(item.status === "downloading" || item.status === "paused") && (
            <ActionButton onClick={() => onCancel?.(item.id)} title="Cancel">
              <StopIcon className="h-4 w-4" />
            </ActionButton>
          )}
          {item.status === "completed" && (
            <ActionButton onClick={() => onOpenFolder?.(item.id)} title="Open folder">
              <FolderIcon className="h-4 w-4" />
            </ActionButton>
          )}
          <ActionButton onClick={() => onRemove?.(item.id)} title="Remove">
            <TrashIcon className="h-4 w-4" />
          </ActionButton>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={cn("font-medium", statusColors[item.status])}>
              {statusLabels[item.status]}
            </span>
            <span className="text-[hsl(var(--muted-foreground))]">
              {formatBytes(item.downloadedBytes)} / {formatBytes(item.totalBytes)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {item.speed && item.status === "downloading" && (
              <span className="font-mono text-[hsl(var(--muted-foreground))]">{item.speed}</span>
            )}
            <span className="text-[hsl(var(--muted-foreground))]">{progress.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {item.error && (
        <p className="text-xs text-[hsl(var(--destructive))] truncate">{item.error}</p>
      )}
    </div>
  )
}

function ActionButton({ onClick, title, children }: { onClick?: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center h-7 w-7 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
    >
      {children}
    </button>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="1" />
    </svg>
  )
}

function RetryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  )
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}
