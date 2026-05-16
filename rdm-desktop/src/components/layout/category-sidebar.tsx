import { useDownloadStore, type FilterCategory } from "@/lib/store"
import { cn } from "@/lib/utils"

interface CategorySidebarProps {
  className?: string
}

const categories: { id: FilterCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { 
    id: "all", 
    label: "All Downloads", 
    icon: <AllIcon />, 
    color: "text-blue-500" 
  },
  { 
    id: "downloading", 
    label: "Downloading", 
    icon: <DownloadIcon />, 
    color: "text-green-500" 
  },
  { 
    id: "paused", 
    label: "Paused", 
    icon: <PauseIcon />, 
    color: "text-yellow-500" 
  },
  { 
    id: "completed", 
    label: "Completed", 
    icon: <CheckIcon />, 
    color: "text-emerald-500" 
  },
  { 
    id: "error", 
    label: "Failed", 
    icon: <ErrorIcon />, 
    color: "text-red-500" 
  },
]

export function CategorySidebar({ className }: CategorySidebarProps) {
  const { filter, setFilter, getCounts } = useDownloadStore()
  const counts = getCounts()

  return (
    <div className={cn("flex w-56 flex-col bg-[hsl(var(--sidebar))]", className)}>
      <div className="p-3 border-b border-[hsl(var(--border))]">
        <h2 className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] tracking-wider">
          Categories
        </h2>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={cn(
              "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all mb-1",
              filter === cat.id
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm"
                : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
            )}
          >
            <span className={cn(cat.color, filter === cat.id && "text-[hsl(var(--primary-foreground))]/80")}>
              {cat.icon}
            </span>
            <span className="flex-1 text-left font-medium">{cat.label}</span>
            {counts[cat.id] > 0 && (
              <span
                className={cn(
                  "min-w-6 h-6 flex items-center justify-center rounded-md px-1.5 text-xs font-semibold tabular-nums",
                  filter === cat.id
                    ? "bg-[hsl(var(--primary-foreground))]/20 text-[hsl(var(--primary-foreground))]"
                    : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                )}
              >
                {counts[cat.id]}
              </span>
            )}
          </button>
        ))}
      </nav>
      
      <div className="p-3 border-t border-[hsl(var(--border))]">
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          RDM v0.1.0
        </p>
      </div>
    </div>
  )
}

function AllIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
