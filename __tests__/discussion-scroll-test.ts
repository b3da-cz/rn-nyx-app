import { initialOlderEndState, newerPageScrollIndex, noteOlderPage } from '../src/lib/discussionScroll'

const posts = (...ids: number[]) => ids.map(id => ({ id }))

describe('noteOlderPage', () => {
  it('shows the club start after one valid empty page and ignores further tries', () => {
    const once = noteOlderPage(initialOlderEndState(), 0)
    expect(once).toEqual({ attempts: 1, reached: true, showStart: true })
    expect(noteOlderPage(once, 0)).toEqual({ attempts: 1, reached: true, showStart: false })
  })

  it('does not count a skipped request and clears the end when posts arrive', () => {
    expect(noteOlderPage(initialOlderEndState(), -1)).toEqual({ attempts: 0, reached: false, showStart: false })
    const afterPosts = noteOlderPage({ attempts: 1, reached: false }, 3)
    expect(afterPosts).toEqual({ attempts: 0, reached: false, showStart: false })
  })

  it('stops after the second empty page', () => {
    const first = noteOlderPage({ attempts: 1, reached: false }, 0)
    expect(first).toEqual({ attempts: 2, reached: true, showStart: true })
    expect(noteOlderPage({ attempts: 2, reached: false }, 0).attempts).toBe(2)
  })
})

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
