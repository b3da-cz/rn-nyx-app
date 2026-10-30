import { utf8ByteLength } from './discussionCache'

export type CachedReminderList = {
  bookmarks: any[]
  mail: any[]
  savedAt: number
}

export type CachedMailPage = {
  conversations: any[]
  messages: any[]
  savedAt: number
}

export type CachedMailList = {
  pages: Record<string, CachedMailPage>
}

export type CachedEventsQuery = {
  events: any[]
  calendar: Record<string, any>
  categories: any[]
  areas: any[]
  savedAt: number
}

export type CachedEventsList = {
  queries: Record<string, CachedEventsQuery>
}

export type CachedNotificationList = {
  posts: any[]
  unreadCount: number
  savedAt: number
}

export type FeedCacheStore = {
  reminders: CachedReminderList | null
  mail: CachedMailList | null
  events: CachedEventsList | null
  notifications: CachedNotificationList | null
}

export type FeedCacheKind = 'reminders' | 'mail' | 'events' | 'notifications'

const MAIL_PAGE_LIMIT = 12
const EVENTS_QUERY_LIMIT = 8

export const emptyFeedCache = (): FeedCacheStore => ({
  reminders: null,
  mail: null,
  events: null,
  notifications: null,
})

const asArray = (value: unknown) => (Array.isArray(value) ? value : [])

const capBySavedAt = <T extends { savedAt?: number }>(record: Record<string, T>, limit: number) => {
  const entries = Object.entries(record || {})
  if (entries.length <= limit) {
    return record
  }
  entries.sort((a, b) => (Number(b[1]?.savedAt) || 0) - (Number(a[1]?.savedAt) || 0))
  return Object.fromEntries(entries.slice(0, limit))
}

export const normalizeFeedCache = (value: unknown): FeedCacheStore => {
  const raw = (value || {}) as FeedCacheStore
  const reminders = raw.reminders
  const mailPages = raw.mail?.pages
  const eventQueries = raw.events?.queries
  const notifications = raw.notifications
  const pages =
    mailPages && typeof mailPages === 'object'
      ? Object.fromEntries(
          Object.entries(mailPages)
            .filter(([, page]) => page && Array.isArray(page.messages))
            .map(([key, page]) => [
              key,
              {
                conversations: asArray(page.conversations),
                messages: asArray(page.messages),
                savedAt: Number(page.savedAt) || 0,
              },
            ]),
        )
      : null
  const queries =
    eventQueries && typeof eventQueries === 'object'
      ? Object.fromEntries(
          Object.entries(eventQueries)
            .filter(([, query]) => query && Array.isArray(query.events))
            .map(([key, query]) => [
              key,
              {
                events: asArray(query.events),
                calendar: query.calendar && typeof query.calendar === 'object' ? query.calendar : {},
                categories: asArray(query.categories),
                areas: asArray(query.areas),
                savedAt: Number(query.savedAt) || 0,
              },
            ]),
        )
      : null
  return {
    reminders:
      reminders && (Array.isArray(reminders.bookmarks) || Array.isArray(reminders.mail))
        ? {
            bookmarks: asArray(reminders.bookmarks),
            mail: asArray(reminders.mail),
            savedAt: Number(reminders.savedAt) || 0,
          }
        : null,
    mail: pages ? { pages } : null,
    events: queries ? { queries } : null,
    notifications:
      notifications && Array.isArray(notifications.posts)
        ? {
            posts: notifications.posts,
            unreadCount: Number(notifications.unreadCount) || 0,
            savedAt: Number(notifications.savedAt) || 0,
          }
        : null,
  }
}

export const mailCacheKey = (recipient?: string | null) =>
  !recipient || recipient === 'all' ? 'all' : `user:${recipient}`

export const eventsCacheKey = (filters: {
  search?: string
  order?: string
  epoch?: string
  category?: number
  area?: number
  month?: number
  year?: number
}) =>
  JSON.stringify({
    search: (filters?.search || '').trim(),
    order: filters?.order || '',
    epoch: filters?.epoch || '',
    category: filters?.category ?? null,
    area: filters?.area ?? null,
    month: filters?.month ?? null,
    year: filters?.year ?? null,
  })

export const postBodyKey = (post: any) => {
  const raw = post?.content_raw
  let rawKey = ''
  if (raw && typeof raw === 'object') {
    try {
      rawKey = JSON.stringify(raw)
    } catch (e) {
      rawKey = ''
    }
  }
  return `${post?.content ?? ''}|${rawKey}`
}

export const isEditablePost = (post: any) => {
  const location = post?.location
  if (location === 'header' || location === 'home') {
    return true
  }
  const type = post?.content_raw?.type || post?.post_type || ''
  return type === 'advertisement' || type === 'event'
}

export const editablePostChanged = (fresh: any, previous: any) =>
  !!previous && isEditablePost(fresh) && postBodyKey(fresh) !== postBodyKey(previous)

