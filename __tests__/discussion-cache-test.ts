import {
  applyCachedLayouts,
  cachedPageResponse,
  discussionCacheReport,
  discussionQueryParts,
  createDiscussionCacheQueue,
  emptyDiscussionCache,
  emptyListCache,
  forgetCachedDiscussion,
  mergeBookmarkSections,
  mergeHistoryDiscussions,
  rememberBookmarkList,
  rememberBookmarksOnList,
  rememberHistoryList,
  rememberHistoryOnList,
  syncCachedPage,
  touchCachedDiscussion,
  DISCUSSION_CACHE_LIMIT_MAX,
  normalizeDiscussionCacheLimit,
} from '../src/lib/discussionCache'

const post = (id: number, content = `post ${id}`, height = 100) => ({
  id,
  content,
  parsed: {
    height,
    imagesHeight: 40,
    images: [{ src: `https://nyx.cz/${id}.jpg`, width: 20, height: 10, byteLength: 50 }],
  },
})

describe('discussion cache', () => {
  it('accepts up to 1000 cached clubs', () => {
    expect(DISCUSSION_CACHE_LIMIT_MAX).toBe(1000)
    expect(normalizeDiscussionCacheLimit(1000)).toBe(1000)
    expect(normalizeDiscussionCacheLimit(1001)).toBe(1000)
    expect(normalizeDiscussionCacheLimit(200)).toBe(200)
  })

  it('keys the latest page and older or newer pages', () => {
    expect(discussionQueryParts('15').pageKey).toBe('latest')
    expect(discussionQueryParts('15?order=older_than&from_id=8')).toEqual({
      discussionId: '15',
      pageKey: 'older:8',
    })
    expect(discussionQueryParts('15?order=newer_than&from_id=3&user=ada').pageKey).toBe('newer:3|ada||')
  })

  it('keeps the last opened clubs and drops the oldest', () => {
    let store = emptyDiscussionCache()
    store = touchCachedDiscussion(store, 1, 2, 1)
    store = touchCachedDiscussion(store, 2, 2, 2)
    store = touchCachedDiscussion(store, 3, 2, 3)
    expect(store.discussions.map(entry => entry.id)).toEqual(['3', '2'])
  })

  it('serves stored image size and post height, and drops a post missing from its page', () => {
    const entry = syncCachedPage(
      {
        id: '9',
        openedAt: 1,
        posts: {
          '2': { post: { id: 2, content: 'gone' }, height: 80 },
          '4': { post: { id: 4, content: 'kept' }, height: 80 },
        },
        pages: { latest: ['2'], older: ['4'] },
      },
      'latest',
      [post(1)],
    )
    expect(entry.posts['2']).toBeUndefined()
    expect(entry.posts['4']?.post.id).toBe(4)
    expect(entry.pages.older).toEqual(['4'])
    const fresh = [{ id: 1, content: 'post 1', parsed: { images: [{ src: 'https://nyx.cz/1.jpg' }] } }]
    applyCachedLayouts(fresh, entry)
    expect(fresh[0].parsed.height).toBe(100)
    expect(fresh[0].parsed.images[0].width).toBe(20)
    expect(fresh[0].parsed.images[0].byteLength).toBe(50)
  })

  it('does not reuse height when the post content changed', () => {
    const entry = syncCachedPage({ id: '9', openedAt: 1, posts: {}, pages: {} }, 'latest', [post(1, 'old')])
    const fresh = [{ id: 1, content: 'new', parsed: { images: [{ src: 'https://nyx.cz/1.jpg' }] } }]
    applyCachedLayouts(fresh, entry)
    expect(fresh[0].parsed.height).toBeUndefined()
  })

  it('does not lock post height when cached image only has 3:2 placeholder dimensions', () => {
    const entry = syncCachedPage({ id: '9', openedAt: 1, posts: {}, pages: {} }, 'latest', [
      {
        id: 1,
        content: 'post 1',
        parsed: {
          height: 260,
          imagesHeight: 220,
          images: [{ src: 'https://nyx.cz/1.jpg', width: 3, height: 2, skipDownload: true, byteLength: 500000 }],
        },
      },
    ])
    const fresh: any[] = [{ id: 1, content: 'post 1', parsed: { images: [{ src: 'https://nyx.cz/1.jpg' }] } }]
    applyCachedLayouts(fresh, entry)
    expect(fresh[0].parsed.height).toBeUndefined()
    expect(fresh[0].parsed.images[0].byteLength).toBe(500000)
  })

  it('keeps history and bookmarks and reports club dates', () => {
    const entry = syncCachedPage({ id: '9', openedAt: 1, posts: {}, pages: {}, common: { discussion: { name_static: 'Klub' } } }, 'latest', [
      { id: 1, content: 'a', inserted_at: '2020-01-02 10:00:00', parsed: { height: 80, images: [] } },
      { id: 2, content: 'b', inserted_at: '2024-05-06 11:00:00', parsed: { height: 90, images: [] } },
    ])
    let store = rememberHistoryList({ discussions: [entry] }, [{ id: 9 }], false)
    store = rememberBookmarkList(store, [{ bookmarks: [{}, {}] }], 1, true)
    store = touchCachedDiscussion(store, 9, 30, 5)
    expect(store.history?.discussions).toHaveLength(1)
    expect(store.bookmarks?.bookmarks).toHaveLength(1)
    const report = discussionCacheReport(store)
    expect(report.clubs[0]).toMatchObject({ name: 'Klub', posts: 2, from: '02.01.2020', to: '06.05.2024' })
    expect(report.historyCount).toBe(1)
    expect(report.bookmarkCount).toBe(2)
    expect(report.bytes).toBeGreaterThan(10)
  })

  it('keeps a club saved while an older read is still finishing', async () => {
    let disk: any = null
    const queue = createDiscussionCacheQueue(
      async () => disk,
      async store => {
        disk = store
      },
    )
    const saved = queue.update(store => ({
      ...store,
      discussions: [{ id: '9', openedAt: 1, posts: {}, pages: {} }],
    }))
    const history = queue.update(store => rememberHistoryList(store, [{ id: 1 }], false))
    await Promise.all([saved, history])
    expect(disk.discussions.map((entry: any) => entry.id)).toEqual(['9'])
    expect(disk.history.discussions).toHaveLength(1)
  })

  it('does not replace the cache when reading it fails', async () => {
    const writes: any[] = []
    const queue = createDiscussionCacheQueue(
      async () => {
        throw new Error('corrupt')
      },
      async store => {
        writes.push(store)
      },
    )
    await expect(queue.update(store => rememberHistoryList(store, [{ id: 1 }], false))).rejects.toThrow('corrupt')
    expect(writes).toEqual([])
  })

  it('drops one club and can clear the whole store', () => {
    const store = rememberHistoryList(
      { discussions: [{ id: '1', openedAt: 1, posts: {}, pages: {} }, { id: '2', openedAt: 2, posts: {}, pages: {} }] },
      [{ id: 1 }],
      false,
    )
    const one = forgetCachedDiscussion(store, '1')
    expect(one.discussions.map(entry => entry.id)).toEqual(['2'])
    expect(one.history?.discussions).toHaveLength(1)
    const cleared = emptyDiscussionCache()
    expect(cleared.discussions).toEqual([])
    expect(cleared.history).toBeNull()
    expect(cleared.bookmarks).toBeNull()
  })

  it('replays a cached page with the stored discussion and falls back to latest or filtered posts', () => {
    const entry = syncCachedPage({ id: '9', openedAt: 1, posts: {}, pages: {}, common: { ok: true } }, 'older:4', [
      post(3),
      post(2),
    ])
    expect(cachedPageResponse(entry, 'older:4')?.posts.map((item: any) => item.id)).toEqual([3, 2])
    expect(cachedPageResponse(entry, 'older:4')?.discussion_common).toMatchObject({ ok: true })
    // When offline and asking for latest, reconstructs available posts instead of returning null
    expect(cachedPageResponse(entry, 'latest')?.posts.map((item: any) => item.id)).toEqual([3, 2])

    // When lastSeenPostId differs from cached page key (e.g. older:10 requested offline)
    expect(cachedPageResponse(entry, 'older:10')?.posts.map((item: any) => item.id)).toEqual([3, 2])

    // When older:2 is requested and no posts are < 2, returns empty array rather than failing
    expect(cachedPageResponse(entry, 'older:2')?.posts).toEqual([])

    // When newer:2 is requested, returns posts > 2
    expect(cachedPageResponse(entry, 'newer:2')?.posts.map((item: any) => item.id)).toEqual([3])

    // When newer:5 is requested and no posts are > 5, returns empty array rather than failing
    expect(cachedPageResponse(entry, 'newer:5')?.posts).toEqual([])

    // Empty club returns null
    expect(cachedPageResponse({ id: '9', openedAt: 1, posts: {}, pages: {} }, 'latest')).toBeNull()
  })

  it('does not wipe cached history when empty or unread-only discussions are received', () => {
    let list = rememberHistoryOnList(emptyListCache(), [{ discussion_id: 10, name: 'A' }, { discussion_id: 20, name: 'B' }], true)
    expect(list.history?.discussions).toHaveLength(2)

    // Receiving empty discussions must not wipe cache
    list = rememberHistoryOnList(list, [], false)
    expect(list.history?.discussions).toHaveLength(2)

    // Receiving only unread item (id 10) merges with read item (id 20) instead of dropping it
    list = rememberHistoryOnList(list, [{ discussion_id: 10, name: 'A fresh' }], false)
    expect(list.history?.discussions).toHaveLength(2)
    expect(list.history?.discussions[0].name).toBe('A fresh')
    expect(list.history?.discussions[1].discussion_id).toBe(20)
  })

  it('does not wipe cached bookmarks when empty unread categories are received', () => {
    const fullCategories = [
      { category: { id: 1, category_name: 'Cat 1' }, bookmarks: [{ discussion_id: 101, name: 'B1' }, { discussion_id: 102, name: 'B2' }] },
    ]
    let list = rememberBookmarksOnList(emptyListCache(), fullCategories, 2, true)
    expect(list.bookmarks?.bookmarks?.[0].bookmarks).toHaveLength(2)

    // When everything is read, API returns categories with bookmarks: []
    const emptyUnread = [{ category: { id: 1, category_name: 'Cat 1' }, bookmarks: [] }]
    list = rememberBookmarksOnList(list, emptyUnread, 0, false)
    expect(list.bookmarks?.bookmarks?.[0].bookmarks).toHaveLength(2)

    // When only 1 item is unread, it merges and preserves the read item
    const oneUnread = [{ category: { id: 1, category_name: 'Cat 1' }, bookmarks: [{ discussion_id: 101, name: 'B1 unread' }] }]
    list = rememberBookmarksOnList(list, oneUnread, 1, false)
    expect(list.bookmarks?.bookmarks?.[0].bookmarks).toHaveLength(2)
    expect(list.bookmarks?.bookmarks?.[0].bookmarks[0].name).toBe('B1 unread')
    expect(list.bookmarks?.bookmarks?.[0].bookmarks[1].discussion_id).toBe(102)
  })

  it('keeps posts from earlier visits when a later page is saved', () => {
    let entry: any = { id: '5', openedAt: 1, posts: {}, pages: {} }
    const older = Array.from({ length: 80 }, (_, i) => post(i + 1))
    const newer = Array.from({ length: 80 }, (_, i) => post(i + 5000))
    entry = syncCachedPage(entry, 'older:101', older)
    entry = syncCachedPage(entry, 'newer:100', newer)
    entry = syncCachedPage(entry, 'older:9001', [post(9000), post(8900)])
    expect(Object.keys(entry.posts)).toHaveLength(162)
    expect(entry.posts['1']?.post.id).toBe(1)
    expect(entry.posts['5079']?.post.id).toBe(5079)
    expect(entry.pages['older:101']).toHaveLength(80)
    expect(entry.pages['newer:100']).toHaveLength(80)
  })

  it('caps total posts per club at MAX_CACHED_POSTS_PER_CLUB', () => {
    let entry: any = { id: '5', openedAt: 1, posts: {}, pages: {} }
    const batch1 = Array.from({ length: 150 }, (_, i) => post(i + 1))
    const batch2 = Array.from({ length: 100 }, (_, i) => post(i + 1000))
    entry = syncCachedPage(entry, 'page1', batch1)
    entry = syncCachedPage(entry, 'page2', batch2)
    expect(Object.keys(entry.posts)).toHaveLength(200)
  })

  it('drops a post that disappeared from a page already in the cache', () => {
    let entry: any = syncCachedPage({ id: '5', openedAt: 1, posts: {}, pages: {} }, 'older:10', [
      post(9),
      post(8),
      post(7),
    ])
    entry = syncCachedPage(entry, 'latest', [post(20)])
    entry = syncCachedPage(entry, 'older:10', [post(9), post(7)])
    expect(entry.posts['8']).toBeUndefined()
    expect(entry.pages['older:10']).toEqual(['9', '7'])
    expect(entry.posts['20']?.post.id).toBe(20)
    expect(entry.posts['9']?.post.id).toBe(9)
  })

  it('peeks in-memory store without triggering reads', async () => {
    let readCount = 0
    const queue = createDiscussionCacheQueue(
      async () => {
        readCount++
        return { discussions: [{ id: '42', openedAt: 1, posts: {}, pages: {} }] }
      },
      async () => {},
    )
    expect(queue.peek()).toBeNull()
    expect(readCount).toBe(0)
    const data = await queue.read()
    expect(readCount).toBe(1)
    expect(queue.peek()).toBe(data)
  })
})
