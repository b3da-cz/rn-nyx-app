export const IMAGE_DOWNLOAD_UNLIMITED = null
export const IMAGE_DOWNLOAD_OFF = 0
export const IMAGE_DOWNLOAD_LIMITS_KB = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1024]
export const IMAGE_PLACEHOLDER_ASPECT = { width: 3, height: 2 }

export const normalizeImageDownloadMaxKb = (value?: number | string | null) => {
  if (value === undefined || value === null || value === '' || value === 'unlimited') {
    return IMAGE_DOWNLOAD_UNLIMITED
  }
  if (value === 'off') {
    return IMAGE_DOWNLOAD_OFF
  }
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) {
    return IMAGE_DOWNLOAD_UNLIMITED
  }
  if (n === 0) {
    return IMAGE_DOWNLOAD_OFF
  }
  return IMAGE_DOWNLOAD_LIMITS_KB.includes(n) ? n : IMAGE_DOWNLOAD_UNLIMITED
}

export const isImageDownloadUnlimited = (maxKb?: number | null) => maxKb == null
export const isImageDownloadOff = (maxKb?: number | null) => maxKb === 0

export const shouldSkipImageDownload = (byteLength: number | null | undefined, maxKb?: number | null) => {
  if (isImageDownloadOff(maxKb)) {
    return true
  }
  if (isImageDownloadUnlimited(maxKb) || byteLength == null) {
    return false
  }
  return byteLength > maxKb * 1024
}

const loadedImageUrls = new Set<string>()

export const rememberLoadedImageUrl = (url?: string | null) => {
  if (url) {
    loadedImageUrls.add(url)
  }
}

export const hasLoadedImageUrl = (url?: string | null) => !!url && loadedImageUrls.has(url)

export const shouldShowCachedImage = (cached?: boolean, _maxKb?: number | null) => !!cached

export const isPlaceholderImageSize = (img?: { width?: number; height?: number } | null) =>
  img?.width === IMAGE_PLACEHOLDER_ASPECT.width && img?.height === IMAGE_PLACEHOLDER_ASPECT.height

export const applyImagePlaceholder = (img: any = {}) => {
  img.skipDownload = true
  img.cached = false
  img.width = IMAGE_PLACEHOLDER_ASPECT.width
  img.height = IMAGE_PLACEHOLDER_ASPECT.height
  return img
}

export const computeImagesHeight = (post: any, screenWidth: number) => {
  if (!(post.parsed?.images?.length > 0)) {
    return 0
  }
  if (post.content_raw?.type === 'advertisement') {
    return 120
  }
  return post.parsed.images
    .map(img => {
      let w = screenWidth
      if (img.src?.includes('youtu')) {
        w = w * 0.8
      }
      if (!(img.width > 0) || !(img.height > 0)) {
        return w * (2 / 3) + 20
      }
      return img.height * (w / img.width) + 20
    })
    .reduce((a: number, b: number) => a + b, 0)
}

export const recountPostOffsets = (posts: any[] = []) => {
  let acc = 0
  for (const post of posts) {
    if (!post.parsed) {
      continue
    }
    acc += post.parsed.height || 0
    post.parsed.offset = acc
  }
  return posts
}

export const applyRevealedImageLayoutAtWidth = (posts: any[] = [], screenWidth: number) => {
  for (const post of posts) {
    if (!post.parsed) {
      continue
    }
    const imagesHeight = computeImagesHeight(post, screenWidth)
    const prev = post.parsed.imagesHeight || 0
    const nextHeight = (post.parsed.height || 0) - prev + imagesHeight
    post.parsed.imagesHeight = imagesHeight
    post.parsed.height = nextHeight < 75 ? 75 : nextHeight
  }
  return recountPostOffsets(posts)
}

export const applyRevealedImageToPosts = (
  posts: any[] = [],
  image: any,
  size?: { width?: number; height?: number } | null,
) => {
  const src = image?.src || image?.url
  if (!src || !posts.length) {
    return posts
  }
  const nextPosts = posts.slice()
  for (let i = 0; i < nextPosts.length; i++) {
    const post = nextPosts[i]
    const images = post.parsed?.images || []
    const j = images.findIndex(img => (image.id && img.id === image.id) || img.src === src || img.src === image.src)
    if (j < 0) {
      continue
    }
    const prev = images[j]
    if (prev.revealed) {
      return nextPosts
    }
    const nextImages = images.slice()
    nextImages[j] = {
      ...prev,
      ...(size && size.width > 0 && size.height > 0 ? { width: size.width, height: size.height } : null),
      revealed: true,
      skipDownload: false,
      cached: true,
    }
    nextPosts[i] = {
      ...post,
      parsed: {
        ...post.parsed,
        images: nextImages,
        layoutEpoch: (post.parsed.layoutEpoch || 0) + 1,
      },
    }
    break
  }
  return nextPosts
}

export const IMAGE_SIZE_MB_BYTES = 1024 * 1024

export type ImageSizeLabel = { text: string; overMb: boolean }

export const formatImageSizeKb = (byteLength?: number | null): ImageSizeLabel | null => {
  if (byteLength == null || !Number.isFinite(byteLength) || byteLength <= 0) {
    return null
  }
  if (byteLength > IMAGE_SIZE_MB_BYTES) {
    const mb = byteLength / IMAGE_SIZE_MB_BYTES
    const rounded = mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10
    const text = Number.isInteger(rounded) ? `${rounded} MB` : `${rounded.toFixed(1)} MB`
    return { text, overMb: true }
  }
  return { text: `${Math.max(1, Math.round(byteLength / 1024))} kB`, overMb: false }
}

const byteLengthByUrl = new Map<string, number | null>()

export const fetchImageByteLength = async (url?: string): Promise<number | null> => {
  if (!url) {
    return null
  }
  if (byteLengthByUrl.has(url)) {
    return byteLengthByUrl.get(url) ?? null
  }
  try {
    const head = await fetch(url, { method: 'HEAD' })
    const fromHead = Number(head.headers.get('content-length'))
    if (Number.isFinite(fromHead) && fromHead > 0) {
      byteLengthByUrl.set(url, fromHead)
      return fromHead
    }
  } catch (e) {}
  try {
    const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } })
    const range = res.headers.get('content-range')
    const match = range && /\/(\d+)\s*$/.exec(range)
    if (match) {
      const bytes = Number(match[1])
      byteLengthByUrl.set(url, bytes)
      return bytes
    }
    const fromGet = Number(res.headers.get('content-length'))
    if (Number.isFinite(fromGet) && fromGet > 1) {
      byteLengthByUrl.set(url, fromGet)
      return fromGet
    }
  } catch (e) {}
  byteLengthByUrl.set(url, null)
  return null
}
