import { Dimensions, Image, PixelRatio } from 'react-native'
import { Bugfender } from '@bugfender/rn-bugfender'
import rnTextSize, { TSFontSpecs } from 'react-native-text-size'
import {
  applyImagePlaceholder,
  applyRevealedImageLayoutAtWidth,
  applyRevealedImageToPosts,
  computeImagesHeight,
  fetchImageByteLength,
  getConfiguredImageFileTimeoutMs,
  getConfiguredImageSizeTimeoutMs,
  hasLoadedImageUrl,
  isImageDownloadOff,
  isImageDownloadUnlimited,
  isPlaceholderImageSize,
  rememberLoadedImageUrl,
  shouldShowCachedImage,
  shouldSkipImageDownload,
} from './imageDownload'
import { discussionRequestBlockHeight, discussionRequestFromPost } from './discussionRequest'
import { attachPollMedia, pollContentHeight, pollLayoutModel } from './poll'
import { FetchProgressEvent, settleWithin } from './fetchProgress'
import { fetchImageDimensionsFromHeader } from './imageHeaderParser'

const IMAGE_CACHE_QUERY_TIMEOUT_MS = 4000

const emitProgress = (onProgress: ((event: FetchProgressEvent) => void) | undefined, event: FetchProgressEvent) => {
  if (typeof onProgress === 'function') {
    onProgress(event)
  }
}

export const queryCachedImageUrls = async (urls: string[] = []): Promise<Set<string>> => {
  const cached = new Set<string>()
  const unique = [...new Set(urls.filter(Boolean))]
  for (const url of unique) {
    if (hasLoadedImageUrl(url)) {
      cached.add(url)
    }
  }
  const missing = unique.filter(url => !cached.has(url))
  if (!missing.length || typeof Image.queryCache !== 'function') {
    return cached
  }
  try {
    const result = await settleWithin(Promise.resolve(Image.queryCache(missing)), IMAGE_CACHE_QUERY_TIMEOUT_MS, null)
    if (result && typeof result === 'object') {
      for (const url of missing) {
        if (result[url]) {
          cached.add(url)
          rememberLoadedImageUrl(url)
        }
      }
    }
  } catch (e) {}
  return cached
}

export const isImageCached = async (url?: string): Promise<boolean> => {
  if (!url) {
    return false
  }
  const cached = await queryCachedImageUrls([url])
  return cached.has(url)
}

const getNativeImageSize = (
  url: string,
  timeoutMs: number,
): Promise<{ width: number; height: number }> => {
  return new Promise(resolve => {
    let done = false
    const finish = (width: number, height: number) => {
      if (done) {
        return
      }
      done = true
      resolve({ width, height })
    }
    const timeout = setTimeout(() => finish(0, 0), timeoutMs)
    try {
      Image.getSize(
        url,
        (width, height) => {
          clearTimeout(timeout)
          finish(width, height)
        },
        () => {
          clearTimeout(timeout)
          finish(0, 0)
        },
      )
    } catch (e) {
      clearTimeout(timeout)
      console.warn(e)
      finish(0, 0)
    }
  })
}

export const getImageSize = async (
  url: string,
  timeoutMs?: number,
  isCached?: boolean,
): Promise<{ width: number; height: number; bytesRead?: number }> => {
  const resolvedTimeout =
    typeof timeoutMs === 'number' && timeoutMs > 0 ? timeoutMs : getConfiguredImageSizeTimeoutMs()

  const cached = isCached ?? hasLoadedImageUrl(url)
  if (cached || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    const size = await getNativeImageSize(url, resolvedTimeout)
    return { ...size, bytesRead: 0 }
  }

  try {
    const headerResult = await fetchImageDimensionsFromHeader(url, resolvedTimeout)
    if (headerResult && headerResult.width > 0 && headerResult.height > 0) {
      return headerResult
    }
  } catch (e) {}

  const fallback = await getNativeImageSize(url, resolvedTimeout)
  return fallback
}

const imageMeasureUrl = (img: any, isFullImgSize?: boolean) =>
  isFullImgSize || img.cached ? img.src : img.thumb || img.src

