import {
  JPEG_QUALITY_DEFAULT,
  JPEG_QUALITY_PERCENTS,
  clampJpegQuality,
  isResizableImageUpload,
  isVideoUpload,
  jpegUploadName,
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

describe('uploaded video tag', () => {
  it('detects video uploads by mime or filename', () => {
    expect(isVideoUpload({ mimetype: 'video/mp4', filename: 'a.bin' })).toBe(true)
    expect(isVideoUpload({ type: 'image/jpeg', filename: 'clip.webm' })).toBe(true)
    expect(isVideoUpload({ mimetype: 'image/jpeg', filename: 'pic.jpg' })).toBe(false)
  })

  it('treats common gallery mime types as resizable jpegs', () => {
    expect(isResizableImageUpload({ type: 'image/jpeg', name: 'a.jpg' })).toBe(true)
    expect(isResizableImageUpload({ type: 'image/jpg', name: 'a.jpg' })).toBe(true)
    expect(isResizableImageUpload({ type: 'image/png', name: 'a.png' })).toBe(true)
    expect(isResizableImageUpload({ type: 'image/gif', name: 'a.gif' })).toBe(false)
    expect(isResizableImageUpload({ type: 'video/mp4', name: 'a.mp4' })).toBe(false)
    expect(jpegUploadName('PXL_photo.HEIC')).toBe('PXL_photo.jpg')
  })

  it('inserts a video tag matching nyx display', () => {
    expect(videoTagFromUpload({ url: '/data/files/clip.mp4' })).toBe(
      '<video src="https://nyx.cz/data/files/clip.mp4" controls="controls" loop></video>',
    )
    expect(videoTagFromUpload({ url: 'https://nyx.cz/data/files/clip.mp4' })).toBe(
      '<video src="https://nyx.cz/data/files/clip.mp4" controls="controls" loop></video>',
    )
  })
})
