export type ParsedImageDimensions = {
  width: number
  height: number
  format: 'png' | 'jpeg' | 'gif' | 'webp' | 'bmp' | 'avif' | 'svg'
}

export type FetchHeaderDimensionsResult = {
  width: number
  height: number
  bytesRead: number
  format?: string
}

export const parseTiffOrientation = (
  bytes: Uint8Array,
  exifOffset: number,
  maxOffset: number,
): number => {
  if (exifOffset + 8 > maxOffset) {
    return 1
  }
  const isLittle = bytes[exifOffset] === 0x49 && bytes[exifOffset + 1] === 0x49
  const isBig = bytes[exifOffset] === 0x4D && bytes[exifOffset + 1] === 0x4D
  if (!isLittle && !isBig) {
    return 1
  }

  const readU16 = (o: number) =>
    isLittle ? bytes[o] | (bytes[o + 1] << 8) : (bytes[o] << 8) | bytes[o + 1]
  const readU32 = (o: number) =>
    isLittle
      ? ((bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16) | (bytes[o + 3] << 24)) >>> 0)
      : (((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0)

  if (readU16(exifOffset + 2) !== 42) {
    return 1
  }
  const ifd0Offset = readU32(exifOffset + 4)
  let ifdPtr = exifOffset + ifd0Offset
  if (ifdPtr + 2 > maxOffset) {
    return 1
  }

  const numEntries = readU16(ifdPtr)
  ifdPtr += 2

  for (let i = 0; i < numEntries && ifdPtr + 12 <= maxOffset; i++, ifdPtr += 12) {
    const tag = readU16(ifdPtr)
    if (tag === 0x0112) {
      const val = readU16(ifdPtr + 8)
      if (val >= 1 && val <= 8) {
        return val
      }
    }
  }
  return 1
}

export const parseImageDimensions = (
  buffer: ArrayBuffer | Uint8Array | null | undefined,
): ParsedImageDimensions | null => {
  if (!buffer) {
    return null
  }
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  if (bytes.length < 10) {
    return null
  }

  // PNG
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0D &&
    bytes[5] === 0x0A &&
    bytes[6] === 0x1A &&
    bytes[7] === 0x0A
  ) {
    if (bytes.length >= 24) {
      const width = ((bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19]) >>> 0
      const height = ((bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23]) >>> 0
      if (width > 0 && height > 0) {
        return { width, height, format: 'png' }
      }
    }
    return null
  }

  // GIF
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    if (bytes.length >= 10) {
      const width = bytes[6] | (bytes[7] << 8)
      const height = bytes[8] | (bytes[9] << 8)
      if (width > 0 && height > 0) {
        return { width, height, format: 'gif' }
      }
    }
    return null
  }

  // BMP
  if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
    if (bytes.length >= 26) {
      const width = bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24)
      const height = Math.abs(bytes[22] | (bytes[23] << 8) | (bytes[24] << 16) | (bytes[25] << 24))
      if (width > 0 && height > 0) {
        return { width, height, format: 'bmp' }
      }
    }
    return null
  }

  // WebP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes.length >= 16 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    // VP8 (lossy)
    if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20) {
      if (bytes.length >= 30 && bytes[20] === 0x9D && bytes[21] === 0x01 && bytes[22] === 0x2A) {
        const width = (bytes[23] | (bytes[24] << 8)) & 0x3FFF
        const height = (bytes[25] | (bytes[26] << 8)) & 0x3FFF
        if (width > 0 && height > 0) {
          return { width, height, format: 'webp' }
        }
      }
    }
    // VP8L (lossless)
    if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x4C) {
      if (bytes.length >= 25 && bytes[20] === 0x2F) {
        const b0 = bytes[21]
        const b1 = bytes[22]
        const b2 = bytes[23]
        const b3 = bytes[24]
        const width = 1 + (((b1 & 0x3F) << 8) | b0)
        const height = 1 + (((b3 & 0x0F) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6))
        if (width > 0 && height > 0) {
          return { width, height, format: 'webp' }
        }
      }
    }
    // VP8X (extended)
    if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x58) {
      if (bytes.length >= 30) {
        const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16))
        const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16))
        if (width > 0 && height > 0) {
          return { width, height, format: 'webp' }
        }
      }
    }
    return null
  }

  // JPEG / JPG
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
    let offset = 2
    let orientation = 1
    let dimensions: { width: number; height: number } | null = null

    while (offset + 1 < bytes.length) {
      if (bytes[offset] !== 0xFF) {
        offset++
        continue
      }
      while (offset < bytes.length && bytes[offset] === 0xFF) {
        offset++
      }
      if (offset >= bytes.length) {
        break
      }
      const marker = bytes[offset++]

      // Markers without length payload
      if (marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7) || marker === 0x01) {
        continue
      }

      if (offset + 1 >= bytes.length) {
        break
      }
      const chunkLength = (bytes[offset] << 8) | bytes[offset + 1]
      if (chunkLength < 2) {
        break
      }

      // APP1 (EXIF)
      if (marker === 0xE1 && offset + 8 < bytes.length) {
        if (
          bytes[offset + 2] === 0x45 &&
          bytes[offset + 3] === 0x78 &&
          bytes[offset + 4] === 0x69 &&
          bytes[offset + 5] === 0x66 &&
          bytes[offset + 6] === 0x00 &&
          bytes[offset + 7] === 0x00
        ) {
          const exifOffset = offset + 8
          const maxOffset = Math.min(bytes.length, offset + chunkLength)
          const exifOrientation = parseTiffOrientation(bytes, exifOffset, maxOffset)
          if (exifOrientation > 0) {
            orientation = exifOrientation
          }
        }
      }

      // SOF markers
      const isSOF =
        marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC
      if (isSOF) {
        if (offset + 6 < bytes.length) {
          const height = (bytes[offset + 3] << 8) | bytes[offset + 4]
          const width = (bytes[offset + 5] << 8) | bytes[offset + 6]
          if (width > 0 && height > 0) {
            dimensions = { width, height }
            break
          }
        }
      }

      offset += chunkLength
    }

    if (dimensions) {
      if (orientation >= 5 && orientation <= 8) {
        return { width: dimensions.height, height: dimensions.width, format: 'jpeg' }
      }
      return { width: dimensions.width, height: dimensions.height, format: 'jpeg' }
    }
    return null
  }

  // AVIF / HEIC (ISOBMFF with 'ispe' box)
  if (bytes.length >= 24 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    for (let i = 8; i < bytes.length - 12; i++) {
      // Look for 'ispe'
      if (bytes[i] === 0x69 && bytes[i + 1] === 0x73 && bytes[i + 2] === 0x70 && bytes[i + 3] === 0x65) {
        const width = ((bytes[i + 8] << 24) | (bytes[i + 9] << 16) | (bytes[i + 10] << 8) | bytes[i + 11]) >>> 0
        const height = ((bytes[i + 12] << 24) | (bytes[i + 13] << 16) | (bytes[i + 14] << 8) | bytes[i + 15]) >>> 0
        if (width > 0 && height > 0) {
          return { width, height, format: 'avif' }
        }
      }
    }
  }

  // SVG (XML / HTML text)
  if (
    (bytes[0] === 0x3C && (bytes[1] === 0x73 || bytes[1] === 0x3F)) ||
    (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF && bytes[3] === 0x3C)
  ) {
    try {
      const slice = bytes.subarray(0, Math.min(bytes.length, 4096))
      let text = ''
      for (let i = 0; i < slice.length; i++) {
        text += String.fromCharCode(slice[i])
      }
      const svgMatch = /<svg[^>]*>/i.exec(text)
      if (svgMatch) {
        const svgTag = svgMatch[0]
        const viewBoxMatch = /viewBox=["']\s*([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)\s*["']/i.exec(
          svgTag,
        )
        if (viewBoxMatch) {
          const w = parseFloat(viewBoxMatch[3])
          const h = parseFloat(viewBoxMatch[4])
          if (w > 0 && h > 0) {
            return { width: Math.round(w), height: Math.round(h), format: 'svg' }
          }
        }
        const wMatch = /\bwidth=["']\s*([\d.]+)/i.exec(svgTag)
        const hMatch = /\bheight=["']\s*([\d.]+)/i.exec(svgTag)
        if (wMatch && hMatch) {
          const w = parseFloat(wMatch[1])
          const h = parseFloat(hMatch[1])
          if (w > 0 && h > 0) {
            return { width: Math.round(w), height: Math.round(h), format: 'svg' }
          }
        }
      }
    } catch (e) {}
  }

  return null
}

export const DEFAULT_HEADER_CHUNK_BYTES = 32768

export const fetchImageDimensionsFromHeader = async (
  url?: string | null,
  timeoutMs: number = 4000,
  chunkSize: number = DEFAULT_HEADER_CHUNK_BYTES,
): Promise<FetchHeaderDimensionsResult | null> => {
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return null
  }
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const abortTimer = new Promise<null>(resolve => {
    timer = setTimeout(() => {
      try {
        controller.abort()
      } catch (e) {}
      resolve(null)
    }, timeoutMs)
  })

  try {
    const fetchPromise = (async (): Promise<FetchHeaderDimensionsResult | null> => {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Range: `bytes=0-${chunkSize - 1}`,
        },
        signal: controller.signal,
      })

      // If the server answered 200 instead of 206, it ignored the Range header.
      // If Content-Length is larger than 2 * chunkSize, abort immediately to prevent downloading large body.
      if (res.status === 200) {
        const contentLength = Number(res.headers?.get?.('content-length'))
        if (Number.isFinite(contentLength) && contentLength > chunkSize * 2) {
          try {
            controller.abort()
          } catch (e) {}
          return null
        }
      } else if (res.status !== 206) {
        return null
      }

      const buffer = await res.arrayBuffer()
      const parsed = parseImageDimensions(buffer)
      if (parsed && parsed.width > 0 && parsed.height > 0) {
        return {
          width: parsed.width,
          height: parsed.height,
          bytesRead: buffer.byteLength,
          format: parsed.format,
        }
      }
      return null
    })().catch(() => null)

    const result = await Promise.race([fetchPromise, abortTimer])
    return result
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}
