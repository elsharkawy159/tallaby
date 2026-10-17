'use client'

import type { FormEvent, ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowUp, Loader2 } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Textarea } from '@workspace/ui/components/textarea'
import { cn } from '@/lib/utils'

interface CreateComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder: string
  disabled?: boolean
  busy?: boolean
  /** Allow submitting an empty box (the studio falls back to project details). */
  allowEmpty?: boolean
  maxLength: number
  /** Extra controls under the input (details disclosure, hints…). */
  footer?: ReactNode
  autoFocus?: boolean
  className?: string
}

export function CreateComposer ({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  busy,
  allowEmpty,
  maxLength,
  footer,
  autoFocus,
  className,
}: CreateComposerProps) {
  const t = useTranslations('aiCreate.composer')
  const length = value.trim().length
  const tooLong = length > maxLength
  const canSubmit = !disabled && !busy && !tooLong && (allowEmpty || length > 0)

  function handleSubmit (e?: FormEvent) {
    e?.preventDefault()
    if (canSubmit) onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-2', className)}>
      <div className="relative rounded-xl border bg-card focus-within:ring-2 focus-within:ring-ring">
        <Textarea
          value={value}
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={maxLength + 50}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          className="max-h-48 min-h-[88px] resize-none border-0 bg-transparent pe-12 text-sm shadow-none focus-visible:ring-0"
        />
        <Button
          type="submit"
          size="icon"
          className="absolute bottom-2 end-2 size-8 rounded-lg"
          disabled={!canSubmit}
          aria-label={t('send')}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>{t('hint')}</span>
        {length > maxLength * 0.8 && (
          <span className={cn(tooLong && 'text-destructive')}>
            {length}/{maxLength}
          </span>
        )}
      </div>
      {footer}
    </form>
  )
}
