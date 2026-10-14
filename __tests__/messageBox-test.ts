import {
  JPEG_QUALITY_DEFAULT,
  JPEG_QUALITY_PERCENTS,
  clampJpegQuality,
  UPLOAD_MAX_BYTES,
  isResizableImageUpload,
  isUploadTooLarge,
  isVideoUpload,
  jpegUploadName,
  uniqueVideoTags,
  isUploadVideoTagEnabled,
  uploadSizeKb,
  uploadSizeLabel,
  uploadSizeMb,
  videoTagFromUpload,
} from '../src/lib/compose'

describe('jpeg quality', () => {
  it('defaults and steps between 50 and 90 by 5', () => {
    expect(JPEG_QUALITY_DEFAULT).toBe(75)
    expect(JPEG_QUALITY_PERCENTS).toEqual([90, 85, 80, 75, 70, 65, 60, 55, 50])
    expect(clampJpegQuality(undefined)).toBe(75)
    expect(clampJpegQuality(50)).toBe(50)
    expect(clampJpegQuality(90)).toBe(90)
    expect(clampJpegQuality(77)).toBe(75)
    expect(clampJpegQuality(10)).toBe(50)
    expect(clampJpegQuality(99)).toBe(90)
  })
})

describe('upload size', () => {
  it('rejects a file that is not smaller than 10 MB and reports kilobytes', () => {
    expect(UPLOAD_MAX_BYTES).toBe(10 * 1024 * 1024)
    expect(isUploadTooLarge(UPLOAD_MAX_BYTES - 1)).toBe(false)
    expect(isUploadTooLarge(UPLOAD_MAX_BYTES)).toBe(true)
    expect(isUploadTooLarge(null)).toBe(false)
    expect(uploadSizeKb(UPLOAD_MAX_BYTES)).toBe(10240)
    expect(uploadSizeKb(1536 * 1024)).toBe(1536)
    expect(uploadSizeMb(UPLOAD_MAX_BYTES)).toBe('10.000')
    expect(uploadSizeMb(1536 * 1024)).toBe('1.500')
    expect(uploadSizeLabel(512 * 1024)).toBe('512 kB')
    expect(uploadSizeLabel(1024 * 1024 - 1)).toMatch(/kB$/)
    expect(uploadSizeLabel(1024 * 1024)).toBe('1.000 MB')
    expect(uploadSizeLabel(12151 * 1024)).toBe('11.866 MB')
  })
})

describe('uploaded video tag setting', () => {
  it('stays on unless the general setting is turned off', () => {
    expect(isUploadVideoTagEnabled(undefined)).toBe(true)
    expect(isUploadVideoTagEnabled({})).toBe(true)
    expect(isUploadVideoTagEnabled({ isUploadVideoTagEnabled: false })).toBe(false)
  })
})

describe('uploaded video', () => {
  it('inserts a video tag when the upload is a video', () => {
    expect(isVideoUpload({ mimetype: 'video/mp4', filename: 'a.bin' })).toBe(true)
    expect(isVideoUpload({ type: 'image/jpeg', filename: 'clip.webm' })).toBe(true)
    expect(isVideoUpload({ mimetype: 'image/jpeg', filename: 'pic.jpg' })).toBe(false)
    expect(videoTagFromUpload({ url: '/data/files/clip.mp4' })).toBe(
      '<video src="https://nyx.cz/data/files/clip.mp4" controls="controls" loop></video>',
    )
  })

  it('keeps one tag when the message and the attachment point at the same file', () => {
    const { kept, dropped } = uniqueVideoTags([
      { link: 'https://nyx.cz/data/files/clip.mp4', raw: 'message' },
      { link: 'https://nyx.cz/data/files/clip.mp4?x=1', raw: 'same-file' },
      { link: '/data/files/clip.mp4', raw: 'attachment' },
      { link: 'https://nyx.cz/data/files/other.mp4', raw: 'other' },
    ])
    expect(kept.map(tag => tag.raw)).toEqual(['message', 'other'])
    expect(dropped.map(tag => tag.raw)).toEqual(['same-file', 'attachment'])
  })
})

describe('uploaded image', () => {
  it('treats common gallery mime types as resizable jpegs', () => {
    expect(isResizableImageUpload({ type: 'image/jpeg', name: 'a.jpg' })).toBe(true)
    expect(isResizableImageUpload({ type: 'image/jpg', name: 'a.jpg' })).toBe(true)
    expect(isResizableImageUpload({ type: 'image/png', name: 'a.png' })).toBe(true)
    expect(isResizableImageUpload({ type: 'image/gif', name: 'a.gif' })).toBe(false)
    expect(isResizableImageUpload({ type: 'video/mp4', name: 'a.mp4' })).toBe(false)
    expect(jpegUploadName('PXL_photo.HEIC')).toBe('PXL_photo.jpg')
  })
})
