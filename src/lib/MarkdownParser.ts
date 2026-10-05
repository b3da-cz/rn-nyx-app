export type InlineToken =
  | { type: 'text'; content: string; bold?: boolean; italic?: boolean }
  | { type: 'link'; text: string; url: string; bold?: boolean; italic?: boolean }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'code'; text: string }

export type MarkdownBlock =
  | { type: 'header'; level: number; content: string }
  | { type: 'code_block'; lang: string; content: string }
  | { type: 'blockquote'; content: string }
  | { type: 'list_item'; ordered: boolean; number?: string; indent: number; content: string }
  | { type: 'hr' }
  | { type: 'paragraph'; content: string }

function cleanUrlAndExtractPunct(rawUrl: string): { url: string; trailingPunct: string } {
  let url = rawUrl.trim()
  // Strip optional markdown link title, e.g. (url "title")
  url = url.replace(/\s+["'][^"']*["']$/, '').trim()

  let trailingPunct = ''
  const punctMatch = url.match(/[.,;:!?]+$/)
  if (punctMatch) {
    trailingPunct = punctMatch[0]
    url = url.slice(0, -trailingPunct.length)
  }
  return { url, trailingPunct }
}

function mergeAdjacentTextTokens(tokens: InlineToken[]): InlineToken[] {
  const merged: InlineToken[] = []
  for (const token of tokens) {
    const prev = merged[merged.length - 1]
    if (
      prev &&
      prev.type === 'text' &&
      token.type === 'text' &&
      Boolean(prev.bold) === Boolean(token.bold) &&
      Boolean(prev.italic) === Boolean(token.italic)
    ) {
      prev.content += token.content
    } else {
      merged.push({ ...token })
    }
  }
  return merged
}

type InlineInherited = {
  bold?: boolean
  italic?: boolean
}

/**
 * Tokenize inline markdown into formatted spans (links, bold, italic, code, text).
 * Resilient against glued characters, punctuation, and formatting wrappers around links.
 */
