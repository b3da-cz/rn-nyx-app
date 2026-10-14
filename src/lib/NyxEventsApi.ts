import NyxApi from 'nyx-api'
import type { DiscussionAccessRightResponse, EventsResponse, Response as NyxResponse } from 'nyx-api'

export type EventsQuery = {
  area?: number
  category?: number
  month?: number
  year?: number
  order?: 'popularity' | 'proximity' | 'freshness'
  epoch?: string
  search?: string
}

// nyx-api 0.5.2 getEvents sends area, category, month and year.
// /api/events also honors order, epoch and search, which the list filter needs.
// setEventAttendance comes from NyxApi.
export class NyxEventsApi extends NyxApi {
  async deleteMail(postId: string | number): Promise<Partial<NyxResponse>> {
    return this.fetch({
      endpoint: `mail/delete/${postId}`,
      method: 'DELETE',
    })
  }

  // Swagger and nyx-api expose set/add/delete for discussion rights, not the list or the
  // change log. The website renders both in /discussion/{id}/rights. The same bearer
  // token loads that HTML. #discussion-log is present only for someone who can see it.
  async getDiscussionRightsPage(discussionId: string | number): Promise<string> {
    const headers = { ...(this.getHeaders('text/html') as Record<string, string>), Accept: 'text/html' }
    const res = await fetch(`https://nyx.cz/discussion/${discussionId}/rights`, {
      method: 'GET',
      headers,
    })
    return res.text()
  }

  // nyx-api writes the right flags, not the day count. The site sets that with this call.
  // -1 is unlimited. The dialog keeps the value between -1 and 999999.
  async setDiscussionDaysLeft(
    discussionId: string | number,
    username: string,
    daysLeft: number,
  ): Promise<Partial<DiscussionAccessRightResponse>> {
    return this.fetch({
      endpoint: `discussion/rights/days_left?discussion_id=${discussionId}&username=${encodeURIComponent(username)}&days_left=${daysLeft}`,
      method: 'POST',
    })
  }

  async getEvents(params?: EventsQuery): Promise<Partial<EventsResponse>> {
    const queryParts: string[] = []
    if (params?.area !== undefined) queryParts.push(`area=${params.area}`)
    if (params?.category !== undefined) queryParts.push(`category=${params.category}`)
    if (params?.month !== undefined) queryParts.push(`month=${params.month}`)
    if (params?.year !== undefined) queryParts.push(`year=${params.year}`)
    if (params?.order) queryParts.push(`order=${encodeURIComponent(params.order)}`)
    if (params?.epoch) queryParts.push(`epoch=${encodeURIComponent(params.epoch)}`)
    if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`)
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
    return this.fetch({
      endpoint: `events${qs}`,
      method: 'GET',
    })
  }
}