const imageNeedsMeasure = (img: any) => {
  if (img.skipDownload && !img.revealed && !img.cached) {
    return false
  }
  return !(img.width > 0 && img.height > 0) || isPlaceholderImageSize(img)
}

export const fetchImageSizes = async (
  posts: any[],
  isFullImgSize?: boolean,
  onProgress?: (event: FetchProgressEvent) => void,
  sizeTimeoutMs?: number,
) => {
  try {
    const jobs: { post: any; index: number; url: string; cached: boolean; byteLength?: number }[] = []
    for (const post of posts) {
      if (!(post.parsed?.images?.length > 0) || post.content_raw?.type === 'advertisement') {
        continue
      }
      post.parsed.images.forEach((img, index) => {
        if (!imageNeedsMeasure(img)) {
          return
        }
        const url = imageMeasureUrl(img, isFullImgSize)
        if (!url) {
          return
        }
        jobs.push({
          post,
          index,
          url,
          cached: !!img.cached,
          byteLength: typeof img.byteLength === 'number' && img.byteLength > 0 ? img.byteLength : undefined,
        })
      })
    }
    if (jobs.length) {
      emitProgress(onProgress, { id: 'sizes', done: 0, total: jobs.length, networkBytes: 0 })
    }
    const resolvedSizeTimeout =
      typeof sizeTimeoutMs === 'number' && sizeTimeoutMs > 0 ? sizeTimeoutMs : getConfiguredImageSizeTimeoutMs()
    let done = 0
    let sizesNetworkBytes = 0
    for (const job of jobs) {
      emitProgress(onProgress, { id: 'sizes', done, total: jobs.length, detail: job.url, networkBytes: sizesNetworkBytes })
      try {
        const { width, height, bytesRead } = await getImageSize(job.url, resolvedSizeTimeout, job.cached)
        if (width > 0 && height > 0 && !job.cached) {
          sizesNetworkBytes += typeof bytesRead === 'number' ? bytesRead : (job.byteLength || 0)
        }
        const images = job.post.parsed.images.slice()
        images[job.index] = { ...images[job.index], width, height }
        job.post.parsed.images = images
      } catch (e) {
        console.warn(e)
      }
      done += 1
      emitProgress(onProgress, { id: 'sizes', done, total: jobs.length, detail: job.url, networkBytes: sizesNetworkBytes })
    }
  } catch (e) {
    console.warn(e) // TODO: remove
    Bugfender.error('ERROR_LAYOUT_HELPER', e.stack)
  }
  return posts
}

export const measureImagePixels = async (img: any, isFullImgSize = true) => {
  const url = isFullImgSize ? img.src : img.thumb || img.src
  const { width, height } = await getImageSize(url)
  return { ...img, width, height }
}

const layoutScreenWidth = (themeBaseFontSize?: number) =>
  Dimensions.get('window').width - 12

export const applyRevealedImageLayout = (posts: any[] = [], themeBaseFontSize: number) =>
  applyRevealedImageLayoutAtWidth(posts, layoutScreenWidth(themeBaseFontSize))

export const revealImageInPosts = async (posts: any[] = [], image: any, themeBaseFontSize: number) => {
  const src = image?.src || image?.url
  if (!src || !posts.length) {
    return posts
  }
  let prev
  for (const post of posts) {
    const img = (post.parsed?.images || []).find(
      item => (image.id && item.id === image.id) || item.src === src || item.src === image.src,
    )
    if (img) {
      prev = img
      break
    }
  }
  if (!prev) {
    return posts
  }
  const needsSize = !(prev.width > 0 && prev.height > 0) || isPlaceholderImageSize(prev)
  if (prev.revealed && !needsSize) {
    return posts
  }
  let nextPosts = prev.revealed ? posts : applyRevealedImageToPosts(posts, image)
  let size
  if (needsSize) {
    try {
      const sized = await measureImagePixels(prev, false)
      if (sized.width > 0 && sized.height > 0) {
        size = { width: sized.width, height: sized.height }
      }
    } catch (e) {
      console.warn(e)
    }
  }
  if (size) {
    nextPosts = applyRevealedImageToPosts(nextPosts, image, size)
  }
  if (!themeBaseFontSize) {
    return nextPosts
  }
  return applyRevealedImageLayout(nextPosts, themeBaseFontSize)
}

