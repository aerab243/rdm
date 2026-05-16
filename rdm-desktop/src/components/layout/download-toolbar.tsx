import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DownloadToolbarProps {
  onAddDownload: () => void
  onStartAll?: () => void
  onStopAll?: () => void
  onDeleteCompleted?: () => void
  hasActiveDownloads?: boolean
  hasDownloads?: boolean
  hasCompleted?: boolean
  className?: string
}

export function DownloadToolbar({ 
  onAddDownload,
  onStartAll,
  onStopAll,
  onDeleteCompleted,
  hasActiveDownloads = false,
  hasDownloads = false,
  hasCompleted = false,
  className 
}: DownloadToolbarProps) {
  return (
    <div className={cn("flex items-center gap-1 px-4 py-2 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))]", className)}>
      <Button 
        variant="default" 
        size="sm" 
        onClick={onAddDownload}
        className="h-8 gap-2"
      >
        <AddIcon className="h-4 w-4" />
        Add URL
      </Button>
      
      <ToolbarDivider />
      
      <ToolbarButton 
        icon={<PlayIcon />} 
        label="Start" 
        disabled={!hasActiveDownloads}
        onClick={onStartAll}
      />
      <ToolbarButton 
        icon={<StopIcon />} 
        label="Stop" 
        disabled={!hasActiveDownloads}
        onClick={onStopAll}
      />
      <ToolbarButton 
        icon={<StopAllIcon />} 
        label="Stop All" 
        disabled={!hasActiveDownloads}
        onClick={onStopAll}
      />
      
      <ToolbarDivider />
      
      <ToolbarButton 
        icon={<DeleteIcon />} 
        label="Delete" 
        disabled={!hasDownloads}
      />
      <ToolbarButton 
        icon={<DeleteCompletedIcon />} 
        label="Delete Completed" 
        disabled={!hasCompleted}
        onClick={onDeleteCompleted}
      />
      
      <ToolbarDivider />
      
      <ToolbarButton 
        icon={<SchedulerIcon />} 
        label="Scheduler" 
        disabled={true}
        tooltip="Coming soon"
      />
      
      <div className="flex-1" />
      
      <Button variant="ghost" size="sm" className="h-8 gap-2">
        <SettingsIcon className="h-4 w-4" />
        Options
      </Button>
    </div>
  )
}

interface ToolbarButtonProps {
  icon: React.ReactNode
  label: string
  disabled?: boolean
  onClick?: () => void
  tooltip?: string
}

function ToolbarButton({ icon, label, disabled, onClick, tooltip }: ToolbarButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      title={tooltip || label}
      className="h-8 gap-2 px-2"
    >
      <span className="text-[hsl(var(--muted-foreground))]">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </Button>
  )
}

function ToolbarDivider() {
  return (
    <div className="h-6 w-px bg-[hsl(var(--border))] mx-1" />
  )
}

function AddIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  )
}

function StopAllIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
  )
}

function DeleteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function DeleteCompletedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="9" y1="10" x2="9" y2="10" />
      <line x1="15" y1="10" x2="15" y2="10" />
    </svg>
  )
}

function SchedulerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  )
}
