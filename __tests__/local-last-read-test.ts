import {
  initLocalLastRead,
  getLocalLastRead,
  getLocalLastReadEntry,
  hasAnyLocalLastRead,
  setLocalLastRead,
  toggleLocalLastRead,
  consumeLocalLastRead,
  clearLocalLastRead,
  isLocalLastReadEnabled,
  applyLocalLastReadToDiscussions,
  hydrateLocalLastRead,
  normalizeLocalLastRead,
  resetLocalLastRead,
} from '../src/lib/localLastRead'

describe('localLastRead', () => {
  beforeEach(async () => {
    await clearLocalLastRead()
  })

  it('normalizes local last read records correctly', () => {
    expect(normalizeLocalLastRead(null)).toEqual({})
    expect(normalizeLocalLastRead('invalid')).toEqual({})
    expect(
      normalizeLocalLastRead({
        '100': 500,
        '200': { postId: '600', unreadCount: 5 },
        '300': 0,
        '400': -5,
        '500': 'not-a-number',
      }),
    ).toEqual({
      '100': { postId: 500, unreadCount: 1 },
      '200': { postId: 600, unreadCount: 5 },
    })
  })

  it('gets, sets, and clears local last read for a discussion', async () => {
    expect(getLocalLastRead(123)).toBeNull()
    expect(hasAnyLocalLastRead()).toBe(false)

    await setLocalLastRead(123, 4567, 5)
    expect(getLocalLastRead(123)).toBe(4567)
    expect(getLocalLastRead('123')).toBe(4567)
    expect(getLocalLastReadEntry(123)).toEqual({ postId: 4567, unreadCount: 5 })
    expect(hasAnyLocalLastRead()).toBe(true)

    await setLocalLastRead(123, null)
    expect(getLocalLastRead(123)).toBeNull()
    expect(hasAnyLocalLastRead()).toBe(false)
  })

  it('toggles local last read on and off with unreadCount', async () => {
    const first = await toggleLocalLastRead(123, 4567, 4)
    expect(first).toEqual({ isSet: true, postId: 4567, unreadCount: 4 })
    expect(getLocalLastRead(123)).toBe(4567)
    expect(getLocalLastReadEntry(123)).toEqual({ postId: 4567, unreadCount: 4 })

    // Toggling with the same post id unsets it
    const second = await toggleLocalLastRead(123, 4567, 4)
    expect(second).toEqual({ isSet: false, postId: null, unreadCount: 0 })
    expect(getLocalLastRead(123)).toBeNull()

    // Setting a different post id replaces it
    await toggleLocalLastRead(123, 100, 2)
    const third = await toggleLocalLastRead(123, 200, 7)
    expect(third).toEqual({ isSet: true, postId: 200, unreadCount: 7 })
    expect(getLocalLastReadEntry(123)).toEqual({ postId: 200, unreadCount: 7 })
  })

  it('consumes local last read and clears it from storage for future visits', async () => {
    await setLocalLastRead(123, 4567, 3)
    expect(getLocalLastRead(123)).toBe(4567)

    const consumed = consumeLocalLastRead(123)
    expect(consumed).toBe(4567)

    // Second consume returns null because it was already cleared
    expect(consumeLocalLastRead(123)).toBeNull()
    expect(getLocalLastRead(123)).toBeNull()
  })

  it('clears all or specific discussion entries', async () => {
    await setLocalLastRead(1, 10, 2)
    await setLocalLastRead(2, 20, 4)

    await clearLocalLastRead(1)
    expect(getLocalLastRead(1)).toBeNull()
    expect(getLocalLastRead(2)).toBe(20)

    await clearLocalLastRead()
    expect(getLocalLastRead(2)).toBeNull()
  })

  it('checks if local last read feature is enabled in config', () => {
    expect(isLocalLastReadEnabled(undefined)).toBe(true)
    expect(isLocalLastReadEnabled(null)).toBe(true)
    expect(isLocalLastReadEnabled({})).toBe(true)
    expect(isLocalLastReadEnabled({ isLocalLastReadEnabled: true })).toBe(true)
    expect(isLocalLastReadEnabled({ isLocalLastReadEnabled: false })).toBe(false)
  })

  it('applies localUnreadCount to discussion list while preserving server unreadPostCount', async () => {
    await setLocalLastRead(100, 555, 5)
    await setLocalLastRead(150, 777, 3)

    const discussions = [
      { discussion_id: 100, last_seen_post_id: 560, unreadPostCount: 10, new_posts_count: 10, new_images_count: 1 },
      { discussion_id: 150, last_seen_post_id: 780, unreadPostCount: 0, new_posts_count: 0 },
      { discussion_id: 200, last_seen_post_id: 300, unreadPostCount: 0, new_posts_count: 0 },
    ]

    const updated = applyLocalLastReadToDiscussions(discussions, { isLocalLastReadEnabled: true })
    // Discussion 100 has 10 server unread + 5 local unread, and jumps to local post 555
    expect(updated[0].last_seen_post_id).toBe(555)
    expect(updated[0].unreadPostCount).toBe(10)
    expect(updated[0].new_images_count).toBe(1)
    expect(updated[0].localUnreadCount).toBe(5)

    // Discussion 150 has 0 server unread + 3 local unread
    expect(updated[1].last_seen_post_id).toBe(777)
    expect(updated[1].unreadPostCount).toBe(0)
    expect(updated[1].localUnreadCount).toBe(3)

    // Discussion 200 without local override remains unchanged
    expect(updated[2].last_seen_post_id).toBe(300)
    expect(updated[2].unreadPostCount).toBe(0)
    expect(updated[2].localUnreadCount).toBeUndefined()

    // If disabled in config, list is returned as-is
    const disabled = applyLocalLastReadToDiscussions(discussions, { isLocalLastReadEnabled: false })
    expect(disabled[0].last_seen_post_id).toBe(560)
    expect(disabled[0].localUnreadCount).toBeUndefined()
  })

  it('survives app restart by rehydrating from storage', async () => {
    await setLocalLastRead(999, 12345, 7)
    expect(getLocalLastRead(999)).toBe(12345)

    // Simulate process restart: memory reset and unhydrated
    resetLocalLastRead()

    // Immediate sync or async reads restore from persistent storage
    expect(getLocalLastRead(999)).toBe(12345)
    expect(getLocalLastReadEntry(999)).toEqual({ postId: 12345, unreadCount: 7 })
    expect(hasAnyLocalLastRead()).toBe(true)

    // Explicit hydrate call also returns the hydrated store
    const hydrated = await hydrateLocalLastRead()
    expect(hydrated['999']).toEqual({ postId: 12345, unreadCount: 7 })
  })

  it('resets local unread in discussions list once consumed, restoring server last seen id', async () => {
    await setLocalLastRead(100, 555, 5)

    const rawDiscussions = [
      { discussion_id: 100, last_seen_post_id: 560, unreadPostCount: 0 },
    ]

    // Apply local unread: discussion becomes unread with local badge and post id 555
    const withLocal = applyLocalLastReadToDiscussions(rawDiscussions, { isLocalLastReadEnabled: true })
    expect(withLocal[0].last_seen_post_id).toBe(555)
    expect(withLocal[0].localUnreadCount).toBe(5)

    // User enters club: consumed
    consumeLocalLastRead(100)
    expect(getLocalLastRead(100)).toBeNull()

    // Offline return: re-applying to the rendered discussion list clears local unread and restores server post id 560
    const reset = applyLocalLastReadToDiscussions(withLocal, { isLocalLastReadEnabled: true })
    expect(reset[0].last_seen_post_id).toBe(560)
    expect(reset[0].localUnreadCount).toBeUndefined()
  })
})
