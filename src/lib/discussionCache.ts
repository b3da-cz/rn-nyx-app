export const DISCUSSION_CACHE_LIMIT_DEFAULT = 30
export const DISCUSSION_CACHE_LIMIT_MAX = 200

export type CachedImageLayout = {
  src: string
  width?: number
  height?: number
  byteLength?: number
  skipDownload?: boolean
  cached?: boolean
  revealed?: boolean
}

export type CachedPostRecord = {
  post: any
  content?: string
  height?: number
  imagesHeight?: number
  images?: CachedImageLayout[]
}

export type DiscussionCacheEntry = {
  id: string
  openedAt: number
  posts: Record<string, CachedPostRecord>
  pages: Record<string, string[]>
  common?: any
}

export type CachedHistoryList = {
  discussions: any[]
  showingRead: boolean
  savedAt: number
}

export type CachedBookmarkList = {
  bookmarks: any[]
  reminderCount: number
  includeSeen: boolean
  savedAt: number
}

export type DiscussionCacheStore = {
  discussions: DiscussionCacheEntry[]
  history?: CachedHistoryList | null
  bookmarks?: CachedBookmarkList | null
}

export const emptyDiscussionCache = (): DiscussionCacheStore => ({
  discussions: [],
  history: null,
  bookmarks: null,
})

export const forgetCachedDiscussion = (
  store: DiscussionCacheStore | null | undefined,
  discussionId: string | number,
): DiscussionCacheStore => {
  const source = normalizeDiscussionCache(store)
  const id = String(discussionId)
  return {
    ...source,
    discussions: source.discussions.filter(entry => entry.id !== id),
  }
}

export const normalizeDiscussionCacheLimit = (value: unknown) => {
  const n = Number(value)
  if (!Number.isFinite(n)) {
    return DISCUSSION_CACHE_LIMIT_DEFAULT
  }
  return Math.max(1, Math.min(DISCUSSION_CACHE_LIMIT_MAX, Math.round(n)))
}

export const normalizeDiscussionCache = (value: unknown): DiscussionCacheStore => {
  const discussions = (value as DiscussionCacheStore)?.discussions
  if (!Array.isArray(discussions)) {
    return emptyDiscussionCache()
  }
  const raw = value as DiscussionCacheStore
  const history = raw?.history
  const bookmarks = raw?.bookmarks
  return {
    discussions: discussions.filter(entry => entry && entry.id != null).map(entry => ({
      id: String(entry.id),
      openedAt: Number(entry.openedAt) || 0,
      posts: entry.posts && typeof entry.posts === 'object' ? entry.posts : {},
      pages: entry.pages && typeof entry.pages === 'object' ? entry.pages : {},
      common: entry.common,
    })),
    history:
      history && Array.isArray(history.discussions)
        ? { discussions: history.discussions, showingRead: !!history.showingRead, savedAt: Number(history.savedAt) || 0 }
        : null,
    bookmarks:
      bookmarks && Array.isArray(bookmarks.bookmarks)
        ? {
            bookmarks: bookmarks.bookmarks,
            reminderCount: Number(bookmarks.reminderCount) || 0,
            includeSeen: !!bookmarks.includeSeen,
            savedAt: Number(bookmarks.savedAt) || 0,
          }
        : null,
  }
}

const withDiscussions = (store: DiscussionCacheStore, discussions: DiscussionCacheEntry[]): DiscussionCacheStore => ({
  discussions,
  history: store.history || null,
  bookmarks: store.bookmarks || null,
})

export const discussionQueryParts = (idOrQuery: string | number) => {
  const raw = String(idOrQuery ?? '')
  const splitAt = raw.indexOf('?')
  const path = splitAt >= 0 ? raw.slice(0, splitAt) : raw
  const query = splitAt >= 0 ? raw.slice(splitAt + 1) : ''
  const discussionId = path.split('/').filter(Boolean)[0] || ''
  const params = new URLSearchParams(query)
  const order = params.get('order')
  const fromId = params.get('from_id')
  let page = 'latest'
  if (order === 'older_than' && fromId) {
    page = `older:${fromId}`
  } else if (order === 'newer_than' && fromId) {
    page = `newer:${fromId}`
  }
  const user = params.get('user') || ''
  const text = params.get('text') || ''
  const rating = params.get('rating') || ''
  if (user || text || (rating && rating !== '0')) {
    page = `${page}|${user}|${text}|${rating}`
  }
  return { discussionId, pageKey: page }
}

