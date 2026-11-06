jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

import {
  createCustomReminderList,
  getCustomReminderLists,
  getCustomReminderListsSync,
  getCustomReminderList,
  renameCustomReminderList,
  deleteCustomReminderList,
  addPostToCustomList,
  removePostFromCustomList,
  removePostFromAllCustomLists,
  isPostInCustomReminders,
  getCustomReminderListsForPost,
  subscribeCustomReminders,
  formatTimestamp,
  resetCustomReminders,
} from '../src/lib/customReminders'

describe('customReminders', () => {
  beforeEach(async () => {
    await resetCustomReminders()
  })

  it('creates and lists custom reminder lists', async () => {
    expect(await getCustomReminderLists()).toEqual([])
    expect(getCustomReminderListsSync()).toEqual([])

    const listA = await createCustomReminderList('Oblíbené')
    expect(listA.name).toBe('Oblíbené')
    expect(listA.id).toBeDefined()
    expect(listA.posts).toEqual([])

    const lists = await getCustomReminderLists()
    expect(lists.length).toBe(1)
    expect(lists[0].id).toBe(listA.id)

    const listB = await createCustomReminderList('Recepty')
    const listsAfter = await getCustomReminderLists()
    expect(listsAfter.length).toBe(2)
    // listB was created later, so it's first by updatedAt desc
    expect(listsAfter[0].id).toBe(listB.id)
    expect(listsAfter[1].id).toBe(listA.id)
  })

  it('renames custom reminder list', async () => {
    const list = await createCustomReminderList('Old Name')
    const renamed = await renameCustomReminderList(list.id, 'New Name')
    expect(renamed?.name).toBe('New Name')

    const loaded = await getCustomReminderList(list.id)
    expect(loaded?.name).toBe('New Name')
  })

  it('adds posts to custom list and checks isPostInCustomReminders', async () => {
    const list = await createCustomReminderList('Archiv')
    const post1 = { id: 101, user_name: 'alice', content: 'test post 1' }
    const post2 = { id: 102, user_name: 'bob', content: 'test post 2' }

    expect(isPostInCustomReminders(101)).toBe(false)
    expect(isPostInCustomReminders(102)).toBe(false)

    await addPostToCustomList(list.id, post1)
    expect(isPostInCustomReminders(101)).toBe(true)
    expect(isPostInCustomReminders('101')).toBe(true)
    expect(isPostInCustomReminders(102)).toBe(false)

    await addPostToCustomList(list.id, post2)
    expect(isPostInCustomReminders(101)).toBe(true)
    expect(isPostInCustomReminders(102)).toBe(true)

    const loaded = await getCustomReminderList(list.id)
    expect(loaded?.posts.length).toBe(2)
    expect(loaded?.posts[0].id).toBe(102) // newly added post is unshifted
    expect(loaded?.posts[1].id).toBe(101)
  })

  it('sorts lists by updatedAt descending after adding a post', async () => {
    const listA = await createCustomReminderList('List A')
    await new Promise(r => setTimeout(r, 10))
    const listB = await createCustomReminderList('List B')

    // Currently B is newer than A
    let lists = await getCustomReminderLists()
    expect(lists[0].id).toBe(listB.id)

    // Add post to A after 20ms
    await new Promise(r => setTimeout(r, 20))
    await addPostToCustomList(listA.id, { id: 50, content: 'update A' })

    // Now A has newer updatedAt than B, so A should be first
    lists = await getCustomReminderLists()
    expect(lists[0].id).toBe(listA.id)
    expect(lists[1].id).toBe(listB.id)
  })

  it('removes post from a specific custom list', async () => {
    const list = await createCustomReminderList('Cestování')
    await addPostToCustomList(list.id, { id: 201, content: 'hotel' })
    await addPostToCustomList(list.id, { id: 202, content: 'letenky' })

    expect(isPostInCustomReminders(201)).toBe(true)
    expect(isPostInCustomReminders(202)).toBe(true)

    const removed = await removePostFromCustomList(list.id, 201)
    expect(removed).toBe(true)
    expect(isPostInCustomReminders(201)).toBe(false)
    expect(isPostInCustomReminders(202)).toBe(true)

    const loaded = await getCustomReminderList(list.id)
    expect(loaded?.posts.length).toBe(1)
    expect(loaded?.posts[0].id).toBe(202)
  })

  it('removes post from all custom lists', async () => {
    const list1 = await createCustomReminderList('Seznam 1')
    const list2 = await createCustomReminderList('Seznam 2')

    const post = { id: 301, content: 'shared post' }
    await addPostToCustomList(list1.id, post)
    await addPostToCustomList(list2.id, post)

    expect(getCustomReminderListsForPost(301).length).toBe(2)
    expect(isPostInCustomReminders(301)).toBe(true)

    await removePostFromAllCustomLists(301)
    expect(isPostInCustomReminders(301)).toBe(false)
    expect(getCustomReminderListsForPost(301).length).toBe(0)

    const l1 = await getCustomReminderList(list1.id)
    const l2 = await getCustomReminderList(list2.id)
    expect(l1?.posts.length).toBe(0)
    expect(l2?.posts.length).toBe(0)
  })

  it('deletes custom reminder list and updates post IDs', async () => {
    const list = await createCustomReminderList('Dočasný')
    await addPostToCustomList(list.id, { id: 401, content: 'temp' })

    expect(isPostInCustomReminders(401)).toBe(true)

    const deleted = await deleteCustomReminderList(list.id)
    expect(deleted).toBe(true)
    expect(isPostInCustomReminders(401)).toBe(false)

    const lists = await getCustomReminderLists()
    expect(lists.length).toBe(0)
  })

  it('notifies listeners on list changes', async () => {
    let callCount = 0
    const unsub = subscribeCustomReminders(() => {
      callCount++
    })

    const list = await createCustomReminderList('Oznámení')
    expect(callCount).toBe(1)

    await addPostToCustomList(list.id, { id: 501, content: 'test' })
    expect(callCount).toBe(2)

    await removePostFromCustomList(list.id, 501)
    expect(callCount).toBe(3)

    unsub()
    await deleteCustomReminderList(list.id)
    // callCount shouldn't increase after unsubscribe
    expect(callCount).toBe(3)
  })

  it('formats timestamp to DD.MM.YYYY HH:MM', () => {
    // 2024-05-15 14:30 UTC
    const date = new Date(2024, 4, 15, 14, 30)
    const formatted = formatTimestamp(date.getTime())
    expect(formatted).toBe('15.05.2024 14:30')
    expect(formatTimestamp('')).toBe('')
  })
})
