import type { EventListItem } from 'nyx-api'
import { EVENT_WEEKDAY_LABELS, isoDate, parseNyxDate } from './events'

// First generated window: yesterday on top, then today and five days ahead. Past is up, future is down.
// How many of those day rows fit on the screen is eventTimelineVisibleDays (default 5).
export const TIMELINE_VISIBLE_DAYS_DEFAULT = 5
export const TIMELINE_VISIBLE_DAYS_MIN = 1
export const TIMELINE_VISIBLE_DAYS_MAX = 10
export const TIMELINE_FUTURE_DAYS = 5
export const TIMELINE_PAST_DAYS = 1
export const TIMELINE_CHUNK_DAYS = 21
export const TIMELINE_DATE_WIDTH = 64
export const TIMELINE_ICON_WIDTH = 16
export const TIMELINE_ICON_HEIGHT = 20
export const TIMELINE_ICON_GAP = 2
export const TIMELINE_NOW_LINE = 3
export const TIMELINE_MAJOR_TICK_HOURS = 6
export const TIMELINE_MAJOR_TICK_WIDTH = 50
export const TIMELINE_MAJOR_TICK_HEIGHT = 2
export const TIMELINE_MINOR_TICK_WIDTH = 40
export const TIMELINE_MINOR_TICK_HEIGHT = 1
export const TIMELINE_MINOR_TICK_DAYS = 3
export const TIMELINE_TICK_LABEL_DAYS = 5
export const TIMELINE_TICK_LABEL_GAP = 6
// /api/events?epoch=past stops at 50. A shorter page is the whole epoch.
export const TIMELINE_LIST_CAP = 50
const MAX_SPAN_DAYS = 90

export type TimelineDay = {
  iso: string
  weekday: string
  label: string
  yearLabel: string
  isWeekend: boolean
}

export type TimelineCoverage = {
  startMs: number
  endMs: number
}

export type TimelinePlacement = {
  discussionId: number
  startMs: number
  endMs: number
  isos: string[]
}

export type TimelineLane = {
  discussionId: number
  column: number
  columns: number
}

// How many 16×20 icons fit beside each other under the card text. None when the row would cover the text.
export function timelineIconCount(iconCount: number, contentWidth: number, contentHeight: number, textHeight: number) {
  if (iconCount <= 0 || textHeight <= 0 || contentHeight - textHeight < TIMELINE_ICON_HEIGHT) {
    return 0
  }
  if (contentWidth < TIMELINE_ICON_WIDTH) {
    return 0
  }
  const across = Math.floor((contentWidth + TIMELINE_ICON_GAP) / (TIMELINE_ICON_WIDTH + TIMELINE_ICON_GAP))
  return Math.min(iconCount, Math.max(0, across))
}

export function timelineDayPlural(days: number): 'one' | 'few' | 'many' {
  const count = normalizeTimelineVisibleDays(days)
  if (count === 1) {
    return 'one'
  }
  if (count < 5) {
    return 'few'
  }
  return 'many'
}

export function timelineVisibleDayOptions() {
  return Array.from({ length: TIMELINE_VISIBLE_DAYS_MAX - TIMELINE_VISIBLE_DAYS_MIN + 1 }, (_, index) => {
    const days = `${TIMELINE_VISIBLE_DAYS_MIN + index}`
    return { value: days, label: days }
  })
}

