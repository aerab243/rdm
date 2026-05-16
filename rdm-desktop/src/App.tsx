import { useState, useEffect, useCallback } from "react"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { TitleBar, CategorySidebar, DownloadToolbar, StatusBar } from "@/components/layout"
import { DownloadListItem, DownloadListHeader } from "@/components/downloads"
import { AddDownloadDialog } from "@/components/downloads/add-download-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDownloadStore } from "@/lib/store"

interface ProgressPayload {
  id: string
  downloaded_bytes: number
  total_bytes: number
  speed?: string
}

function App() {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const { 
    downloads, 
    filter, 
    addDownload, 
    removeDownload, 
    updateDownload, 
    getFilteredDownloads, 
    clearCompleted,
    startAll,
    stopAll,
    getCounts 
  } = useDownloadStore()
  
  const filteredDownloads = getFilteredDownloads()
  const counts = getCounts()

  useEffect(() => {
    const unlistenProgress = listen<ProgressPayload>("download-progress", (event) => {
      const { id, downloaded_bytes, total_bytes, speed } = event.payload
      updateDownload(id, {
        downloadedBytes: downloaded_bytes,
        totalBytes: total_bytes,
        speed: speed || undefined,
        status: "downloading",
      })
    })

    const unlistenCancelled = listen<{ id: string }>("download-cancelled", (event) => {
      updateDownload(event.payload.id, { status: "paused" })
    })

    return () => {
      unlistenProgress.then((fn) => fn())
      unlistenCancelled.then((fn) => fn())
    }
  }, [updateDownload])

  const handleAddDownload = useCallback(
    async (download: {
      url: string
      filename: string
      segments: number
      allowInsecure: boolean
    }) => {
      const id = addDownload({
        url: download.url,
        filename: download.filename,
        totalBytes: 0,
        allowInsecure: download.allowInsecure,
        segments: download.segments,
      })

      try {
        updateDownload(id, { status: "downloading" })
        await invoke("start_download", {
          url: download.url,
          path: download.filename,
          segments: download.segments,
          allowInsecure: download.allowInsecure,
          downloadId: id,
        })
        updateDownload(id, { status: "completed", totalBytes: 0 })
      } catch (error) {
        updateDownload(id, { status: "error", error: String(error) })
      }
    },
    [addDownload, updateDownload]
  )

  const handlePause = useCallback(
    (id: string) => {
      updateDownload(id, { status: "paused" })
      invoke("cancel_download", { downloadId: id }).catch(console.error)
    },
    [updateDownload]
  )

  const handleResume = useCallback(
    (id: string) => {
      updateDownload(id, { status: "downloading" })
    },
    [updateDownload]
  )

  const handleCancel = useCallback(
    (id: string) => {
      invoke("cancel_download", { downloadId: id }).catch(console.error)
      removeDownload(id)
    },
    [removeDownload]
  )

  const handleRemove = useCallback(
    (id: string) => {
      removeDownload(id)
    },
    [removeDownload]
  )

  const handleRetry = useCallback(
    (id: string) => {
      const item = downloads.find((d) => d.id === id)
      if (item) {
        handleAddDownload({
          url: item.url,
          filename: item.filename,
          segments: item.segments || 8,
          allowInsecure: item.allowInsecure || false,
        })
        removeDownload(id)
      }
    },
    [downloads, handleAddDownload, removeDownload]
  )

  const handleStopAll = useCallback(() => {
    stopAll()
    const activeDownloads = downloads.filter(d => d.status === "downloading")
    activeDownloads.forEach(d => {
      invoke("cancel_download", { downloadId: d.id }).catch(console.error)
    })
  }, [stopAll, downloads])

  const handleClearCompleted = useCallback(() => {
    clearCompleted()
  }, [clearCompleted])

  const handleStartAll = useCallback(() => {
    startAll()
  }, [startAll])

  return (
    <div className="flex flex-col h-screen bg-[hsl(var(--background))]">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        <CategorySidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          <DownloadToolbar
            onAddDownload={() => setAddDialogOpen(true)}
            onStartAll={handleStartAll}
            onStopAll={handleStopAll}
            onDeleteCompleted={handleClearCompleted}
            hasActiveDownloads={counts.downloading > 0 || counts.paused > 0}
            hasDownloads={counts.all > 0}
            hasCompleted={counts.completed > 0}
          />
          
          <div className="flex-1 overflow-hidden flex flex-col">
            {filteredDownloads.length === 0 ? (
              <EmptyDownloadsState
                filter={filter}
                onAddDownload={() => setAddDialogOpen(true)}
              />
            ) : (
              <>
                <DownloadListHeader />
                <ScrollArea className="flex-1">
                  <div className="min-w-[700px]">
                    {filteredDownloads.map((item) => (
                      <DownloadListItem
                        key={item.id}
                        item={item}
                        onPause={handlePause}
                        onResume={handleResume}
                        onCancel={handleCancel}
                        onRetry={handleRetry}
                        onRemove={handleRemove}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </main>
      </div>

      <StatusBar />

      <AddDownloadDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddDownload}
      />
    </div>
  )
}

function EmptyDownloadsState({ 
  filter, 
  onAddDownload 
}: { 
  filter: string
  onAddDownload: () => void 
}) {
  const messages: Record<string, { title: string; description: string }> = {
    all: { 
      title: "No downloads", 
      description: "Add a URL to start downloading files at maximum speed" 
    },
    downloading: { 
      title: "No active downloads", 
      description: "Downloads in progress will appear here" 
    },
    paused: { 
      title: "No paused downloads", 
      description: "Paused downloads will appear here" 
    },
    completed: { 
      title: "No completed downloads", 
      description: "Completed downloads will appear here" 
    },
    error: { 
      title: "No failed downloads", 
      description: "Failed downloads will appear here" 
    },
  }

  const { title, description } = messages[filter] || messages.all

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 mb-4 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
        <DownloadIcon className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
      </div>
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-[300px] mb-4">
        {description}
      </p>
      {filter === "all" && (
        <button
          onClick={onAddDownload}
          className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <PlusIcon className="h-4 w-4" />
          Add URL
        </button>
      )}
    </div>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export default App
