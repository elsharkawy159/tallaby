'use client'

import { useCallback, useEffect, useRef } from 'react'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  /** Bump when tool list length or any tool state changes */
  scrollKey: string
}

export function ToolPartsScroll ({ children, scrollKey }: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const userScrolledUpRef = useRef(false)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const viewport = viewportRef.current
    if (!viewport || userScrolledUpRef.current) return
    viewport.scrollTo({ top: viewport.scrollHeight, behavior })
  }, [])

  useEffect(() => {
    userScrolledUpRef.current = false
    scrollToBottom('auto')
    const id = requestAnimationFrame(() => scrollToBottom('auto'))
    return () => cancelAnimationFrame(id)
  }, [scrollKey, scrollToBottom])

  useEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const onScroll = () => {
      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
      userScrolledUpRef.current = distanceFromBottom > 24
    }

    viewport.addEventListener('scroll', onScroll, { passive: true })

    const observer = new ResizeObserver(() => {
      scrollToBottom('auto')
    })
    observer.observe(content)

    return () => {
      viewport.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [scrollToBottom])

  return (
    <ScrollArea
      className={cn(
        'max-h-28 min-h-11 w-full min-w-0 rounded-lg border border-border/30 bg-muted/40',
        '[&_[data-slot=scroll-area-scrollbar]]:hidden',
        '[&_[data-slot=scroll-area-viewport]]:[mask-image:linear-gradient(to_bottom,transparent,black_18px)]'
      )}
    >
      <div
        ref={(el) => {
          viewportRef.current = el?.closest(
            '[data-slot="scroll-area-viewport"]'
          ) as HTMLDivElement | null
        }}
        className="px-2.5 py-2"
      >
        <div ref={contentRef} className="flex flex-col gap-0.5">
          {children}
        </div>
        <div className="h-px shrink-0" aria-hidden />
      </div>
    </ScrollArea>
  )
}
