import {
  IMAGE_DOWNLOAD_OFF,
  IMAGE_DOWNLOAD_UNLIMITED,
  applyImagePlaceholder,
  applyRevealedImageLayoutAtWidth,
  formatImageSizeKb,
  hasLoadedImageUrl,
  isPlaceholderImageSize,
  normalizeImageDownloadMaxKb,
  rememberLoadedImageUrl,
  shouldShowCachedImage,
  shouldSkipImageDownload,
} from '../src/lib/imageDownload'

describe('imageDownload', () => {
  it('defaults unknown values to unlimited', () => {
    expect(normalizeImageDownloadMaxKb(undefined)).toBe(IMAGE_DOWNLOAD_UNLIMITED)
    expect(normalizeImageDownloadMaxKb(null)).toBe(IMAGE_DOWNLOAD_UNLIMITED)
    expect(normalizeImageDownloadMaxKb('unlimited')).toBe(IMAGE_DOWNLOAD_UNLIMITED)
    expect(normalizeImageDownloadMaxKb('nope')).toBe(IMAGE_DOWNLOAD_UNLIMITED)
  })

  it('accepts off and the listed kb caps', () => {
    expect(normalizeImageDownloadMaxKb('off')).toBe(IMAGE_DOWNLOAD_OFF)
    expect(normalizeImageDownloadMaxKb(0)).toBe(IMAGE_DOWNLOAD_OFF)
    expect(normalizeImageDownloadMaxKb(50)).toBe(50)
    expect(normalizeImageDownloadMaxKb('1024')).toBe(1024)
    expect(normalizeImageDownloadMaxKb(123)).toBe(IMAGE_DOWNLOAD_UNLIMITED)
  })

  it('skips download only when off or over the byte cap', () => {
    expect(shouldSkipImageDownload(999999, IMAGE_DOWNLOAD_UNLIMITED)).toBe(false)
    expect(shouldSkipImageDownload(1, IMAGE_DOWNLOAD_OFF)).toBe(true)
    expect(shouldSkipImageDownload(50 * 1024, 50)).toBe(false)
    expect(shouldSkipImageDownload(50 * 1024 + 1, 50)).toBe(true)
    expect(shouldSkipImageDownload(null, 50)).toBe(false)
  })

  it('treats a cache hit as showable regardless of download settings', () => {
    expect(shouldShowCachedImage(true, IMAGE_DOWNLOAD_OFF)).toBe(true)
    expect(shouldShowCachedImage(true, 50)).toBe(true)
    expect(shouldShowCachedImage(true, IMAGE_DOWNLOAD_UNLIMITED)).toBe(true)
    expect(shouldShowCachedImage(false, IMAGE_DOWNLOAD_OFF)).toBe(false)
  })

  it('remembers loaded image urls for the session', () => {
    const url = 'https://nyx.cz/cached-session.jpg'
    expect(hasLoadedImageUrl(url)).toBe(false)
    rememberLoadedImageUrl(url)
    expect(hasLoadedImageUrl(url)).toBe(true)
  })

  it('formats placeholder size in kB, and MB in red over 1 MB', () => {
    expect(formatImageSizeKb(null)).toBe(null)
    expect(formatImageSizeKb(0)).toBe(null)
    expect(formatImageSizeKb(512)).toEqual({ text: '1 kB', overMb: false })
    expect(formatImageSizeKb(50 * 1024)).toEqual({ text: '50 kB', overMb: false })
    expect(formatImageSizeKb(1024 * 1024)).toEqual({ text: '1024 kB', overMb: false })
    expect(formatImageSizeKb(1024 * 1024 + 1)).toEqual({ text: '1 MB', overMb: true })
    expect(formatImageSizeKb(1.5 * 1024 * 1024)).toEqual({ text: '1.5 MB', overMb: true })
    expect(formatImageSizeKb(12.2 * 1024 * 1024)).toEqual({ text: '12 MB', overMb: true })
  })

  it('marks placeholders as 3:2', () => {
    const img = applyImagePlaceholder({ src: 'https://nyx.cz/a.jpg' })
    expect(img.skipDownload).toBe(true)
    expect(img.cached).toBe(false)
    expect(img.width / img.height).toBe(3 / 2)
    expect(isPlaceholderImageSize(img)).toBe(true)
  })
})

describe('revealed image layout', () => {
  it('recounts post offsets after a revealed image grows', () => {
    const posts = [
      {
        id: 1,
        parsed: {
          height: 200,
          offset: 200,
          imagesHeight: 80,
          images: [{ width: 3, height: 2, skipDownload: false }],
        },
      },
      {
        id: 2,
        parsed: { height: 150, offset: 350, imagesHeight: 0, images: [] },
      },
    ]
    posts[0].parsed.images[0].width = 300
    posts[0].parsed.images[0].height = 300
    const next = applyRevealedImageLayoutAtWidth(posts, 360)
    expect(next[0].parsed.height).toBeGreaterThan(200)
    expect(next[1].parsed.offset).toBe(next[0].parsed.height + next[1].parsed.height)
  })
})
