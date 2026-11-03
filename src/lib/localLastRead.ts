import { Storage } from './Storage'

export type LocalLastReadEntry = {
  postId: number
  unreadCount: number
}

export type LocalLastReadStore = Record<string, LocalLastReadEntry>

let memoryStore: LocalLastReadStore = {}
let isHydrated = false

export function normalizeLocalLastRead(raw: unknown): LocalLastReadStore {
  if (!raw || typeof raw !== 'object') {
    return {}
  }
  const result: LocalLastReadStore = {}
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!key) continue
    if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
      result[String(key)] = { postId: Math.trunc(val), unreadCount: 1 }
    } else if (val && typeof val === 'object') {
      const entry = val as Record<string, unknown>
      const id = Number(entry.postId)
      const count = Number(entry.unreadCount)
      if (Number.isFinite(id) && id > 0) {
        result[String(key)] = {
          postId: Math.trunc(id),
          unreadCount: Number.isFinite(count) && count >= 0 ? Math.trunc(count) : 1,
        }
      }
    }
  }
  return result
}

export function initLocalLastRead(store?: unknown): void {
  memoryStore = normalizeLocalLastRead(store)
  isHydrated = true
}

export async function hydrateLocalLastRead(): Promise<LocalLastReadStore> {
  if (!isHydrated) {
    const stored = await Storage.getLocalLastReadStore()
    memoryStore = normalizeLocalLastRead(stored)
    isHydrated = true
  }
  return memoryStore
}

export function isLocalLastReadEnabled(config?: { isLocalLastReadEnabled?: boolean } | null): boolean {
  return config?.isLocalLastReadEnabled !== false
}

export function hasAnyLocalLastRead(config?: { isLocalLastReadEnabled?: boolean } | null): boolean {
  return isLocalLastReadEnabled(config) && Object.keys(memoryStore).length > 0
}

export function getLocalLastReadEntry(discussionId?: number | string | null): LocalLastReadEntry | null {
  if (!discussionId) return null
  const entry = memoryStore[String(discussionId)]
  return entry && entry.postId > 0 ? entry : null
}

export function getLocalLastRead(discussionId?: number | string | null): number | null {
  return getLocalLastReadEntry(discussionId)?.postId ?? null
}

export async function setLocalLastRead(
  discussionId: number | string,
  postId: number | string | null,
  unreadCount = 1,
): Promise<void> {
  const discKey = String(discussionId)
  const numericPostId = Number(postId)
  if (!numericPostId || numericPostId <= 0) {
    delete memoryStore[discKey]
  } else {
    const numCount = Number(unreadCount)
    memoryStore[discKey] = {
      postId: Math.trunc(numericPostId),
      unreadCount: Number.isFinite(numCount) && numCount >= 0 ? Math.trunc(numCount) : 1,
    }
  }
  await Storage.setLocalLastReadStore(memoryStore)
}

export async function toggleLocalLastRead(
  discussionId: number | string,
  postId: number | string,
  unreadCount = 1,
): Promise<{ isSet: boolean; postId: number | null; unreadCount: number }> {
  const current = getLocalLastRead(discussionId)
  const target = Math.trunc(Number(postId))
  if (current === target) {
    await setLocalLastRead(discussionId, null)
    return { isSet: false, postId: null, unreadCount: 0 }
  }
  await setLocalLastRead(discussionId, target, unreadCount)
  return {
    isSet: true,
    postId: target,
    unreadCount: getLocalLastReadEntry(discussionId)?.unreadCount ?? 0,
  }
}

export function consumeLocalLastRead(discussionId?: number | string | null): number | null {
  if (!discussionId) return null
  const discKey = String(discussionId)
  const entry = memoryStore[discKey]
  if (entry && entry.postId > 0) {
    delete memoryStore[discKey]
    Storage.setLocalLastReadStore(memoryStore).catch(e => console.warn('localLastRead persist failed', e))
    return entry.postId
  }
  return null
}

export async function clearLocalLastRead(discussionId?: number | string | null): Promise<void> {
  if (discussionId) {
    delete memoryStore[String(discussionId)]
  } else {
    memoryStore = {}
  }
  await Storage.setLocalLastReadStore(memoryStore)
}

export function applyLocalLastReadToDiscussions(discussions: any[] = [], config?: any): any[] {
  if (!Array.isArray(discussions) || !isLocalLastReadEnabled(config)) {
    return discussions
  }
  return discussions.map(d => {
    const discId = d?.discussion_id ?? d?.id
    const entry = getLocalLastReadEntry(discId)
    if (!entry) {
      return d
    }
    return {
      ...d,
      last_seen_post_id: entry.postId,
      localUnreadCount: entry.unreadCount,
    }
  })
}