export function tokenizeInlineMarkdown(text: string, inherited: InlineInherited = {}): InlineToken[] {
  if (!text) {
    return []
  }

  const tokens: InlineToken[] = []
  // 1) Link with optional wrapping marks (*, **, ***, _, __, @) and trailing punctuation inside/outside
  // 2) Bold **...** or __...__
  // 3) Italic *...* or _..._
  // 4) Code `...`
  // 5) Autolink https://...
  const regex =
    /((\*{1,3}|_{1,2})?(@)?\[([^\]]+)\]\(([^)]+)\)([.,;:!?]+)?(\*{1,3}|_{1,2})?([.,;:!?]+)?)|(\*\*([^*]+)\*\*)|(__([^_]+)__)|(\*([^*]+)\*)|(_([^_]+)_)|(`([^`]+)`)|(https?:\/\/[^\s)]+)/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
        ...(inherited.bold ? { bold: true } : {}),
        ...(inherited.italic ? { italic: true } : {}),
      })
    }

    if (match[1] && match[4] && match[5]) {
      // Link matched!
      const prefix = match[2] || ''
      const atSign = match[3] || ''
      const rawLinkText = match[4]
      const rawUrl = match[5]
      const punctInside = match[6] || ''
      const suffix = match[7] || ''
      const punctOutside = match[8] || ''

      const { url, trailingPunct: urlPunct } = cleanUrlAndExtractPunct(rawUrl)

      const isBold = Boolean(
        inherited.bold ||
          prefix.includes('**') ||
          suffix.includes('**') ||
          prefix.includes('__') ||
          suffix.includes('__') ||
          /^\*\*.*\*\*$/.test(rawLinkText),
      )

      const isItalic = Boolean(
        inherited.italic ||
          prefix === '*' ||
          suffix === '*' ||
          prefix === '_' ||
          suffix === '_' ||
          prefix === '***' ||
          suffix === '***' ||
          /^\*.*\*$/.test(rawLinkText),
      )

      let cleanText = rawLinkText.replace(/^\*\*|\*\*$/g, '').replace(/^\*|\*$/g, '')
      if (atSign && !cleanText.startsWith('@')) {
        cleanText = `@${cleanText}`
      }

      tokens.push({
        type: 'link',
        text: cleanText,
        url,
        ...(isBold ? { bold: true } : {}),
        ...(isItalic ? { italic: true } : {}),
      })

      const trailingPunct = punctInside + punctOutside + urlPunct
      if (trailingPunct) {
        const isPunctBold = Boolean(inherited.bold || (isBold && punctInside))
        const isPunctItalic = Boolean(inherited.italic || (isItalic && punctInside))
        tokens.push({
          type: 'text',
          content: trailingPunct,
          ...(isPunctBold ? { bold: true } : {}),
          ...(isPunctItalic ? { italic: true } : {}),
        })
      }
    } else if (match[9] || match[11]) {
      // Bold
      const boldContent = match[10] || match[12]
      if (/\[[^\]]+\]\([^)]+\)|https?:\/\//.test(boldContent)) {
        const inner = tokenizeInlineMarkdown(boldContent, { ...inherited, bold: true })
        tokens.push(...inner)
      } else {
        tokens.push({
          type: 'bold',
          text: boldContent,
        })
      }
    } else if (match[13] || match[15]) {
      // Italic
      const italicContent = match[14] || match[16]
      if (/\[[^\]]+\]\([^)]+\)|https?:\/\//.test(italicContent)) {
        const inner = tokenizeInlineMarkdown(italicContent, { ...inherited, italic: true })
        tokens.push(...inner)
      } else {
        tokens.push({
          type: 'italic',
          text: italicContent,
        })
      }
    } else if (match[17]) {
      // Code
      tokens.push({
        type: 'code',
        text: match[18],
      })
    } else if (match[19]) {
      // Autolink
      const { url, trailingPunct } = cleanUrlAndExtractPunct(match[19])
      tokens.push({
        type: 'link',
        text: url,
        url,
        ...(inherited.bold ? { bold: true } : {}),
        ...(inherited.italic ? { italic: true } : {}),
      })
      if (trailingPunct) {
        tokens.push({
          type: 'text',
          content: trailingPunct,
          ...(inherited.bold ? { bold: true } : {}),
          ...(inherited.italic ? { italic: true } : {}),
        })
      }
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      content: text.substring(lastIndex),
      ...(inherited.bold ? { bold: true } : {}),
      ...(inherited.italic ? { italic: true } : {}),
    })
  }

  return mergeAdjacentTextTokens(tokens)
}

/**
 * Parse markdown string into structural blocks.
 */
export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  if (!markdown) {
    return []
  }
  const lines = markdown.split(/\r?\n/)
  const blocks: MarkdownBlock[] = []

  let inCodeBlock = false
  let codeBlockLines: string[] = []
  let codeBlockLang = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Fenced code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          type: 'code_block',
          lang: codeBlockLang,
          content: codeBlockLines.join('\n'),
        })
        inCodeBlock = false
        codeBlockLines = []
        codeBlockLang = ''
      } else {
        inCodeBlock = true
        codeBlockLang = line.trim().slice(3).trim()
        codeBlockLines = []
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(line)
      continue
    }

    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    // Headers
    const hMatch = trimmed.match(/^(#{1,4})\s+(.+)$/)
    if (hMatch) {
      blocks.push({
        type: 'header',
        level: hMatch[1].length,
        content: hMatch[2],
      })
      continue
    }

    // Horizontal Rule
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' })
      continue
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      blocks.push({
        type: 'blockquote',
        content: trimmed.replace(/^>\s?/, ''),
      })
      continue
    }

    // Unordered List (- or *)
    const ulMatch = line.match(/^(\s*)([\*\-])\s+(.+)$/)
    if (ulMatch) {
      const indent = Math.floor(ulMatch[1].length / 2)
      blocks.push({
        type: 'list_item',
        ordered: false,
        indent,
        content: ulMatch[3],
      })
      continue
    }

    // Ordered List (1. or 2.)
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/)
    if (olMatch) {
      const indent = Math.floor(olMatch[1].length / 2)
      blocks.push({
        type: 'list_item',
        ordered: true,
        number: olMatch[2],
        indent,
        content: olMatch[3],
      })
      continue
    }

    // Regular paragraph
    blocks.push({
      type: 'paragraph',
      content: trimmed,
    })
  }

  if (inCodeBlock && codeBlockLines.length > 0) {
    blocks.push({
      type: 'code_block',
      lang: codeBlockLang,
      content: codeBlockLines.join('\n'),
    })
  }

  return blocks
}
