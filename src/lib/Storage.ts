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

const getCachedLlmModels = async () => (await get(StorageKeys.cachedLlmModels)) || []

const setCachedLlmModels = async models => set(StorageKeys.cachedLlmModels, models)

const getFavoriteLlmModels = async (): Promise<string[]> => (await get(StorageKeys.favoriteLlmModels)) || []

const setFavoriteLlmModels = async (models: string[]) => set(StorageKeys.favoriteLlmModels, models)

const getLlmPendingTasks = async (): Promise<any[]> => (await get(StorageKeys.llmPendingTasks)) || []

const setLlmPendingTasks = async (tasks: any[]) => set(StorageKeys.llmPendingTasks, tasks)

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
  removeAll,
}
