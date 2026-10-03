import NyxApi from 'nyx-api'
import type { EventsResponse } from 'nyx-api'

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
