'use client'

import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { Row } from '../shared/row'

type Props = {
  /** Which props are editable for this element. */
  fields: Array<'title' | 'description' | 'text' | 'triggerLabel' | 'content' | 'fallback' | 'variant' | 'value'>
  props: Record<string, unknown>
  onProps: (patch: Record<string, unknown>) => void
}

const VARIANT_OPTS = ['default', 'secondary', 'destructive', 'outline'] as const

export function TextPropControls ({ fields, props, onProps }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {fields.map((f) => {
        if (f === 'variant') {
          return (
            <Row key={f} label="Variant">
              <Select
                value={String(props.variant ?? 'default')}
                onValueChange={(v) => onProps({ variant: v })}
              >
                <SelectTrigger className="h-7 flex-1 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-999!">
                  {VARIANT_OPTS.map((v) => (
                    <SelectItem key={v} value={v} className="text-xs">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          )
        }
        if (f === 'value') {
          return (
            <Row key={f} label="Value">
              <Input
                className="h-7 flex-1 px-2 text-[11px]"
                type="number"
                value={String(props.value ?? '')}
                onChange={(e) => onProps({ value: Number(e.target.value) })}
                aria-label="Value"
              />
            </Row>
          )
        }
        const labelMap: Record<string, string> = {
          title: 'Title',
          description: 'Desc',
          text: 'Text',
          triggerLabel: 'Trigger',
          content: 'Content',
          fallback: 'Initials',
        }
        return (
          <Row key={f} label={labelMap[f] ?? f}>
            <Input
              className="h-7 flex-1 px-2 text-[11px]"
              value={String(props[f] ?? '')}
              onChange={(e) => onProps({ [f]: e.target.value })}
              aria-label={labelMap[f]}
            />
          </Row>
        )
      })}
    </div>
  )
}
