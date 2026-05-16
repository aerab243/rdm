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
  createdAt: number
  completedAt?: number
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

export function DownloadListItem({
  item,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onRemove,
}: DownloadItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const progress = item.totalBytes > 0 ? (item.downloadedBytes / item.totalBytes) * 100 : 0

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const estimateETA = (): string => {
    if (item.status !== "downloading" || !item.speed) return "-"
    const speedMatch = item.speed.match(/[\d.]+/)
    if (!speedMatch) return "-"
    const speed = parseFloat(speedMatch[0]) * 1024 * 1024 // Assuming MB/s
    if (speed === 0) return "-"
    const remaining = item.totalBytes - item.downloadedBytes
    const seconds = Math.ceil(remaining / speed)
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const getStatusBadge = () => {
    const statusConfig: Record<DownloadItemData["status"], { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-gray-500/20 text-gray-500" },
      downloading: { label: "Downloading", className: "bg-green-500/20 text-green-500" },
      paused: { label: "Paused", className: "bg-yellow-500/20 text-yellow-500" },
      completed: { label: "Completed", className: "bg-emerald-500/20 text-emerald-500" },
      error: { label: "Failed", className: "bg-red-500/20 text-red-500" },
    }
    const config = statusConfig[item.status]
    return (
      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", config.className)}>
        {config.label}
      </span>
    )
  }

  const getFileIcon = () => {
    const ext = item.filename.split(".").pop()?.toLowerCase() || ""
    const videoExts = ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm"]
    const audioExts = ["mp3", "wav", "flac", "aac", "ogg", "m4a"]
    const docExts = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"]
    const archExts = ["zip", "rar", "7z", "tar", "gz", "bz2"]
    
    if (videoExts.includes(ext)) return <VideoIcon />
    if (audioExts.includes(ext)) return <AudioIcon />
    if (docExts.includes(ext)) return <DocIcon />
    if (archExts.includes(ext)) return <ArchiveIcon />
    return <FileIcon />
  }

  return (
    <div
      className={cn(
        "group grid grid-cols-[32px_1fr_100px_140px_100px_80px_80px_50px] items-center gap-2 px-4 py-2 border-b border-[hsl(var(--border))] transition-colors",
        isHovered && "bg-[hsl(var(--muted))]/30",
        item.status === "completed" && "opacity-60"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon */}
      <div className="flex items-center justify-center text-[hsl(var(--muted-foreground))]">
        {getFileIcon()}
      </div>

      {/* Filename & URL */}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{item.filename}</p>
        <p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{item.url}</p>
      </div>

      {/* Size */}
      <div className="text-xs text-[hsl(var(--muted-foreground))] text-right font-mono tabular-nums">
        {item.totalBytes > 0 ? formatBytes(item.totalBytes) : "-"}
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs font-mono tabular-nums w-10 text-right">
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
          <span className="font-mono tabular-nums">
            {formatBytes(item.downloadedBytes)}
          </span>
        </div>
      </div>

      {/* Status */}
      <div className="flex justify-center">
        {getStatusBadge()}
      </div>

      {/* Speed */}
      <div className="text-xs text-right font-mono tabular-nums text-[hsl(var(--muted-foreground))]">
        {item.speed || "-"}
      </div>

      {/* ETA */}
      <div className="text-xs text-right font-mono tabular-nums text-[hsl(var(--muted-foreground))]">
        {estimateETA()}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-0.5">
        {item.status === "downloading" && (
          <ActionButton onClick={() => onPause?.(item.id)} title="Pause">
            <PauseIcon />
          </ActionButton>
        )}
        {item.status === "paused" && (
          <ActionButton onClick={() => onResume?.(item.id)} title="Resume">
            <PlayIcon />
          </ActionButton>
        )}
        {item.status === "error" && (
          <ActionButton onClick={() => onRetry?.(item.id)} title="Retry">
            <RetryIcon />
          </ActionButton>
        )}
        {(item.status === "downloading" || item.status === "paused") && (
          <ActionButton onClick={() => onCancel?.(item.id)} title="Cancel">
            <StopIcon />
          </ActionButton>
        )}
        <ActionButton onClick={() => onRemove?.(item.id)} title="Remove">
          <TrashIcon />
        </ActionButton>
      </div>
    </div>
  )
}

function ActionButton({ onClick, title, children }: { onClick?: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center h-6 w-6 rounded text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
    >
      {children}
    </button>
  )
}

function FileIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  )
}

function AudioIcon() {
  return (
    <svg className="h-4 w-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg className="h-4 w-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function ArchiveIcon() {
  return (
    <svg className="h-4 w-4 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 8v13H3V8" />
      <path d="M1 3h22v5H1z" />
      <path d="M10 12h4" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="1" />
    </svg>
  )
}

function RetryIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

export function DownloadListHeader() {
  return (
    <div className="grid grid-cols-[32px_1fr_100px_140px_100px_80px_80px_50px] items-center gap-2 px-4 py-2 bg-[hsl(var(--muted))]/50 border-b border-[hsl(var(--border))]">
      <div className="text-[hsl(var(--muted-foreground))]"></div>
      <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">File Name</div>
      <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))] text-right">Size</div>
      <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))] text-left">Progress</div>
      <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))] text-center">Status</div>
      <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))] text-right">Speed</div>
      <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))] text-right">ETA</div>
      <div className="text-xs font-semibold text-[hsl(var(--muted-foreground))]"></div>
    </div>
  )
}
