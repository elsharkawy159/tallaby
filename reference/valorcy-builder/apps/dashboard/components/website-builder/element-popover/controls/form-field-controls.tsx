'use client'

import { Input } from '@workspace/ui/components/input'
import { Checkbox } from '@workspace/ui/components/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { Row } from '../shared/row'
import type { ShadcnComponentType } from '@/lib/builder/component-node'

type Props = {
  type: ShadcnComponentType
  props: Record<string, unknown>
  onProps: (patch: Record<string, unknown>) => void
}

const INPUT_TYPES = ['text', 'email', 'password', 'number', 'tel', 'url', 'date'] as const

export function FormFieldControls ({ type, props, onProps }: Props) {
  const showPlaceholder = type === 'input' || type === 'textarea' || type === 'search'
  const showInputType = type === 'input'
  const showText = type === 'label'
  const showChecked = type === 'checkbox'
  const showName =
    type === 'input' ||
    type === 'textarea' ||
    type === 'select' ||
    type === 'checkbox' ||
    type === 'radio' ||
    type === 'search'

  return (
    <div className="flex flex-col gap-1.5">
      {showText ? (
        <Row label="Text">
          <Input
            className="h-7 flex-1 px-2 text-[11px]"
            value={String(props.text ?? '')}
            onChange={(e) => onProps({ text: e.target.value })}
            aria-label="Label text"
          />
        </Row>
      ) : null}
      {showName ? (
        <Row label="Name">
          <Input
            className="h-7 flex-1 px-2 text-[11px]"
            value={String(props.name ?? '')}
            placeholder="field-name"
            onChange={(e) => onProps({ name: e.target.value })}
            aria-label="Field name"
          />
        </Row>
      ) : null}
      {showPlaceholder ? (
        <Row label="Hint">
          <Input
            className="h-7 flex-1 px-2 text-[11px]"
            value={String(props.placeholder ?? '')}
            placeholder="Placeholder"
            onChange={(e) => onProps({ placeholder: e.target.value })}
            aria-label="Placeholder"
          />
        </Row>
      ) : null}
      {showInputType ? (
        <Row label="Type">
          <Select
            value={String(props.type ?? 'text')}
            onValueChange={(v) => onProps({ type: v })}
          >
            <SelectTrigger className="h-7 flex-1 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-999!">
              {INPUT_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
      ) : null}
      {showChecked ? (
        <Row label="Default">
          <label className="flex items-center gap-1.5 text-[11px]">
            <Checkbox
              checked={Boolean(props.checked)}
              onCheckedChange={(v) => onProps({ checked: Boolean(v) })}
            />
            Checked
          </label>
        </Row>
      ) : null}
      <Row label="Required">
        <label className="flex items-center gap-1.5 text-[11px]">
          <Checkbox
            checked={Boolean(props.required)}
            onCheckedChange={(v) => onProps({ required: Boolean(v) })}
          />
          Required
        </label>
      </Row>
    </div>
  )
}
