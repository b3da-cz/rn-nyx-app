export const filterDiscussions = (list: any[], filters?: string[]): any[] => {
  return list.filter(d => filter(d.full_name?.length ? d.full_name : d.discussion_name, filters))
}

export const isDiscussionPermitted = (title: string, filters?: string[]): boolean => {
  return filter(title, filters)
}

export const filterPostsByContent = (list: any[], filters?: string[]): any[] => {
  return list.filter(p => filter(p.content, filters))
}

export const filterPostsByAuthor = (list: any[], blockedUsers: string[]): any[] => {
  return list.filter(p => !blockedUsers.includes(p.username))
}

const LISTING_POST_TYPES = new Set(['event', 'advertisement'])

// A club whose posts are ads or events (opened from history or bookmarks).
// A real event or ad discussion has ordinary posts, so composing stays available there.
export const isListingDiscussion = (
  title?: string | null,
  posts?: { content_raw?: { type?: string | null } | null; post_type?: string | null }[] | null,
): boolean => {
  if (title?.includes('tržiště')) {
    return true
  }
  return !!posts?.some(post => LISTING_POST_TYPES.has(post?.content_raw?.type || post?.post_type || ''))
}

const filter = (str: string, filters?: string[]): boolean => {
  filters = filters && filters.length > 0 ? filters : []
  if (!str || str?.length === 0 || filters.length === 0) {
    return true
  }
  const normalized = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  for (const phrase of filters) {
    if (normalized?.length > 0 && normalized.includes(phrase)) {
      return false
    }
  }
  return true
}
