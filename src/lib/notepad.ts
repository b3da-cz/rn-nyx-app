export const NOTEPAD_CREATE_URL = 'https://nyx.cz/notepad/create'

export const notepadEditUrl = (entryId: number | string) => `https://nyx.cz/notepad/${entryId}/edit`

export const isNotepadEditorUrl = (url?: string | null) =>
  url === NOTEPAD_CREATE_URL || /^https:\/\/nyx\.cz\/notepad\/\d+\/edit\/?$/.test(url || '')

export type NotepadListEntry = {
  id: number
  category_id?: number | null
  title?: string
  public?: boolean
  inserted_at?: string
  updated_at?: string
}

export type NotepadDetail = NotepadListEntry & {
  content?: string
  content_raw?: string
  sharing_token?: string
}

const asNotepadEntry = (value: any): NotepadListEntry | null => {
  if (!value || typeof value !== 'object') {
    return null
  }
  const id = value.id ?? value.entry_id ?? value.entryId
  if (id == null || id === '' || Number.isNaN(Number(id))) {
    return null
  }
  return {
    id: Number(id),
    category_id: value.category_id,
    title: value.title || value.name || '',
    public: value.public,
    inserted_at: value.inserted_at,
    updated_at: value.updated_at,
  }
}

const collectEntries = (bucket: any, into: Map<number, NotepadListEntry>) => {
  const list = Array.isArray(bucket) ? bucket : bucket && typeof bucket === 'object' ? Object.values(bucket) : []
  list.forEach(item => {
    const entry = asNotepadEntry(item)
    if (!entry || into.has(entry.id)) {
      return
    }
    into.set(entry.id, entry)
  })
}

// Swagger says { entries: [...] }. The live list has also come back empty for that key,
// so accept a bare array, a map, and category groups before giving up.
export const notepadEntries = (res?: any): NotepadListEntry[] => {
  if (!res) {
    return []
  }
  const into = new Map<number, NotepadListEntry>()
  collectEntries(Array.isArray(res) ? res : null, into)
  collectEntries(res.entries, into)
  collectEntries(res.notepad_entries, into)
  collectEntries(res.notes, into)
  collectEntries(res.items, into)
  collectEntries(res.data?.entries, into)
  collectEntries(res.notepad?.entries, into)
  collectEntries(res.result?.entries, into)
  const selected = asNotepadEntry(res.selected_entry)
  if (selected && !into.has(selected.id)) {
    into.set(selected.id, selected)
  }
  if (Array.isArray(res.categories)) {
    res.categories.forEach((category: any) => {
      collectEntries(category?.entries, into)
      collectEntries(category?.notes, into)
      collectEntries(category?.items, into)
    })
  }
  return [...into.values()]
}

const decodeHtml = (value: string) =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim()

export const NOTEPAD_LIST_URL = 'https://nyx.cz/notepad'

// Posted from the website list. The page is server HTML, and the cookie from the
// editor login is what actually shows the rows when GET /api/notepad comes back empty.
export const NOTEPAD_LIST_EXTRACT_SCRIPT = `(function () {
  var sends = 0
  function send() {
    sends += 1
    var entries = []
    var seen = {}
    var nodes = document.querySelectorAll('[data-entry-id]')
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i]
      var id = el.getAttribute('data-entry-id')
      if (!id || seen[id]) continue
      seen[id] = 1
      var link = el.querySelector('a[href*="/notepad/"]')
      var title = link ? (link.textContent || '') : ''
      if (!title) {
        var heading = el.querySelector('h1,h2,h3')
        title = heading ? (heading.textContent || '') : ''
      }
      entries.push({ id: Number(id), title: title.replace(/\\s+/g, ' ').trim() })
    }
    var guest = !!(document.body && /\\bguest\\b/.test(document.body.className || ''))
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ entries: entries, guest: guest, done: sends > 1 }))
    }
  }
  send()
  setTimeout(send, 800)
})(); true;`

