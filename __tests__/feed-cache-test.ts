import {
  emptyFeedCache,
  eventContentKey,
  eventsCacheKey,
  feedCacheCounts,
  forgetFeed,
  mailCacheKey,
  parsedForFreshPost,
  reconcileEvents,
  reconcileMailMessages,
  reconcileNotifications,
  reconcilePosts,
  rememberEventsQuery,
  rememberMailPage,
  rememberNotifications,
  rememberReminders,
} from '../src/lib/feedCache'

const post = (id: number, content = `post ${id}`, extra: any = {}) => ({
  id,
  content,
  parsed: { height: 10, clearText: content },
  ...extra,
})

describe('feed cache', () => {
  it('keeps an unchanged post and drops one that disappeared', () => {
    const kept = post(2)
    const merged = reconcilePosts([kept, post(3)], [{ id: 2, content: 'post 2' }])
    expect(merged.changed).toBe(true)
    expect(merged.items).toEqual([kept])
  })

  it('keeps immutable post text and reparses an edited header, board or ad', () => {
    const previous = [
      post(1, 'same'),
      { id: 2, location: 'header', content: 'old board', parsed: { height: 4, clearText: 'old board' } },
      { id: 3, location: 'home', content: 'old home', parsed: { height: 4 } },
      {
        id: 4,
        content: 'old ad',
        content_raw: { type: 'advertisement', data: { summary: 'old' } },
        parsed: { height: 4 },
      },
    ]
    const fresh = [
      { id: 1, content: 'same' },
      { id: 2, location: 'header', content: 'new board' },
      { id: 3, location: 'home', content: 'old home' },
      { id: 4, content: 'new ad', content_raw: { type: 'advertisement', data: { summary: 'new' } } },
    ]
    const merged = reconcilePosts(previous, fresh)
    expect(merged.items[0]).toBe(previous[0])
    expect(merged.items[1]).toBe(fresh[1])
    expect(merged.items[1].parsed).toBeUndefined()
    expect(merged.items[2]).toBe(previous[2])
    expect(merged.items[3]).toBe(fresh[3])

    expect(parsedForFreshPost(fresh[0], previous[0])).toEqual(previous[0].parsed)
    expect(parsedForFreshPost(fresh[1], previous[1])).toBeUndefined()
    expect(parsedForFreshPost(fresh[2], previous[2])).toEqual(previous[2].parsed)
    expect(parsedForFreshPost(fresh[3], previous[3])).toBeUndefined()
  })

  it('updates a notification when replies or ratings differ and removes a deleted one', () => {
    const kept = {
      data: post(1),
      details: { replies: [post(11)], thumbs_up: [{ username: 'a' }] },
    }
    const rated = {
      data: { id: 2, content: 'post 2', rating: 1, parsed: { height: 10 } },
      details: { replies: [], thumbs_up: [{ username: 'a' }] },
    }
    const fresh = [
      { data: { id: 1, content: 'post 1' }, details: { replies: [{ id: 11 }, { id: 12 }], thumbs_up: [{ username: 'a' }] } },
      { data: { id: 2, content: 'post 2', rating: 4 }, details: { replies: [], thumbs_up: [{ username: 'a' }, { username: 'b' }] } },
    ]
    const merged = reconcileNotifications([kept, rated, { data: post(3), details: { replies: [], thumbs_up: [] } }], fresh)
    expect(merged.changed).toBe(true)
    expect(merged.items).toHaveLength(2)
    expect(merged.items[0].data).toBe(kept.data)
    expect(merged.items[0].details.replies.map(reply => reply.id)).toEqual([11, 12])
    expect(merged.items[0].details.replies[0]).toBe(kept.details.replies[0])
    expect(merged.items[0].details.replies[1].parsed).toBeUndefined()
    expect(merged.items[1].data.rating).toBe(4)
    expect(merged.items[1].data.parsed).toEqual(rated.data.parsed)
    expect(merged.items[1].details.thumbs_up).toHaveLength(2)
  })

  it('keeps older mail and drops a message deleted from the latest page', () => {
    const older = post(1)
    const kept = post(5)
    const merged = reconcileMailMessages([post(8), kept, older], [
      { id: 9, content: 'new' },
      { id: 5, content: 'post 5' },
    ])
    expect(merged.items.map(item => item.id)).toEqual([9, 5, 1])
    expect(merged.items[1]).toBe(kept)
    expect(merged.items[2]).toBe(older)
  })

  it('updates an event when the description or attendees change', () => {
    const same = { discussion_id: 1, summary: 'vecer', going_people: 2, friends: [{ username: 'ada' }] }
    const edited = { discussion_id: 2, summary: 'stary popis', attendees: [{ username: 'ada' }] }
    const merged = reconcileEvents(
      [same, edited, { discussion_id: 3, summary: 'pryc' }],
      [
        { discussion_id: 1, summary: 'vecer', going_people: 2, friends: [{ username: 'ada' }] },
        { discussion_id: 2, summary: 'novy popis', attendees: [{ username: 'ada' }, { username: 'bea' }] },
      ],
    )
    expect(merged.items[0]).toBe(same)
    expect(merged.items[1].summary).toBe('novy popis')
    expect(eventContentKey(merged.items[1])).toContain('bea')
    expect(merged.items.find(event => event.discussion_id === 3)).toBeUndefined()
  })

  it('stores each list on its own and forgets one without the others', () => {
    let store = emptyFeedCache()
    store = rememberReminders(store, [post(1)], [post(2)])
    store = rememberMailPage(store, mailCacheKey('all'), [{ username: 'ada' }], [post(3)])
    store = rememberMailPage(store, mailCacheKey('ada'), [], [post(4)])
    store = rememberEventsQuery(store, eventsCacheKey({ order: 'proximity', epoch: 'future' }), {
      events: [{ discussion_id: 9, summary: 'akce' }],
      calendar: {},
      categories: [],
      areas: [],
    })
    store = rememberNotifications(store, [{ data: post(5), details: { replies: [], thumbs_up: [] } }], 1)
    expect(feedCacheCounts(store)).toEqual({
      remindersCount: 2,
      mailCount: 2,
      eventsCount: 1,
      notificationsCount: 1,
    })
    store = forgetFeed(store, 'mail')
    expect(store.mail).toBeNull()
    expect(store.reminders?.bookmarks).toHaveLength(1)
    expect(store.notifications?.unreadCount).toBe(1)
    expect(store.events?.queries[eventsCacheKey({ order: 'proximity', epoch: 'future' })]?.events).toHaveLength(1)
  })
})
