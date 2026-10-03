import type { EventAttendee } from 'nyx-api'
import { eventBodyHtml, eventDetailImages, EventDetailData } from './events'
import { Parser } from './Parser'

type EventDetailSource = {
  owner?: { user?: { username?: string } }
  event_specific_data?: {
    event?: {
      location?: string | null
      duration?: { start?: string; end?: string }
      summary?: string | null
      description?: string | null
      photo_ids?: string[] | null
      thumbnail_id?: string | null
      going_people?: number
      interested_people?: number
    }
    area?: { gettext_name?: string }
    attachments?: { url?: string | null }[]
    attendees?: EventAttendee[]
  }
}

export function toEventDetail(common?: EventDetailSource | null): EventDetailData | null {
  const data = common?.event_specific_data
  const event = data?.event
  if (!event) {
    return null
  }
  const html = eventBodyHtml(event)
  const parsed = html ? new Parser(html, 'text').parse() : null
  const inline = (parsed?.images || []).map(image => image.src).filter((src): src is string => !!src)
  const { images } = eventDetailImages(inline, data?.attachments || [], event.photo_ids, event.thumbnail_id)
  return {
    owner: common?.owner?.user?.username,
    areaName: data?.area?.gettext_name,
    location: event.location || '',
    start: event.duration?.start,
    end: event.duration?.end,
    parsed,
    images,
    going: event.going_people || 0,
    interested: event.interested_people || 0,
    attendees: (data?.attendees || []).filter(attendee => attendee.attendance_type !== 'none'),
  }
}