// The website list is server HTML: .notepad-entry[data-entry-id] and /notepad/{id} links.
// GET /api/notepad can answer without those rows, so the list uses this page too.
export const notepadEntriesFromHtml = (html?: string | null): NotepadListEntry[] => {
  if (!html) {
    return []
  }
  const into = new Map<number, NotepadListEntry>()
  const idRe = /data-entry-id=(?:"(\d+)"|'(\d+)'|(\d+))/g
  let match: RegExpExecArray | null
  while ((match = idRe.exec(html))) {
    const id = Number(match[1] || match[2] || match[3])
    if (!id || into.has(id)) {
      continue
    }
    const slice = html.slice(match.index, match.index + 900)
    const heading = slice.match(/<h[1-3][^>]*>([^<]+)</i)?.[1]
    into.set(id, { id, title: heading ? decodeHtml(heading) : '' })
  }
  const linkRe = /href=(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([^<]*)</g
  while ((match = linkRe.exec(html))) {
    const href = match[1] || match[2] || match[3] || ''
    const idMatch = href.match(/\/notepad\/(\d+)/)
    if (!idMatch || /\/notepad\/\d+\/(?:edit|create)(?:$|[/?#])/.test(href)) {
      continue
    }
    const id = Number(idMatch[1])
    const title = decodeHtml(match[4] || '')
    const current = into.get(id) || { id, title: '' }
    if (!current.title && title) {
      current.title = title
    }
    into.set(id, current)
  }
  return [...into.values()]
}

export const notepadEntriesFromWebMessage = (raw?: string | null): NotepadListEntry[] => {
  if (!raw) {
    return []
  }
  try {
    const data = JSON.parse(raw)
    return notepadEntries(data?.entries ? { entries: data.entries } : data)
  } catch {
    return notepadEntriesFromHtml(raw)
  }
}

export const sortedNotepadEntries = (entries: NotepadListEntry[]) =>
  [...entries].sort((a, b) =>
    String(b.updated_at || b.inserted_at || '').localeCompare(String(a.updated_at || a.inserted_at || '')),
  )

// GET /api/notepad/{id} is documented as NotepadData with selected_entry.
// nyx-api types that call as a bare entry, so accept both.
export const notepadSelected = (res?: any): NotepadDetail | null => {
  const selected = res?.selected_entry
  if (selected?.id != null) {
    return selected
  }
  if (res?.id != null && (typeof res.content === 'string' || typeof res.content_raw === 'string')) {
    return res
  }
  return null
}

// The website copies a.btn.plain or a.btn.reader. Those sit next to /notepad/{id}/edit.
export const notepadPlainUrl = (entryId: number | string) => `https://nyx.cz/notepad/${entryId}`

export const notepadReaderUrl = (entryId: number | string) => `https://nyx.cz/notepad/${entryId}/reader`

export type NotepadCodeKind = 'md' | 'js' | 'json' | 'csv' | 'log'

const markdownSomewhere = (text: string) =>
  /(^|\n)\s{0,3}#{1,6}\s+\S|(^|\n)\s*```|(^|\n)\s*[-*+]\s+\S|(^|\n)\s*\d+\.\s+\S|\[[^\]]+\]\([^)]+\)|\*\*[^*\n]+\*\*/.test(
    text,
  )

// Whole note wins for json, js, csv and log. Markdown matches even a part of the text,
// including a fenced block, so the file viewer can show that part formatted.
export const notepadCodeKind = (text?: string | null): NotepadCodeKind | null => {
  const body = `${text || ''}`
  const trimmed = body.trim()
  if (!trimmed) {
    return null
  }
  if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.length > 1) {
    try {
      JSON.parse(trimmed)
      return 'json'
    } catch {
      // not a whole json document
    }
  }
  const lines = trimmed.split(/\r?\n/).filter(line => line.trim())
  const jsHints = (trimmed.match(/\b(function|const|let|class|import|export|return)\b|=>/g) || []).length
  const codeLines = lines.filter(line => /[{};]|=>|\b(function|const|let|var|class|import|export)\b/.test(line)).length
  if (jsHints >= 2 && lines.length > 0 && codeLines / lines.length >= 0.5 && /[{}]/.test(trimmed)) {
    return 'js'
  }
  const logLines = lines.filter(line =>
    /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}|^\s*(ERROR|FATAL|WARN|WARNING|INFO|DEBUG|TRACE)\b/.test(line),
  ).length
  if (lines.length >= 2 && logLines / lines.length >= 0.5) {
    return 'log'
  }
  const commas = lines.map(line => (line.match(/,/g) || []).length)
  if (lines.length >= 3 && commas[0] >= 1 && commas.every(count => count === commas[0]) && !markdownSomewhere(trimmed)) {
    return 'csv'
  }
  if (markdownSomewhere(body)) {
    return 'md'
  }
  return null
}

export const notepadBody = (entry?: { content?: string; content_raw?: string } | null) => {
  const raw = entry?.content_raw
  if (typeof raw === 'string' && raw.trim()) {
    return raw
  }
  return `${entry?.content || ''}`
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}
