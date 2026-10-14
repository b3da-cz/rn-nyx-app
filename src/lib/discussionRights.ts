export type DiscussionRightKey = 'read' | 'write' | 'delete' | 'edit' | 'edit_rights' | 'public'

export type DiscussionRightsKind = 'owner' | 'user' | 'registered' | 'public'

export type DiscussionRightsRow = {
  kind: DiscussionRightsKind
  username: string
  rights: Partial<Record<DiscussionRightKey, boolean>>
  daysLeft: number | null
  editable: boolean
}

export type RightsLogAction = {
  op: 'add' | 'remove'
  label: string
  username?: string
}

export type RightsLogEntry = {
  username: string
  actions: RightsLogAction[]
}

export type RightsLogGroup = {
  date: string
  entries: RightsLogEntry[]
}

export type DiscussionRightsPage = {
  rows: DiscussionRightsRow[]
  log: RightsLogGroup[]
  canEdit: boolean
}

// Nyx records an edit-board change as "změna práv". Show it as board management.
export function rightsLogLabel(label: string, boardLabel: string): string {
  return label.replace(/zm[eě]na pr[aá]v/gi, boardLabel)
}

// "ščřžýáíéě" and "scrzyaiee" compare equal. Each original character keeps its index.
export function foldSearch(value: string): string {
  let folded = ''
  for (const ch of value) {
    folded += ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
  }
  return folded
}

export function searchMatchRanges(text: string, query: string): Array<[number, number]> {
  const needle = foldSearch(query.trim())
  if (!needle) {
    return []
  }
  const originAt: number[] = []
  let folded = ''
  let origin = 0
  for (const ch of text) {
    const piece = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
    for (let i = 0; i < piece.length; i++) {
      originAt.push(origin)
    }
    folded += piece
    origin += ch.length
  }
  const ranges: Array<[number, number]> = []
  let from = 0
  while (from <= folded.length - needle.length) {
    const at = folded.indexOf(needle, from)
    if (at < 0) {
      break
    }
    ranges.push([originAt[at], originAt[at + needle.length] ?? text.length])
    from = at + needle.length
  }
  return ranges
}

const USER_RIGHTS: DiscussionRightKey[] = ['read', 'write', 'delete', 'edit', 'edit_rights']
const REGISTERED_RIGHTS: DiscussionRightKey[] = ['read', 'write', 'delete', 'edit']

export const RIGHTS_TABLE_COLUMNS: DiscussionRightKey[] = ['read', 'write', 'delete', 'edit', 'edit_rights']

// true = granted, false = denied, null = this column does not apply to the row.
// Anonymous "public" is the read column. Signed-in users have no user-rights column.
export function rightsTableCell(row: DiscussionRightsRow, key: DiscussionRightKey): boolean | null {
  if (row.kind === 'public') {
    return key === 'read' ? !!row.rights.public : null
  }
  if (row.kind === 'registered' && key === 'edit_rights') {
    return null
  }
  return !!row.rights[key]
}

export function rightKeysFor(row: DiscussionRightsRow): DiscussionRightKey[] {
  if (row.kind === 'public') {
    return ['public']
  }
  if (row.kind === 'registered') {
    return REGISTERED_RIGHTS
  }
  return USER_RIGHTS
}

export function isRightsManager(row: DiscussionRightsRow): boolean {
  if (row.kind === 'owner') {
    return true
  }
  return !!(row.rights.delete || row.rights.edit || row.rights.edit_rights)
}

export function rightsFromApiBody(body: any): Partial<Record<DiscussionRightKey, boolean>> | null {
  if (!body || body.error) {
    return null
  }
  if ('ar_read' in body || 'ar_write' in body || 'ar_rights' in body) {
    return {
      read: !!body.ar_read,
      write: !!body.ar_write,
      delete: !!body.ar_delete,
      edit: !!body.ar_edit,
      edit_rights: !!body.ar_rights,
    }
  }
  if ('read' in body || 'public' in body || 'write' in body) {
    const next: Partial<Record<DiscussionRightKey, boolean>> = {}
    ;(['read', 'write', 'delete', 'edit', 'public'] as DiscussionRightKey[]).forEach(key => {
      if (key in body) {
        next[key] = !!body[key]
      }
    })
    return next
  }
  return null
}

export function applyRightsResponse(row: DiscussionRightsRow, body: any): DiscussionRightsRow {
  const next = rightsFromApiBody(body)
  if (!next) {
    return row
  }
  const daysLeft = typeof body?.days_left === 'number' ? body.days_left : row.daysLeft
  return { ...row, rights: { ...row.rights, ...next }, daysLeft }
}

export function parseDiscussionRightsPage(html: string): DiscussionRightsPage {
  const rows = parseRows(sliceSection(html, 'discussion-rights'))
  const log = parseLog(sliceSection(html, 'discussion-log'))
  return {
    rows,
    log,
    canEdit: rows.some(row => row.editable),
  }
}

