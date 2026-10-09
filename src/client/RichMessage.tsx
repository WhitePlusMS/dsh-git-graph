import { Fragment, type ReactNode } from 'react'
import { css } from './styles.ts'

export interface MessageToken {
  readonly kind: 'text' | 'code' | 'strong' | 'em' | 'link'
  readonly value: string
}

/** A bounded inline subset: the source is always text, never executable HTML. */
export function messageTokens(text: string): MessageToken[] {
  const tokens: MessageToken[] = []
  const pattern = /\\[\\*_`]|`([^`\n]+)`|\*\*([^\n]+?)\*\*|__([^\n]+?)__|\*([^*\n]+?)\*|(?<![\p{L}\p{N}])_([^_\n]+?)_(?![\p{L}\p{N}])|https?:\/\/[^\s<>`]+/gu
  let start = 0
  for (const match of text.matchAll(pattern)) {
    if (match.index > start) tokens.push({ kind: 'text', value: text.slice(start, match.index) })
    const raw = match[0]
    if (raw.startsWith('\\')) tokens.push({ kind: 'text', value: raw.slice(1) })
    else if (match[1] !== undefined) tokens.push({ kind: 'code', value: match[1] })
    else if (match[2] !== undefined || match[3] !== undefined) tokens.push({ kind: 'strong', value: match[2] ?? match[3] ?? '' })
    else if (match[4] !== undefined || match[5] !== undefined) tokens.push({ kind: 'em', value: match[4] ?? match[5] ?? '' })
    else {
      let url = raw.replace(/[.,;:!?]+$/u, '')
      // Keep balanced URL parentheses, but leave surrounding prose punctuation.
      for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']] as const) {
        while (url.endsWith(close) && url.split(close).length > url.split(open).length) url = url.slice(0, -1)
      }
      tokens.push({ kind: 'link', value: url })
      if (url.length < raw.length) tokens.push({ kind: 'text', value: raw.slice(url.length) })
    }
    start = match.index + raw.length
  }
  if (start < text.length) tokens.push({ kind: 'text', value: text.slice(start) })
  return tokens
}

function inlineMessage(text: string, depth = 0): ReactNode {
  if (depth >= 4) return text
  return messageTokens(text).map((token, index) => {
    if (token.kind === 'link') return <a key={index} href={token.value} target="_blank" rel="noopener noreferrer">{token.value}</a>
    if (token.kind === 'code') return <code key={index}>{token.value}</code>
    if (token.kind === 'strong') return <strong key={index}>{inlineMessage(token.value, depth + 1)}</strong>
    if (token.kind === 'em') return <em key={index}>{inlineMessage(token.value, depth + 1)}</em>
    return <Fragment key={index}>{token.value}</Fragment>
  })
}

export function RichMessage({ text, formatted }: { readonly text: string; readonly formatted: boolean }) {
  return <div className={css.detailBody} data-rich-message={formatted}>{formatted ? inlineMessage(text) : text}</div>
}
