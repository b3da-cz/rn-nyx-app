import { newerPageScrollIndex } from '../src/lib/discussionScroll'

const posts = (...ids: number[]) => ids.map(id => ({ id }))

describe('newerPageScrollIndex', () => {
  it('lands on the oldest post the newer page actually added', () => {
    const before = [20, 19, 18]
    const merged = posts(30, 29, 28, 20, 19, 18)
    expect(newerPageScrollIndex(merged, before)).toBe(2)
  })

  it('uses the next newer post when a fetched id is missing', () => {
    const before = [20, 19]
    const merged = posts(30, 28, 20, 19)
    expect(newerPageScrollIndex(merged, before)).toBe(1)
  })

  it('stays on the only new post even when that post is the top of the list', () => {
    expect(newerPageScrollIndex(posts(21, 20, 19), [20, 19])).toBe(0)
  })

  it('does not scroll when the fetch added nothing', () => {
    expect(newerPageScrollIndex(posts(20, 19), [20, 19])).toBeNull()
    expect(newerPageScrollIndex([], [20])).toBeNull()
  })
})