function parseRows(section: string): DiscussionRightsRow[] {
  if (!section) {
    return []
  }
  const body = section.split(/<tbody>/i)[1] || section
  return body
    .split(/<tr\b/i)
    .slice(1)
    .map(part => part.split(/<\/tr>/i)[0])
    .map(parseRow)
    .filter((row): row is DiscussionRightsRow => !!row)
}

function parseRow(raw: string): DiscussionRightsRow | null {
  const open = raw.match(/^([^>]*)>/)
  const attrs = open?.[1] || ''
  const inner = raw.slice(open?.[0].length || 0)
  if (/<th\b/i.test(inner)) {
    return null
  }
  const text = stripTags(inner)
  const username =
    attr(attrs, 'data-username') ||
    attr(inner, 'alt') ||
    (/href=['"]\/profile\/([^'"]+)['"]/i.exec(inner)?.[1] ?? '')
  let kind: DiscussionRightsKind = 'user'
  if (/majitel diskuze/i.test(text)) {
    kind = 'owner'
  } else if (/přihlášení uživatelé/i.test(text)) {
    kind = 'registered'
  } else if (/nepřihlášení/i.test(text)) {
    kind = 'public'
  }
  if (kind === 'user' && !username) {
    return null
  }
  const rights: Partial<Record<DiscussionRightKey, boolean>> = {}
  let daysLeft: number | null = null
  let editable = false
  const inputRe = /<input\b([^>]*)>/gi
  let match: RegExpExecArray | null
  while ((match = inputRe.exec(inner))) {
    const tag = match[1]
    const right = /data-right=["']([^"']+)["']/.exec(tag)?.[1] as DiscussionRightKey | undefined
    if (right) {
      rights[right] = /\bchecked\b/.test(tag)
      if (!/\bdisabled\b/.test(tag)) {
        editable = true
      }
      continue
    }
    if (/type=number/.test(tag) || /type=["']number["']/.test(tag)) {
      const value = /value=["']([^"']*)["']/.exec(tag)?.[1]
      daysLeft = value == null || value === '' ? null : Number(value)
    }
  }
  if (kind === 'owner') {
    USER_RIGHTS.forEach(key => {
      rights[key] = true
    })
    editable = false
  }
  return {
    kind,
    username: kind === 'user' || kind === 'owner' ? username : '',
    rights,
    daysLeft: kind === 'user' ? daysLeft : null,
    editable,
  }
}

function parseLog(section: string): RightsLogGroup[] {
  if (!section) {
    return []
  }
  const headerEnd = section.search(/<\/header>/i)
  const body = headerEnd >= 0 ? section.slice(headerEnd + '</header>'.length) : section
  const groups = /<tr\b/i.test(body) ? parseLogTable(body) : parseLogBlocks(body)
  fillMissingDates(body, groups)
  return groups.filter(group => group.date || group.entries.length > 0)
}

// The visible date can sit in markup the row walk does not treat as its own row.
// If the entries parsed and the date did not, take it from the log text.
function fillMissingDates(body: string, groups: RightsLogGroup[]) {
  if (groups.length === 0 || groups.every(group => group.date)) {
    return
  }
  const dates: string[] = []
  const re = /(\d{1,2}\s*\.\s*\d{1,2}\s*\.\s*\d{4}(?:\s+\d{1,2}(?:\s*:\s*\d{2}){1,2})?)/g
  const text = stripTags(body)
  let match: RegExpExecArray | null
  while ((match = re.exec(text))) {
    const date = formatLogDateText(match[1], true)
    if (date && !dates.includes(date)) {
      dates.push(date)
    }
  }
  if (dates.length === 0) {
    return
  }
  if (dates.length === 1) {
    groups.forEach(group => {
      if (!group.date) {
        group.date = dates[0]
      }
    })
    return
  }
  let index = 0
  groups.forEach(group => {
    if (!group.date && index < dates.length) {
      group.date = dates[index]
      index += 1
    }
  })
}

// The website log is a table: a date row, then "provedl" | "akce".
// The actor sits in the first cell. Action cells hold the icons and, for a
// user-specific change, that user's name. Several icons can share one span.
function parseLogTable(body: string): RightsLogGroup[] {
  const groups: RightsLogGroup[] = []
  let current: RightsLogGroup | null = null
  let carriedActor = ''
  const [preamble, ...rowParts] = body.split(/<tr\b/i)
  let carriedDate = embeddedLogDate(preamble || '') || logDateFrom(preamble || '')
  rowParts
    .map(part => part.split(/<\/tr>/i)[0])
    .forEach(raw => {
      const open = raw.match(/^([^>]*)>/)
      const attrs = open?.[1] || ''
      const inner = raw.slice(open?.[0].length || 0)
      if (/<th\b/i.test(inner)) {
        const headerDate = logDateFrom(`${attrs} ${inner}`) || embeddedLogDate(inner) || formatLogDateText(stripTags(inner))
        if (!headerDate) {
          return
        }
        carriedDate = headerDate
        current = { date: headerDate, entries: [] }
        groups.push(current)
        carriedActor = ''
        return
      }
      const date = logDateFrom(`${attrs} ${inner}`)
      if (date) {
        carriedDate = date
        current = { date, entries: [] }
        groups.push(current)
        carriedActor = ''
        return
      }
      const cells = inner
        .split(/<td\b/i)
        .slice(1)
        .map(part => part.replace(/^[^>]*>/i, '').split(/<\/td>/i)[0])
      const cellActor = usernamesIn(cells[0] || '')[0] || ''
      const actor = cellActor || carriedActor
      if (cellActor) {
        carriedActor = cellActor
      }
      const rowDate = embeddedLogDate(inner) || actorCellDate(cells[0] || '', actor)
      if (rowDate) {
        carriedDate = rowDate
      }
      const actionHtml = cells.length > 1 ? cells.slice(1).join('') : inner
      const actions = extractLogActions(actionHtml, actor)
      if (!actor && actions.length === 0) {
        return
      }
      if (!current || (rowDate && current.date && current.date !== rowDate && current.entries.length > 0)) {
        current = { date: carriedDate, entries: [] }
        groups.push(current)
      } else if (carriedDate && !current.date) {
        current.date = carriedDate
      }
      const last = current.entries[current.entries.length - 1]
      if (last && last.username === actor) {
        last.actions.push(...actions)
        return
      }
      current.entries.push({ username: actor, actions })
    })
  return groups
}

function parseLogBlocks(body: string): RightsLogGroup[] {
  const groups: RightsLogGroup[] = []
  let current: RightsLogGroup | null = null
  extractClassed(body, ['dp', 'ar-change']).forEach(block => {
    if (block.name === 'dp') {
      current = { date: logDateFrom(block.inner) || stripTags(block.inner), entries: [] }
      groups.push(current)
      return
    }
    if (!current) {
      current = { date: '', entries: [] }
      groups.push(current)
    }
    const entry = parseLogBlock(block.inner)
    if (entry.username || entry.actions.length > 0) {
      current.entries.push(entry)
    }
  })
  return groups
}

function parseLogBlock(inner: string): RightsLogEntry {
  const icons = actionMarks(inner)
  const before = icons.length ? inner.slice(0, icons[0].index) : inner
  const actor = usernamesIn(before)[0] || ''
  return { username: actor, actions: extractLogActions(inner, actor) }
}

function extractLogActions(html: string, actor: string): RightsLogAction[] {
  const marks = actionMarks(html)
  if (marks.length === 0) {
    return []
  }
  let subject: string | undefined
  const before = html.slice(0, marks[0].index)
  const leading = usernamesIn(before).find(name => name !== actor)
  if (leading) {
    subject = leading
  }
  const actions: RightsLogAction[] = []
  marks.forEach((mark, index) => {
    const start = mark.index + mark.tag.length
    const end = marks[index + 1]?.index ?? html.length
    const chunk = html.slice(start, end)
    const label = actionLabel(chunk)
    if (label) {
      actions.push({ op: mark.op, label, username: subject })
    }
    const next = usernamesIn(chunk).find(name => name !== actor)
    if (next) {
      subject = next
    }
  })
  return actions
}

// An empty icon span has the label after it. A removed/added element can also
// carry the label in its own text, with no separate empty icon.
function actionMarks(html: string): { index: number; tag: string; op: 'add' | 'remove' }[] {
  const re = /<([a-zA-Z0-9]+)\b([^>]*)>/g
  const marks: { index: number; tag: string; op: 'add' | 'remove' }[] = []
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const op = actionOp(classTokens(match[2] || ''))
    if (!op) {
      continue
    }
    marks.push({ index: match.index, tag: match[0], op })
  }
  return marks
}

