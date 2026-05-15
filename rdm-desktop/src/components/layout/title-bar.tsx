import { useState, useCallback, type ReactNode } from "react"
import { getCurrentWindow } from "@tauri-apps/api/window"

interface TitleBarProps {
  title?: string
  children?: ReactNode
}

export function TitleBar({ title = "RDM", children }: TitleBarProps) {
  const appWindow = getCurrentWindow()
  const [isMaximized, setIsMaximized] = useState(false)

  const handleMinimize = useCallback(async () => {
    await appWindow.minimize()
  }, [appWindow])

  const handleMaximize = useCallback(async () => {
    const maximized = await appWindow.isMaximized()
    if (maximized) {
      await appWindow.unmaximize()
      setIsMaximized(false)
    } else {
      await appWindow.maximize()
      setIsMaximized(true)
    }
  }, [appWindow])

  const handleClose = useCallback(async () => {
    await appWindow.close()
  }, [appWindow])

  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-tauri-drag-region]')) {
      await appWindow.startDragging()
    }
  }, [appWindow])

  return (
    <div
      onMouseDown={handleMouseDown}
      className="flex h-9 items-center justify-between bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] select-none cursor-default"
    >
      <div className="flex items-center gap-2 px-3">
        <div className="flex items-center justify-center w-4 h-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-sm font-medium">{title}</span>
      </div>

      {children && <div className="flex items-center gap-1 px-2">{children}</div>}

      <div className="flex">
        <button
          onClick={handleMinimize}
          className="flex items-center justify-center w-11 h-9 hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer"
          aria-label="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="flex items-center justify-center w-11 h-9 hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer"
          aria-label={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="2.5" y="0.5" width="9" height="9" rx="0" />
              <rect x="0" y="2.5" width="9" height="9" rx="0" fill="var(--background)" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="0.5" width="9" height="9" />
            </svg>
          )}
        </button>
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-11 h-9 hover:bg-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive-foreground))] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2">
            <line x1="0" y1="0" x2="10" y2="10" />
            <line x1="10" y1="0" x2="0" y2="10" />
          </svg>
        </button>
      </div>
    </div>
  )
}
