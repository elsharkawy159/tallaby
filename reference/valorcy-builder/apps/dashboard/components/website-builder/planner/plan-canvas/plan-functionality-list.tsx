'use client'

import { useTranslations } from 'next-intl'
import { Check, ImageIcon, Settings2, ShoppingCart, Sparkles } from 'lucide-react'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@/lib/utils'
import type { DerivedFunctionality, FunctionalityId } from '@/lib/ai/plan-functionality'
import type { WebsitePlan } from '@/lib/ai/site-plan-schema'
import { useSitePlanStore } from '@/lib/ai/use-site-plan-store'
import { PlanCard } from './plan-overview'

interface PlanFunctionalityListProps {
  plan: WebsitePlan
  items: DerivedFunctionality[]
  onToggle: (id: FunctionalityId, enabled: boolean) => void
}

export function PlanFunctionalityList ({ plan, items, onToggle }: PlanFunctionalityListProps) {
  const t = useTranslations('aiCreate')
  const apply = useSitePlanStore((s) => s.apply)
  const modules = items.filter((i) => i.toggleable)
  const included = items.filter((i) => !i.toggleable)
  const store = items.find((i) => i.id === 'ecommerce')?.enabled
  const settings = plan.generationSettings

  return (
    <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        <PlanCard title={t('plan.features.modules')} icon={<Sparkles />}>
          <p className="mb-3 text-xs text-muted-foreground">{t('plan.features.hint')}</p>
          <ul className="divide-y">
            {modules.map((item) => {
              const inputId = `plan-functionality-${item.id}`
              return (
                <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <label htmlFor={inputId} className={cn('text-sm font-medium', !item.enabled && 'text-muted-foreground')}>
                      {t(`functionality.${item.id}`)}
                    </label>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t(`plan.features.hints.${item.id}`)}</p>
                  </div>
                  <Switch id={inputId} checked={item.enabled} onCheckedChange={(checked) => onToggle(item.id, checked)} />
                </li>
              )
            })}
          </ul>
        </PlanCard>

        {store && (
          <PlanCard title={t('plan.features.store')} icon={<ShoppingCart />}>
            <ul className="space-y-2 text-sm">
              {(['storeCart', 'storePayment', 'storeCatalog'] as const).map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {t(`plan.features.${key}`)}
                </li>
              ))}
            </ul>
          </PlanCard>
        )}
      </div>

      <aside className="min-w-0 space-y-4">
        <PlanCard title={t('plan.features.included')}>
          <ul className="space-y-2">
            {included.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3" />
                </span>
                {t(`functionality.${item.id}`)}
              </li>
            ))}
          </ul>
        </PlanCard>

        <PlanCard title={t('plan.features.settings')} icon={<Settings2 />}>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
              <label htmlFor="plan-setting-images" className="min-w-0 flex-1 text-sm">
                {t('plan.features.includeImages')}
              </label>
              <Switch
                id="plan-setting-images"
                checked={settings?.includeImages !== false}
                onCheckedChange={(includeImages) => apply({ op: 'settings.update', patch: { includeImages } })}
              />
            </li>
            <li className="flex items-center gap-3">
              <Sparkles className="size-4 shrink-0 text-muted-foreground" />
              <label htmlFor="plan-setting-samples" className="min-w-0 flex-1 text-sm">
                {t('plan.features.sampleContent')}
              </label>
              <Switch
                id="plan-setting-samples"
                checked={settings?.sampleContent !== false}
                onCheckedChange={(sampleContent) => apply({ op: 'settings.update', patch: { sampleContent } })}
              />
            </li>
          </ul>
        </PlanCard>
      </aside>
    </div>
  )
}