export const findCachedDiscussion = (store: DiscussionCacheStore | null | undefined, discussionId: string | number) =>
  store?.discussions?.find(entry => entry.id === String(discussionId))

export const touchCachedDiscussion = (
  store: DiscussionCacheStore | null | undefined,
  discussionId: string | number,
  limit: unknown,
  now = Date.now(),
): DiscussionCacheStore => {
  const source = normalizeDiscussionCache(store)
  const id = String(discussionId || '')
  if (!id) {
    return source
  }
  const existing = findCachedDiscussion(source, id)
  const entry: DiscussionCacheEntry = existing
    ? { ...existing, openedAt: now }
    : { id, openedAt: now, posts: {}, pages: {} }
  const rest = source.discussions.filter(item => item.id !== id)
  return withDiscussions(source, [entry, ...rest].slice(0, normalizeDiscussionCacheLimit(limit)))
}

export const snapshotPostLayout = (post: any): CachedPostRecord => {
  const parsed = post?.parsed
  const raw = { ...(post || {}) }
  delete raw.parsed
  delete raw.isClubStart
  const images = (parsed?.images || [])
    .filter((img: any) => img?.src)
    .map((img: any) => ({
      src: img.src,
      width: img.width,
      height: img.height,
      byteLength: img.byteLength,
      skipDownload: img.skipDownload,
      cached: img.cached,
      revealed: img.revealed,
    }))
  return {
    post: raw,
    content: raw.content,
    height: parsed?.height,
    imagesHeight: parsed?.imagesHeight,
    images,
  }
}

const imageLayoutReady = (img: any) =>
  !img?.src || img.src.includes('youtu') || (img.width > 0 && img.height > 0)

export const applyCachedLayouts = (posts: any[] = [], entry?: DiscussionCacheEntry | null) => {
  if (!entry) {
    return posts
  }
  for (const post of posts) {
    if (!post?.parsed || post.isClubStart || post.id == null) {
      continue
    }
    const record = entry.posts[String(post.id)]
    if (!record || !(record.height > 0)) {
      continue
    }
    if (record.content != null && post.content != null && record.content !== post.content) {
      continue
    }
    const bySrc = new Map((record.images || []).filter(img => img.src).map(img => [img.src, img]))
    let ready = true
    if (post.parsed.images?.length) {
      post.parsed.images = post.parsed.images.map((img: any) => {
        const hit = bySrc.get(img.src)
        if (!hit) {
          if (!imageLayoutReady(img)) {
            ready = false
          }
          return img
        }
        const next = {
          ...img,
          width: hit.width,
          height: hit.height,
          byteLength: hit.byteLength,
          skipDownload: hit.skipDownload,
          cached: hit.cached,
          revealed: hit.revealed,
        }
        if (!imageLayoutReady(next)) {
          ready = false
        }
        return next
      })
    }
    if (!ready) {
      continue
    }
    post.parsed.height = record.height
    if (record.imagesHeight > 0) {
      post.parsed.imagesHeight = record.imagesHeight
    }
  }
  return posts
}

export const syncCachedPage = (entry: DiscussionCacheEntry, pageKey: string, posts: any[] = []): DiscussionCacheEntry => {
  const ids = posts.filter(post => post && !post.isClubStart && post.id != null).map(post => String(post.id))
  const seen = new Set(ids)
  const previous = entry.pages[pageKey] || []
  const pages = { ...entry.pages, [pageKey]: ids }
  const keptElsewhere = new Set<string>()
  Object.entries(pages).forEach(([key, list]) => {
    if (key === pageKey) {
      return
    }
    list.forEach(id => keptElsewhere.add(id))
  })
  const stored = { ...entry.posts }
  previous.forEach(id => {
    if (!seen.has(id) && !keptElsewhere.has(id)) {
      delete stored[id]
    }
  })
  posts.forEach(post => {
    if (!post || post.isClubStart || post.id == null) {
      return
    }
    stored[String(post.id)] = snapshotPostLayout(post)
  })
  return { ...entry, posts: stored, pages }
}

