import { createMMKV, MMKV } from 'react-native-mmkv'
import AsyncStorage from '@react-native-async-storage/async-storage'

let mmkvInstance: MMKV | null = null
try {
  mmkvInstance = createMMKV({ id: 'nyx-storage' })
} catch (e) {
  console.warn('MMKV initialization failed, falling back to AsyncStorage:', e)
}

const MIGRATION_FLAG_KEY = '__mmkv_migrated_v1__'
let migrationPromise: Promise<void> | null = null

const ensureMigrated = async (force = false): Promise<void> => {
  if (!mmkvInstance) {
    return
  }
  if (!force && mmkvInstance.getBoolean(MIGRATION_FLAG_KEY)) {
    return
  }
  if (migrationPromise) {
    return migrationPromise
  }
  migrationPromise = (async () => {
    try {
      const keys = await AsyncStorage.getAllKeys()
      if (keys && keys.length > 0) {
        const pairs = await AsyncStorage.multiGet(keys)
        for (const [key, value] of pairs) {
          if (key && value != null && (force || !mmkvInstance.contains(key))) {
            mmkvInstance.set(key, value)
          }
        }
      }
      mmkvInstance.set(MIGRATION_FLAG_KEY, true)
    } catch (e) {
      console.warn('Failed to migrate AsyncStorage to MMKV:', e)
    } finally {
      migrationPromise = null
    }
  })()
  return migrationPromise
}

ensureMigrated().catch(() => {})

const StorageKeys = {
  auth: 'auth',
  blockedUsers: 'blockedUsers',
  filters: 'filters',
  config: 'config',
  user: 'user',
  llmHistory: 'llmHistory',
  cachedLlmModels: 'cachedLlmModels',
  favoriteLlmModels: 'favoriteLlmModels',
  llmPendingTasks: 'llmPendingTasks',
  llmPromptTemplates: 'llmPromptTemplates',
  lumoQuota: 'lumoQuota',
  ratingPrompt: 'ratingPrompt',
  supportPurchases: 'supportPurchases',
  lastPurchaseSync: 'lastPurchaseSync',
  uploadSettings: 'uploadSettings',
  fingerprintBackgroundAt: 'fingerprintBackgroundAt',
  discussionCache: 'discussionCache',
  discussionListCache: 'discussionListCache',
  feedCache: 'feedCache',
  messageDrafts: 'messageDrafts',
  localLastRead: 'localLastRead',
  llmClubPrompts: 'llmClubPrompts',
  llmClubDateFilters: 'llmClubDateFilters',
  customReminders: 'customReminders',
}

const set = async (key: string, value: any) => {
  try {
    const jsonValue =
      value == null
        ? null
        : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value)
    if (mmkvInstance) {
      if (jsonValue == null) {
        mmkvInstance.delete(key)
      } else {
        mmkvInstance.set(key, jsonValue)
      }
    } else {
      if (jsonValue == null) {
        await AsyncStorage.removeItem(key)
      } else {
        await AsyncStorage.setItem(key, jsonValue)
      }
    }
  } catch (e) {
    console.warn(e)
  }
}

const get = async (key: string) => {
  try {
    const jsonValue = await readRawStorageItem(key)
    return jsonValue != null ? JSON.parse(jsonValue) : null
  } catch (e) {
    console.warn(e)
    return null
  }
}

const getAuth = async () => get(StorageKeys.auth)

const setAuth = async auth => set(StorageKeys.auth, auth)

const getBlockedUsers = async () => get(StorageKeys.blockedUsers)

const setBlockedUsers = async users => set(StorageKeys.blockedUsers, users)

const getFilters = async () => get(StorageKeys.filters)

const setFilters = async filters => set(StorageKeys.filters, filters)

const getConfig = async () => get(StorageKeys.config)

const setConfig = async conf => set(StorageKeys.config, conf)

const getUser = async () => get(StorageKeys.user)

const setUser = async conf => set(StorageKeys.user, conf)

