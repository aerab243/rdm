import { create } from 'zustand'

export interface DownloadItem {
  id: string
  url: string
  filename: string
  totalBytes: number
  downloadedBytes: number
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error'
  speed?: string
  error?: string
  allowInsecure?: boolean
  segments?: number
  createdAt: number
  completedAt?: number
}

export type FilterCategory = 'all' | 'downloading' | 'paused' | 'completed' | 'error'

interface DownloadStore {
  downloads: DownloadItem[]
  filter: FilterCategory
  
  // Actions
  addDownload: (download: Omit<DownloadItem, 'id' | 'createdAt' | 'downloadedBytes' | 'status'>) => string
  removeDownload: (id: string) => void
  updateDownload: (id: string, updates: Partial<DownloadItem>) => void
  setFilter: (filter: FilterCategory) => void
  clearCompleted: () => void
  startAll: () => void
  stopAll: () => void
  
  // Computed
  getFilteredDownloads: () => DownloadItem[]
  getCounts: () => Record<FilterCategory, number>
  getTotalSpeed: () => number
  getActiveDownloads: () => DownloadItem[]
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  downloads: [],
  filter: 'all',

  addDownload: (download) => {
    const id = crypto.randomUUID()
    const newDownload: DownloadItem = {
      ...download,
      id,
      createdAt: Date.now(),
      downloadedBytes: 0,
      status: 'pending',
    }
    set((state) => ({ downloads: [newDownload, ...state.downloads] }))
    return id
  },

  removeDownload: (id) => {
    set((state) => ({ downloads: state.downloads.filter((d) => d.id !== id) }))
  },

  updateDownload: (id, updates) => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    }))
  },

  setFilter: (filter) => set({ filter }),

  clearCompleted: () => {
    set((state) => ({
      downloads: state.downloads.filter((d) => d.status !== 'completed'),
    }))
  },

  startAll: () => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.status === 'paused' ? { ...d, status: 'downloading' as const } : d
      ),
    }))
  },

  stopAll: () => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.status === 'downloading' ? { ...d, status: 'paused' as const } : d
      ),
    }))
  },

  getFilteredDownloads: () => {
    const { downloads, filter } = get()
    if (filter === 'all') return downloads
    return downloads.filter((d) => d.status === filter)
  },

  getCounts: () => {
    const { downloads } = get()
    return {
      all: downloads.length,
      downloading: downloads.filter((d) => d.status === 'downloading').length,
      paused: downloads.filter((d) => d.status === 'paused').length,
      completed: downloads.filter((d) => d.status === 'completed').length,
      error: downloads.filter((d) => d.status === 'error').length,
    }
  },

  getTotalSpeed: () => {
    const { downloads } = get()
    return downloads
      .filter((d) => d.status === 'downloading' && d.speed)
      .reduce((acc, d) => {
        const match = d.speed?.match(/[\d.]+/)
        return acc + (match ? parseFloat(match[0]) * 1024 * 1024 : 0)
      }, 0)
  },

  getActiveDownloads: () => {
    const { downloads } = get()
    return downloads.filter((d) => d.status === 'downloading' || d.status === 'paused')
  },
}))
