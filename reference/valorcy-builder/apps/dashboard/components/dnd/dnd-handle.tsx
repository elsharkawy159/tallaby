'use client'

import { createContext, useContext, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { GripVertical } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import { DRAG_HANDLE_ATTR } from './presets'

type HandleRef = (element: Element | null) => void

const HandleContext = createContext<HandleRef | null>(null)

/** Provides the enclosing draggable's `handleRef` to a `<DndHandle>` anywhere below it. */
export function DndHandleProvider ({
  handleRef,
  children,
}: {
  handleRef: HandleRef
  children: ReactNode
}) {
  return <HandleContext.Provider value={handleRef}>{children}</HandleContext.Provider>
}

/**
 * The only element that starts a drag for its enclosing draggable. Registering
 * a handle makes the pointer sensor bind to it alone, so the rest of the item
 * (buttons, inputs, inline editors) keeps its normal behaviour; a mouse press
 * on the handle activates immediately.
 *
 * Clicks are stopped here so grabbing a handle never selects whatever sits
 * behind it.
 */
export function DndHandle ({
  label,
  className,
  children,
  onClick,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  /** Accessible name, e.g. "Drag Button". */
  label: string
}) {
  const handleRef = useContext(HandleContext)
  return (
    <button
      type="button"
      ref={handleRef ?? undefined}
      aria-label={label}
      title={label}
      {...{ [DRAG_HANDLE_ATTR]: '' }}
      className={cn(
        'inline-flex cursor-grab touch-none items-center justify-center rounded text-muted-foreground active:cursor-grabbing',
        className
      )}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(event)
      }}
      {...rest}
    >
      {children ?? <GripVertical className="size-3.5" aria-hidden />}
    </button>
  )
}
