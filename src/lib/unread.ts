// Posts are newest-first (higher id first). The oldest unread is the last
// unread item in that order — just above last_seen when it is still present,
// or the last post with id > last_seen when last_seen was deleted.
export const getOldestUnreadIndex = (posts: any[] = [], lastSeenPostId?: number | string | null) => {
  if (!posts.length) {
    return 0
  }
  const lastSeen = Number(lastSeenPostId)
  const hasLastSeen = Number.isFinite(lastSeen) && lastSeen > 0
  let oldestUnread = -1
  for (let i = 0; i < posts.length; i++) {
    const id = Number(posts[i].id)
    const unreadByFlag = posts[i].new === true
    const unreadById = hasLastSeen && Number.isFinite(id) && id > lastSeen
    if (unreadByFlag || unreadById) {
      oldestUnread = i
    }
  }
  if (oldestUnread >= 0) {
    return oldestUnread
  }
  if (hasLastSeen) {
    for (let i = 0; i < posts.length; i++) {
      if (Number(posts[i].id) === lastSeen) {
        return i > 0 ? i - 1 : 0
      }
    }
  }
  return 0
}
