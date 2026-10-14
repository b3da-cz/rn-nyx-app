export const TEXT_FILE_EXTENSIONS = ['md', 'js', 'json', 'txt', 'log', 'csv'] as const

export type TextFileExt = (typeof TEXT_FILE_EXTENSIONS)[number]

export type SourceLang = 'js' | 'json' | 'csv' | 'log' | 'text'

export type SourceToken = 'plain' | 'keyword' | 'string' | 'number' | 'comment' | 'key' | 'punct' | 'level'

export type SourceSpan = { text: string; kind: SourceToken }

// A text view of a multi-megabyte file is not usable. Above this, only download.
export const TEXT_FILE_MAX_BYTES = 1_500_000

const JS_KEYWORDS = new Set([
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'default',
  'else',
  'export',
  'false',
  'for',
  'from',
  'function',
  'if',
  'import',
  'in',
  'let',
  'new',
  'null',
  'of',
  'return',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'undefined',
  'var',
  'while',
])

export function textFileExtOf(value: string): TextFileExt | null {
  const clean = `${value || ''}`.trim().split(/[?#]/)[0]
  const base = decodeURIComponent(clean.split('/').pop() || clean)
  const match = base.match(/\.([a-z0-9]{1,8})$/i)
  const ext = match?.[1]?.toLowerCase()
  return ext && (TEXT_FILE_EXTENSIONS as readonly string[]).includes(ext) ? (ext as TextFileExt) : null
}

export function textFileKind(url: string, label?: string): TextFileExt | null {
  return textFileExtOf(url) || textFileExtOf(label || '')
}

export function sourceLangFor(ext: TextFileExt, parsed: boolean): SourceLang {
  if (!parsed || ext === 'md' || ext === 'txt') {
    return 'text'
  }
  if (ext === 'js') {
    return 'js'
  }
  if (ext === 'json') {
    return 'json'
  }
  if (ext === 'csv') {
    return 'csv'
  }
  return 'log'
}

export function mimeForTextFile(ext: TextFileExt): string {
  if (ext === 'md') return 'text/markdown'
  if (ext === 'js') return 'text/javascript'
  if (ext === 'json') return 'application/json'
  if (ext === 'csv') return 'text/csv'
  return 'text/plain'
}

export function fileNameFromUrl(url: string, label?: string): string {
  const fromLabel = textFileExtOf(label || '') ? `${label}`.trim().split(/[?#]/)[0].split('/').pop() : ''
  if (fromLabel) {
    return decodeURIComponent(fromLabel)
  }
  const fromUrl = decodeURIComponent(`${url}`.split(/[?#]/)[0].split('/').pop() || '')
  return fromUrl || 'file.txt'
}

export function isNyxFileHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host === 'nyx.cz' || host.endsWith('.nyx.cz')
  } catch {
    return false
  }
}

export function splitByRanges(text: string, ranges: Array<[number, number]>): Array<{ text: string; hit: boolean }> {
  if (!ranges.length || !text) {
    return text ? [{ text, hit: false }] : []
  }
  const parts: Array<{ text: string; hit: boolean }> = []
  let from = 0
  ranges.forEach(([start, end]) => {
    const at = Math.max(start, from)
    const to = Math.min(end, text.length)
    if (to <= at) {
      return
    }
    if (at > from) {
      parts.push({ text: text.slice(from, at), hit: false })
    }
    parts.push({ text: text.slice(at, to), hit: true })
    from = to
  })
  if (from < text.length) {
    parts.push({ text: text.slice(from), hit: false })
  }
  return parts
}

function pushSpan(spans: SourceSpan[], text: string, kind: SourceToken) {
  if (!text) {
    return
  }
  const prev = spans[spans.length - 1]
  if (prev && prev.kind === kind) {
    prev.text += text
    return
  }
  spans.push({ text, kind })
}

function scanJs(line: string): SourceSpan[] {
  const spans: SourceSpan[] = []
  const re =
    /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|('(?:\\.|[^'])*'|"(?:\\.|[^"])*"|`(?:\\.|[^`])*`)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_$][\w$]*\b)|(.)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(line))) {
    const [all, comment, block, str, num, word, other] = match
    if (comment || block) {
      pushSpan(spans, all, 'comment')
    } else if (str) {
      pushSpan(spans, all, 'string')
    } else if (num) {
      pushSpan(spans, all, 'number')
    } else if (word) {
      pushSpan(spans, all, JS_KEYWORDS.has(word) ? 'keyword' : 'plain')
    } else {
      pushSpan(spans, other || all, 'plain')
    }
  }
  return spans.length ? spans : [{ text: line, kind: 'plain' }]
}

function scanJson(line: string): SourceSpan[] {
  const spans: SourceSpan[] = []
  const re = /("(?:\\.|[^"])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}\[\],:])|(\s+)|(.)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(line))) {
    const [all, str, colon, num, word, punct, space, other] = match
    if (str) {
      pushSpan(spans, str, colon ? 'key' : 'string')
      if (colon) {
        pushSpan(spans, colon, 'punct')
      }
    } else if (num) {
      pushSpan(spans, num, 'number')
    } else if (word) {
      pushSpan(spans, word, 'keyword')
    } else if (punct) {
      pushSpan(spans, punct, 'punct')
    } else {
      pushSpan(spans, space || other || all, 'plain')
    }
  }
  return spans.length ? spans : [{ text: line, kind: 'plain' }]
}

function scanCsv(line: string): SourceSpan[] {
  const spans: SourceSpan[] = []
  let field = ''
  let quoted = false
  const flush = (kind: SourceToken) => {
    pushSpan(spans, field, kind)
    field = ''
  }
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      field += ch
      if (ch === '"' && line[i + 1] === '"') {
        field += line[i + 1]
        i++
      } else if (ch === '"') {
        flush('string')
        quoted = false
      }
      continue
    }
    if (ch === '"') {
      flush('plain')
      field = ch
      quoted = true
      continue
    }
    if (ch === ',') {
      flush('plain')
      pushSpan(spans, ch, 'punct')
      continue
    }
    field += ch
  }
  flush(quoted ? 'string' : 'plain')
  return spans.length ? spans : [{ text: line, kind: 'plain' }]
}

function scanLog(line: string): SourceSpan[] {
  const spans: SourceSpan[] = []
  const re = /(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?)|\b(ERROR|FATAL|WARN|WARNING|INFO|DEBUG|TRACE)\b|(\s+)|(\S+)|(.)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(line))) {
    const [all, time, level, space, word] = match
    if (time) {
      pushSpan(spans, time, 'number')
    } else if (level) {
      pushSpan(spans, level, 'level')
    } else {
      pushSpan(spans, space || word || all, 'plain')
    }
  }
  return spans.length ? spans : [{ text: line, kind: 'plain' }]
}

export function highlightSourceLine(line: string, lang: SourceLang): SourceSpan[] {
  if (!line) {
    return []
  }
  if (lang === 'js') return scanJs(line)
  if (lang === 'json') return scanJson(line)
  if (lang === 'csv') return scanCsv(line)
  if (lang === 'log') return scanLog(line)
  return [{ text: line, kind: 'plain' }]
}
