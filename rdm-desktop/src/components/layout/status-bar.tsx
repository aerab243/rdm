import { useDownloadStore } from "@/lib/store"

export function StatusBar() {
  const { downloads, getCounts } = useDownloadStore()
  const counts = getCounts()
  const activeDownloads = counts.downloading

  const totalSpeed = downloads
    .filter((d) => d.status === "downloading" && d.speed)
    .reduce((acc, d) => acc + (parseFloat(d.speed?.replace(/[^\d.]/g, "") || "0") || 0), 0)

  const formatSpeed = (speed: number) => {
    if (speed >= 1000000) return `${(speed / 1000000).toFixed(1)} MB/s`
    if (speed >= 1000) return `${(speed / 1000).toFixed(1)} KB/s`
    return `${speed.toFixed(0)} B/s`
  }

  return (
    <div className="flex h-7 items-center justify-between border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 text-xs text-[hsl(var(--muted-foreground))]">
      <div className="flex items-center gap-4">
        {activeDownloads > 0 && (
          <>
            <span>
              {activeDownloads} download{activeDownloads > 1 ? "s" : ""} active
            </span>
            {totalSpeed > 0 && (
              <span className="font-mono tabular-nums">{formatSpeed(totalSpeed)}</span>
            )}
          </>
        )}
        {counts.completed > 0 && (
          <span>
            {counts.completed} completed
          </span>
        )}
        {counts.error > 0 && (
          <span className="text-[hsl(var(--destructive))]">
            {counts.error} failed
          </span>
        )}
      </div>
      <span>{counts.all} total</span>
    </div>
  )
}
