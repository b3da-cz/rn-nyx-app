// Posts are newest-first. After a newer-page fetch, scroll to the oldest post
// that fetch actually added — one slot above the previous top — never to the
// newest post of that page. A deleted id is already absent, so the next newer
// post that did arrive is the target.
export const newerPageScrollIndex = (posts: { id?: number | string }[] = [], beforeIds: Iterable<number | string> = []) => {
  if (!posts.length) {
    return null
  }
  const before = new Set(Array.from(beforeIds, id => Number(id)))
  let oldestFresh = -1
  posts.forEach((post, index) => {
    const id = Number(post?.id)
    if (Number.isFinite(id) && !before.has(id)) {
      oldestFresh = index
    }
  })
  return oldestFresh >= 0 ? oldestFresh : null
}
