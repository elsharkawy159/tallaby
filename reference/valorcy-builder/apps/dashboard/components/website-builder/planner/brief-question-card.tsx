'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { cn } from '@/lib/utils'
import {
  YOU_DECIDE_OPTION_ID,
  type BriefAnswer,
  type BriefQuestion,
} from '@/lib/ai/brief-answers'

interface BriefQuestionCardProps {
  question: BriefQuestion
  index: number
  total: number
  onAnswer: (answer: BriefAnswer) => void
  onSkipAll: () => void
}

/**
 * One clarifying question at a time. Single-choice answers submit on click so
 * the common path is one tap per question; multi-choice, "Other…" and text
 * answers confirm with Next.
 */
export function BriefQuestionCard ({ question, index, total, onAnswer, onSkipAll }: BriefQuestionCardProps) {
  const t = useTranslations('aiCreate.questions')
  const [selected, setSelected] = useState<string[]>([])
  const [otherOpen, setOtherOpen] = useState(false)
  const [text, setText] = useState('')

  const isText = question.kind === 'text'
  const canConfirm = isText ? text.trim().length > 0 : selected.length > 0 || text.trim().length > 0

  function choose (optionId: string) {
    if (question.kind === 'single') {
      if (optionId === YOU_DECIDE_OPTION_ID || !otherOpen) {
        onAnswer({ questionId: question.id, optionIds: [optionId] })
        return
      }
      setSelected([optionId])
      return
    }
    if (optionId === YOU_DECIDE_OPTION_ID) {
      onAnswer({ questionId: question.id, optionIds: [optionId] })
      return
    }
    setSelected((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    )
  }

  function confirm () {
    if (!canConfirm) return
    onAnswer({
      questionId: question.id,
      optionIds: question.kind === 'single' && text.trim() ? [] : selected,
      text: text.trim() || undefined,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card p-3.5 text-card-foreground shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground">
        <span>{t('counter', { current: index + 1, total })}</span>
        <button
          type="button"
          onClick={onSkipAll}
          className="rounded px-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('skipAll')}
        </button>
      </div>
      <p className="text-sm font-medium leading-snug">{question.question}</p>

      {isText ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            confirm()
          }}
        >
          <Input
            autoFocus
            value={text}
            maxLength={120}
            placeholder={t('textPlaceholder')}
            aria-label={question.question}
            onChange={(e) => setText(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={!canConfirm}>
            {t('next')}
          </Button>
        </form>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={question.question}>
            {question.options.map((option) => {
              const active = selected.includes(option.id)
              const isDecide = option.id === YOU_DECIDE_OPTION_ID
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => choose(option.id)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:border-primary hover:text-primary',
                    isDecide && !active && 'border-dashed text-muted-foreground'
                  )}
                >
                  {active && <Check className="size-3" />}
                  {option.label}
                </button>
              )
            })}
            {question.allowOther && (
              <button
                type="button"
                aria-expanded={otherOpen}
                onClick={() => setOtherOpen((v) => !v)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  otherOpen ? 'border-primary text-primary' : 'hover:border-primary hover:text-primary'
                )}
              >
                {t('other')}
              </button>
            )}
          </div>

          {otherOpen && (
            <Input
              autoFocus
              className="mt-2"
              value={text}
              maxLength={120}
              placeholder={t('otherPlaceholder')}
              aria-label={t('otherPlaceholder')}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  confirm()
                }
              }}
            />
          )}

          {(question.kind === 'multi' || otherOpen) && (
            <div className="mt-3 flex justify-end">
              <Button size="sm" onClick={confirm} disabled={!canConfirm}>
                {index + 1 === total ? t('finish') : t('next')}
              </Button>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
