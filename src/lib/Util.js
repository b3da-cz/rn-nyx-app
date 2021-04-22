export const generateUuidV4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

export const getDistinctPosts = (posts, oldPosts) => {
  let newPosts = []
  const map = new Map()
  for (const item of [...posts, ...oldPosts]) {
    if (!map.has(item.id)) {
      map.set(item.id, true)
      if (!item.uuid) {
        item.uuid = generateUuidV4()
      }
      if (!item.parsed) {
        const oldParsedPost = oldPosts.filter(p => p.id === item.id)
        item.parsed = oldParsedPost.length ? oldParsedPost[0].parsed : null
      }
      newPosts.push(item)
    }
  }
  newPosts.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
  // console.warn('posts len', newPosts.length); // TODO: remove
  return newPosts
}
