import { exclusiveLastPostsFilter, lastPostsEndpoint } from '../src/lib/lastPosts'

describe('last posts filter exclusivity', () => {
  it('keeps friends above rated by me and rated by me above a minimum', () => {
    expect(exclusiveLastPostsFilter(25, true, true)).toEqual({
      minRating: 0,
      isRatedByFriends: true,
      isRatedByMe: false,
    })
    expect(exclusiveLastPostsFilter(25, false, true)).toEqual({
      minRating: 0,
      isRatedByFriends: false,
      isRatedByMe: true,
    })
    expect(exclusiveLastPostsFilter(25, false, false)).toEqual({
      minRating: 25,
      isRatedByFriends: false,
      isRatedByMe: false,
    })
    expect(exclusiveLastPostsFilter(0, false, false)).toEqual({
      minRating: 0,
      isRatedByFriends: false,
      isRatedByMe: false,
    })
  })
})

describe('last posts endpoint', () => {
  it('keeps the working path filters and sends rated by me as a query', () => {
    expect(lastPostsEndpoint()).toBe('last')
    expect(lastPostsEndpoint(10, false, false)).toBe('last/min_rating/10')
    expect(lastPostsEndpoint(0, true, false)).toBe('last/rated_by_friends')
    expect(lastPostsEndpoint(0, false, true)).toBe('last?rated_by_me=true')
    expect(lastPostsEndpoint(25, false, true)).toBe('last?min_rating=25&rated_by_me=true')
    expect(lastPostsEndpoint(0, true, true)).toBe('last?rated_by_friends=true&rated_by_me=true')
    expect(lastPostsEndpoint(50, true, true)).toBe('last?min_rating=50&rated_by_friends=true&rated_by_me=true')
  })
})