export const parsedForFreshPost = (fresh: any, previous: any) => {
  if (fresh?.parsed) {
    return fresh.parsed
  }
  if (previous?.parsed && !editablePostChanged(fresh, previous)) {
    return previous.parsed
  }
  return undefined
}

export type ReconcileResult<T> = { items: T[]; changed: boolean }

const sameList = (previous: any[], items: any[]) =>
  previous.length === items.length && items.every((item, index) => item === previous[index])

export const reconcilePosts = (cached: any[] = [], fresh: any[] = []): ReconcileResult<any> => {
  const previous = new Map<string, any>()
  for (const post of cached || []) {
    if (post?.id != null && !previous.has(String(post.id))) {
      previous.set(String(post.id), post)
    }
  }
  const seen = new Set<string>()
  const items: any[] = []
  let changed = false
  for (const post of fresh || []) {
    if (post?.id == null) {
      items.push(post)
      changed = true
      continue
    }
    const id = String(post.id)
    if (seen.has(id)) {
      continue
    }
    seen.add(id)
    const prev = previous.get(id)
    if (!prev) {
      items.push(post)
      changed = true
      continue
    }
    if (editablePostChanged(post, prev)) {
      items.push(post)
      changed = true
      continue
    }
    items.push(prev)
  }
  if ((cached || []).some(post => post?.id != null && !seen.has(String(post.id)))) {
    changed = true
  }
  if (!changed && !sameList(cached || [], items)) {
    changed = true
  }
  return { items, changed }
}

export const reconcileMailMessages = (cached: any[] = [], fresh: any[] = []): ReconcileResult<any> => {
  if (!Array.isArray(fresh) || fresh.length === 0) {
    return { items: [], changed: (cached || []).length > 0 }
  }
  const ids = fresh.map(post => Number(post?.id)).filter(id => Number.isFinite(id))
  const minFresh = ids.length ? Math.min(...ids) : Number.POSITIVE_INFINITY
  const older = (cached || [])
    .filter(post => Number(post?.id) < minFresh)
    .sort((a, b) => Number(b.id) - Number(a.id))
  const windowCached = (cached || []).filter(post => !(Number(post?.id) < minFresh))
  const window = reconcilePosts(windowCached, fresh)
  const items = [...window.items, ...older]
  const changed = window.changed || !sameList(cached || [], items)
  return { items, changed }
}

const replyCount = (item: any) => item?.details?.replies?.length || 0
const ratingCount = (item: any) => item?.details?.thumbs_up?.length || 0

export const notificationNeedsPrepare = (item: any) => {
  if (!item?.data?.parsed) {
    return true
  }
  return (item?.details?.replies || []).some((reply: any) => reply && !reply.parsed)
}

export const reconcileNotifications = (cached: any[] = [], fresh: any[] = []): ReconcileResult<any> => {
  const previous = new Map<string, any>()
  for (const item of cached || []) {
    if (item?.data?.id != null && !previous.has(String(item.data.id))) {
      previous.set(String(item.data.id), item)
    }
  }
  const seen = new Set<string>()
  const items: any[] = []
  let changed = false
  for (const item of fresh || []) {
    if (item?.data?.id == null) {
      items.push(item)
      changed = true
      continue
    }
    const id = String(item.data.id)
    if (seen.has(id)) {
      continue
    }
    seen.add(id)
    const prev = previous.get(id)
    if (!prev) {
      items.push(item)
      changed = true
      continue
    }
    const replies = reconcilePosts(prev.details?.replies || [], item.details?.replies || [])
    const ratingsDiffer = ratingCount(prev) !== ratingCount(item)
    const ratingValueDiffer = prev.data?.rating !== item.data?.rating || prev.data?.my_rating !== item.data?.my_rating
    if (!replies.changed && !ratingsDiffer && !ratingValueDiffer) {
      items.push(prev)
      continue
    }
    changed = true
    const data = ratingValueDiffer
      ? { ...prev.data, rating: item.data?.rating, my_rating: item.data?.my_rating }
      : prev.data
    items.push({
      ...prev,
      data,
      details: {
        ...(prev.details || {}),
        ...(item.details || {}),
        replies: replies.items,
        thumbs_up: item.details?.thumbs_up || [],
      },
    })
  }
  if ((cached || []).some(item => item?.data?.id != null && !seen.has(String(item.data.id)))) {
    changed = true
  }
  if (!changed && !sameList(cached || [], items)) {
    changed = true
  }
  return { items, changed }
}

export const eventContentKey = (event: any) =>
  JSON.stringify({
    summary: event?.summary || '',
    description: event?.description || '',
    location: event?.location || '',
    full_name: event?.full_name || '',
    start: event?.duration?.start || '',
    end: event?.duration?.end || '',
    going: event?.going_people || 0,
    interested: event?.interested_people || 0,
    mine: event?.my_attendance || '',
    friends: event?.friends || [],
    attendees: event?.attendees || [],
    thumbnail: event?.thumbnail_id || '',
  })

