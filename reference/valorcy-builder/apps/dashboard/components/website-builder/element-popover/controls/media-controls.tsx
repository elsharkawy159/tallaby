'use client'

import { Input } from '@workspace/ui/components/input'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { Row } from '../shared/row'
import type { ShadcnComponentType } from '@/lib/builder/component-node'

type Props = {
  type: ShadcnComponentType
  props: Record<string, unknown>
  onProps: (patch: Record<string, unknown>) => void
}

export function MediaControls ({ type, props, onProps }: Props) {
  const isVideo = type === 'video'
  const isMap = type === 'map'

  return (
    <div className="flex flex-col gap-1.5">
      <Row label={isMap ? 'Embed' : 'Source'}>
        <Input
          className="h-7 flex-1 px-2 text-[11px]"
          value={String(props.src ?? '')}
          placeholder={isMap ? 'https://maps.google.com/…' : 'https://…'}
          onChange={(e) => onProps({ src: e.target.value })}
          aria-label="Source URL"
        />
      </Row>
      {isMap ? (
        <Row label="Title">
          <Input
            className="h-7 flex-1 px-2 text-[11px]"
            value={String(props.title ?? '')}
            placeholder="Map title"
            onChange={(e) => onProps({ title: e.target.value })}
            aria-label="Title"
          />
        </Row>
      ) : null}
      {isVideo ? (
        <>
          <Row label="Controls">
            <label className="flex items-center gap-1.5 text-[11px]">
              <Checkbox
                checked={Boolean(props.controls)}
                onCheckedChange={(v) => onProps({ controls: Boolean(v) })}
              />
              Show
            </label>
          </Row>
          <Row label="Autoplay">
            <label className="flex items-center gap-1.5 text-[11px]">
              <Checkbox
                checked={Boolean(props.autoplay)}
                onCheckedChange={(v) => onProps({ autoplay: Boolean(v) })}
              />
              Auto
            </label>
          </Row>
          <Row label="Loop">
            <label className="flex items-center gap-1.5 text-[11px]">
              <Checkbox
                checked={Boolean(props.loop)}
                onCheckedChange={(v) => onProps({ loop: Boolean(v) })}
              />
              Loop
            </label>
          </Row>
        </>
      ) : null}
    </div>
  )
}