const markCachedImage = (img: any) => {
  const next = { ...img, cached: true, skipDownload: false }
  if (isPlaceholderImageSize(next)) {
    next.width = 0
    next.height = 0
  }
  return next
}

const imageNeedsByteLength = (img: any, cached: Set<string>, maxKb?: number | null) => {
  if (!img?.src || img.revealed || img.src.includes('youtu')) {
    return false
  }
  if (shouldShowCachedImage(cached.has(img.src), maxKb) || isImageDownloadOff(maxKb)) {
    return false
  }
  return true
}

export const applyImageDownloadPolicy = async (
  posts: any[],
  maxKb?: number | null,
  onProgress?: (event: FetchProgressEvent) => void,
  fileTimeoutMs?: number,
  sizeTimeoutMs?: number,
) => {
  try {
    const resolvedFileTimeout =
      typeof fileTimeoutMs === 'number' && fileTimeoutMs > 0 ? fileTimeoutMs : getConfiguredImageFileTimeoutMs()
    const resolvedSizeTimeout =
      typeof sizeTimeoutMs === 'number' && sizeTimeoutMs > 0 ? sizeTimeoutMs : getConfiguredImageSizeTimeoutMs()
    if (isImageDownloadUnlimited(maxKb)) {
      return fetchImageSizes(posts, false, onProgress, resolvedSizeTimeout)
    }
    const srcs: string[] = []
    for (const post of posts) {
      for (const img of post.parsed?.images || []) {
        if (img.src) {
          srcs.push(img.src)
        }
      }
    }
    if (srcs.length) {
      emitProgress(onProgress, { id: 'cache', done: 0, total: srcs.length })
    }
    const cached = srcs.length ? await queryCachedImageUrls(srcs) : new Set<string>()
    if (srcs.length) {
      emitProgress(onProgress, { id: 'cache', done: srcs.length, total: srcs.length })
    }
    const byteTargets: any[] = []
    for (const post of posts) {
      if (!post.parsed?.images?.length || post.content_raw?.type === 'advertisement') {
        continue
      }
      for (const img of post.parsed.images) {
        if (imageNeedsByteLength(img, cached, maxKb)) {
          byteTargets.push(img)
        }
      }
    }
    if (byteTargets.length) {
      emitProgress(onProgress, { id: 'bytes', done: 0, total: byteTargets.length, networkBytes: 0 })
    }
    let byteDone = 0
    let byteNetworkBytes = 0
    for (const post of posts) {
      if (!post.parsed?.images?.length || post.content_raw?.type === 'advertisement') {
        continue
      }
      const nextImages = []
      for (const img of post.parsed.images) {
        if (img.revealed || img.src?.includes('youtu')) {
          nextImages.push(img)
          continue
        }
        if (shouldShowCachedImage(cached.has(img.src), maxKb)) {
          nextImages.push(markCachedImage(img))
          continue
        }
        if (isImageDownloadOff(maxKb)) {
          nextImages.push(applyImagePlaceholder({ ...img }))
          continue
        }
        emitProgress(onProgress, {
          id: 'bytes',
          done: byteDone,
          total: byteTargets.length,
          detail: img.src,
          networkBytes: byteNetworkBytes,
        })
        const bytes = await fetchImageByteLength(img.src, resolvedFileTimeout)
        byteDone += 1
        // HEAD request network overhead (headers ~512 bytes)
        byteNetworkBytes += 512
        emitProgress(onProgress, {
          id: 'bytes',
          done: byteDone,
          total: byteTargets.length,
          detail: img.src,
          networkBytes: byteNetworkBytes,
        })
        if (shouldSkipImageDownload(bytes, maxKb)) {
          nextImages.push(applyImagePlaceholder({ ...img, byteLength: bytes }))
        } else {
          nextImages.push({ ...img, skipDownload: false, byteLength: bytes })
        }
      }
      post.parsed = {
        ...post.parsed,
        images: nextImages,
        layoutEpoch: (post.parsed.layoutEpoch || 0) + 1,
      }
    }
    return fetchImageSizes(posts, false, onProgress, resolvedSizeTimeout)
  } catch (e) {
    console.warn(e)
    Bugfender.error('ERROR_LAYOUT_HELPER', e.stack)
    return posts
  }
}

