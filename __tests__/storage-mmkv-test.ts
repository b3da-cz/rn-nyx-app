jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

import AsyncStorage from '@react-native-async-storage/async-storage'
import { Storage } from '../src/lib/Storage'

describe('Storage with MMKV', () => {
  beforeEach(async () => {
    await Storage.removeAll()
  })

  it('stores and retrieves config via Storage', async () => {
    const config = { isDarkMode: true, themeName: 'matrix', isDiscussionCacheEnabled: true }
    await Storage.setConfig(config)
    const loaded = await Storage.getConfig()
    expect(loaded).toEqual(config)
  })

  it('stores and retrieves single cached club', async () => {
    const club = { id: '99', openedAt: 12345, posts: { '1': { post: { id: 1 } } }, pages: { latest: ['1'] } }
    await Storage.setCachedClub('99', club)
    const loaded = await Storage.getCachedClub('99')
    expect(loaded).toEqual(club)
  })

  it('migrates legacy keys from AsyncStorage to MMKV', async () => {
    // Write legacy data directly to AsyncStorage
    await AsyncStorage.setItem('auth', JSON.stringify({ token: 'abc-123', username: 'tester' }))
    // ensureMigrated or getAuth should retrieve and migrate it
    await Storage.ensureMigrated()
    const auth = await Storage.getAuth()
    expect(auth).toEqual({ token: 'abc-123', username: 'tester' })
  })

  it('saves and reads feed cache', async () => {
    const feed = {
      reminders: null,
      mail: { pages: { '1': { conversations: [], messages: [{ id: 10, content: 'hi' }], savedAt: 1 } } },
      events: null,
      notifications: null,
    }
    await Storage.setFeedCache(feed as any)
    const loaded = await Storage.getFeedCache()
    expect(loaded).toEqual(feed)
  })
})
