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

export type NotepadSection = {
  id: number
  title: string
  uncategorized: boolean
  entries: NotepadListEntry[]
}

export const NOTEPAD_UNCATEGORIZED_ID = -1

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
    public: notepadIsPublic(value.public),
    inserted_at: value.inserted_at,
    updated_at: value.updated_at,
  }
}

// API sends a boolean. HTML and the cookie list use a lock icon or a public class.
export const notepadIsPublic = (value: unknown): boolean | undefined => {
  if (value === true || value === 1 || value === '1' || value === 'true') {
    return true
  }
  if (value === false || value === 0 || value === '0' || value === 'false') {
    return false
  }
  return undefined
}

const notepadVisibility = (slice: string): boolean | undefined => {
  if (/icon-lock|data-public=(?:"0"|'0'|0\b)|class=(?:"[^"]*\bprivate\b[^"]*"|'[^']*\bprivate\b[^']*'|\bprivate\b)/i.test(slice)) {
    return false
  }
  if (
    /data-public=(?:"1"|'1'|1\b|true)|class=(?:"[^"]*\bpublic\b[^"]*"|'[^']*\bpublic\b[^']*'|\bpublic\b)|data-value=(?:"(?:plain|reader)"|'(?:plain|reader)'|(?:plain|reader)\b)/i.test(
      slice,
    )
  ) {
    return true
  }
  return undefined
}

const categoryLabel = (category: any) =>
  `${category?.category_name || category?.name || category?.title || ''}`.trim()

const categoryId = (category: any): number | null => {
  const raw = category?.id ?? category?.category_id
  if (raw == null || raw === '' || Number.isNaN(Number(raw))) {
    return null
  }
  return Number(raw)
}

// The site uses category id -1 and the name "nezařazené poznámky" for notes without a category.
export const notepadIsUncategorized = (id?: number | null, name?: string) =>
  id == null || id < 0 || /neza[rř]azen/i.test(name || '')

// Swagger says { entries: [...] }. The live list is
// entries: [{ category: { id, category_name }, entries: [NotepadEntryMinimal] }].
// Named categories stay in payload order. The uncategorized section is last.
export const notepadSections = (res?: any): NotepadSection[] => {
  const order: NotepadSection[] = []
  const byKey = new Map<number, NotepadSection>()

  const bucket = (id: number | null, name: string) => {
    const uncategorized = notepadIsUncategorized(id, name)
    const key = uncategorized ? NOTEPAD_UNCATEGORIZED_ID : (id as number)
    let section = byKey.get(key)
    if (!section) {
      section = { id: key, title: name, uncategorized, entries: [] }
      byKey.set(key, section)
      order.push(section)
    } else if (name && !section.title) {
      section.title = name
    }
    return section
  }

  const addEntry = (entry: NotepadListEntry, section: NotepadSection) => {
    if (section.entries.some(item => item.id === entry.id)) {
      return
    }
    section.entries.push(
      entry.category_id == null && !section.uncategorized ? { ...entry, category_id: section.id } : entry,
    )
  }

  const visit = (item: any) => {
    if (!item || typeof item !== 'object') {
      return
    }
    const nested = [item.entries, item.notes, item.items].find(Array.isArray) as any[] | undefined
    if (nested && (item.category || item.category_name || (item.name && !item.title))) {
      const source = item.category || item
      const section = bucket(categoryId(source), categoryLabel(source) || categoryLabel(item))
      nested.forEach(child => {
        const entry = asNotepadEntry(child)
        if (entry) {
          addEntry(entry, section)
        }
      })
      return
    }
    const entry = asNotepadEntry(item)
    if (entry) {
      addEntry(entry, bucket(entry.category_id ?? null, ''))
      return
    }
    nested?.forEach(visit)
  }

  const walk = (value: any) => {
    const list = Array.isArray(value) ? value : value && typeof value === 'object' ? Object.values(value) : []
    list.forEach(visit)
  }

  if (res) {
    if (Array.isArray(res)) {
      walk(res)
    } else {
      walk(res.entries)
      walk(res.notepad_entries)
      walk(res.notes)
      walk(res.items)
      walk(res.data?.entries)
      walk(res.notepad?.entries)
      walk(res.result?.entries)
      walk(res.categories)
      const selected = asNotepadEntry(res.selected_entry)
      if (selected && !order.some(section => section.entries.some(entry => entry.id === selected.id))) {
        addEntry(selected, bucket(selected.category_id ?? null, ''))
      }
    }
  }

  const named = order.filter(section => !section.uncategorized)
  const uncategorized = order
    .filter(section => section.uncategorized)
    .reduce<NotepadSection | null>((acc, section) => {
      if (!acc) {
        return { ...section, id: NOTEPAD_UNCATEGORIZED_ID, entries: [...section.entries] }
      }
      section.entries.forEach(entry => addEntry(entry, acc))
      if (!acc.title && section.title) {
        acc.title = section.title
      }
      return acc
    }, null)
  const sections = [...named, ...(uncategorized?.entries.length ? [uncategorized] : [])]
  return sections.map(section => ({ ...section, entries: sortedNotepadEntries(section.entries) }))
}

export const notepadEntries = (res?: any): NotepadListEntry[] => notepadSections(res).flatMap(section => section.entries)

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
      var cls = ' ' + (el.className || '') + ' '
      var pub = el.getAttribute('data-public')
      var locked = !!el.querySelector('.icon-lock')
      var isPrivate = locked || pub === '0' || pub === 'false' || /(^|\\s)private(\\s|$)/.test(cls)
      var isPublic = pub === '1' || pub === 'true' || /(^|\\s)public(\\s|$)/.test(cls)
      var row = { id: Number(id), title: title.replace(/\\s+/g, ' ').trim() }
      if (isPrivate) row.public = false
      else if (isPublic) row.public = true
      entries.push(row)
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
    const tagStart = html.lastIndexOf('<', match.index)
    const nextEntry = html.slice(match.index + 12).search(/data-entry-id=/)
    const sliceEnd = nextEntry >= 0 ? match.index + 12 + nextEntry : match.index + 900
    const slice = html.slice(tagStart >= 0 ? tagStart : match.index, sliceEnd)
    const heading = slice.match(/<h[1-3][^>]*>([^<]+)</i)?.[1]
    into.set(id, { id, title: heading ? decodeHtml(heading) : '', public: notepadVisibility(slice) })
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
    const tagStart = html.lastIndexOf('<', match.index)
    const windowSlice = html.slice(tagStart >= 0 ? tagStart : match.index, match.index + 240)
    const current = into.get(id) || { id, title: '', public: notepadVisibility(windowSlice) }
    if (!current.title && title) {
      current.title = title
    }
    if (current.public == null) {
      current.public = notepadVisibility(windowSlice)
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
