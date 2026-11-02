import {
  createDiscussionCacheQueue,
  DiscussionCacheEntry,
  DiscussionCacheStore,
  DiscussionListCache,
  findCachedDiscussion,
  normalizeDiscussionCache,
  normalizeListCache,
} from './discussionCache'
import { FeedCacheStore, normalizeFeedCache } from './feedCache'
import { Storage } from './Storage'

const clubs = createDiscussionCacheQueue(
  () => Storage.getDiscussionCache(),
  async store => {
    if (store.history || store.bookmarks) {
      const existing = normalizeListCache(await Storage.getDiscussionListCache())
      await Storage.setDiscussionListCache({
        history: existing.history || store.history || null,
        bookmarks: existing.bookmarks || store.bookmarks || null,
      })
      delete (store as any).history
      delete (store as any).bookmarks
    }
    const { history: _history, bookmarks: _bookmarks, ...clubsOnly } = store
    await Storage.setDiscussionCache(clubsOnly)
  },
)

const lists = createDiscussionCacheQueue(
  async () => {
    const own = normalizeListCache(await Storage.getDiscussionListCache())
    if (own.history || own.bookmarks) {
      return own
    }
    const legacy = normalizeDiscussionCache(await Storage.getDiscussionCache())
    if (legacy.history || legacy.bookmarks) {
      return { history: legacy.history, bookmarks: legacy.bookmarks }
    }
    return own
  },
  store => Storage.setDiscussionListCache(store),
  normalizeListCache,
)

export const readDiscussionCache = () => clubs.read()

export const readCachedDiscussion = async (discussionId: string | number): Promise<DiscussionCacheEntry | null> => {
  const id = String(discussionId || '')
  if (!id) {
    return null
  }
  const inMemory = clubs.peek()
  if (inMemory) {
    const found = findCachedDiscussion(inMemory, id)
    if (found) {
      return found
    }
  }
  try {
    const club = await Storage.getCachedClub(id)
    if (club && typeof club === 'object') {
      return club
    }
  } catch (e) {
    console.warn(`Failed to read cached club "${id}":`, e)
  }
  return null
}

export const updateDiscussionCache = (mutate: (store: DiscussionCacheStore) => DiscussionCacheStore) =>
  clubs.update(mutate)

export const readDiscussionListCache = () => lists.read()

export const updateDiscussionListCache = (mutate: (store: DiscussionListCache) => DiscussionListCache) =>
  lists.update(mutate)

const feeds = createDiscussionCacheQueue(
  () => Storage.getFeedCache(),
  store => Storage.setFeedCache(store),
  normalizeFeedCache,
)

export const readFeedCache = () => feeds.read()

export const updateFeedCache = (mutate: (store: FeedCacheStore) => FeedCacheStore) => feeds.update(mutate)
