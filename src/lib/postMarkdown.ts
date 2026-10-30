import he from 'he'

const MARKDOWN_SIGNAL =
  /(^|\n)\s{0,3}#{1,6}\s+\S|(^|\n)\s*```|(^|\n)\s*[-*+]\s+\S|(^|\n)\s*\d+\.\s+\S|\[[^\]]+\]\([^)\s]+\)|\*\*[^*\n]+\*\*|__[^_\n]+__|(^|\n)\s*>\s+\S|(^|\n)[^\n]*\|[^\n]*\n\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+/

function withoutEmbedded(html: string): string {
  return html
    .replace(/<pre\b[\s\S]*?<\/pre>/gi, '\n')
    .replace(/<(div|span)\b[^>]*\bspoiler\b[^>]*>[\s\S]*?<\/\1>/gi, '\n')
    .replace(/<div\b[^>]*\bembed-wrapper\b[^>]*>[\s\S]*?<\/div>/gi, '\n')
    .replace(/<video\b[\s\S]*?<\/video>/gi, '\n')
    .replace(/<img\b[^>]*>/gi, '\n')
}

function breaksToNewlines(html: string): string {
  return html
    .replace(/\r\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|pre)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function postHtmlToText(html?: string | null): string {
  return breaksToNewlines(he.decode(withoutEmbedded(`${html || ''}`)))
}

export function postHtmlToMarkdown(html?: string | null): string {
  let text = he.decode(withoutEmbedded(`${html || ''}`))
  text = text.replace(
    /<a\b[^>]*href=(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi,
    (_match, quoted, apos, bare, label) => {
      const href = `${quoted || apos || bare || ''}`
      const name = `${label || ''}`.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (!href) {
        return name
      }
      const url = href.startsWith('/') ? `https://nyx.cz${href}` : href
      return name ? `[${name}](${url})` : url
    },
  )
  return breaksToNewlines(text)
}

export type PostFlowSegment =
  | { type: 'markdown'; text: string }
  | { type: 'code'; index: number }
  | { type: 'image'; index: number }
  | { type: 'video'; index: number }
  | { type: 'embed'; index: number }
  | { type: 'spoiler'; index: number }

const EMBEDS: Array<{ type: PostFlowSegment['type']; pattern: RegExp }> = [
  { type: 'code', pattern: /<pre\b[\s\S]*?<\/pre>/i },
  { type: 'image', pattern: /<img\b[^>]*\bsrc\s*=[^>]*>/i },
  { type: 'video', pattern: /<video\b[\s\S]*?<\/video>/i },
  { type: 'embed', pattern: /<div\b[^>]*\bembed-wrapper\b[^>]*>[\s\S]*?<\/div>/i },
  { type: 'spoiler', pattern: /<(div|span)\b[^>]*\bspoiler\b[^>]*>[\s\S]*?<\/\1>/i },
]

// Text and embedded blocks in source order. A mermaid <pre> stays between the
// markdown before it and the markdown after it, instead of after the whole post.
export function splitPostFlow(html?: string | null): PostFlowSegment[] {
  const source = `${html || ''}`
  const segments: PostFlowSegment[] = []
  const counts: Record<string, number> = {}
  let from = 0
  while (from < source.length) {
    const slice = source.slice(from)
    let found: { at: number; length: number; type: PostFlowSegment['type'] } | null = null
    EMBEDS.forEach(embed => {
      const match = embed.pattern.exec(slice)
      if (!match) {
        return
      }
      if (!found || match.index < found.at || (match.index === found.at && match[0].length > found.length)) {
        found = { at: match.index, length: match[0].length, type: embed.type }
      }
    })
    if (!found) {
      const text = postHtmlToMarkdown(slice)
      if (text) {
        segments.push({ type: 'markdown', text })
      }
      break
    }
    const embed = found as { at: number; length: number; type: PostFlowSegment['type'] }
    const text = postHtmlToMarkdown(slice.slice(0, embed.at))
    if (text) {
      segments.push({ type: 'markdown', text })
    }
    const index = counts[embed.type] || 0
    counts[embed.type] = index + 1
    segments.push({ type: embed.type, index } as PostFlowSegment)
    from += embed.at + embed.length
  }
  return segments
}

export function isPostMarkdown(text?: string | null): boolean {
  const body = `${text || ''}`.trim()
  if (body.length < 3) {
    return false
  }
  return MARKDOWN_SIGNAL.test(body)
}

const SPECIAL_POST = new Set(['advertisement', 'dice', 'poll', 'event', 'discussion_request'])

export function postCanFormatMarkdown(post?: { content?: string; content_raw?: { type?: string } | null } | null): boolean {
  const type = post?.content_raw?.type
  if (type && SPECIAL_POST.has(type)) {
    return false
  }
  if (typeof post?.content !== 'string' || !post.content.trim()) {
    return false
  }
  return isPostMarkdown(postHtmlToText(post.content))
}
