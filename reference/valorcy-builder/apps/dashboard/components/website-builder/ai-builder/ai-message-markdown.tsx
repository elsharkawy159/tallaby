'use client'

import { useMemo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Block =
  | { kind: 'paragraph'; lines: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'ul'; items: string[] }

function parseInline (text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index))
    }
    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={key++} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-background/60 px-1 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>
      )
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        nodes.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {linkMatch[1]}
          </a>
        )
      }
    }
    last = match.index + token.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes.length ? nodes : [text]
}

function parseBlocks (source: string): Block[] {
  const lines = source.split('\n')
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''
    const ol = line.match(/^\s*(\d+)\.\s+(.+)$/)
    const ul = line.match(/^\s*[-*]\s+(.+)$/)
    if (ol) {
      const items: string[] = []
      while (i < lines.length) {
        const m = (lines[i] ?? '').match(/^\s*\d+\.\s+(.+)$/)
        if (!m) break
        items.push(m[1] ?? '')
        i++
      }
      blocks.push({ kind: 'ol', items })
      continue
    }
    if (ul) {
      const items: string[] = []
      while (i < lines.length) {
        const m = (lines[i] ?? '').match(/^\s*[-*]\s+(.+)$/)
        if (!m) break
        items.push(m[1] ?? '')
        i++
      }
      blocks.push({ kind: 'ul', items })
      continue
    }
    if (!line.trim()) {
      i++
      continue
    }
    const para: string[] = []
    while (i < lines.length && (lines[i] ?? '').trim()) {
      const l = lines[i] ?? ''
      if (/^\s*(\d+\.|[-*])\s+/.test(l)) break
      para.push(l)
      i++
    }
    blocks.push({ kind: 'paragraph', lines: para })
  }
  return blocks
}

type Props = {
  text: string
  className?: string
}

export function AiMessageMarkdown ({ text, className }: Props) {
  const blocks = useMemo(() => parseBlocks(text), [text])
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {blocks.map((block, bi) => {
        if (block.kind === 'ol') {
          return (
            <ol key={bi} className="list-decimal space-y-1 ps-5">
              {block.items.map((item, ii) => (
                <li key={ii} className="leading-relaxed">
                  {parseInline(item)}
                </li>
              ))}
            </ol>
          )
        }
        if (block.kind === 'ul') {
          return (
            <ul key={bi} className="list-disc space-y-1 ps-5">
              {block.items.map((item, ii) => (
                <li key={ii} className="leading-relaxed">
                  {parseInline(item)}
                </li>
              ))}
            </ul>
          )
        }
        return (
          <div key={bi} className="space-y-1">
            {block.lines.map((line, li) => (
              <p key={li} className="leading-relaxed">
                {parseInline(line)}
              </p>
            ))}
          </div>
        )
      })}
    </div>
  )
}