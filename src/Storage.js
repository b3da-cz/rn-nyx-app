import AsyncStorage from '@react-native-async-storage/async-storage'

const StorageKeys = {
  auth: 'auth',
  config: 'config',
}

const set = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
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

export const Storage = {
  getAuth,
  setAuth,
  getConfig,
  setConfig,
}
