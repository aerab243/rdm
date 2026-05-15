import { useState, useEffect, useCallback } from "react"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { TitleBar } from "@/components/layout"
import { Sidebar, StatusBar } from "@/components/layout"
import { DownloadItem, DownloadsHeader, EmptyState } from "@/components/downloads"
import { AddDownloadDialog } from "@/components/downloads/add-download-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDownloadStore } from "@/lib/store"

interface ProgressPayload {
  id: string
  downloaded_bytes: number
  total_bytes: number
}

function App() {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const { downloads, filter, addDownload, removeDownload, updateDownload, getFilteredDownloads, getCounts, clearCompleted } = useDownloadStore()
  
  const filteredDownloads = getFilteredDownloads()
  const counts = getCounts()

  useEffect(() => {
    const unlistenProgress = listen<ProgressPayload>("download-progress", (event) => {
      const { id, downloaded_bytes, total_bytes } = event.payload
      updateDownload(id, {
        downloadedBytes: downloaded_bytes,
        totalBytes: total_bytes,
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

  const handleResume = useCallback((id: string) => {
    updateDownload(id, { status: "downloading" })
  }, [updateDownload])

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

  return (
    <div className="flex flex-col h-screen bg-[hsl(var(--background))]">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          <DownloadsHeader
            onAddDownload={() => setAddDialogOpen(true)}
            onClearCompleted={counts.completed > 0 ? clearCompleted : undefined}
            totalCount={filteredDownloads.length}
          />
          
          <ScrollArea className="flex-1">
            {filteredDownloads.length === 0 ? (
              <EmptyState
                title={filter === "all" ? "No downloads" : `No ${filter} downloads`}
                description={
                  filter === "all"
                    ? "Add a download to get started"
                    : `You don't have any ${filter} downloads`
                }
                action={
                  filter === "all"
                    ? { label: "Add Download", onClick: () => setAddDialogOpen(true) }
                    : undefined
                }
              />
            ) : (
              <div className="p-4 space-y-2">
                {filteredDownloads.map((item) => (
                  <DownloadItem
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
            )}
          </ScrollArea>
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

export default App
