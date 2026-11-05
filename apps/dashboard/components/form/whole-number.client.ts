'use client'

import { useState } from 'react'

import { inRangeValue, settledValue, wholeNumberText, type WholeNumberRange } from './whole-number.lib'

/**
 * Props for a whole-number text input (see whole-number.lib.ts): spread the
 * result on the input, together with `inputMode="numeric"` and `dir="ltr"`.
 * `onCommit` only ever receives an in-range integer.
 */
export function useWholeNumberInput (
  value: number,
  onCommit: (value: number) => void,
  range: WholeNumberRange
) {
  const [text, setText] = useState(String(value))
  const [seen, setSeen] = useState(value)

  // Follow outside changes (reset, loaded draft) without an effect, but keep
  // text that already reads as the new value.
  if (seen !== value) {
    setSeen(value)
    if (inRangeValue(text, range) !== value) setText(String(value))
  }

  return {
    type: 'text' as const,
    inputMode: 'numeric' as const,
    value: text,
    onChange: (event: { target: { value: string } }) => {
      const next = wholeNumberText(event.target.value, range.max)
      setText(next)
      const n = inRangeValue(next, range)
      if (n !== null && n !== value) onCommit(n)
    },
    onBlur: () => {
      const n = settledValue(text, range)
      setText(String(n))
      if (n !== value) onCommit(n)
    },
  }
}
