// Posts are newest-first. After a newer-page fetch, scroll to the oldest post
// that fetch actually added — one slot above the previous top — never to the
// newest post of that page. A deleted id is already absent, so the next newer
// post that did arrive is the target.
export const CLUB_START_POST_ID = 0
export const OLDER_END_FETCH_LIMIT = 2

export type OlderEndState = {
  attempts: number
  reached: boolean
}

export const initialOlderEndState = (): OlderEndState => ({ attempts: 0, reached: false })

// added > 0: the page contained posts. added === 0: a valid empty page.
// added < 0: the request did not finish, so it does not count.
// One empty page is the start of the club. A second empty page is the last try.
export const noteOlderPage = (state: OlderEndState, added: number): OlderEndState & { showStart: boolean } => {
  if (state.reached || added < 0) {
    return { attempts: state.attempts, reached: state.reached, showStart: false }
  }
  if (added > 0) {
    return { attempts: 0, reached: false, showStart: false }
  }
  const attempts = state.attempts + 1
  if (attempts > OLDER_END_FETCH_LIMIT) {
    return { attempts: OLDER_END_FETCH_LIMIT, reached: true, showStart: false }
  }
  return { attempts, reached: true, showStart: true }
}

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
