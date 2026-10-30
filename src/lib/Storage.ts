import AsyncStorage from '@react-native-async-storage/async-storage'

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
}

const set = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, Array.isArray(value) || typeof value === 'object' ? JSON.stringify(value) : value)
  } catch (e) {
    console.warn(e)
  }
}

const get = async key => {
  try {
    const jsonValue = await AsyncStorage.getItem(key)
    return jsonValue != null ? JSON.parse(jsonValue) : null
  } catch (e) {
    console.warn(e)
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
  const key = provider === 'openai' ? 'openai' : 'openrouter'
  if (Array.isArray(raw)) {
    return key === 'openrouter' ? raw : []
  }
  if (raw && typeof raw === 'object' && Array.isArray(raw[key])) {
    return raw[key]
  }
  return []
}

const getCachedLlmModels = async (provider?: string) =>
  cachedLlmModelsFor(await get(StorageKeys.cachedLlmModels), provider)

const setCachedLlmModels = async (models, provider?: string) => {
  const key = provider === 'openai' ? 'openai' : 'openrouter'
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

const readRawStorageItem = async (key: string, retries = 1): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key)
  } catch (e) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 60))
      return readRawStorageItem(key, retries - 1)
    }
    console.warn(`Storage.getItem error for key "${key}":`, e)
    throw e
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
    for (const club of discussions) {
      if (club && club.id != null) {
        const id = String(club.id)
        currentIds.add(id)
        await AsyncStorage.setItem(clubStorageKey(id), JSON.stringify(club))
      }
    }
    for (const prevId of prevIds) {
      if (!currentIds.has(prevId)) {
        await AsyncStorage.removeItem(clubStorageKey(prevId)).catch(() => {})
      }
    }
    const manifest = {
      sharded: true,
      index: discussions.map(club => ({
        id: String(club.id),
        openedAt: Number(club.openedAt) || 0,
      })),
    }
    await AsyncStorage.setItem(StorageKeys.discussionCache, JSON.stringify(manifest))
  } catch (e) {
    console.warn('Failed to save discussion cache:', e)
    throw e
  }
}

const getDiscussionListCache = async () => readStoredJson(StorageKeys.discussionListCache)

const getFeedCache = async () => readStoredJson(StorageKeys.feedCache)

const setFeedCache = async cache => {
  try {
    await AsyncStorage.setItem(StorageKeys.feedCache, JSON.stringify(cache))
  } catch (e) {
    console.warn('Failed to save feed cache:', e)
    throw e
  }
}

const setDiscussionListCache = async cache => {
  try {
    await AsyncStorage.setItem(StorageKeys.discussionListCache, JSON.stringify(cache))
  } catch (e) {
    console.warn('Failed to save discussion list cache:', e)
    throw e
  }
}

const getMessageDrafts = async () => get(StorageKeys.messageDrafts)

const setMessageDrafts = async drafts => set(StorageKeys.messageDrafts, drafts)

const removeAll = async () =>
  set(StorageKeys.auth, null)
    .then(() => set(StorageKeys.blockedUsers, null))
    .then(() => set(StorageKeys.filters, null))
    .then(() => set(StorageKeys.config, null))
    .then(() => set(StorageKeys.user, null))
    .then(() => set(StorageKeys.llmHistory, null))
    .then(() => set(StorageKeys.cachedLlmModels, null))
    .then(() => set(StorageKeys.favoriteLlmModels, null))
    .then(() => set(StorageKeys.llmPendingTasks, null))
    .then(() => set(StorageKeys.llmPromptTemplates, null))
    .then(() => set(StorageKeys.messageDrafts, null))

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
  getDiscussionListCache,
  setDiscussionListCache,
  getFeedCache,
  setFeedCache,
  getMessageDrafts,
  setMessageDrafts,
  removeAll,
}