export const eventDetailContentKey = (detail: any) =>
  JSON.stringify({
    name: detail?.name || '',
    location: detail?.location || '',
    start: detail?.start || '',
    end: detail?.end || '',
    going: detail?.going || 0,
    interested: detail?.interested || 0,
    mine: detail?.myAttendance || '',
    body: detail?.parsed?.clearText || detail?.parsed?.text || '',
    attendees: (detail?.attendees || []).map((attendee: any) => ({
      username: attendee?.username,
      attendance_type: attendee?.attendance_type,
    })),
  })

export const reconcileEvents = (cached: any[] = [], fresh: any[] = []): ReconcileResult<any> => {
  const previous = new Map<string, any>()
  for (const event of cached || []) {
    const id = event?.discussion_id ?? event?.id
    if (id != null && !previous.has(String(id))) {
      previous.set(String(id), event)
    }
  }
  const seen = new Set<string>()
  const items: any[] = []
  let changed = false
  for (const event of fresh || []) {
    const id = event?.discussion_id ?? event?.id
    if (id == null) {
      items.push(event)
      changed = true
      continue
    }
    const key = String(id)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    const prev = previous.get(key)
    if (!prev || eventContentKey(prev) !== eventContentKey(event)) {
      items.push(event)
      changed = true
      continue
    }
    items.push(prev)
  }
  if (
    (cached || []).some(event => {
      const id = event?.discussion_id ?? event?.id
      return id != null && !seen.has(String(id))
    })
  ) {
    changed = true
  }
  if (!changed && !sameList(cached || [], items)) {
    changed = true
  }
  return { items, changed }
}

export const rememberReminders = (
  store: FeedCacheStore | null | undefined,
  bookmarks: any[] = [],
  mail: any[] = [],
  now = Date.now(),
): FeedCacheStore => {
  const current = normalizeFeedCache(store)
  return {
    ...current,
    reminders: { bookmarks: bookmarks || [], mail: mail || [], savedAt: now },
  }
}

export const rememberMailPage = (
  store: FeedCacheStore | null | undefined,
  key: string,
  conversations: any[] = [],
  messages: any[] = [],
  now = Date.now(),
): FeedCacheStore => {
  const current = normalizeFeedCache(store)
  const pages = {
    ...(current.mail?.pages || {}),
    [key]: { conversations: conversations || [], messages: messages || [], savedAt: now },
  }
  return { ...current, mail: { pages: capBySavedAt(pages, MAIL_PAGE_LIMIT) } }
}

export const rememberEventsQuery = (
  store: FeedCacheStore | null | undefined,
  key: string,
  query: Omit<CachedEventsQuery, 'savedAt'>,
  now = Date.now(),
): FeedCacheStore => {
  const current = normalizeFeedCache(store)
  const queries = {
    ...(current.events?.queries || {}),
    [key]: {
      events: query.events || [],
      calendar: query.calendar || {},
      categories: query.categories || [],
      areas: query.areas || [],
      savedAt: now,
    },
  }
  return { ...current, events: { queries: capBySavedAt(queries, EVENTS_QUERY_LIMIT) } }
}

export const rememberNotifications = (
  store: FeedCacheStore | null | undefined,
  posts: any[] = [],
  unreadCount = 0,
  now = Date.now(),
): FeedCacheStore => {
  const current = normalizeFeedCache(store)
  return {
    ...current,
    notifications: { posts: posts || [], unreadCount: Number(unreadCount) || 0, savedAt: now },
  }
}

export const forgetFeed = (store: FeedCacheStore | null | undefined, kind: FeedCacheKind): FeedCacheStore => {
  const current = normalizeFeedCache(store)
  return { ...current, [kind]: null }
}

export const feedCacheCounts = (store: FeedCacheStore | null | undefined) => {
  const source = normalizeFeedCache(store)
  const mail = Object.values(source.mail?.pages || {}).reduce((sum, page) => sum + (page?.messages?.length || 0), 0)
  const events = Object.values(source.events?.queries || {}).reduce((sum, query) => sum + (query?.events?.length || 0), 0)
  return {
    remindersCount: (source.reminders?.bookmarks?.length || 0) + (source.reminders?.mail?.length || 0),
    mailCount: mail,
    eventsCount: events,
    notificationsCount: source.notifications?.posts?.length || 0,
  }
}

export const withFeedCacheReport = <T extends { bytes?: number }>(report: T, feeds: unknown) => {
  const source = normalizeFeedCache(feeds)
  const counts = feedCacheCounts(source)
  const hasFeed = counts.remindersCount + counts.mailCount + counts.eventsCount + counts.notificationsCount > 0
  return {
    ...report,
    bytes: (report?.bytes || 0) + (hasFeed ? utf8ByteLength(source) : 0),
    ...counts,
  }
}
