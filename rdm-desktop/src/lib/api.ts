import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

interface ProgressPayload {
  id: string
  downloaded_bytes: number
  total_bytes: number
}

export async function startDownload(
  url: string,
  filename: string,
  segments: number,
  allowInsecure: boolean,
  downloadId: string
): Promise<void> {
  await invoke('start_download', {
    url,
    path: filename,
    segments,
    allowInsecure,
    downloadId,
  })
}

export async function cancelDownload(downloadId: string): Promise<void> {
  await invoke('cancel_download', { downloadId })
}

export function onDownloadProgress(callback: (payload: ProgressPayload) => void): () => void {
  let unlisten: (() => void) | null = null

  listen<ProgressPayload>('download-progress', (event) => {
    callback(event.payload)
  }).then((fn) => {
    unlisten = fn
  })

  return () => {
    unlisten?.()
  }
}

export function onDownloadCancelled(callback: (downloadId: string) => void): () => void {
  let unlisten: (() => void) | null = null

  listen<{ id: string }>('download-cancelled', (event) => {
    callback(event.payload.id)
  }).then((fn) => {
    unlisten = fn
  })

  return () => {
    unlisten?.()
  }
}
