'use client'

import { useState } from 'react'
import { Mail, MapPin, Phone, Plus, Sparkles, X } from 'lucide-react'
import { Badge } from '@workspace/ui/components/badge'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Textarea } from '@workspace/ui/components/textarea'
import { cn } from '@/lib/utils'
import {
  SITE_FEATURE_OPTIONS,
  type SiteExtraDetails,
} from '@/lib/ai/site-plan-schema'

const DETAILS_MAX = 1500

const DETAIL_PROMPTS = [
  'We are open 9–6 on weekdays and closed Sundays.',
  'Highlight our 15 years of experience and free consultations.',
  'Keep the tone warm and family-friendly, no corporate jargon.',
  'Mention that we serve the greater Cairo area only.',
]

interface DetailsFormProps {
  value: SiteExtraDetails
  onChange: (next: SiteExtraDetails) => void
  /**
   * Rendered inside the create form's "Add more details" disclosure rather than
   * as its own step: drops the heading and the closing explainer, which the
   * surrounding screen already provides.
   */
  embedded?: boolean
}

/**
 * The optional detail fields. Everything here is optional; every field that IS
 * filled is threaded verbatim into every agent prompt (copy, SEO, review) via
 * `businessContextLines()`.
 */
export function DetailsForm({ value, onChange, embedded }: DetailsFormProps) {
  const [serviceDraft, setServiceDraft] = useState('')

  const services = value.services ?? []
  const features = value.features ?? []
  const contact = value.contact ?? {}
  const detailsLength = (value.additionalDetails ?? '').length

  function patch(next: Partial<SiteExtraDetails>) {
    onChange({ ...value, ...next })
  }

  function addService(raw: string) {
    const label = raw.trim()
    if (!label || services.includes(label)) {
      setServiceDraft('')
      return
    }
    patch({ services: [...services, label].slice(0, 12) })
    setServiceDraft('')
  }

  function toggleFeature(id: string) {
    patch({
      features: features.includes(id)
        ? features.filter((f) => f !== id)
        : [...features, id],
    })
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h2 className="text-xl font-semibold">Anything else we should know?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All optional — but the more you share, the more the site sounds like your business
            instead of a template.
          </p>
        </div>
      )}

      {/* Free-form requirements */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="additionalDetails">
            Requirements, preferences, and business details
          </Label>
          <span className="text-xs text-muted-foreground">
            {detailsLength}/{DETAILS_MAX}
          </span>
        </div>
        <Textarea
          id="additionalDetails"
          className="min-h-[130px] resize-none"
          maxLength={DETAILS_MAX}
          placeholder="Opening hours, years in business, awards, what to emphasise, what to avoid, specific wording you want used…"
          value={value.additionalDetails ?? ''}
          onChange={(e) => patch({ additionalDetails: e.target.value })}
        />
        <div className="flex flex-wrap gap-2">
          {DETAIL_PROMPTS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() =>
                patch({
                  additionalDetails: [value.additionalDetails?.trim(), example]
                    .filter(Boolean)
                    .join('\n')
                    .slice(0, DETAILS_MAX),
                })
              }
              className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Plus className="size-3" />
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Services / products */}
      <div className="space-y-2">
        <Label htmlFor="serviceDraft">
          Services or products you offer{' '}
          <span className="text-muted-foreground">(press Enter after each)</span>
        </Label>
        <Input
          id="serviceDraft"
          placeholder="e.g. Teeth whitening"
          value={serviceDraft}
          onChange={(e) => setServiceDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              addService(serviceDraft)
            }
          }}
          onBlur={() => addService(serviceDraft)}
        />
        {services.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {services.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1 px-3 py-1 text-sm">
                {s}
                <button
                  type="button"
                  aria-label={`Remove ${s}`}
                  onClick={() => patch({ services: services.filter((x) => x !== s) })}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Must-have capabilities */}
      <div className="space-y-2">
        <Label>What should the website include?</Label>
        <div className="flex flex-wrap gap-2">
          {SITE_FEATURE_OPTIONS.map((f) => {
            const selected = features.includes(f.id)
            return (
              <Badge
                key={f.id}
                variant={selected ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer select-none px-3 py-1 text-sm transition-colors',
                  selected ? 'hover:bg-primary/80' : 'hover:border-primary hover:text-primary'
                )}
                onClick={() => toggleFeature(f.id)}
              >
                {f.label}
              </Badge>
            )
          })}
        </div>
      </div>

      {/* Real contact details */}
      <div className="space-y-2">
        <Label>
          Contact details <span className="text-muted-foreground">(used as-is, never invented)</span>
        </Label>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              aria-label="Contact email"
              placeholder="hello@acme.com"
              className="ps-9"
              value={contact.email ?? ''}
              onChange={(e) => patch({ contact: { ...contact, email: e.target.value } })}
            />
          </div>
          <div className="relative">
            <Phone className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="tel"
              aria-label="Contact phone"
              placeholder="+20 100 000 0000"
              className="ps-9"
              value={contact.phone ?? ''}
              onChange={(e) => patch({ contact: { ...contact, phone: e.target.value } })}
            />
          </div>
          <div className="relative">
            <MapPin className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Address"
              placeholder="City / address"
              className="ps-9"
              value={contact.address ?? ''}
              onChange={(e) => patch({ contact: { ...contact, address: e.target.value } })}
            />
          </div>
        </div>
      </div>

      {!embedded && (
        <div className="flex items-start gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            When you hit <strong className="font-medium text-foreground">Generate website</strong>,
            the AI plans your brand, picks every section, writes the copy, finds the images, adds
            SEO, and reviews the result — then saves the finished site into the builder.
          </span>
        </div>
      )}
    </div>
  )
}