export const postsNeedingLayout = (posts: any[] = []) => posts.filter(post => !(post?.parsed?.height > 0))

export const assignPostOffsets = (posts: any[] = []) => {
  let sum = 0
  for (const post of posts) {
    const height = post?.parsed?.height > 0 ? post.parsed.height : 0
    sum += height
    if (post?.parsed) {
      post.parsed.offset = sum
    }
  }
  return posts
}

export const getBlockSizes = async (
  posts: any[],
  themeBaseFontSize: number,
  fontScale: number = PixelRatio.getFontScale() || 1,
  onProgress?: (event: FetchProgressEvent) => void,
) => {
  try {
    themeBaseFontSize = themeBaseFontSize > 15 ? themeBaseFontSize : themeBaseFontSize * 1.075
    // Measure at the app font size and let rn-text-size apply system SP scaling
    // (allowFontScaling). Premultiplying PixelRatio.getFontScale() and measuring
    // in DIP is linear, but Android scales large fonts less than that, so long
    // posts were reserved taller than they render once the system font is maxed.
    const effectiveFontSize = themeBaseFontSize
    const fontSpecs: TSFontSpecs = {
      fontFamily: undefined,
      fontSize: effectiveFontSize,
      // fontStyle: 'italic',
      // fontWeight: 'bold',
    }
    if (themeBaseFontSize > 16) {
      fontSpecs.fontWeight = 'bold'
    }
    const headerSize = themeBaseFontSize * 3.3 * fontScale
    const paddingBottom = (themeBaseFontSize * fontScale) / 2
    const screenWidth = layoutScreenWidth(themeBaseFontSize)
    const minPostHeight = Math.round(75 * fontScale)
    let index = 0
    let cumulativeOffset = 0
    if (posts.length) {
      emitProgress(onProgress, { id: 'layout', done: 0, total: posts.length })
    }
    const allClearTexts = posts.map(p => (p.parsed?.clearText ? p.parsed.clearText : ' '))
    const allClearHeights =
      posts.length > 0
        ? await rnTextSize.flatHeights({
            text: allClearTexts,
            width: screenWidth,
            allowFontScaling: true,
            ...fontSpecs,
          })
        : []

    for (const post of posts) {
      const request = post.content_raw?.type === 'discussion_request' ? discussionRequestFromPost(post) : null
      let textHeight = post.parsed?.clearText ? allClearHeights[index] || 0 : 0
      let discussionRequestMeasured = 0
      if (request) {
        textHeight = 0
        const lines = [request.name, request.category, request.summary]
        if (!request.discussionId) {
          lines.push(request.links.length ? ' ' : request.similar || '-')
        }
        const measured = await rnTextSize.flatHeights({
          text: lines,
          width: Dimensions.get('window').width - 40,
          fontSize: effectiveFontSize,
          allowFontScaling: true,
        })
        discussionRequestMeasured = discussionRequestBlockHeight(
          request,
          measured.reduce((a, b) => a + b, 0),
          fontScale,
        )
      }
      const imagesHeight = computeImagesHeight(post, screenWidth)
      const codeHeights =
        post.parsed.codeBlocks?.length > 0
          ? await rnTextSize.flatHeights({
              text: post.parsed.codeBlocks.map(c => c.raw),
              width: 99999,
              fontSize: 11,
              allowFontScaling: true,
            })
          : []
      const codeBlocksHeight =
        codeHeights.length > 0 ? codeHeights.reduce((a, b) => a + b) + codeHeights.length * 10 : 0
      if (codeBlocksHeight > 0) {
        post.parsed.codeBlocks.forEach((c, i) => {
          post.parsed.codeBlocks[i] = { ...c, height: codeHeights[i] }
        })
      }
      const diceHeight =
        post.content_raw?.type === 'dice'
          ? ((post.content_raw?.data?.computed_values?.user_did_roll ? 40 : 90) +
              post.content_raw?.data?.rolls?.length * 40) *
            fontScale
          : 0
      let pollHeight = 0
      if (post.content_raw?.type === 'poll') {
        attachPollMedia(post)
        const model = pollLayoutModel(post)
        const width = Dimensions.get('window').width - 48
        const questionHeights = await rnTextSize.flatHeights({
          text: [model.question || ' '],
          width,
          fontSize: effectiveFontSize * 1.25,
          allowFontScaling: true,
        })
        const bodyTexts = [model.instructions, ...model.answers]
        const bodyHeights = await rnTextSize.flatHeights({
          text: bodyTexts.map(text => text || ' '),
          width: width - 28,
          fontSize: effectiveFontSize,
          allowFontScaling: true,
        })
        const statsHeights = model.showStats
          ? await rnTextSize.flatHeights({
              text: ['votes\nrespondents'],
              width,
              fontSize: effectiveFontSize,
              allowFontScaling: true,
            })
          : [0]
        // Image pixels are reserved by computeImagesHeight via parsed.images.
        pollHeight = pollContentHeight({
          questionHeight: model.question ? questionHeights[0] || 0 : 0,
          instructionsHeight: model.instructions ? bodyHeights[0] || 0 : 0,
          answerHeights: model.answers.map((text, index) => (text ? bodyHeights[index + 1] || 0 : 0)),
          statsHeight: model.showStats ? statsHeights[0] || 0 : 0,
          canVote: model.showVoteButton,
          voteRows: model.voteRows,
          resultRows: model.resultRows,
          fontScale,
        })
      }
      const adTextHeights =
        post.content_raw?.type === 'advertisement'
          ? await rnTextSize.flatHeights({
              text: [post.content_raw?.data?.summary, '\n\naction\nlocation/price'],
              width: Dimensions.get('window').width - 22,
              fontSize: 16,
              allowFontScaling: true,
            })
          : []
      const adHeight = adTextHeights.length > 0 ? adTextHeights.reduce((a, b) => a + b) + 15 * fontScale : 0
      const eventData = post.content_raw?.type === 'event' ? post.content_raw.data : null
      let eventHeight = 0
      if (eventData?.discussion_id) {
        const fullWidth = Dimensions.get('window').width - 24
        const hasThumb = !!eventData.thumbnail_id
        const headHeights = await rnTextSize.flatHeights({
          text: [eventData.full_name || ' ', eventData.category_path || ' ', eventData.location || ' '],
          width: Math.max(80, fullWidth - (hasThumb ? 84 : 0)),
          fontSize: effectiveFontSize,
          allowFontScaling: true,
        })
        const summaryHeights = eventData.summary
          ? await rnTextSize.flatHeights({
              text: [eventData.summary],
              width: fullWidth,
              fontSize: Math.max(11, effectiveFontSize * 0.8),
              allowFontScaling: true,
            })
          : [0]
        const head = Math.max(
          headHeights.reduce((a, b) => a + b, 0),
          hasThumb ? 72 : 0,
        )
        eventHeight =
          head +
          summaryHeights.reduce((a, b) => a + b, 0) +
          (eventData.going_people > 0 ? 36 * fontScale : 8) +
          28 * fontScale
      }
      const discussionRequestHeight = discussionRequestMeasured
      // each video renders a square WebView plus a "copy link" row below it;
      // reserve the row height too or the row gets clipped by the fixed post height
      const videoCopyRowHeight = 16 + (2 * themeBaseFontSize * fontScale) / 5 + 6
      const videoHeight =
        post.parsed?.videos?.length > 0 ? post.parsed.videos.length * (screenWidth + videoCopyRowHeight) : 0
      const height =
        eventHeight > 0
          ? eventHeight
          : (adHeight > 0 ? adHeight : textHeight) +
            discussionRequestHeight +
            imagesHeight +
            codeBlocksHeight +
            diceHeight +
            pollHeight +
            headerSize +
            videoHeight +
            paddingBottom
      post.parsed.imagesHeight = imagesHeight
      cumulativeOffset += post.parsed.height
      post.parsed.offset = cumulativeOffset

      index++
      emitProgress(onProgress, { id: 'layout', done: index, total: posts.length })
    }
  } catch (e) {
    console.warn(e) // TODO: remove
    Bugfender.error('ERROR_LAYOUT_HELPER', e.stack)
  }
  return posts
}
