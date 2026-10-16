import { filterDiscussions, filterPostsByAuthor, filterPostsByContent } from './Filtering'

export type SearchKind = 'all' | 'discussions' | 'advertisements' | 'events' | 'users' | 'posts'

export const SEARCH_KINDS: SearchKind[] = ['all', 'discussions', 'advertisements', 'events', 'users', 'posts']

export type SearchSection = { key: SearchKind | 'users' | 'posts'; data: any[] }

const UNIFIED_KEYS = ['advertisements', 'discussions', 'events', 'users'] as const

export const searchUser = (row: any) => (row?.username ? row : row?.user?.username ? row.user : row)

export const searchUsers = (bucket: any) =>
  [...(bucket?.exact || []), ...(bucket?.friends || []), ...(bucket?.others || [])]
    .map(searchUser)
    .filter(user => user?.username)

export const plainSearchText = (value: unknown) =>
  String(value ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()

export const searchPostLine = (post: any) => {
  const body = plainSearchText(typeof post?.content === 'string' ? post.content : '')
  const who = post?.username ? `${post.username}${body ? `: ${body}` : ''}` : body
  return [post?.discussion_name, who].filter(Boolean).join(' — ')
}

export const mergeSearchPosts = (existing: any[] = [], next: any[] = []) => {
  const seen = new Set<number | string>()
  const out: any[] = []
  for (const post of [...existing, ...next]) {
    if (post?.id == null || seen.has(post.id)) {
      continue
    }
    seen.add(post.id)
    out.push(post)
  }
  return out
}

const keep = (sections: SearchSection[]) => sections.filter(section => section.data.length > 0)

export const sectionsFromUnified = (res: any, kind: SearchKind, filters?: string[]): SearchSection[] => {
  const discussion = res?.discussion || {}
  const byKey: Record<string, any[]> = {
    advertisements: discussion.advertisements || [],
    discussions: filterDiscussions(discussion.discussions || [], filters),
    events: discussion.events || [],
    users: searchUsers(res?.user),
  }
  const keys = kind === 'all' ? UNIFIED_KEYS : UNIFIED_KEYS.filter(key => key === kind)
  return keep(keys.map(key => ({ key, data: byKey[key] || [] })))
}

export const sectionsFromUsers = (res: any): SearchSection[] => {
  const data = searchUsers(res)
  return data.length ? [{ key: 'users', data }] : []
}

export const sectionsFromPosts = (posts: any[], filters?: string[], blockedUsers?: string[]): SearchSection[] => {
  const data = filterPostsByAuthor(filterPostsByContent(posts || [], filters), blockedUsers || [])
  return data.length ? [{ key: 'posts', data }] : []
}

type SearchApi = {
  search: (phrase: string, isUnified?: boolean, isUsername?: boolean) => Promise<any>
  searchV2: (params: { text?: string; order?: string; fromId?: number }) => Promise<any>
}

// Posts use search-v2. The first page also calls GET search?search=, which nyx-api exposes on search()
// and the app did not call. Later pages follow search-v2 older_than.
export const loadSearchPosts = async (api: SearchApi, phrase: string, fromId?: number) => {
  if (fromId) {
    const older = await api.searchV2({ text: phrase, order: 'older_than', fromId })
    return older?.posts || []
  }
  const [fulltext, plain] = await Promise.all([
    api.searchV2({ text: phrase, order: 'newest' }),
    api.search(phrase, false, false),
  ])
  return mergeSearchPosts(fulltext?.posts || [], plain?.posts || [])
}

export const loadSearch = async (
  api: SearchApi,
  phrase: string,
  kind: SearchKind,
  filters?: string[],
  blockedUsers?: string[],
  fromId?: number,
): Promise<SearchSection[]> => {
  if (kind === 'posts') {
    return sectionsFromPosts(await loadSearchPosts(api, phrase, fromId), filters, blockedUsers)
  }
  if (kind === 'users') {
    return sectionsFromUsers(await api.search(phrase, false, true))
  }
  return sectionsFromUnified(await api.search(phrase, true), kind, filters)
}
