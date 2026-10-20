'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ChatEntry {
  id: string
  role: 'user' | 'assistant'
  text: string
  tone?: 'default' | 'muted' | 'error'
  /** Assistant is still working on this step. */
  pending?: boolean
}

interface CreateChatPanelProps {
  entries: ChatEntry[]
  /** Interactive widget below the transcript (question card, progress…). */
  active?: ReactNode
  composer?: ReactNode
  className?: string
}

/** The compact left-hand conversation of the AI create studio. */
export function CreateChatPanel ({ entries, active, composer, className }: CreateChatPanelProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const lastEntry = entries[entries.length - 1]

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [entries.length, lastEntry?.text, lastEntry?.pending, active])

  return (
    <aside className={cn('flex min-h-0 flex-col bg-background', className)}>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
        {entries.map((entry) => (
          <ChatBubble key={entry.id} entry={entry} />
        ))}
        {active}
        <div ref={endRef} />
      </div>
      {composer ? <div className="border-t bg-background p-3">{composer}</div> : null}
    </aside>
  )
}

function ChatBubble ({ entry }: { entry: ChatEntry }) {
  if (entry.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-ee-md bg-primary px-3 py-2 text-sm text-primary-foreground">
          {entry.text}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-3.5" />
      </div>
      <div
        className={cn(
          'min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed',
          entry.tone === 'muted' && 'text-muted-foreground',
          entry.tone === 'error' && 'text-destructive'
        )}
      >
        {entry.pending ? (
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            {entry.text}
          </span>
        ) : (
          entry.text
        )}
      </div>
    </motion.div>
  )
}
