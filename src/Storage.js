import AsyncStorage from '@react-native-async-storage/async-storage'

const StorageKeys = {
  auth: 'auth',
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

const getConfig = async () => get(StorageKeys.config)

const setConfig = async conf => set(StorageKeys.config, conf)

const getUser = async () => get(StorageKeys.user)

const setUser = async conf => set(StorageKeys.user, conf)

const removeAll = async () =>
  set(StorageKeys.auth, null)
    .then(() => set(StorageKeys.config, null))
    .then(() => set(StorageKeys.user, null))

export const Storage = {
  getAuth,
  setAuth,
  getConfig,
  setConfig,
  getUser,
  setUser,
  removeAll,
}
