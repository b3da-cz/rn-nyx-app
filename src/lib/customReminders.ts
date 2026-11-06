import { Storage } from './Storage'

export type CustomReminderList = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  posts: any[]
}

let cachedLists: CustomReminderList[] | null = null
let cachedPostIds: Set<string> = new Set()
const listeners: Set<() => void> = new Set()
let initPromise: Promise<CustomReminderList[]> | null = null

const sortLists = (lists: CustomReminderList[]): CustomReminderList[] => {
  return [...lists].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

const rebuildPostIds = (lists: CustomReminderList[]) => {
  const ids = new Set<string>()
  for (const list of lists) {
    for (const post of list.posts || []) {
      if (post?.id != null) {
        ids.add(String(post.id))
      }
    }
  }
  cachedPostIds = ids
}

const notifyListeners = () => {
  listeners.forEach(cb => {
    try {
      cb()
    } catch (e) {
      console.warn(e)
    }
  })
}

const hydrateFromRawJson = (raw: string | null | undefined): boolean => {
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      cachedLists = sortLists(parsed)
      rebuildPostIds(cachedLists)
      return true
    }
  } catch (e) {
    console.warn('Failed to parse customReminders from storage', e)
  }
  return false
}

const trySyncInit = () => {
  if (cachedLists !== null) return
  const raw = Storage.getString('customReminders')
  if (raw) {
    hydrateFromRawJson(raw)
  }
}

export const initCustomReminders = async (): Promise<CustomReminderList[]> => {
  if (cachedLists !== null) {
    return cachedLists
  }
  if (initPromise) {
    return initPromise
  }
  initPromise = (async () => {
    try {
      trySyncInit()
      if (cachedLists !== null) {
        return cachedLists
      }
      const stored = await Storage.getCustomRemindersStore()
      if (Array.isArray(stored)) {
        cachedLists = sortLists(stored)
      } else {
        cachedLists = []
      }
      rebuildPostIds(cachedLists)
      return cachedLists
    } finally {
      initPromise = null
    }
  })()
  return initPromise
}

export const getCustomReminderLists = async (): Promise<CustomReminderList[]> => {
  await initCustomReminders()
  return cachedLists || []
}

export const getCustomReminderListsSync = (): CustomReminderList[] => {
  trySyncInit()
  return cachedLists || []
}

export const getCustomReminderList = async (id: string): Promise<CustomReminderList | null> => {
  const lists = await getCustomReminderLists()
  return lists.find(l => l.id === id) || null
}

const saveAndNotify = async (lists: CustomReminderList[]) => {
  cachedLists = sortLists(lists)
  rebuildPostIds(cachedLists)
  await Storage.setCustomRemindersStore(cachedLists)
  notifyListeners()
}

export const createCustomReminderList = async (name: string): Promise<CustomReminderList> => {
  const lists = await getCustomReminderLists()
  const trimmedName = name?.trim() || 'Nový seznam'
  const now = Date.now()
  const newList: CustomReminderList = {
    id: `crl_${now}_${Math.random().toString(36).substring(2, 7)}`,
    name: trimmedName,
    createdAt: now,
    updatedAt: now,
    posts: [],
  }
  const next = [newList, ...lists]
  await saveAndNotify(next)
  return newList
}

export const renameCustomReminderList = async (
  id: string,
  name: string,
): Promise<CustomReminderList | null> => {
  const lists = await getCustomReminderLists()
  const idx = lists.findIndex(l => l.id === id)
  if (idx < 0) return null
  const updated: CustomReminderList = {
    ...lists[idx],
    name: name?.trim() || lists[idx].name,
    updatedAt: Date.now(),
  }
  const next = [...lists]
  next[idx] = updated
  await saveAndNotify(next)
  return updated
}

export const deleteCustomReminderList = async (id: string): Promise<boolean> => {
  const lists = await getCustomReminderLists()
  const next = lists.filter(l => l.id !== id)
  if (next.length === lists.length) return false
  await saveAndNotify(next)
  return true
}

export const addPostToCustomList = async (listId: string, post: any): Promise<boolean> => {
  if (!post || post.id == null) return false
  const lists = await getCustomReminderLists()
  const idx = lists.findIndex(l => l.id === listId)
  if (idx < 0) return false
  const list = lists[idx]
  const existingPosts = list.posts || []
  const postIdx = existingPosts.findIndex(p => String(p.id) === String(post.id))
  let nextPosts: any[]
  if (postIdx >= 0) {
    nextPosts = [...existingPosts]
    nextPosts[postIdx] = post
  } else {
    nextPosts = [post, ...existingPosts]
  }
  const updated: CustomReminderList = {
    ...list,
    posts: nextPosts,
    updatedAt: Date.now(),
  }
  const next = [...lists]
  next[idx] = updated
  await saveAndNotify(next)
  return true
}

export const removePostFromCustomList = async (
  listId: string,
  postId: number | string,
): Promise<boolean> => {
  const lists = await getCustomReminderLists()
  const idx = lists.findIndex(l => l.id === listId)
  if (idx < 0) return false
  const list = lists[idx]
  const nextPosts = (list.posts || []).filter(p => String(p.id) !== String(postId))
  if (nextPosts.length === (list.posts || []).length) return false
  const updated: CustomReminderList = {
    ...list,
    posts: nextPosts,
    updatedAt: Date.now(),
  }
  const next = [...lists]
  next[idx] = updated
  await saveAndNotify(next)
  return true
}

export const removePostFromAllCustomLists = async (
  postId: number | string,
): Promise<boolean> => {
  const lists = await getCustomReminderLists()
  const idStr = String(postId)
  let changed = false
  const now = Date.now()
  const next = lists.map(list => {
    const filtered = (list.posts || []).filter(p => String(p.id) !== idStr)
    if (filtered.length !== (list.posts || []).length) {
      changed = true
      return {
        ...list,
        posts: filtered,
        updatedAt: now,
      }
    }
    return list
  })
  if (changed) {
    await saveAndNotify(next)
  }
  return changed
}

export const isPostInCustomReminders = (postId: number | string): boolean => {
  if (postId == null) return false
  trySyncInit()
  if (cachedLists === null && !initPromise) {
    initCustomReminders().catch(() => {})
  }
  return cachedPostIds.has(String(postId))
}

export const getCustomReminderListsForPost = (postId: number | string): CustomReminderList[] => {
  if (postId == null) return []
  trySyncInit()
  const idStr = String(postId)
  return (cachedLists || []).filter(l => (l.posts || []).some(p => String(p.id) === idStr))
}

export const subscribeCustomReminders = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const formatTimestamp = (ts: number | string): string => {
  if (!ts) return ''
  const date = typeof ts === 'number' ? new Date(ts) : new Date(String(ts))
  if (isNaN(date.getTime())) return String(ts)
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const mins = String(date.getMinutes()).padStart(2, '0')
  return `${d}.${m}.${y} ${hours}:${mins}`
}

export const resetCustomReminders = async (): Promise<void> => {
  cachedLists = []
  cachedPostIds = new Set()
  await Storage.setCustomRemindersStore([])
  notifyListeners()
}
