import {
  bookmarkFetchIncludesSeen,
  bookmarkSectionReadFilterIcon,
  filterBookmarkSection,
  nextBookmarkSectionReadFilter,
  normalizeBookmarkSectionFilters,
} from '../src/lib/bookmarkSections'

const discussions = [
  { id: 1, unreadPostCount: 3 },
  { id: 2, unreadPostCount: 0 },
  { id: 3, unreadPostCount: 1 },
]

describe('bookmark section read filter', () => {
  it('cycles all, unread, then read', () => {
    expect(nextBookmarkSectionReadFilter()).toBe('unread')
    expect(nextBookmarkSectionReadFilter('all')).toBe('unread')
    expect(nextBookmarkSectionReadFilter('unread')).toBe('read')
    expect(nextBookmarkSectionReadFilter('read')).toBe('all')
    expect(nextBookmarkSectionReadFilter('nope')).toBe('unread')
  })

  it('keeps only unread and read modes', () => {
    expect(
      normalizeBookmarkSectionFilters({
        Klub: 'unread',
        Archiv: 'read',
        Vše: 'all',
        Divné: 'yes',
      }),
    ).toEqual({ Klub: 'unread', Archiv: 'read' })
    expect(normalizeBookmarkSectionFilters(null)).toEqual({})
    expect(normalizeBookmarkSectionFilters(['unread'])).toEqual({})
  })

  it('lets a section mode override the star filter', () => {
    expect(filterBookmarkSection(discussions, 'unread', true, true).map(d => d.id)).toEqual([1, 3])
    expect(filterBookmarkSection(discussions, 'read', false, true).map(d => d.id)).toEqual([2])
    expect(filterBookmarkSection(discussions, undefined, true, true).map(d => d.id)).toEqual([1, 2, 3])
    expect(filterBookmarkSection(discussions, 'all', false, true).map(d => d.id)).toEqual([1, 3])
  })

  it('ignores stored section modes while the setting is off', () => {
    expect(filterBookmarkSection(discussions, 'read', true, false)).toBe(discussions)
    expect(filterBookmarkSection(discussions, 'read', false, false).map(d => d.id)).toEqual([1, 3])
    expect(filterBookmarkSection(discussions, 'unread', false, false).map(d => d.id)).toEqual([1, 3])
  })

  it('fetches seen bookmarks only when a visible mode needs them', () => {
    expect(bookmarkFetchIncludesSeen(false, false, { Klub: 'read' })).toBe(false)
    expect(bookmarkFetchIncludesSeen(false, true, {})).toBe(true)
    expect(bookmarkFetchIncludesSeen(true, false, {})).toBe(false)
    expect(bookmarkFetchIncludesSeen(true, false, { Klub: 'unread' })).toBe(false)
    expect(bookmarkFetchIncludesSeen(true, false, { Klub: 'read' })).toBe(true)
    expect(bookmarkFetchIncludesSeen(true, true, { Klub: 'unread' })).toBe(true)
  })

  it('maps modes to line, filled, and crossed eyes', () => {
    expect(bookmarkSectionReadFilterIcon('all')).toBe('eye-outline')
    expect(bookmarkSectionReadFilterIcon(undefined)).toBe('eye-outline')
    expect(bookmarkSectionReadFilterIcon('unread')).toBe('eye')
    expect(bookmarkSectionReadFilterIcon('read')).toBe('eye-off')
  })
})
