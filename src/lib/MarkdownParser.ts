export type InlineToken =
  | { type: 'text'; content: string }
  | { type: 'link'; text: string; url: string }
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

/**
 * Tokenize inline markdown into formatted spans (links, bold, italic, code, text).
 */
export function tokenizeInlineMarkdown(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  const regex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(https?:\/\/[^\s)]+)/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.substring(lastIndex, match.index) })
    }

    if (match[1]) {
      // [text](url)
      const linkText = match[2].replace(/^\*\*|\*\*$/g, '')
      tokens.push({ type: 'link', text: linkText, url: match[3] })
    } else if (match[4]) {
      // **bold**
      tokens.push({ type: 'bold', text: match[5] })
    } else if (match[6]) {
      // *italic*
      tokens.push({ type: 'italic', text: match[7] })
    } else if (match[8]) {
      // `code`
      tokens.push({ type: 'code', text: match[9] })
    } else if (match[10]) {
      // Autolink https://...
      tokens.push({ type: 'link', text: match[10], url: match[10] })
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', content: text.substring(lastIndex) })
  }

  return tokens
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
