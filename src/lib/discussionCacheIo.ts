import {
  createDiscussionCacheQueue,
  DiscussionCacheStore,
  DiscussionListCache,
  normalizeDiscussionCache,
  normalizeListCache,
} from './discussionCache'
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

export const updateDiscussionCache = (mutate: (store: DiscussionCacheStore) => DiscussionCacheStore) =>
  clubs.update(mutate)

export const readDiscussionListCache = () => lists.read()

export const updateDiscussionListCache = (mutate: (store: DiscussionListCache) => DiscussionListCache) =>
  lists.update(mutate)