function actionOp(tokens: string[]): 'add' | 'remove' | null {
  const icon = tokens.find(token => /^icon-(?:minus|plus|circle-with-minus|circle-with-plus)$/.test(token))
  if (icon) {
    return /minus/.test(icon) ? 'remove' : 'add'
  }
  if (tokens.includes('removed')) {
    return 'remove'
  }
  if (tokens.includes('added')) {
    return 'add'
  }
  return null
}

function actionLabel(html: string): string {
  return stripTags(html.replace(/<img\b[^>]*>/gi, ' ').replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, ' '))
}

function usernamesIn(html: string): string[] {
  const names: string[] = []
  const push = (raw?: string) => {
    if (!raw) {
      return
    }
    let name = raw.trim()
    try {
      name = decodeURIComponent(name)
    } catch {
      // keep the raw profile slug
    }
    if (name && !names.includes(name)) {
      names.push(name)
    }
  }
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    push(attr(match[0], 'alt') || /(?:^|\s)alt=([^\s>"']+)/i.exec(match[0])?.[1])
  }
  for (const match of html.matchAll(/href=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)) {
    const href = match[1] || match[2] || match[3] || ''
    push(/\/profile\/([^/?#]+)/i.exec(href)?.[1])
  }
  return names
}

// A row is a date only when its text is the date itself. Action rows can mention
// days ("∞ dní") and must not steal the group header.
function logDateFrom(html: string): string {
  if (/icon-minus|icon-plus|ar-change|\bremoved\b|\badded\b/i.test(html)) {
    return ''
  }
  return formatLogDateText(stripTags(html)) || dateFromDatetime(html, stripTags(html).length > 40)
}

// The date often sits in `.dp` or on the actor, beside the name, inside the same
// row as the actions. Those rows also contain removed/added markup.
function embeddedLogDate(html: string): string {
  const dp = /<([a-zA-Z0-9]+)\b[^>]*\bclass=(?:"[^"]*\bdp\b[^"]*"|'[^']*\bdp\b[^']*'|[^\s>]*\bdp\b)[^>]*>([\s\S]*?)<\/\1>/i.exec(html)
  if (dp) {
    const fromText = formatLogDateText(stripTags(dp[2]), true)
    if (fromText) {
      return fromText
    }
  }
  const time = /<time\b([^>]*)>([\s\S]*?)<\/time>/i.exec(html)
  if (!time) {
    return ''
  }
  return formatLogDateText(stripTags(time[2]), true) || dateFromDatetime(time[1] || '', false)
}

function actorCellDate(cell: string, actor: string): string {
  const marked = embeddedLogDate(cell)
  if (marked) {
    return marked
  }
  let text = stripTags(cell)
  if (actor) {
    text = text.replace(actor, ' ')
  }
  return formatLogDateText(text)
}

function formatLogDateText(text: string, allowExtra = false): string {
  // Tags around each number become spaces, so the page text is "9 . 6 . 2021" or "07 : 28".
  const shown = /(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4})(?:\s+(\d{1,2}(?:\s*:\s*\d{2}){1,2}))?/.exec(text)
  if (!shown) {
    return ''
  }
  const rest = text.replace(shown[0], '').replace(/\s+/g, ' ').trim()
  if (!allowExtra && rest !== '') {
    return ''
  }
  if (allowExtra && rest.length > 24) {
    return ''
  }
  const date = `${Number(shown[1])}.${Number(shown[2])}.${shown[3]}`
  const time = shown[4] ? shown[4].replace(/\s+/g, '') : ''
  return time ? `${date} ${time}` : date
}

function dateFromDatetime(html: string, tooLong: boolean): string {
  const stamp = /datetime=["'](\d{4})-(\d{2})-(\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)?/i.exec(html)
  if (!stamp || tooLong) {
    return ''
  }
  return `${Number(stamp[3])}.${Number(stamp[2])}.${stamp[1]}${stamp[4] ? ` ${stamp[4]}` : ''}`
}

function sliceSection(html: string, id: string): string {
  const at = html.indexOf(`id=${id}`)
  const quoted = at < 0 ? html.indexOf(`id="${id}"`) : at
  const start = at >= 0 ? at : quoted
  if (start < 0) {
    return ''
  }
  const sectionStart = html.lastIndexOf('<section', start)
  const from = sectionStart >= 0 && start - sectionStart < 200 ? sectionStart : start
  const end = html.indexOf('</section>', from)
  return end < 0 ? html.slice(from) : html.slice(from, end)
}

function attr(source: string, name: string): string {
  const match = new RegExp(`${name}=["']([^"']+)["']`, 'i').exec(source)
  return match?.[1] || ''
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractClassed(html: string, names: string[]): { name: string; inner: string }[] {
  const out: { name: string; inner: string }[] = []
  const re = /<([a-zA-Z0-9]+)(\s[^>]*?)?>/g
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    const tokens = classTokens(match[2] || '')
    const name = names.find(item => tokens.includes(item))
    if (!name) {
      continue
    }
    const from = match.index + match[0].length
    const close = findClose(html, match[1], from)
    out.push({ name, inner: html.slice(from, close) })
    re.lastIndex = close
  }
  return out
}

function classTokens(attrs: string): string[] {
  const match = /class=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/.exec(attrs)
  return (match?.[1] || match?.[2] || match?.[3] || '').split(/\s+/).filter(Boolean)
}

function findClose(html: string, tag: string, from: number): number {
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi')
  re.lastIndex = from
  let depth = 1
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    depth += match[1] ? -1 : 1
    if (depth === 0) {
      return match.index
    }
  }
  return html.length
}
