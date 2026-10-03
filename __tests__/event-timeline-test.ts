import type { EventListItem } from 'nyx-api'
import {
  addCoverage,
  coverageForEpoch,
  dayCoverage,
  extendTimelineDays,
  initialTimelineDays,
  isIsoCovered,
  layoutTimelineLanes,
  mergeTimelineEvents,
  placeTimelineEvents,
  timelineBlockFrame,
  timelineClock,
  timelineOffset,
  timelineSpanClock,
  timelineTopIndex,
  TIMELINE_CHUNK_DAYS,
  TIMELINE_LIST_CAP,
} from '../src/lib/eventTimeline'

const now = new Date(2026, 9, 3, 11, 0, 0)

function event(partial: Partial<EventListItem> & Pick<EventListItem, 'discussion_id' | 'duration'>): EventListItem {
  return {
    full_name: 'Akce',
    area_id: 1,
    location: '',
    area_gettext_name: '',
    upcoming_short_event: false,
    category_id: 581,
    category_path: 'party',
    bookmark: false,
    new_posts_count: 0,
    new_replies_count: 0,
    new_links_count: 0,
    new_images_count: 0,
    going_people: 1,
    interested_people: 0,
    friends: [],
    my_attendance: 'going',
    ...partial,
  }
}

describe('event timeline', () => {
  it('opens on seven days with yesterday on top and the future below', () => {
    const days = initialTimelineDays(now, 0)
    expect(days).toHaveLength(7)
    expect(days[0].iso).toBe('2026-10-02')
    expect(days[0].weekday).toBe('Pá')
    expect(days[0].isWeekend).toBe(false)
    expect(days[1].iso).toBe('2026-10-03')
    expect(days[1].isWeekend).toBe(true)
    expect(days[2].iso).toBe('2026-10-04')
    expect(days[2].weekday).toBe('Ne')
    expect(days[6].iso).toBe('2026-10-08')
    expect(days.find(day => day.iso === '2026-10-03')?.yearLabel).toBe('')
  })

  it('scrolls the first screen so yesterday starts at the top', () => {
    const days = initialTimelineDays(now, TIMELINE_CHUNK_DAYS)
    const top = timelineTopIndex(days, now)
    expect(days[top].iso).toBe('2026-10-02')
    expect(days[top + 6].iso).toBe('2026-10-08')
  })

  it('grows past days above the list and future days below it', () => {
    const days = initialTimelineDays(now, 0)
    const past = extendTimelineDays(days, 'past', 2)
    expect(past[0].iso).toBe('2026-09-30')
    expect(past[2].iso).toBe('2026-10-02')
    const future = extendTimelineDays(days, 'future', 2)
    expect(future[future.length - 1].iso).toBe('2026-10-10')
    expect(future[future.length - 3].iso).toBe('2026-10-08')
  })

  it('labels the first of January with the year', () => {
    const days = initialTimelineDays(new Date(2026, 11, 31), 0)
    const newYear = days.find(day => day.iso === '2027-01-01')
    expect(newYear?.yearLabel).toBe('2027')
    expect(newYear?.label).toBe('1. 1.')
    expect(newYear?.weekday).toBe('Pá')
  })

  it('draws one block from the start time to the end time, side by side when they overlap', () => {
    const row = 240
    expect(timelineOffset(new Date(2026, 9, 2, 12, 0).getTime(), '2026-10-02', row)).toBe(120)
    const placed = placeTimelineEvents([
      event({
        discussion_id: 1,
        full_name: 'Hymny',
        duration: { start: '2026-10-02T18:30:00', end: '2026-10-03T23:59:00' },
        my_attendance: 'interested',
      }),
      event({
        discussion_id: 2,
        full_name: 'Acid',
        duration: { start: '2026-10-02T22:00:00', end: '2026-10-03T07:00:00' },
      }),
    ])
    expect(placed[0].isos).toEqual(['2026-10-02', '2026-10-03'])
    const lanes = layoutTimelineLanes(placed)
    expect(lanes).toEqual([
      { discussionId: 1, column: 0, columns: 2 },
      { discussionId: 2, column: 1, columns: 2 },
    ])
    const hymny = timelineBlockFrame(placed[0].startMs, placed[0].endMs, '2026-10-02', row)
    const acid = timelineBlockFrame(placed[1].startMs, placed[1].endMs, '2026-10-02', row)
    expect(hymny.top).toBeCloseTo((18.5 / 24) * row)
    expect(acid.top).toBeCloseTo((22 / 24) * row)
    expect(acid.top).toBeGreaterThan(hymny.top)
    expect(hymny.top + hymny.height).toBeGreaterThan(acid.top + acid.height)
    expect(timelineSpanClock(placed[0].startMs, placed[0].endMs)).toBe('18:30–23:59')
    expect(timelineSpanClock(placed[1].startMs, placed[1].endMs)).toBe('22:00–7:00')

    const apart = layoutTimelineLanes(
      placeTimelineEvents([
        event({ discussion_id: 3, duration: { start: '2026-10-23T20:00:00', end: '2026-10-24T02:00:00' } }),
        event({ discussion_id: 4, duration: { start: '2026-10-24T18:00:00', end: '2026-10-25T04:00:00' } }),
      ]),
    )
    expect(apart).toEqual([
      { discussionId: 3, column: 0, columns: 1 },
      { discussionId: 4, column: 0, columns: 1 },
    ])
  })

  it('does not take the next day when the event ends at midnight', () => {
    const [placement] = placeTimelineEvents([
      event({ discussion_id: 5, duration: { start: '2026-10-24T22:00:00', end: '2026-10-25T00:00:00' } }),
    ])
    expect(placement.isos).toEqual(['2026-10-24'])
    const crossing = placeTimelineEvents([
      event({ discussion_id: 6, duration: { start: '2026-10-24T22:00:00', end: '2026-10-25T00:01:00' } }),
    ])
    expect(crossing[0].isos).toEqual(['2026-10-24', '2026-10-25'])
  })

  it('drops events the user is not attending and ignores a zero date', () => {
    const placed = placeTimelineEvents([
      event({ discussion_id: 7, duration: { start: '2026-10-06T19:00:00', end: '2026-10-06T22:00:00' } }),
      event({
        discussion_id: 8,
        my_attendance: 'none',
        duration: { start: '2026-10-06T19:00:00', end: '2026-10-06T22:00:00' },
      }),
      event({
        discussion_id: 9,
        duration: { start: '1970-01-01T00:00:00', end: '1970-01-01T00:00:00' },
      }),
    ])
    expect(placed.map(item => item.discussionId)).toEqual([7])
  })

  it('formats the clock for the part of the event on that day', () => {
    const start = new Date(2026, 9, 24, 20, 0).getTime()
    const end = new Date(2026, 9, 25, 4, 0).getTime()
    expect(timelineClock(start, end, '2026-10-24')).toBe('20:00–')
    expect(timelineClock(start, end, '2026-10-25')).toBe('–4:00')
    expect(timelineClock(start, new Date(2026, 9, 24, 23, 0).getTime(), '2026-10-24')).toBe('20:00–23:00')
    expect(
      timelineClock(new Date(2026, 9, 24, 0, 0).getTime(), new Date(2026, 9, 25, 0, 0).getTime(), '2026-10-24'),
    ).toBe(null)
  })

  it('keeps the latest attendance and drops everyone else', () => {
    const going = event({ discussion_id: 1, duration: { start: '2026-10-06T19:00:00', end: '2026-10-06T22:00:00' } })
    const interested = event({
      discussion_id: 1,
      my_attendance: 'interested',
      duration: { start: '2026-10-06T19:00:00', end: '2026-10-06T22:00:00' },
    })
    const other = event({
      discussion_id: 2,
      my_attendance: 'none',
      duration: { start: '2026-10-06T19:00:00', end: '2026-10-06T22:00:00' },
    })
    const merged = mergeTimelineEvents([going], [interested, other])
    expect(merged).toHaveLength(1)
    expect(merged[0].my_attendance).toBe('interested')
  })

  it('trusts a short future page and day-fetches past the capped history', () => {
    const future = [event({ discussion_id: 1, duration: { start: '2026-10-06T19:00:00', end: '2026-10-06T22:00:00' } })]
    expect(isIsoCovered([coverageForEpoch('future', future, now)], '2027-04-02')).toBe(true)
    const past = Array.from({ length: TIMELINE_LIST_CAP }, (_, index) =>
      event({
        discussion_id: index + 1,
        duration:
          index === 0
            ? { start: '1970-01-01T00:00:00', end: '1970-01-01T00:00:00' }
            : { start: '2026-08-05T18:00:00', end: '2026-08-05T22:00:00' },
      }),
    )
    const covered = coverageForEpoch('past', past, now)
    expect(isIsoCovered([covered], '2026-08-05')).toBe(true)
    expect(isIsoCovered([covered], '2026-08-04')).toBe(false)
    expect(isIsoCovered(addCoverage([covered], dayCoverage('2026-08-04')), '2026-08-04')).toBe(true)
  })
})
