import { useDownloadStore } from "@/lib/store"

export function StatusBar() {
  const { getCounts, getTotalSpeed } = useDownloadStore()
  const counts = getCounts()
  const totalSpeed = getTotalSpeed()
  const activeCount = counts.downloading + counts.paused

  const formatSpeed = (bytesPerSec: number): string => {
    if (bytesPerSec === 0) return "0 B/s"
    if (bytesPerSec >= 1e9) return `${(bytesPerSec / 1e9).toFixed(2)} GB/s`
    if (bytesPerSec >= 1e6) return `${(bytesPerSec / 1e6).toFixed(2)} MB/s`
    if (bytesPerSec >= 1e3) return `${(bytesPerSec / 1e3).toFixed(1)} KB/s`
    return `${bytesPerSec.toFixed(0)} B/s`
  }

  return (
    <div className="flex h-8 items-center justify-between border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-4 text-xs text-[hsl(var(--muted-foreground))]">
      <div className="flex items-center gap-4">
        {/* Active downloads count */}
        {activeCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-2 h-2 rounded-full bg-green-500" />
            <span>{activeCount} download{activeCount > 1 ? "s" : ""} active</span>
          </div>
        )}
        
        {/* Total speed */}
        {totalSpeed > 0 && (
          <span className="font-mono tabular-nums font-medium">
            {formatSpeed(totalSpeed)}
          </span>
        )}

        {/* Separator */}
        {activeCount > 0 && counts.completed > 0 && (
          <span className="text-[hsl(var(--border))]">|</span>
        )}

        {/* Completed count */}
        {counts.completed > 0 && (
          <span>
            {counts.completed} completed
          </span>
        )}

        {/* Error count */}
        {counts.error > 0 && (
          <span className="text-[hsl(var(--destructive))]">
            {counts.error} failed
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span>{counts.all} total</span>
      </div>
    </div>
  )
}
