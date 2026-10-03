export type BookmarkSectionReadFilter = 'all' | 'unread' | 'read'

const ORDER: BookmarkSectionReadFilter[] = ['all', 'unread', 'read']

export function nextBookmarkSectionReadFilter(current?: string): BookmarkSectionReadFilter {
  const index = ORDER.indexOf(current as BookmarkSectionReadFilter)
  const safe = index === -1 ? 0 : index
  return ORDER[(safe + 1) % ORDER.length]
}

export function normalizeBookmarkSectionFilters(value: unknown): Record<string, BookmarkSectionReadFilter> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }
  const filters: Record<string, BookmarkSectionReadFilter> = {}
  for (const [title, filter] of Object.entries(value as Record<string, unknown>)) {
    if (filter === 'unread' || filter === 'read') {
      filters[title] = filter
    }
  }
  return filters
}

function isUnreadDiscussion(discussion?: { unreadPostCount?: number }): boolean {
  return (discussion?.unreadPostCount ?? 0) > 0
}

// Unread or read on a section overrides the list-wide star filter.
// While the setting is off, stored section modes are ignored.
export function filterBookmarkSection<T extends { unreadPostCount?: number }>(
  discussions: T[] | undefined,
  filter: string | undefined,
  isShowingRead: boolean,
  featureEnabled: boolean,
): T[] {
  const list = discussions || []
  if (!featureEnabled) {
    return isShowingRead ? list : list.filter(discussion => isUnreadDiscussion(discussion))
  }
  const mode = filter === 'unread' || filter === 'read' ? filter : isShowingRead ? 'all' : 'unread'
  if (mode === 'all') {
    return list
  }
  if (mode === 'unread') {
    return list.filter(discussion => isUnreadDiscussion(discussion))
  }
  return list.filter(discussion => !isUnreadDiscussion(discussion))
}

// Unread-only payload is enough when every section still resolves to unread.
// A read-only section needs bookmarks/all even if the star filter is unread.
export function bookmarkFetchIncludesSeen(
  featureEnabled: boolean,
  isShowingRead: boolean,
  filters: Record<string, string> | undefined,
): boolean {
  if (!featureEnabled) {
    return !!isShowingRead
  }
  if (isShowingRead) {
    return true
  }
  return Object.values(filters || {}).some(filter => filter === 'read')
}

export function bookmarkSectionReadFilterIcon(filter?: string): string {
  if (filter === 'unread') {
    return 'eye'
  }
  if (filter === 'read') {
    return 'eye-off'
  }
  return 'eye-outline'
}
