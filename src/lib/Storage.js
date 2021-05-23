import AsyncStorage from '@react-native-async-storage/async-storage'

const StorageKeys = {
  auth: 'auth',
  blockedUsers: 'blockedUsers',
  filters: 'filters',
  config: 'config',
  user: 'user',
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

const removeAll = async () =>
  set(StorageKeys.auth, null)
    .then(() => set(StorageKeys.blockedUsers, null))
    .then(() => set(StorageKeys.filters, null))
    .then(() => set(StorageKeys.config, null))
    .then(() => set(StorageKeys.user, null))

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
  removeAll,
}
