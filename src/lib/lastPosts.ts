// Friends wins over rated-by-me, and rated-by-me wins over a minimum rating.
// The last-posts API ignores the lower filter, so only one of them is sent.
export const exclusiveLastPostsFilter = (
  minRating = 0,
  isRatedByFriends = false,
  isRatedByMe = false,
) => {
  if (isRatedByFriends) {
    return { minRating: 0, isRatedByFriends: true, isRatedByMe: false }
  }
  if (isRatedByMe) {
    return { minRating: 0, isRatedByFriends: false, isRatedByMe: true }
  }
  return { minRating, isRatedByFriends: false, isRatedByMe: false }
}

// GET /api/last takes min_rating, rated_by_friends and rated_by_me as query params.
// nyx-api 0.5.2 puts the first two in the path, and that still answers.
// /last/rated_by_me is not a route and returns 404, also when appended to the other paths.
export const lastPostsEndpoint = (minRating = 0, isRatedByFriends?: boolean, isRatedByMe?: boolean) => {
  if (!isRatedByMe) {
    return `last${minRating > 0 ? `/min_rating/${minRating}` : ''}${isRatedByFriends ? '/rated_by_friends' : ''}`
  }
  const query: string[] = []
  if (minRating > 0) {
    query.push(`min_rating=${minRating}`)
  }
  if (isRatedByFriends) {
    query.push('rated_by_friends=true')
  }
  query.push('rated_by_me=true')
  return `last?${query.join('&')}`
}