const getLlmHistory = async () => (await get(StorageKeys.llmHistory)) || []

const setLlmHistory = async history => set(StorageKeys.llmHistory, history)

const cachedLlmModelsFor = (raw, provider?: string) => {
  const key = provider === 'lumo' ? 'lumo' : provider === 'openai' ? 'openai' : 'openrouter'
  if (raw && typeof raw === 'object' && Array.isArray(raw[key])) {
    return raw[key]
  }
  if (provider === 'lumo') {
    return []
  }
  if (Array.isArray(raw)) {
    return key === 'openrouter' ? raw : []
  }
  return []
}

const getCachedLlmModels = async (provider?: string) =>
  cachedLlmModelsFor(await get(StorageKeys.cachedLlmModels), provider)

const setCachedLlmModels = async (models, provider?: string) => {
  const key = provider === 'lumo' ? 'lumo' : provider === 'openai' ? 'openai' : 'openrouter'
  const raw = await get(StorageKeys.cachedLlmModels)
  const store = Array.isArray(raw) ? { openrouter: raw } : raw && typeof raw === 'object' ? { ...raw } : {}
  store[key] = models
  await set(StorageKeys.cachedLlmModels, store)
}

const getFavoriteLlmModels = async (): Promise<string[]> => (await get(StorageKeys.favoriteLlmModels)) || []

const setFavoriteLlmModels = async (models: string[]) => set(StorageKeys.favoriteLlmModels, models)

const getLlmPendingTasks = async (): Promise<any[]> => (await get(StorageKeys.llmPendingTasks)) || []

const setLlmPendingTasks = async (tasks: any[]) => set(StorageKeys.llmPendingTasks, tasks)

const getLumoQuota = async () => get(StorageKeys.lumoQuota)

const setLumoQuota = async quota => set(StorageKeys.lumoQuota, quota)

const getLlmPromptTemplates = async () => (await get(StorageKeys.llmPromptTemplates)) || []

const setLlmPromptTemplates = async templates => set(StorageKeys.llmPromptTemplates, templates)

const getRatingPrompt = async () => get(StorageKeys.ratingPrompt)

const setRatingPrompt = async state => set(StorageKeys.ratingPrompt, state)

const getSupportPurchases = async (): Promise<Record<string, number>> => (await get(StorageKeys.supportPurchases)) || {}

const setSupportPurchases = async (purchases: Record<string, number>) => set(StorageKeys.supportPurchases, purchases)

const getLastPurchaseSync = async (): Promise<number> => (await get(StorageKeys.lastPurchaseSync)) || 0

const setLastPurchaseSync = async (ts: number) => set(StorageKeys.lastPurchaseSync, ts)

const getUploadSettings = async (): Promise<{ size?: string | number; quality?: number } | null> =>
  get(StorageKeys.uploadSettings)

const setUploadSettings = async (settings: { size?: string | number; quality?: number }) =>
  set(StorageKeys.uploadSettings, settings)

const getFingerprintBackgroundAt = async (): Promise<number | null> => {
  const value = await get(StorageKeys.fingerprintBackgroundAt)
  const at = typeof value === 'number' ? value : value?.at
  return typeof at === 'number' && Number.isFinite(at) ? at : null
}

const setFingerprintBackgroundAt = async (at: number | null) =>
  set(StorageKeys.fingerprintBackgroundAt, at == null ? null : { at })

const getLocalLastReadStore = async (): Promise<Record<string, number>> =>
  (await get(StorageKeys.localLastRead)) || {}

const setLocalLastReadStore = async (store: Record<string, number>) =>
  set(StorageKeys.localLastRead, store)

const getCustomRemindersStore = async (): Promise<any[]> =>
  (await get(StorageKeys.customReminders)) || []

const setCustomRemindersStore = async (lists: any[]) =>
  set(StorageKeys.customReminders, lists)

