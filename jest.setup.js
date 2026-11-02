/* eslint-disable no-undef */
const mockMmkvStorage = new Map()

jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: jest.fn(),
  },
}))

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    set: jest.fn((key, value) => mockMmkvStorage.set(key, value)),
    getString: jest.fn(key => mockMmkvStorage.get(key)),
    getNumber: jest.fn(key => mockMmkvStorage.get(key)),
    getBoolean: jest.fn(key => mockMmkvStorage.get(key)),
    contains: jest.fn(key => mockMmkvStorage.has(key)),
    delete: jest.fn(key => mockMmkvStorage.delete(key)),
    clearAll: jest.fn(() => mockMmkvStorage.clear()),
    getAllKeys: jest.fn(() => Array.from(mockMmkvStorage.keys())),
  })),
}))
