import {
  parseImageDimensions,
  parseTiffOrientation,
  fetchImageDimensionsFromHeader,
} from '../src/lib/imageHeaderParser'

describe('imageHeaderParser', () => {
  describe('parseImageDimensions', () => {
    it('returns null for empty or invalid buffer', () => {
      expect(parseImageDimensions(null)).toBeNull()
      expect(parseImageDimensions(undefined)).toBeNull()
      expect(parseImageDimensions(new Uint8Array([1, 2, 3]))).toBeNull()
      expect(parseImageDimensions(new Uint8Array(10))).toBeNull()
    })

    it('parses PNG dimensions', () => {
      const buf = Buffer.alloc(24)
      buf.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], 0)
      buf.set([0x00, 0x00, 0x00, 0x0D], 8)
      buf.set([0x49, 0x48, 0x44, 0x52], 12)
      buf.writeUInt32BE(1280, 16)
      buf.writeUInt32BE(720, 20)
      expect(parseImageDimensions(buf)).toEqual({ width: 1280, height: 720, format: 'png' })
    })

    it('parses GIF dimensions', () => {
      const buf = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x2C, 0x01, 0xC8, 0x00])
      expect(parseImageDimensions(buf)).toEqual({ width: 300, height: 200, format: 'gif' })
    })

    it('parses BMP dimensions', () => {
      const buf = Buffer.alloc(26)
      buf[0] = 0x42
      buf[1] = 0x4D
      buf.writeInt32LE(640, 18)
      buf.writeInt32LE(-480, 22) // negative height for top-down DIB
      expect(parseImageDimensions(buf)).toEqual({ width: 640, height: 480, format: 'bmp' })
    })

    it('parses WebP VP8X dimensions', () => {
      const buf = Buffer.alloc(30)
      buf.write('RIFF', 0)
      buf.writeUInt32LE(30, 4)
      buf.write('WEBP', 8)
      buf.write('VP8X', 12)
      // canvas width - 1 = 799 (0x031F), canvas height - 1 = 599 (0x0257)
      buf[24] = 0x1F
      buf[25] = 0x03
      buf[26] = 0x00
      buf[27] = 0x57
      buf[28] = 0x02
      buf[29] = 0x00
      expect(parseImageDimensions(buf)).toEqual({ width: 800, height: 600, format: 'webp' })
    })

    it('parses WebP VP8 lossy dimensions', () => {
      const buf = Buffer.alloc(30)
      buf.write('RIFF', 0)
      buf.writeUInt32LE(30, 4)
      buf.write('WEBP', 8)
      buf.write('VP8 ', 12)
      buf[20] = 0x9D
      buf[21] = 0x01
      buf[22] = 0x2A
      buf.writeUInt16LE(400, 23)
      buf.writeUInt16LE(300, 25)
      expect(parseImageDimensions(buf)).toEqual({ width: 400, height: 300, format: 'webp' })
    })

    it('parses WebP VP8L lossless dimensions', () => {
      const buf = Buffer.alloc(26)
      buf.write('RIFF', 0)
      buf.writeUInt32LE(26, 4)
      buf.write('WEBP', 8)
      buf.write('VP8L', 12)
      buf[20] = 0x2F
      // width = 100, height = 50
      // 100 - 1 = 99 -> 0x63; 50 - 1 = 49 -> 0x31
      const widthMinus1 = 99
      const heightMinus1 = 49
      buf[21] = widthMinus1 & 0xFF
      buf[22] = ((widthMinus1 >> 8) & 0x3F) | ((heightMinus1 & 0x03) << 6)
      buf[23] = (heightMinus1 >> 2) & 0xFF
      buf[24] = (heightMinus1 >> 10) & 0x0F
      expect(parseImageDimensions(buf)).toEqual({ width: 100, height: 50, format: 'webp' })
    })

    it('parses JPEG SOF0 without EXIF', () => {
      const jpeg = Buffer.from([
        0xFF, 0xD8, // SOI
        0xFF, 0xE0, 0x00, 0x10, // APP0 len 16
        0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
        0xFF, 0xC0, 0x00, 0x11, // SOF0 len 17
        0x08, // precision 8
        0x04, 0x38, // height 1080
        0x07, 0x80, // width 1920
        0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      ])
      expect(parseImageDimensions(jpeg)).toEqual({ width: 1920, height: 1080, format: 'jpeg' })
    })

    it('parses JPEG with EXIF orientation 6 and swaps width & height', () => {
      const exifHeader = Buffer.alloc(40)
      exifHeader.write('Exif\0\0', 0)
      exifHeader.write('II', 6)
      exifHeader.writeUInt16LE(42, 8)
      exifHeader.writeUInt32LE(8, 10)
      exifHeader.writeUInt16LE(1, 14)
      exifHeader.writeUInt16LE(0x0112, 16) // Tag Orientation
      exifHeader.writeUInt16LE(3, 18) // Type SHORT
      exifHeader.writeUInt32LE(1, 20) // Count 1
      exifHeader.writeUInt16LE(6, 24) // Orientation 6 (Rotate 90 CW)

      const app1Length = exifHeader.length + 2
      const jpeg = Buffer.concat([
        Buffer.from([0xFF, 0xD8]),
        Buffer.from([0xFF, 0xE1, (app1Length >> 8) & 0xFF, app1Length & 0xFF]),
        exifHeader,
        Buffer.from([
          0xFF, 0xC0, 0x00, 0x11,
          0x08,
          0x04, 0x38, // height 1080
          0x07, 0x80, // width 1920
          0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
        ]),
      ])
      // Rotated 90 degrees: width becomes 1080, height becomes 1920
      expect(parseImageDimensions(jpeg)).toEqual({ width: 1080, height: 1920, format: 'jpeg' })
    })

    it('parses SVG with viewBox or width/height', () => {
      const svg1 = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300"><path/></svg>')
      expect(parseImageDimensions(svg1)).toEqual({ width: 500, height: 300, format: 'svg' })

      const svg2 = Buffer.from('<?xml version="1.0"?><svg width="250" height="150"></svg>')
      expect(parseImageDimensions(svg2)).toEqual({ width: 250, height: 150, format: 'svg' })
    })

    it('parses AVIF with ftyp and ispe', () => {
      const buf = Buffer.alloc(32)
      buf.writeUInt32BE(32, 0)
      buf.write('ftyp', 4)
      buf.write('avif', 8)
      buf.write('ispe', 16)
      buf.writeUInt32BE(0, 20) // flags
      buf.writeUInt32BE(1024, 24) // width
      buf.writeUInt32BE(768, 28) // height
      expect(parseImageDimensions(buf)).toEqual({ width: 1024, height: 768, format: 'avif' })
    })
  })

  describe('fetchImageDimensionsFromHeader', () => {
    const originalFetch = global.fetch

    afterEach(() => {
      global.fetch = originalFetch
    })

    it('returns null for non-http url', async () => {
      expect(await fetchImageDimensionsFromHeader(null)).toBeNull()
      expect(await fetchImageDimensionsFromHeader('data:image/png;base64,...')).toBeNull()
      expect(await fetchImageDimensionsFromHeader('file:///path/to/img.png')).toBeNull()
    })

    it('returns dimensions on HTTP 206 Partial Content', async () => {
      const png = Buffer.alloc(24)
      png.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], 0)
      png.set([0x00, 0x00, 0x00, 0x0D], 8)
      png.set([0x49, 0x48, 0x44, 0x52], 12)
      png.writeUInt32BE(800, 16)
      png.writeUInt32BE(600, 20)

      global.fetch = jest.fn().mockResolvedValue({
        status: 206,
        headers: { get: () => 'bytes 0-23/1000' },
        arrayBuffer: async () => png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength),
      })

      const res = await fetchImageDimensionsFromHeader('https://example.com/photo.png', 1000)
      expect(res).toEqual({ width: 800, height: 600, bytesRead: 24, format: 'png' })
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/photo.png', expect.objectContaining({
        headers: { Range: 'bytes=0-32767' },
      }))
    })

    it('aborts on HTTP 200 when server ignores Range and sends huge content', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        headers: { get: (name: string) => (name === 'content-length' ? '10485760' : null) }, // 10 MB
        arrayBuffer: jest.fn(),
      })

      const res = await fetchImageDimensionsFromHeader('https://example.com/huge.jpg', 1000)
      expect(res).toBeNull()
    })

    it('returns null when network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
      const res = await fetchImageDimensionsFromHeader('https://example.com/err.jpg', 1000)
      expect(res).toBeNull()
    })
  })
})