const readRawStorageItem = async (key: string, retries = 1): Promise<string | null> => {
  if (mmkvInstance) {
    const val = mmkvInstance.getString(key)
    if (val !== undefined) {
      return val
    }
    if (!mmkvInstance.getBoolean(MIGRATION_FLAG_KEY)) {
      await ensureMigrated()
      const afterMigrate = mmkvInstance.getString(key)
      if (afterMigrate !== undefined) {
        return afterMigrate
      }
    }
  }
  try {
    const legacy = await AsyncStorage.getItem(key)
    if (legacy != null && mmkvInstance) {
      mmkvInstance.set(key, legacy)
    }
    return legacy
  } catch (e) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 60))
      return readRawStorageItem(key, retries - 1)
    }
    console.warn(`Storage.getItem error for key "${key}":`, e)
    return null
  }
}

const readStoredJson = async key => {
  const jsonValue = await readRawStorageItem(key)
  if (jsonValue == null) {
    return null
  }
  try {
    return JSON.parse(jsonValue)
  } catch (e) {
    console.warn(`Storage JSON parse error for key "${key}":`, e)
    return null
  }
}

const clubStorageKey = (id: string | number) => `discussionCache:club:${id}`

const MAX_SAVED_CLUB_MAP_SIZE = 50

const lastSavedClubMap = new Map<string, any>()

const pruneLastSavedClubMap = () => {
  if (lastSavedClubMap.size <= MAX_SAVED_CLUB_MAP_SIZE) {
    return
  }
  const overflow = lastSavedClubMap.size - MAX_SAVED_CLUB_MAP_SIZE
  let count = 0
  for (const key of lastSavedClubMap.keys()) {
    lastSavedClubMap.delete(key)
    count += 1
    if (count >= overflow) {
      break
    }
  }
}

const rememberSavedClub = (clubId: string, club: any) => {
  lastSavedClubMap.delete(clubId)
  lastSavedClubMap.set(clubId, club)
}

const getCachedClub = async (id: string | number) => {
  const clubId = String(id || '')
  if (!clubId) {
    return null
  }
  const club = await readStoredJson(clubStorageKey(clubId))
  if (club && typeof club === 'object') {
    rememberSavedClub(clubId, club)
    pruneLastSavedClubMap()
    return club
  }
  return null
}

const setCachedClub = async (id: string | number, club: any) => {
  const clubId = String(id || '')
  if (!clubId || !club) {
    return
  }
  rememberSavedClub(clubId, club)
  pruneLastSavedClubMap()
  const key = clubStorageKey(clubId)
  const str = JSON.stringify(club)
  if (mmkvInstance) {
    mmkvInstance.set(key, str)
  } else {
    await AsyncStorage.setItem(key, str)
  }
}

const removeCachedClub = async (id: string | number) => {
  const clubId = String(id || '')
  if (!clubId) {
    return
  }
  lastSavedClubMap.delete(clubId)
  const key = clubStorageKey(clubId)
  if (mmkvInstance) {
    mmkvInstance.delete(key)
  } else {
    await AsyncStorage.removeItem(key).catch(() => {})
  }
}

const getDiscussionCache = async () => {
  const manifest = await readStoredJson(StorageKeys.discussionCache)
  if (!manifest) {
    return null
  }
  if (!manifest.sharded) {
    return manifest
  }
  const index: { id: string; openedAt?: number }[] = Array.isArray(manifest.index) ? manifest.index : []
  if (index.length === 0) {
    return { discussions: [] }
  }
  const discussions: any[] = []
  for (const item of index) {
    const id = String(item?.id ?? '')
    if (!id) {
      continue
    }
    try {
      const club = await readStoredJson(clubStorageKey(id))
      if (club && typeof club === 'object') {
        discussions.push(club)
      } else if (item?.openedAt) {
        discussions.push({ id, openedAt: item.openedAt, posts: {}, pages: {} })
      }
    } catch (e) {
      console.warn(`Failed to read club "${id}" from cache:`, e)
      discussions.push({ id, openedAt: Number(item?.openedAt) || 0, posts: {}, pages: {} })
    }
  }
  for (let i = Math.min(discussions.length, MAX_SAVED_CLUB_MAP_SIZE) - 1; i >= 0; i--) {
    const club = discussions[i]
    if (club?.id != null) {
      rememberSavedClub(String(club.id), club)
    }
  }
  pruneLastSavedClubMap()
  return { discussions }
}