export function normalizeTimelineVisibleDays(value: unknown) {
  const parsed = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed)) {
    return TIMELINE_VISIBLE_DAYS_DEFAULT
  }
  return Math.min(TIMELINE_VISIBLE_DAYS_MAX, Math.max(TIMELINE_VISIBLE_DAYS_MIN, Math.round(parsed)))
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function parseIso(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function clock(ms: number) {
  const date = new Date(ms)
  return `${date.getHours()}:${`${date.getMinutes()}`.padStart(2, '0')}`
}

export function timelineDay(date: Date): TimelineDay {
  const day = startOfDay(date)
  const weekday = EVENT_WEEKDAY_LABELS[(day.getDay() + 6) % 7]
  const showYear = day.getMonth() === 0 && day.getDate() === 1
  return {
    iso: isoDate(day),
    weekday,
    label: `${day.getDate()}. ${day.getMonth() + 1}.`,
    yearLabel: showYear ? `${day.getFullYear()}` : '',
    isWeekend: day.getDay() === 0 || day.getDay() === 6,
  }
}

// Ascending: earlier days first, so scrolling down moves into the future.
export function initialTimelineDays(now = new Date(), chunk = TIMELINE_CHUNK_DAYS): TimelineDay[] {
  const past = TIMELINE_PAST_DAYS + chunk
  const future = TIMELINE_FUTURE_DAYS + chunk
  const first = addDays(startOfDay(now), -past)
  const total = past + future + 1
  const days: TimelineDay[] = []
  for (let i = 0; i < total; i++) {
    days.push(timelineDay(addDays(first, i)))
  }
  return days
}

export function timelineTopIndex(days: { iso: string }[], now = new Date()) {
  const iso = isoDate(addDays(startOfDay(now), -TIMELINE_PAST_DAYS))
  const index = days.findIndex(day => day.iso === iso)
  return index < 0 ? 0 : index
}

export function extendTimelineDays(days: TimelineDay[], edge: 'future' | 'past', count = TIMELINE_CHUNK_DAYS) {
  if (!days.length || count <= 0) {
    return days
  }
  if (edge === 'past') {
    const first = parseIso(days[0].iso)
    const added: TimelineDay[] = []
    for (let i = count; i >= 1; i--) {
      added.push(timelineDay(addDays(first, -i)))
    }
    return [...added, ...days]
  }
  const last = parseIso(days[days.length - 1].iso)
  const added: TimelineDay[] = []
  for (let i = 1; i <= count; i++) {
    added.push(timelineDay(addDays(last, i)))
  }
  return [...days, ...added]
}

function dayIndex(ms: number, origin: Date) {
  const date = new Date(ms)
  const utcMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const utcOrigin = Date.UTC(origin.getFullYear(), origin.getMonth(), origin.getDate())
  return Math.round((utcMs - utcOrigin) / 86400000)
}

// 12:00 is halfway down that day's row. The origin day is the first row.
export function timelineOffset(ms: number, originIso: string, rowHeight: number) {
  const origin = parseIso(originIso)
  const date = new Date(ms)
  const start = startOfDay(date).getTime()
  const end = addDays(startOfDay(date), 1).getTime()
  const fraction = end === start ? 0 : (ms - start) / (end - start)
  return (dayIndex(ms, origin) + fraction) * rowHeight
}

// Center the 3px line on the current instant. Cards paint above it.
export function timelineNowTop(ms: number, originIso: string, rowHeight: number) {
  return timelineOffset(ms, originIso, rowHeight) - TIMELINE_NOW_LINE / 2
}

export type TimelineTick = {
  key: string
  top: number
  width: number
  height: number
  major: boolean
  label: string | null
}

function tickLabel(hour: number, visibleDays: number) {
  if (hour % TIMELINE_MAJOR_TICK_HOURS !== 0) {
    return null
  }
  if (visibleDays > TIMELINE_TICK_LABEL_DAYS && hour !== 0 && hour !== 12) {
    return null
  }
  return `${hour}`
}

// Major marks every 6 hours on the right. Hour marks join them when three days or fewer fit on screen.
export function timelineTicks(originIso: string, dayCount: number, rowHeight: number, visibleDays: number): TimelineTick[] {
  if (!originIso || dayCount <= 0 || rowHeight <= 0) {
    return []
  }
  const showMinor = visibleDays <= TIMELINE_MINOR_TICK_DAYS
  const origin = parseIso(originIso)
  const ticks: TimelineTick[] = []
  for (let day = 0; day < dayCount; day++) {
    const count = showMinor ? 24 : 24 / TIMELINE_MAJOR_TICK_HOURS
    for (let step = 0; step < count; step++) {
      const hour = showMinor ? step : step * TIMELINE_MAJOR_TICK_HOURS
      const major = hour % TIMELINE_MAJOR_TICK_HOURS === 0
      const height = major ? TIMELINE_MAJOR_TICK_HEIGHT : TIMELINE_MINOR_TICK_HEIGHT
      const width = major ? TIMELINE_MAJOR_TICK_WIDTH : TIMELINE_MINOR_TICK_WIDTH
      const ms = new Date(origin.getFullYear(), origin.getMonth(), origin.getDate() + day, hour).getTime()
      ticks.push({
        key: `${originIso}-${day}-${hour}`,
        top: timelineOffset(ms, originIso, rowHeight) - height / 2,
        width,
        height,
        major,
        label: tickLabel(hour, visibleDays),
      })
    }
  }
  return ticks
}

export function timelineBlockFrame(startMs: number, endMs: number, originIso: string, rowHeight: number) {
  const top = timelineOffset(startMs, originIso, rowHeight)
  const bottom = timelineOffset(endMs, originIso, rowHeight)
  return { top, height: Math.max(0, bottom - top) }
}

function eventRange(event: EventListItem) {
  if (event.discussion_id == null || !event.duration?.start || !event.duration?.end) {
    return null
  }
  if (event.my_attendance !== 'going' && event.my_attendance !== 'interested') {
    return null
  }
  const start = parseNyxDate(event.duration.start)
  const end = parseNyxDate(event.duration.end)
  const startMs = start.getTime()
  let endMs = end.getTime()
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || start.getFullYear() < 2000) {
    return null
  }
  if (endMs <= startMs) {
    endMs = startMs + 60 * 60 * 1000
  }
  return { discussionId: event.discussion_id, startMs, endMs }
}

