import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { useDownloadStore, type FilterCategory } from "@/lib/store"

interface SidebarProps {
  children?: ReactNode
}

const navItems: { id: FilterCategory; label: string; icon: typeof DownloadIcon }[] = [
  { id: "all", label: "All Downloads", icon: AllIcon },
  { id: "downloading", label: "Downloading", icon: DownloadIcon },
  { id: "paused", label: "Paused", icon: PauseIcon },
  { id: "completed", label: "Completed", icon: CheckIcon },
  { id: "error", label: "Failed", icon: ErrorIcon },
]

export function Sidebar({ children }: SidebarProps) {
  const { filter, setFilter, getCounts } = useDownloadStore()
  const counts = getCounts()

  return (
    <div className="flex w-52 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--sidebar))]">
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={cn(
              "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
              filter === item.id
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
            )}
          >
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
            {counts[item.id] > 0 && (
              <span
                className={cn(
                  "min-w-5 h-5 flex items-center justify-center rounded-full px-1.5 text-xs font-medium",
                  filter === item.id
                    ? "bg-[hsl(var(--primary-foreground))]/20 text-[hsl(var(--primary-foreground))]"
                    : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                )}
              >
                {counts[item.id]}
              </span>
            )}
          </button>
        ))}
      </nav>
      <Separator />
      {children && <div className="flex-1 p-2">{children}</div>}
    </div>
  )
}

function AllIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