const setDiscussionCache = async cache => {
  try {
    const discussions = Array.isArray(cache?.discussions) ? cache.discussions : []
    const previousManifest = await readStoredJson(StorageKeys.discussionCache).catch(() => null)
    const prevIds = new Set<string>()
    if (previousManifest?.sharded && Array.isArray(previousManifest.index)) {
      previousManifest.index.forEach((item: any) => {
        if (item?.id) prevIds.add(String(item.id))
      })
    }
    const currentIds = new Set<string>()
    for (let i = 0; i < discussions.length; i++) {
      const club = discussions[i]
      if (club && club.id != null) {
        const id = String(club.id)
        currentIds.add(id)
        const tracked = lastSavedClubMap.has(id)
        const shouldWrite = tracked ? lastSavedClubMap.get(id) !== club : !prevIds.has(id) || i === 0
        if (shouldWrite) {
          const key = clubStorageKey(id)
          const str = JSON.stringify(club)
          if (mmkvInstance) {
            mmkvInstance.set(key, str)
          } else {
            await AsyncStorage.setItem(key, str)
          }
        }
      }
    }
    for (let i = Math.min(discussions.length, MAX_SAVED_CLUB_MAP_SIZE) - 1; i >= 0; i--) {
      const club = discussions[i]
      if (club?.id != null) {
        rememberSavedClub(String(club.id), club)
      }
    }
    for (const prevId of prevIds) {
      if (!currentIds.has(prevId)) {
        lastSavedClubMap.delete(prevId)
        const key = clubStorageKey(prevId)
        if (mmkvInstance) {
          mmkvInstance.delete(key)
        } else {
          await AsyncStorage.removeItem(key).catch(() => {})
        }
      }
    }
    pruneLastSavedClubMap()
    const manifest = {
      sharded: true,
      index: discussions.map(club => ({
        id: String(club.id),
        openedAt: Number(club.openedAt) || 0,
      })),
    }
    const manifestKey = StorageKeys.discussionCache
    const manifestStr = JSON.stringify(manifest)
    if (mmkvInstance) {
      mmkvInstance.set(manifestKey, manifestStr)
    } else {
      await AsyncStorage.setItem(manifestKey, manifestStr)
    }
  } catch (e) {
    console.warn('Failed to save discussion cache:', e)
    throw e
  }
}

const getDiscussionListCache = async () => readStoredJson(StorageKeys.discussionListCache)

const getFeedCache = async () => readStoredJson(StorageKeys.feedCache)

const setFeedCache = async cache => {
  try {
    const str = JSON.stringify(cache)
    if (mmkvInstance) {
      mmkvInstance.set(StorageKeys.feedCache, str)
    } else {
      await AsyncStorage.setItem(StorageKeys.feedCache, str)
    }
  } catch (e) {
    console.warn('Failed to save feed cache:', e)
    throw e
  }
}

const setDiscussionListCache = async cache => {
  try {
    const str = JSON.stringify(cache)
    if (mmkvInstance) {
      mmkvInstance.set(StorageKeys.discussionListCache, str)
    } else {
      await AsyncStorage.setItem(StorageKeys.discussionListCache, str)
    }
  } catch (e) {
    console.warn('Failed to save discussion list cache:', e)
    throw e
  }
}

const getMessageDrafts = async () => get(StorageKeys.messageDrafts)

const setMessageDrafts = async drafts => set(StorageKeys.messageDrafts, drafts)

const getLlmClubPrompt = async (discussionId: number | string): Promise<string> => {
  const store = (await get(StorageKeys.llmClubPrompts)) || {}
  return store[String(discussionId)] || ''
}