function isosBetween(startMs: number, endMs: number) {
  const isos: string[] = []
  let cursor = startOfDay(new Date(startMs))
  const last = startOfDay(new Date(endMs - 1)).getTime()
  let guard = 0
  while (cursor.getTime() <= last && guard < MAX_SPAN_DAYS) {
    isos.push(isoDate(cursor))
    cursor = addDays(cursor, 1)
    guard += 1
  }
  return isos
}

export function placeTimelineEvents(events: EventListItem[]): TimelinePlacement[] {
  return events.flatMap(event => {
    const range = eventRange(event)
    if (!range) {
      return []
    }
    return [{ ...range, isos: isosBetween(range.startMs, range.endMs) }]
  })
}

// Overlapping times share side-by-side columns for the whole span. A gap resets to full width.
export function layoutTimelineLanes(items: { discussionId: number; startMs: number; endMs: number }[]): TimelineLane[] {
  const sorted = [...items].sort(
    (a, b) => a.startMs - b.startMs || a.endMs - b.endMs || a.discussionId - b.discussionId,
  )
  const clusters: (typeof sorted)[] = []
  let current: typeof sorted = []
  let clusterEnd = -Infinity
  for (const item of sorted) {
    if (current.length && item.startMs >= clusterEnd) {
      clusters.push(current)
      current = []
      clusterEnd = -Infinity
    }
    current.push(item)
    clusterEnd = Math.max(clusterEnd, item.endMs)
  }
  if (current.length) {
    clusters.push(current)
  }
  const lanes: TimelineLane[] = []
  clusters.forEach(cluster => {
    const columnEnds: number[] = []
    const assigned: { discussionId: number; column: number }[] = []
    for (const item of cluster) {
      let column = columnEnds.findIndex(end => end <= item.startMs)
      if (column < 0) {
        column = columnEnds.length
        columnEnds.push(item.endMs)
      } else {
        columnEnds[column] = item.endMs
      }
      assigned.push({ discussionId: item.discussionId, column })
    }
    const columns = Math.max(1, columnEnds.length)
    assigned.forEach(item => lanes.push({ discussionId: item.discussionId, column: item.column, columns }))
  })
  return lanes
}

