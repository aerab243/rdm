import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialogContext() {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("Dialog components must be used within a Dialog provider")
  return context
}

interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ className, open: controlledOpen, onOpenChange, children, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const open = controlledOpen ?? internalOpen

    const handleOpenChange = React.useCallback(
      (newOpen: boolean) => {
        setInternalOpen(newOpen)
        onOpenChange?.(newOpen)
      },
      [onOpenChange]
    )

    if (!open) return null

    return (
      <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
        <div
          ref={ref}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--foreground))]/20 backdrop-blur-sm",
            className
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleOpenChange(false)
          }}
          {...props}
        >
          {children}
        </div>
      </DialogContext.Provider>
    )
  }
)
Dialog.displayName = "Dialog"

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, onClose, children, ...props }, ref) => {
    const { onOpenChange } = useDialogContext()

    const handleClose = React.useCallback(() => {
      onClose?.()
      onOpenChange(false)
    }, [onClose, onOpenChange])

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full max-w-lg rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-lg animate-in fade-in-0 zoom-in-95",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
        <button
          onClick={handleClose}
          className={cn(
            "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-[hsl(var(--background))] transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2"
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    )
  }
)
DialogContent.displayName = "DialogContent"

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
  )
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  )
)
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-[hsl(var(--muted-foreground))]", className)} {...props} />
  )
)
DialogDescription.displayName = "DialogDescription"

const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}
      {...props}
    />
  )
)
DialogFooter.displayName = "DialogFooter"

const DialogClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { onClose?: () => void }>(
  ({ className, onClose, ...props }, ref) => {
    const { onOpenChange } = useDialogContext()

    const handleClose = React.useCallback(() => {
      onClose?.()
      onOpenChange(false)
    }, [onClose, onOpenChange])

    return (
      <button
        ref={ref}
        className={cn(
          "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-[hsl(var(--background))] transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2",
          className
        )}
        onClick={handleClose}
        {...props}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    )
  }
)
DialogClose.displayName = "DialogClose"

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose }
