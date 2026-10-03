import type { EventAttendee, EventListItem } from 'nyx-api'

export type EventOrder = 'popularity' | 'proximity' | 'freshness'
export type EventEpoch = 'future' | 'past' | 'all'
export type EventAttendance = 'any' | 'me' | 'friends'
export type MyAttendance = 'going' | 'interested' | 'none'

export function normalizeMyAttendance(value?: string | null): MyAttendance {
  if (value === 'going' || value === 'interested') {
    return value
  }
  return 'none'
}

export type EventListFilters = {
  search: string
  order: EventOrder
  epoch: EventEpoch | string
  attendance: EventAttendance
  category?: number
  area?: number
  month: number
  year: number
}

const WEEKDAYS = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']
export const EVENT_MONTHS = [
  'Leden',
  'Únor',
  'Březen',
  'Duben',
  'Květen',
  'Červen',
  'Červenec',
  'Srpen',
  'Září',
  'Říjen',
  'Listopad',
  'Prosinec',
]
export const EVENT_WEEKDAY_LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export function defaultEventFilters(now = new Date()): EventListFilters {
  return {
    search: '',
    order: 'proximity',
    epoch: 'future',
    attendance: 'any',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }
}

export function isEventFilterActive(filters: EventListFilters, now = new Date()) {
  const defaults = defaultEventFilters(now)
  return (
    filters.search.trim().length > 0 ||
    filters.order !== defaults.order ||
    filters.epoch !== defaults.epoch ||
    filters.attendance !== defaults.attendance ||
    filters.category !== undefined ||
    filters.area !== undefined
  )
}

export function toEventsQuery(filters: EventListFilters) {
  const search = filters.search.trim()
  return {
    area: filters.area,
    category: filters.category,
    month: filters.month,
    year: filters.year,
    order: filters.order,
    epoch: filters.epoch,
    search: search.length > 0 ? search : undefined,
  }
}

export function parseNyxDate(value: string) {
  const [date, time = '00:00:00'] = value.split('T')
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0, 0)
}

export function isoDate(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function pad(value: number) {
  return `${value}`.padStart(2, '0')
}

function formatClock(date: Date) {
  return `${date.getHours()}:${pad(date.getMinutes())}`
}

function formatDay(date: Date) {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function formatEventDuration(startValue: string, endValue: string, now = new Date()) {
  const start = parseNyxDate(startValue)
  const end = parseNyxDate(endValue)
  const today = startOfDay(now)
  const startDay = startOfDay(start)
  const daysUntil = Math.round((startDay.getTime() - today.getTime()) / 86400000)
  const weekday = WEEKDAYS[start.getDay()]

  if (sameDay(start, end)) {
    if (daysUntil >= 0 && daysUntil < 7) {
      return `${weekday} @ ${formatClock(start)} - ${formatClock(end)}`
    }
    return `${weekday} ${formatDay(start)} @ ${formatClock(start)} - ${formatClock(end)}`
  }

  if (startDay < today && sameDay(end, now)) {
    return `${start.getDate()}.${start.getMonth() + 1}.${start.getFullYear()} @ ${formatClock(start)} - dnes @ ${formatClock(end)}`
  }

  const endLabel = sameDay(end, now)
    ? `dnes @ ${formatClock(end)}`
    : `${WEEKDAYS[end.getDay()]} ${formatDay(end)} @ ${formatClock(end)}`
  return `${weekday} ${formatDay(start)} @ ${formatClock(start)} - ${endLabel}`
}

export function eventMetaParts(event: EventListItem, now = new Date()) {
  const duration = formatEventDuration(event.duration?.start, event.duration?.end, now)
  const area = (event.area_gettext_name || '').replace(' - ', ' – ')
  const location = event.location?.trim()
  const place = location ? `${area} | ${location}` : area
  const category = event.category_path || ''
  return {
    schedule: [category, duration].filter(part => part.length > 0).join(' | '),
    place,
  }
}

export function formatEventMeta(event: EventListItem, now = new Date()) {
  const { schedule, place } = eventMetaParts(event, now)
  return [schedule, place].filter(part => part.length > 0).join(' | ')
}

export function filterEventsByAttendance(events: EventListItem[], attendance: EventAttendance) {
  if (attendance === 'me') {
    return events.filter(event => event.my_attendance === 'going' || event.my_attendance === 'interested')
  }
  if (attendance === 'friends') {
    return events.filter(event => (event.friends?.length || 0) > 0)
  }
  return events
}

export type CalendarCell = {
  date: Date
  iso: string
  inMonth: boolean
}

export function monthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1)
  const leading = (first.getDay() + 6) % 7
  const start = new Date(year, month - 1, 1 - leading)
  const cells: CalendarCell[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    cells.push({
      date,
      iso: isoDate(date),
      inMonth: date.getMonth() === month - 1,
    })
  }
  while (cells.length > 28 && cells.slice(-7).every(cell => !cell.inMonth)) {
    cells.splice(-7, 7)
  }
  return cells
}

export function eventThumbUrl(thumbnailId?: string | null) {
  if (!thumbnailId) {
    return null
  }
  if (thumbnailId.startsWith('http')) {
    return thumbnailId
  }
  return `https://nyx.cz${thumbnailId.startsWith('/') ? '' : '/'}${thumbnailId}`
}

export function eventBodyHtml(event: { description?: string | null; summary?: string | null }) {
  const description = (event.description || '').trim()
  if (description) {
    return description.replace(/<\/(div|p|li|h[1-6]|tr)>/gi, '</$1><br>').replace(/<li\b[^>]*>/gi, match => `${match}• `)
  }
  const summary = (event.summary || '').replace(/\r\n/g, '\n').trim()
  if (!summary) {
    return ''
  }
  const escaped = summary.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const linked = escaped.replace(/https?:\/\/[^\s<]+/g, url => {
    const clean = url.replace(/[),.;]+$/, '')
    const tail = url.slice(clean.length)
    return `<a href="${clean}">${clean}</a>${tail}`
  })
  return linked.replace(/\n/g, '<br>')
}

export function discussionTarget(url?: string | null) {
  if (!url) {
    return null
  }
  const match = url.match(/^(?:https?:\/\/(?:www\.)?nyx\.cz)?\/discussion\/(\d+)(?:\/id\/(\d+))?/)
  if (!match) {
    return null
  }
  return { discussionId: match[1], postId: match[2] }
}

export type EventFriendInput =
  | string
  | {
      username?: string | null
      attendance_type?: string | null
      attendance?: string | null
    }
  | null

export type EventFriendMark = {
  username: string
  attendance: 'going' | 'interested'
}

// List payloads are usernames inside the "going" sentence. Detail rows carry attendance_type.
export function eventFriends(friends?: EventFriendInput[] | null): EventFriendMark[] {
  return (friends || []).flatMap(friend => {
    if (!friend) {
      return []
    }
    if (typeof friend === 'string') {
      return friend ? [{ username: friend, attendance: 'going' as const }] : []
    }
    const username = friend.username || ''
    if (!username) {
      return []
    }
    const raw = friend.attendance_type || friend.attendance
    if (raw === 'none') {
      return []
    }
    return [{ username, attendance: raw === 'interested' ? 'interested' : 'going' }]
  })
}

export function eventFriendNames(friends?: EventFriendInput[] | null) {
  return eventFriends(friends).map(friend => friend.username)
}

export function otherAttendeesNoun(count: number) {
  if (count === 1) {
    return 'dalšího'
  }
  if (count < 5) {
    return 'další'
  }
  return 'dalších'
}

export function friendAttendees(attendees: EventAttendee[] = []) {
  const rank = { going: 0, interested: 1, none: 2 }
  return attendees
    .filter(attendee => attendee.is_friend && attendee.attendance_type !== 'none')
    .slice()
    .sort((a, b) => rank[a.attendance_type] - rank[b.attendance_type])
}

export type EventDetailImage = { src: string; url: string }

export type EventDetailData = {
  name?: string
  owner?: string
  areaName?: string
  location?: string
  start?: string
  end?: string
  parsed: any | null
  images: EventDetailImage[]
  going: number
  interested: number
  myAttendance: MyAttendance
  attendees: EventAttendee[]
}

export function applyMyAttendance(detail: EventDetailData, username: string, next: MyAttendance): EventDetailData {
  const prev = detail.myAttendance || 'none'
  if (prev === next) {
    return detail
  }
  let going = detail.going
  let interested = detail.interested
  if (prev === 'going') {
    going -= 1
  }
  if (prev === 'interested') {
    interested -= 1
  }
  if (next === 'going') {
    going += 1
  }
  if (next === 'interested') {
    interested += 1
  }
  let attendees = detail.attendees
  if (username) {
    const index = attendees.findIndex(attendee => attendee.username === username)
    if (next === 'none') {
      attendees = attendees.filter(attendee => attendee.username !== username)
    } else if (index >= 0) {
      attendees = attendees.slice()
      attendees[index] = { ...attendees[index], attendance_type: next }
    } else {
      attendees = [
        ...attendees,
        {
          discussion_id: attendees[0]?.discussion_id || 0,
          username,
          attendance_type: next,
          is_friend: false,
        },
      ]
    }
  }
  return {
    ...detail,
    myAttendance: next,
    going: Math.max(0, going),
    interested: Math.max(0, interested),
    attendees,
  }
}

export function eventDetailImages(
  inlineSrcs: string[] = [],
  attachments: { url?: string | null }[] = [],
  photoIds?: string[] | null,
  thumbnailId?: string | null,
) {
  const images: EventDetailImage[] = []
  const seen = new Set<string>()
  const add = (value?: string | null) => {
    const url = eventThumbUrl(value)
    if (!url || seen.has(url)) {
      return
    }
    seen.add(url)
    images.push({ src: url, url })
  }
  inlineSrcs.forEach(add)
  attachments.forEach(file => add(file.url))
  ;(photoIds || []).forEach(add)
  if (images.length === 0) {
    add(thumbnailId)
  }
  const inline = new Set(inlineSrcs.map(src => eventThumbUrl(src)).filter((src): src is string => !!src))
  return {
    images,
    extras: images.filter(image => !inline.has(image.src)),
  }
}

export const EVENT_CREATE_URL = 'https://nyx.cz/event/create'

// The site only stores a lasting login cookie when this box is checked.
export const NYX_KEEP_LOGGED_SCRIPT = `(function () {
  var box = document.getElementById('keep_logged')
  if (box) {
    box.checked = true
  }
})();
true;`

const NYX_BROWSER_PROTOCOLS = new Set(['http:', 'https:', 'about:', 'blob:'])

export function isNyxBrowserUrl(url: string) {
  try {
    return NYX_BROWSER_PROTOCOLS.has(new URL(url).protocol)
  } catch {
    return false
  }
}

export function attendancePhrase(count: number, endValue: string, now = new Date()) {
  if (count <= 0) {
    return null
  }
  const past = parseNyxDate(endValue).getTime() < now.getTime()
  if (count === 1) {
    return {
      lead: past ? 'Na událost se chystal' : 'Na událost se chystá',
      noun: 'člověk',
    }
  }
  if (count < 5) {
    return {
      lead: past ? 'Na událost se chystali' : 'Na událost se chystají',
      noun: 'lidé',
    }
  }
  return {
    lead: past ? 'Na událost se chystalo' : 'Na událost se chystá',
    noun: 'lidí',
  }
}