export function timelineSpanClock(startMs: number, endMs: number) {
  return `${clock(startMs)}–${clock(endMs)}`
}

export function timelineClock(startMs: number, endMs: number, iso: string) {
  const dayStart = parseIso(iso).getTime()
  const dayEnd = addDays(parseIso(iso), 1).getTime()
  const begins = startMs > dayStart
  const ends = endMs < dayEnd
  if (!begins && !ends) {
    return null
  }
  if (begins && ends) {
    return `${clock(startMs)}–${clock(endMs)}`
  }
  if (begins) {
    return `${clock(startMs)}–`
  }
  return `–${clock(endMs)}`
}

export function myTimelineEvents(events: EventListItem[]) {
  return events.filter(event => event.my_attendance === 'going' || event.my_attendance === 'interested')
}

export function mergeTimelineEvents(current: EventListItem[], incoming: EventListItem[]) {
  const map = new Map<number, EventListItem>()
  for (const event of current) {
    if (event.discussion_id != null) {
      map.set(event.discussion_id, event)
    }
  }
  for (const event of myTimelineEvents(incoming)) {
    if (event.discussion_id != null) {
      map.set(event.discussion_id, event)
    }
  }
  return [...map.values()]
}

function startMsOf(events: EventListItem[]) {
  return events.flatMap(event => {
    if (!event.duration?.start) {
      return []
    }
    const start = parseNyxDate(event.duration.start)
    if (Number.isNaN(start.getTime()) || start.getFullYear() < 2000) {
      return []
    }
    return [startOfDay(start).getTime()]
  })
}

export function coverageForEpoch(kind: 'future' | 'past', events: EventListItem[], now = new Date()): TimelineCoverage {
  const today = startOfDay(now).getTime()
  const tomorrow = addDays(startOfDay(now), 1).getTime()
  const starts = startMsOf(events)
  const truncated = events.length >= TIMELINE_LIST_CAP
  if (!starts.length) {
    if (truncated) {
      return { startMs: today, endMs: today }
    }
    return kind === 'future'
      ? { startMs: today, endMs: Number.POSITIVE_INFINITY }
      : { startMs: Number.NEGATIVE_INFINITY, endMs: tomorrow }
  }
  if (kind === 'future') {
    if (!truncated) {
      return { startMs: today, endMs: Number.POSITIVE_INFINITY }
    }
    const maxStart = Math.max(...starts)
    return { startMs: today, endMs: addDays(new Date(maxStart), 1).getTime() }
  }
  if (!truncated) {
    return { startMs: Number.NEGATIVE_INFINITY, endMs: tomorrow }
  }
  return { startMs: Math.min(...starts), endMs: tomorrow }
}

export function addCoverage(coverage: TimelineCoverage[], next: TimelineCoverage) {
  const merged: TimelineCoverage[] = []
  for (const span of [...coverage, next].sort((a, b) => a.startMs - b.startMs)) {
    const prev = merged[merged.length - 1]
    if (prev && span.startMs <= prev.endMs) {
      prev.endMs = Math.max(prev.endMs, span.endMs)
    } else {
      merged.push({ ...span })
    }
  }
  return merged
}

export function dayCoverage(iso: string): TimelineCoverage {
  const startMs = parseIso(iso).getTime()
  return { startMs, endMs: addDays(new Date(startMs), 1).getTime() }
}

export function isIsoCovered(coverage: TimelineCoverage[], iso: string) {
  const ms = parseIso(iso).getTime()
  return coverage.some(span => ms >= span.startMs && ms < span.endMs)
}
