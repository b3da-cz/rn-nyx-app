import { Storage } from './Storage'

export type LocalLastReadEntry = { postId: number; unreadCount: number }
export type LocalLastReadStore = Record<string, LocalLastReadEntry>

let memoryStore: LocalLastReadStore = {}
let isHydrated = false
let hydrationPromise: Promise<LocalLastReadStore> | null = null

export function normalizeLocalLastRead(raw: unknown): LocalLastReadStore {
  if (!raw || typeof raw !== 'object') return {}
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
        result[String(key)] = { postId: Math.trunc(id), unreadCount: Number.isFinite(count) && count >= 0 ? Math.trunc(count) : 1 }
      }
    }
  }
  return result
}

function trySyncHydrate(): boolean {
  if (isHydrated) return true
  try {
    const raw = typeof Storage?.getString === 'function' ? Storage.getString('localLastRead') : null
    if (raw) {
      memoryStore = normalizeLocalLastRead(JSON.parse(raw))
      isHydrated = true
      return true
    }
  } catch (e) {}
  return false
}

trySyncHydrate()

export function initLocalLastRead(store?: unknown): void {
  memoryStore = normalizeLocalLastRead(store)
  isHydrated = true
}
export function resetLocalLastRead(): void {
  memoryStore = {}
  isHydrated = false
  hydrationPromise = null
}

export function hydrateLocalLastRead(): Promise<LocalLastReadStore> {
  if (isHydrated || trySyncHydrate()) return Promise.resolve(memoryStore)
  if (!hydrationPromise) {
    hydrationPromise = Storage.getLocalLastReadStore()
      .then(stored => {
        if (stored && typeof stored === 'object') memoryStore = { ...normalizeLocalLastRead(stored), ...memoryStore }
        isHydrated = true
        return memoryStore
      })
      .catch(e => { console.warn('Failed to hydrate localLastRead:', e); return memoryStore })
      .finally(() => { hydrationPromise = null })
  }
  return hydrationPromise
}

export function isLocalLastReadEnabled(config?: { isLocalLastReadEnabled?: boolean } | null): boolean {
  return config?.isLocalLastReadEnabled !== false
}

export function hasAnyLocalLastRead(config?: { isLocalLastReadEnabled?: boolean } | null): boolean {
  if (!isHydrated) trySyncHydrate()
  return isLocalLastReadEnabled(config) && Object.keys(memoryStore).length > 0
}

export function getLocalLastReadEntry(discussionId?: number | string | null): LocalLastReadEntry | null {
  if (!discussionId) return null
  if (!isHydrated) trySyncHydrate()
  const entry = memoryStore[String(discussionId)]
  return entry && entry.postId > 0 ? entry : null
}

export function getLocalLastRead(discussionId?: number | string | null): number | null {
  return getLocalLastReadEntry(discussionId)?.postId ?? null
}

export async function setLocalLastRead(discussionId: number | string, postId: number | string | null, unreadCount = 1): Promise<void> {
  if (!isHydrated) await hydrateLocalLastRead()
  const discKey = String(discussionId)
  const numericPostId = Number(postId)
  if (!numericPostId || numericPostId <= 0) delete memoryStore[discKey]
  else {
    const count = Number(unreadCount)
    memoryStore[discKey] = { postId: Math.trunc(numericPostId), unreadCount: Number.isFinite(count) && count >= 0 ? Math.trunc(count) : 1 }
  }
  await Storage.setLocalLastReadStore(memoryStore)
}

export async function toggleLocalLastRead(discussionId: number | string, postId: number | string, unreadCount = 1) {
  const current = getLocalLastRead(discussionId)
  const target = Math.trunc(Number(postId))
  if (current === target) {
    await setLocalLastRead(discussionId, null)
    return { isSet: false, postId: null, unreadCount: 0 }
  }
  await setLocalLastRead(discussionId, target, unreadCount)
  return { isSet: true, postId: target, unreadCount: getLocalLastReadEntry(discussionId)?.unreadCount ?? 0 }
}

export function consumeLocalLastRead(discussionId?: number | string | null): number | null {
  if (!discussionId) return null
  if (!isHydrated) trySyncHydrate()
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
  if (!isHydrated) await hydrateLocalLastRead()
  if (discussionId) delete memoryStore[String(discussionId)]
  else memoryStore = {}
  await Storage.setLocalLastReadStore(memoryStore)
}

export function applyLocalLastReadToDiscussions(discussions: any[] = [], config?: any): any[] {
  if (!Array.isArray(discussions)) return discussions
  const enabled = isLocalLastReadEnabled(config)
  if (enabled && !isHydrated) trySyncHydrate()
  return discussions.map(d => {
    const discId = d?.discussion_id ?? d?.id
    const entry = enabled ? getLocalLastReadEntry(discId) : null
    if (entry) return { ...d, _serverLastSeenPostId: d._serverLastSeenPostId ?? d.last_seen_post_id, last_seen_post_id: entry.postId, localUnreadCount: entry.unreadCount }
    if (d?.localUnreadCount !== undefined || d?._serverLastSeenPostId !== undefined) {
      const { localUnreadCount, _serverLastSeenPostId, ...rest } = d
      return { ...rest, last_seen_post_id: _serverLastSeenPostId ?? d.last_seen_post_id }
    }
    return d
  })
}
