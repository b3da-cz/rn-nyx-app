export const JPEG_QUALITY_DEFAULT = 75
export const JPEG_QUALITY_PERCENTS = [90, 85, 80, 75, 70, 65, 60, 55, 50]

export const clampJpegQuality = (value?: number | string | null) => {
  const n = Number(value)
  if (!Number.isFinite(n)) {
    return JPEG_QUALITY_DEFAULT
  }
  const stepped = Math.round(n / 5) * 5
  if (stepped < 50) {
    return 50
  }
  if (stepped > 90) {
    return 90
  }
  return stepped
}

export const videoSrcKey = (link?: string | null) => {
  if (!link) {
    return ''
  }
  return link.replace(/^https?:\/\/(www\.)?nyx\.cz/i, '').split('?')[0]
}

export const uniqueVideoTags = <T extends { link?: string | null }>(tags: T[]) => {
  const seen = new Set<string>()
  const kept: T[] = []
  const dropped: T[] = []
  tags.forEach(tag => {
    const key = videoSrcKey(tag.link)
    if (key && seen.has(key)) {
      dropped.push(tag)
      return
    }
    if (key) {
      seen.add(key)
    }
    kept.push(tag)
  })
  return { kept, dropped }
}

export const isResizableImageUpload = (file?: { type?: string; name?: string } | null) => {
  if (!file) {
    return false
  }
  const mime = `${file.type || ''}`.toLowerCase()
  if (/image\/(jpeg|jpg|pjpeg|png|webp|heic|heif|bmp)/.test(mime)) {
    return true
  }
  return /\.(jpe?g|png|webp|heic|heif|bmp)$/i.test(file.name || '')
}

export const jpegUploadName = (name?: string | null) => {
  const base = `${name || 'image'}`.replace(/\.[^./\\]+$/, '') || 'image'
  return `${base}.jpg`
}
