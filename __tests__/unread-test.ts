import { applyUnreadFlags, getOldestUnreadIndex } from '../src/lib/unread'

const posts = (...ids: number[]) => ids.map(id => ({ id }))

describe('getOldestUnreadIndex', () => {
  it('returns 0 for empty lists', () => {
    expect(getOldestUnreadIndex([], 8)).toBe(0)
  })

  it('lands on the post above last_seen when last_seen is present', () => {
    expect(getOldestUnreadIndex(posts(10, 9, 8, 7, 6), 8)).toBe(1)
  })

  it('lands on the oldest unread when last_seen was deleted', () => {
    expect(getOldestUnreadIndex(posts(10, 9, 7, 6), 8)).toBe(1)
    expect(getOldestUnreadIndex(posts(10, 9), 8)).toBe(1)
  })

  it('stays at the top when there are no unread posts', () => {
    expect(getOldestUnreadIndex(posts(8, 7, 6), 8)).toBe(0)
    expect(getOldestUnreadIndex(posts(7, 6), 8)).toBe(0)
  })

  it('uses the new flag when last_seen is unknown', () => {
    const list = [
      { id: 10, new: true },
      { id: 9, new: true },
      { id: 7, new: false },
    ]
    expect(getOldestUnreadIndex(list)).toBe(1)
  })
})

describe('applyUnreadFlags', () => {
  it('sets new flag on posts newer than lastSeen', () => {
    const list: any[] = [{ id: 12 }, { id: 10 }, { id: 8 }]
    applyUnreadFlags(list, 9)
    expect(list[0].new).toBe(true)
    expect(list[1].new).toBe(true)
    expect(list[2].new).toBeUndefined()
  })

  it('resets new flag when strictReset is true', () => {
    const list = [{ id: 12, new: false }, { id: 10, new: false }, { id: 8, new: true }]
    applyUnreadFlags(list, 9, true)
    expect(list[0].new).toBe(true)
    expect(list[1].new).toBe(true)
    expect(list[2].new).toBe(false)
  })
})

