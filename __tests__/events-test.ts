import type { EventListItem } from 'nyx-api'
import {
  attendancePhrase,
  defaultEventFilters,
  filterEventsByAttendance,
  formatEventDuration,
  formatEventMeta,
  isEventFilterActive,
  monthGrid,
  toEventsQuery,
} from '../src/lib/events'

const now = new Date(2026, 9, 3, 11, 0, 0)

describe('events', () => {
  it('formats durations the way the web list does', () => {
    expect(formatEventDuration('2026-10-06T19:00:00', '2026-10-06T22:00:00', now)).toBe('Út @ 19:00 - 22:00')
    expect(formatEventDuration('2027-04-02T19:00:00', '2027-04-02T22:59:00', now)).toBe(
      'Pá 02.04.2027 @ 19:00 - 22:59',
    )
    expect(formatEventDuration('2026-10-24T20:00:00', '2026-10-25T04:00:00', now)).toBe(
      'So 24.10.2026 @ 20:00 - Ne 25.10.2026 @ 4:00',
    )
    expect(formatEventDuration('2026-10-02T22:00:00', '2026-10-03T07:00:00', now)).toBe(
      '2.10.2026 @ 22:00 - dnes @ 7:00',
    )
  })

  it('joins category, time and place', () => {
    const event = {
      category_path: 'concert',
      duration: { start: '2027-04-02T19:00:00', end: '2027-04-02T22:59:00' },
      area_gettext_name: 'ČR - Praha',
      location: 'Klub 007 Strahov',
    } as EventListItem
    expect(formatEventMeta(event, now)).toBe('concert | Pá 02.04.2027 @ 19:00 - 22:59 | ČR – Praha | Klub 007 Strahov')
  })

  it('builds a Monday-first October 2026 grid', () => {
    const cells = monthGrid(2026, 10)
    expect(cells[0].iso).toBe('2026-09-28')
    expect(cells[3].iso).toBe('2026-10-01')
    expect(cells[3].inMonth).toBe(true)
    expect(cells[0].inMonth).toBe(false)
  })

  it('filters attendance on the client and keeps other filters for the query', () => {
    const events = [
      { discussion_id: 1, my_attendance: 'going', friends: [] },
      { discussion_id: 2, my_attendance: null, friends: ['ALICE'] },
      { discussion_id: 3, my_attendance: 'none', friends: [] },
    ] as EventListItem[]
    expect(filterEventsByAttendance(events, 'me').map(event => event.discussion_id)).toEqual([1])
    expect(filterEventsByAttendance(events, 'friends').map(event => event.discussion_id)).toEqual([2])
    expect(filterEventsByAttendance(events, 'any')).toHaveLength(3)

    const filters = { ...defaultEventFilters(now), search: ' strahov ', category: 580, area: 0, epoch: '2026-10-24' }
    expect(toEventsQuery(filters)).toMatchObject({
      search: 'strahov',
      category: 580,
      area: 0,
      epoch: '2026-10-24',
      order: 'proximity',
      month: 10,
      year: 2026,
    })
    expect(isEventFilterActive(defaultEventFilters(now), now)).toBe(false)
    expect(isEventFilterActive(filters, now)).toBe(true)
  })

  it('picks the Czech attendee phrase', () => {
    expect(attendancePhrase(1, '2026-10-06T22:00:00', now)?.noun).toBe('člověk')
    expect(attendancePhrase(2, '2026-10-06T22:00:00', now)?.lead).toBe('Na událost se chystají')
    expect(attendancePhrase(1, '2026-10-02T22:00:00', now)?.lead).toBe('Na událost se chystal')
    expect(attendancePhrase(0, '2026-10-06T22:00:00', now)).toBeNull()
  })
})
