import { loadSearch, mergeSearchPosts, searchPostLine, searchUser } from '../src/lib/search'

const api = {
  search: jest.fn(),
  searchV2: jest.fn(),
}

const unified = {
  discussion: {
    advertisements: [{ id: 1, discussion_name: 'Inzerát' }],
    discussions: [{ id: 2, discussion_name: 'Klub' }],
    events: [{ id: 3, discussion_name: 'Akce' }],
  },
  user: { exact: [{ username: 'ALICE' }], friends: [], others: [{ user: { username: 'BOB' } }] },
}

beforeEach(() => {
  api.search.mockReset()
  api.searchV2.mockReset()
})

describe('search kinds', () => {
  it('unwraps a username row', () => {
    expect(searchUser({ user: { username: 'BOB' } }).username).toBe('BOB')
    expect(searchUser({ username: 'ALICE' }).username).toBe('ALICE')
  })

  it('keeps every unified bucket and can show one kind', async () => {
    api.search.mockResolvedValue(unified)
    const all = await loadSearch(api, 'klub', 'all')
    expect(api.search).toHaveBeenCalledWith('klub', true)
    expect(all.map(section => section.key)).toEqual(['advertisements', 'discussions', 'events', 'users'])
    expect(all.find(section => section.key === 'users')?.data.map(user => user.username)).toEqual(['ALICE', 'BOB'])

    api.search.mockClear()
    const events = await loadSearch(api, 'klub', 'events')
    expect(events).toEqual([{ key: 'events', data: [{ id: 3, discussion_name: 'Akce' }] }])
  })

  it('looks up users on the username endpoint', async () => {
    api.search.mockResolvedValue({ exact: [{ username: 'CYRIL' }], friends: [], others: [] })
    const sections = await loadSearch(api, 'cyr', 'users')
    expect(api.search).toHaveBeenCalledWith('cyr', false, true)
    expect(sections[0].data).toEqual([{ username: 'CYRIL' }])
  })

  it('loads posts from search-v2 and from plain search, then older pages from search-v2', async () => {
    api.searchV2.mockResolvedValueOnce({ posts: [{ id: 10, username: 'A', discussion_name: 'Klub', content: '<b>ahoj</b>' }] })
    api.search.mockResolvedValueOnce({ posts: [{ id: 11, username: 'B', content: 'druhy' }, { id: 10, content: 'dup' }] })
    const first = await loadSearch(api, 'ahoj', 'posts')
    expect(api.searchV2).toHaveBeenCalledWith({ text: 'ahoj', order: 'newest' })
    expect(api.search).toHaveBeenCalledWith('ahoj', false, false)
    expect(first[0].data.map(post => post.id)).toEqual([10, 11])
    expect(searchPostLine(first[0].data[0])).toBe('Klub — A: ahoj')

    api.searchV2.mockResolvedValueOnce({ posts: [{ id: 12, content: 'starsi' }] })
    const older = await loadSearch(api, 'ahoj', 'posts', [], [], 11)
    expect(api.searchV2).toHaveBeenCalledWith({ text: 'ahoj', order: 'older_than', fromId: 11 })
    expect(mergeSearchPosts(first[0].data, older[0].data).map(post => post.id)).toEqual([10, 11, 12])
  })
})