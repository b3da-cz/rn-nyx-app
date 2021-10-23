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
