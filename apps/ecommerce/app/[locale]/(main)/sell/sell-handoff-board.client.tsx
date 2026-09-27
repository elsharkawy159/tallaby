'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'
import { SELL_SERVICES, allHandledBy } from './sell.lib'
import type { SellHandler, SellServiceId } from './sell.types'

const HANDLERS: SellHandler[] = ['seller', 'tallaby']

export function SellHandoffBoard() {
  const t = useTranslations('pages.sell.board')
  // Same default as the onboarding wizard: Tallaby handles everything.
  const [handlers, setHandlers] = useState<Record<SellServiceId, SellHandler>>(
    () => allHandledBy('tallaby'),
  )

  const tallabyCount = SELL_SERVICES.filter(
    (service) => handlers[service.id] === 'tallaby',
  ).length
  const total = SELL_SERVICES.length

  return (
    <div className="overflow-hidden rounded-3xl border bg-background shadow-xl shadow-primary/10">
      <div className="flex flex-col gap-3 border-b bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p className="text-sm font-medium text-muted-foreground">{t('presetsLabel')}</p>
        <div className="flex flex-wrap gap-2">
          <PresetButton
            active={tallabyCount === total}
            onClick={() => setHandlers(allHandledBy('tallaby'))}
          >
            {t('presetTallaby')}
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
              {t('recommended')}
            </span>
          </PresetButton>
          <PresetButton
            active={tallabyCount === 0}
            onClick={() => setHandlers(allHandledBy('seller'))}
          >
            {t('presetSeller')}
          </PresetButton>
        </div>
      </div>

      <ul className="divide-y">
        {SELL_SERVICES.map((service) => {
          const Icon = service.icon
          const handler = handlers[service.id]
          const byTallaby = handler === 'tallaby'
          const name = t(`services.${service.id}.name`)

          return (
            <li
              key={service.id}
              className={cn(
                'flex flex-col gap-4 p-4 transition-colors motion-reduce:transition-none sm:flex-row sm:items-center md:px-6',
                byTallaby && 'bg-primary/[0.04]',
              )}
            >
              <div className="flex min-w-0 flex-1 gap-3">
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors motion-reduce:transition-none',
                    byTallaby
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{name}</p>
                  <p className="text-sm text-muted-foreground" aria-live="polite">
                    {t(`services.${service.id}.${handler}`)}
                  </p>
                  {byTallaby && service.planKeys.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t('plans')}>
                      {service.planKeys.map((planKey) => (
                        <li
                          key={planKey}
                          className="rounded-full border border-primary/20 bg-background px-2.5 py-0.5 text-xs text-primary"
                        >
                          {t(`planNames.${planKey}`)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div
                role="radiogroup"
                aria-label={t('whoHandles', { service: name })}
                className="relative grid w-full shrink-0 grid-cols-2 rounded-full bg-muted p-1 sm:w-48"
              >
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-full transition-all duration-300 ease-out motion-reduce:transition-none',
                    byTallaby ? 'bg-primary' : 'bg-background shadow-sm',
                  )}
                  style={{ insetInlineStart: byTallaby ? '50%' : '0.25rem' }}
                />
                {HANDLERS.map((option) => {
                  const selected = option === handler
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() =>
                        setHandlers((prev) => ({ ...prev, [service.id]: option }))
                      }
                      className={cn(
                        'relative z-10 rounded-full px-3 py-1.5 text-sm font-medium transition-colors motion-reduce:transition-none',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        selected
                          ? option === 'tallaby'
                            ? 'text-primary-foreground'
                            : 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {t(option === 'seller' ? 'you' : 'tallaby')}
                    </button>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col gap-3 border-t bg-muted/40 p-4 md:flex-row md:items-center md:gap-6 md:px-6">
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex gap-1" aria-hidden>
            {SELL_SERVICES.map((service) => (
              <span
                key={service.id}
                className={cn(
                  'h-2 w-5 rounded-full transition-colors motion-reduce:transition-none',
                  handlers[service.id] === 'tallaby' ? 'bg-primary' : 'bg-border',
                )}
              />
            ))}
          </div>
          <p className="text-sm font-semibold" aria-live="polite">
            {t('summary', { count: tallabyCount, total })}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{t('pricingNote')}</p>
      </div>
    </div>
  )
}

function PresetButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'bg-background text-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}