const setLlmClubPrompt = async (discussionId: number | string, prompt: string): Promise<void> => {
  const store = (await get(StorageKeys.llmClubPrompts)) || {}
  const key = String(discussionId)
  if (prompt) {
    store[key] = prompt
  } else {
    delete store[key]
  }
  await set(StorageKeys.llmClubPrompts, store)
}

const getLlmClubDateFilter = async (
  discussionId: number | string,
): Promise<{ preset: string; dateFrom?: string; dateTo?: string } | null> => {
  const store = (await get(StorageKeys.llmClubDateFilters)) || {}
  return store[String(discussionId)] || null
}

const setLlmClubDateFilter = async (
  discussionId: number | string,
  filter: { preset: string; dateFrom?: string; dateTo?: string },
): Promise<void> => {
  const store = (await get(StorageKeys.llmClubDateFilters)) || {}
  store[String(discussionId)] = filter
  await set(StorageKeys.llmClubDateFilters, store)
}

const removeAll = async () => {
  if (mmkvInstance) {
    mmkvInstance.clearAll()
  }
  await Promise.all([
    set(StorageKeys.auth, null),
    set(StorageKeys.blockedUsers, null),
    set(StorageKeys.filters, null),
    set(StorageKeys.config, null),
    set(StorageKeys.user, null),
    set(StorageKeys.llmHistory, null),
    set(StorageKeys.cachedLlmModels, null),
    set(StorageKeys.favoriteLlmModels, null),
    set(StorageKeys.llmPendingTasks, null),
    set(StorageKeys.llmPromptTemplates, null),
    set(StorageKeys.messageDrafts, null),
    set(StorageKeys.llmClubPrompts, null),
    set(StorageKeys.llmClubDateFilters, null),
  ])
  await AsyncStorage.clear().catch(() => {})
}

export const Storage = {
  getAuth,
  setAuth,
  getBlockedUsers,
  setBlockedUsers,
  getFilters,
  setFilters,
  getConfig,
  setConfig,
  getUser,
  setUser,
  getLlmHistory,
  setLlmHistory,
  getCachedLlmModels,
  setCachedLlmModels,
  getFavoriteLlmModels,
  setFavoriteLlmModels,
  getLlmPendingTasks,
  setLlmPendingTasks,
  getLlmPromptTemplates,
  setLlmPromptTemplates,
  getLumoQuota,
  setLumoQuota,
  getRatingPrompt,
  setRatingPrompt,
  getSupportPurchases,
  setSupportPurchases,
  getLastPurchaseSync,
  setLastPurchaseSync,
  getUploadSettings,
  setUploadSettings,
  getFingerprintBackgroundAt,
  setFingerprintBackgroundAt,
  getDiscussionCache,
  setDiscussionCache,
  getCachedClub,
  setCachedClub,
  removeCachedClub,
  getDiscussionListCache,
  setDiscussionListCache,
  getFeedCache,
  setFeedCache,
  getMessageDrafts,
  setMessageDrafts,
  getLocalLastReadStore,
  setLocalLastReadStore,
  getCustomRemindersStore,
  setCustomRemindersStore,
  getLlmClubPrompt,
  setLlmClubPrompt,
  getLlmClubDateFilter,
  setLlmClubDateFilter,
  removeAll,
  isMmkvAvailable: () => !!mmkvInstance,
  getMmkv: () => mmkvInstance,
  getString: (key: string) => mmkvInstance?.getString(key),
  setString: (key: string, val: string) => mmkvInstance?.set(key, val),
  getBoolean: (key: string) => mmkvInstance?.getBoolean(key),
  setBoolean: (key: string, val: boolean) => mmkvInstance?.set(key, val),
  getNumber: (key: string) => mmkvInstance?.getNumber(key),
  setNumber: (key: string, val: number) => mmkvInstance?.set(key, val),
  ensureMigrated,
}
