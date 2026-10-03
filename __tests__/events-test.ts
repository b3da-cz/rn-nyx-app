import type { EventAttendee, EventListItem } from 'nyx-api'
import {
  applyMyAttendance,
  attendancePhrase,
  defaultEventFilters,
  discussionTarget,
  eventBodyHtml,
  eventDetailImages,
  EventDetailData,
  filterEventsByAttendance,
  formatEventDuration,
  eventMetaParts,
  formatEventMeta,
  eventFriendNames,
  friendAttendees,
  isEventFilterActive,
  isNyxBrowserUrl,
  normalizeMyAttendance,
  otherAttendeesNoun,
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
    expect(eventMetaParts(event, now)).toEqual({
      schedule: 'concert | Pá 02.04.2027 @ 19:00 - 22:59',
      place: 'ČR – Praha | Klub 007 Strahov',
    })
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

  it('uses the html description and falls back to a linked summary', () => {
    expect(eventBodyHtml({ description: '<div>vstup volný</div>', summary: 'ignored' })).toBe(
      '<div>vstup volný</div><br>',
    )
    expect(eventBodyHtml({ description: '', summary: 'line\r\nhttps://ra.co/events/1.' })).toBe(
      'line<br><a href="https://ra.co/events/1">https://ra.co/events/1</a>.',
    )
    expect(eventBodyHtml({ summary: 'a < b' })).toBe('a &lt; b')
  })

  it('keeps nyx discussion links inside the app', () => {
    expect(discussionTarget('https://nyx.cz/discussion/291499/id/12')).toEqual({
      discussionId: '291499',
      postId: '12',
    })
    expect(discussionTarget('/discussion/291499')).toEqual({ discussionId: '291499', postId: undefined })
    expect(discussionTarget('https://ra.co/events/1')).toBeNull()
  })

  it('names friends and the other attendees', () => {
    expect(eventFriendNames(['ALICE', { username: 'BOB' }, { username: '' }, null as any])).toEqual(['ALICE', 'BOB'])
    expect(otherAttendeesNoun(1)).toBe('dalšího')
    expect(otherAttendeesNoun(3)).toBe('další')
    expect(otherAttendeesNoun(6)).toBe('dalších')
  })

  it('shows friend avatars for people who are going first', () => {
    const attendees = [
      { username: 'A', attendance_type: 'interested', is_friend: true },
      { username: 'B', attendance_type: 'going', is_friend: false },
      { username: 'C', attendance_type: 'going', is_friend: true },
      { username: 'D', attendance_type: 'none', is_friend: true },
    ] as EventAttendee[]
    expect(friendAttendees(attendees).map(attendee => attendee.username)).toEqual(['C', 'A'])
  })

  it('collects attachment images and skips a duplicate thumbnail', () => {
    const { images, extras } = eventDetailImages(['https://i.ibb.co/x/image.png'], [{ url: '/files/flyer.jpg' }], null, '/files/thumb.jpg')
    expect(images.map(image => image.url)).toEqual(['https://i.ibb.co/x/image.png', 'https://nyx.cz/files/flyer.jpg'])
    expect(extras.map(image => image.url)).toEqual(['https://nyx.cz/files/flyer.jpg'])
    expect(eventDetailImages([], [], null, '/files/thumb.jpg').images[0].url).toBe('https://nyx.cz/files/thumb.jpg')
  })

  it('keeps web links in the event browser and hands off other schemes', () => {
    expect(isNyxBrowserUrl('https://nyx.cz/event/create')).toBe(true)
    expect(isNyxBrowserUrl('http://nyx.cz/login')).toBe(true)
    expect(isNyxBrowserUrl('about:blank')).toBe(true)
    expect(isNyxBrowserUrl('mailto:nyx@nyx.cz')).toBe(false)
    expect(isNyxBrowserUrl('javascript:alert(1)')).toBe(false)
    expect(isNyxBrowserUrl('')).toBe(false)
  })

  it('keeps only going and interested as the signed-in attendance', () => {
    expect(normalizeMyAttendance('going')).toBe('going')
    expect(normalizeMyAttendance('interested')).toBe('interested')
    expect(normalizeMyAttendance('none')).toBe('none')
    expect(normalizeMyAttendance('later')).toBe('none')
    expect(normalizeMyAttendance(null)).toBe('none')
  })

  it('moves the signed-in user between attendance counts', () => {
    const base: EventDetailData = {
      parsed: null,
      images: [],
      going: 4,
      interested: 4,
      myAttendance: 'none',
      attendees: [{ discussion_id: 9, username: 'A', attendance_type: 'going', is_friend: true }],
    }
    const going = applyMyAttendance(base, 'NNN_TEST', 'going')
    expect(going.going).toBe(5)
    expect(going.interested).toBe(4)
    expect(going.attendees.map(attendee => attendee.username)).toEqual(['A', 'NNN_TEST'])
    const interested = applyMyAttendance(going, 'NNN_TEST', 'interested')
    expect(interested.going).toBe(4)
    expect(interested.interested).toBe(5)
    expect(interested.attendees.find(attendee => attendee.username === 'NNN_TEST')?.attendance_type).toBe('interested')
    const cleared = applyMyAttendance(interested, 'NNN_TEST', 'none')
    expect(cleared.going).toBe(4)
    expect(cleared.interested).toBe(4)
    expect(cleared.attendees.map(attendee => attendee.username)).toEqual(['A'])
    expect(applyMyAttendance(cleared, 'NNN_TEST', 'none')).toBe(cleared)
  })

  it('picks the Czech attendee phrase', () => {
    expect(attendancePhrase(1, '2026-10-06T22:00:00', now)?.noun).toBe('člověk')
    expect(attendancePhrase(2, '2026-10-06T22:00:00', now)?.lead).toBe('Na událost se chystají')
    expect(attendancePhrase(1, '2026-10-02T22:00:00', now)?.lead).toBe('Na událost se chystal')
    expect(attendancePhrase(0, '2026-10-06T22:00:00', now)).toBeNull()
  })
})
