'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'

const CNAME_VALUE = 'cname.valorcy.com'
const ARECORD_VALUE = '76.76.21.21'

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7 shrink-0"
      onClick={handleCopy}
    >
      {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
    </Button>
  )
}

function DnsRow({ type, name, value }: { type: string; name: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5">{type}</span>
        <span>record</span>
      </div>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <span className="text-muted-foreground w-10">Name</span>
        <code className="font-mono text-xs truncate">{name}</code>
        <CopyButton value={name} />
      </div>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <span className="text-muted-foreground w-10">Value</span>
        <code className="font-mono text-xs truncate">{value}</code>
        <CopyButton value={value} />
      </div>
    </div>
  )
}

type Props = { domain: string }

export function DnsInstructions({ domain }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Add one of the following DNS records for <strong className="text-foreground">{domain}</strong> at your domain registrar, then click Verify.
      </p>
      <DnsRow type="CNAME" name={domain} value={CNAME_VALUE} />
      <p className="text-xs text-center text-muted-foreground">— or use an A record if CNAME isn&apos;t supported on the root domain —</p>
      <DnsRow type="A" name={domain} value={ARECORD_VALUE} />
    </div>
  )
}
