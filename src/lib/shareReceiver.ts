import { DeviceEventEmitter, NativeModules, Platform } from 'react-native'

const { ShareReceiver } = NativeModules

export type SharedFile = {
  uri: string
  name: string
  type: string
  size: number
  thumbnailUri?: string
}

export type SharedData = {
  type: 'text' | 'file'
  text?: string
  file?: SharedFile
}

export type ShareClub = { id: number; name: string; unreadCount?: number }

export const parseShareDiscussions = (discs: any[] = []): ShareClub[] =>
  (Array.isArray(discs) ? discs : [])
    .map((d: any) => ({
      id: Number(d?.discussion_id || d?.id || 0),
      name: String(d?.discussion_name || d?.full_name || d?.name || '').trim(),
      unreadCount: Math.max(
        Number(d?.new_posts_count) || 0,
        Number(d?.new_replies_count) || 0,
        Number(d?.new_images_count) || 0,
        Number(d?.new_links_count) || 0,
      ),
    }))
    .filter(c => c.id > 0 && c.name.length > 0)

export const parseShareBookmarks = (cats: any[] = []): ShareClub[] => {
  const b: ShareClub[] = [], seen = new Set<number>()
  if (Array.isArray(cats)) {
    for (const c of cats) {
      if (Array.isArray(c?.bookmarks)) {
        for (const d of c.bookmarks) {
          const id = Number(d?.discussion_id || d?.id || 0)
          const name = String(d?.full_name || d?.discussion_name || d?.name || '').trim()
          if (id > 0 && name.length > 0 && !seen.has(id)) {
            seen.add(id)
            b.push({ id, name })
          }
        }
      }
    }
  }
  return b
}

export const getInitialShare = async (): Promise<SharedData | null> => {
  if (Platform.OS !== 'android' || !ShareReceiver) {
    return null
  }
  try {
    const data = await ShareReceiver.getInitialShare()
    if (data) {
      await ShareReceiver.clearInitialShare()
    }
    return data
  } catch (e) {
    console.warn('[ShareReceiver] getInitialShare error:', e)
    return null
  }
}

export const clearInitialShare = async (): Promise<void> => {
  if (Platform.OS !== 'android' || !ShareReceiver) {
    return
  }
  try {
    await ShareReceiver.clearInitialShare()
  } catch (_) {}
}

export const subscribeShareReceived = (callback: (data: SharedData) => void): (() => void) => {
  if (Platform.OS !== 'android') {
    return () => {}
  }
  const sub = DeviceEventEmitter.addListener('onShareReceived', async (data: SharedData) => {
    try {
      await clearInitialShare()
    } catch (_) {}
    callback(data)
  })
  return () => sub.remove()
}