export const forgetCachedPost = (entry: DiscussionCacheEntry, postId: string | number): DiscussionCacheEntry => {
  const id = String(postId)
  const posts = { ...entry.posts }
  delete posts[id]
  const pages: Record<string, string[]> = {}
  Object.entries(entry.pages).forEach(([key, list]) => {
    pages[key] = (list || []).filter(item => item !== id)
  })
  return { ...entry, posts, pages }
}

export const cachedPageResponse = (entry: DiscussionCacheEntry | null | undefined, pageKey: string) => {
  const ids = entry?.pages?.[pageKey]
  if (!ids) {
    return null
  }
  const posts = ids.map(id => entry.posts[id]?.post).filter(Boolean)
  return { posts, discussion_common: entry.common || null }
}

export const putCachedDiscussion = (store: DiscussionCacheStore, entry: DiscussionCacheEntry): DiscussionCacheStore => {
  const rest = store.discussions.filter(item => item.id !== entry.id)
  return withDiscussions(store, [entry, ...rest])
}

export const rememberHistoryList = (
  store: DiscussionCacheStore | null | undefined,
  discussions: any[] = [],
  showingRead = false,
  now = Date.now(),
): DiscussionCacheStore => {
  const source = normalizeDiscussionCache(store)
  return {
    ...source,
    history: { discussions, showingRead: !!showingRead, savedAt: now },
  }
}

export const rememberBookmarkList = (
  store: DiscussionCacheStore | null | undefined,
  bookmarks: any[] = [],
  reminderCount = 0,
  includeSeen = false,
  now = Date.now(),
): DiscussionCacheStore => {
  const source = normalizeDiscussionCache(store)
  return {
    ...source,
    bookmarks: {
      bookmarks,
      reminderCount: Number(reminderCount) || 0,
      includeSeen: !!includeSeen,
      savedAt: now,
    },
  }
}

export const cacheDay = (value?: string | null) => {
  if (!value || value.length < 10) {
    return ''
  }
  return `${value.substr(8, 2)}.${value.substr(5, 2)}.${value.substr(0, 4)}`
}

export const utf8ByteLength = (value: unknown) => {
  const json = JSON.stringify(value ?? null)
  try {
    return new TextEncoder().encode(json).length
  } catch (e) {
    return json.length
  }
}

export type CachedClubReport = {
  id: string
  name: string
  posts: number
  from: string
  to: string
}

export const discussionCacheReport = (store: DiscussionCacheStore | null | undefined) => {
  const source = normalizeDiscussionCache(store)
  const clubs: CachedClubReport[] = source.discussions.map(entry => {
    const times = Object.values(entry.posts || {})
      .map(record => record?.post?.inserted_at)
      .filter((value): value is string => typeof value === 'string' && value.length >= 10)
      .sort()
    const discussion = entry.common?.discussion
    const dynamic = discussion?.name_dynamic ? ` ${discussion.name_dynamic}` : ''
    const name = `${discussion?.name_static || ''}${dynamic}`.trim() || entry.id
    const from = cacheDay(times[0])
    const to = cacheDay(times[times.length - 1])
    return {
      id: entry.id,
      name,
      posts: Object.keys(entry.posts || {}).length,
      from,
      to: to && to !== from ? to : '',
    }
  })
  const bookmarkCount = (source.bookmarks?.bookmarks || []).reduce(
    (sum, section) => sum + (Array.isArray(section?.bookmarks) ? section.bookmarks.length : 0),
    0,
  )
  return {
    bytes: utf8ByteLength(source),
    clubs,
    historyCount: source.history?.discussions?.length || 0,
    bookmarkCount,
  }
}
