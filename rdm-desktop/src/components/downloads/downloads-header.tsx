import { type ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface DownloadsHeaderProps {
  onAddDownload: () => void
  onClearCompleted?: () => void
  totalCount?: number
}

export function DownloadsHeader({ onAddDownload, onClearCompleted, totalCount }: DownloadsHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">Downloads</h2>
        {totalCount !== undefined && totalCount > 0 && (
          <span className="flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
            {totalCount}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onClearCompleted && (
          <Button size="sm" variant="ghost" onClick={onClearCompleted}>
            Clear completed
          </Button>
        )}
        <Button size="sm" onClick={onAddDownload}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Download
        </Button>
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 text-[hsl(var(--muted-foreground))]">{icon}</div>}
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-[250px] mb-4">{description}</p>
      {action && (
        <Button size="sm" variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
