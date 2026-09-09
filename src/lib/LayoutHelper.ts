import { Dimensions, Image } from 'react-native'
import { Bugfender } from '@bugfender/rn-bugfender'
import rnTextSize, { TSFontSpecs } from 'react-native-text-size'
import {
  applyImagePlaceholder,
  applyRevealedImageLayoutAtWidth,
  applyRevealedImageToPosts,
  computeImagesHeight,
  fetchImageByteLength,
  hasLoadedImageUrl,
  isImageDownloadOff,
  isImageDownloadUnlimited,
  isPlaceholderImageSize,
  rememberLoadedImageUrl,
  shouldShowCachedImage,
  shouldSkipImageDownload,
} from './imageDownload'

const getImageSizes = async (images: any[], isFullImgSize?: boolean) => {
  return new Promise(async resolve => {
    try {
      const nextImages: any[] = []
      for (const img of images) {
        if (img.skipDownload && !img.revealed && !img.cached) {
          nextImages.push(img)
          continue
        }
        if (img.width > 0 && img.height > 0 && !isPlaceholderImageSize(img)) {
          nextImages.push(img)
          continue
        }
        const { width, height } = await getImageSize(isFullImgSize || img.cached ? img.src : img.thumb || img.src)
        nextImages.push({
          ...img,
          width,
          height,
        })
      }
      resolve(nextImages)
    } catch (e) {
      resolve(images.map(img => ({ width: 100, height: 100, ...img })))
    }
  })
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
    const result = await Image.queryCache(missing)
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

const getImageSize = async (url: string): Promise<{ width: number; height: number }> => {
  return new Promise(resolve => {
    let done = false
    const finish = (width: number, height: number) => {
      if (done) {
        return
      }
      done = true
      resolve({ width, height })
    }
    const timeout = setTimeout(() => finish(0, 0), 4000)
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

export const fetchImageSizes = async (posts: any[], isFullImgSize?: boolean, onProgress?: Function) => {
  try {
    let i = 0
    for (const post of posts) {
      if (post.parsed.images?.length > 0 && post.content_raw?.type !== 'advertisement') {
        const needsSizes = post.parsed.images.some(
          img =>
            (img.revealed || img.cached || !img.skipDownload) &&
            (!img.width || !img.height || isPlaceholderImageSize(img)),
        )
        if (needsSizes) {
          post.parsed.images = await getImageSizes(post.parsed.images, isFullImgSize)
        }
      }
      i++
      typeof onProgress === 'function' ? onProgress({ length: posts.length, done: i }) : null // + ~4s in debug :( .. what about Promise.allSettled() ?
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

const layoutScreenWidth = (themeBaseFontSize: number) =>
  Dimensions.get('window').width - (themeBaseFontSize > 16 ? 12 : 2)

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
  if (!prev || prev.revealed) {
    return posts
  }
  let size
  try {
    const sized = await measureImagePixels(prev, false)
    if (sized.width > 0 && sized.height > 0) {
      size = { width: sized.width, height: sized.height }
    }
  } catch (e) {
    console.warn(e)
  }
  const nextPosts = applyRevealedImageToPosts(posts, image, size)
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

export const applyImageDownloadPolicy = async (posts: any[], maxKb?: number | null) => {
  try {
    if (isImageDownloadUnlimited(maxKb)) {
      return fetchImageSizes(posts, false)
    }
    const srcs: string[] = []
    for (const post of posts) {
      for (const img of post.parsed?.images || []) {
        if (img.src) {
          srcs.push(img.src)
        }
      }
    }
    const cached = srcs.length ? await queryCachedImageUrls(srcs) : new Set<string>()
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
        const bytes = await fetchImageByteLength(img.src)
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
    return fetchImageSizes(posts, false)
  } catch (e) {
    console.warn(e)
    Bugfender.error('ERROR_LAYOUT_HELPER', e.stack)
    return posts
  }
}

export const getBlockSizes = async (posts: any[], themeBaseFontSize: number) => {
  try {
    themeBaseFontSize = themeBaseFontSize > 15 ? themeBaseFontSize : themeBaseFontSize * 1.075
    const fontSpecs: TSFontSpecs = {
      fontFamily: undefined,
      fontSize: themeBaseFontSize,
      // fontStyle: 'italic',
      // fontWeight: 'bold',
    }
    if (themeBaseFontSize > 16) {
      fontSpecs.fontWeight = 'bold'
    }
    const headerSize = themeBaseFontSize * 3.3
    const paddingBottom = themeBaseFontSize / 2
    const screenWidth = Dimensions.get('window').width - (themeBaseFontSize > 16 ? 12 : 2)
    let index = 0
    for (const post of posts) {
      const textHeights = await rnTextSize.flatHeights({
        text: [post.parsed.clearText],
        width: screenWidth,
        ...fontSpecs,
      })
      const textHeight = textHeights.reduce((a, b) => a + b)
      const imagesHeight = computeImagesHeight(post, screenWidth)
      const codeHeights =
        post.parsed.codeBlocks?.length > 0
          ? await rnTextSize.flatHeights({
              text: post.parsed.codeBlocks.map(c => c.raw),
              width: 99999,
              fontSize: 11,
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
          ? (post.content_raw?.data?.computed_values?.user_did_roll ? 40 : 90) +
            post.content_raw?.data?.rolls?.length * 40
          : 0
      const pollTextHeights =
        post.content_raw?.type === 'poll'
          ? await rnTextSize.flatHeights({
              text: [post.content_raw?.data?.question, post.content_raw?.data?.instructions, '\nrespondents\nvotes'],
              width: Dimensions.get('window').width - 40,
              fontSize: themeBaseFontSize,
            })
          : []
      const pollHeight =
        pollTextHeights.length > 0
          ? (post.content_raw?.data?.computed_values?.user_did_vote ? 60 : 115) +
            pollTextHeights.reduce((a, b) => a + b) +
            Object.keys(post.content_raw?.data?.answers || {}).length * 56
          : 0
      const adTextHeights =
        post.content_raw?.type === 'advertisement'
          ? await rnTextSize.flatHeights({
              text: [post.content_raw?.data?.summary, '\n\naction\nlocation/price'],
              width: Dimensions.get('window').width - 22,
              fontSize: 16,
            })
          : []
      const adHeight = adTextHeights.length > 0 ? adTextHeights.reduce((a, b) => a + b) + 15 : 0
      const discussionRequestTextHeights =
        post.content_raw?.type === 'discussion_request'
          ? await rnTextSize.flatHeights({
              text: [post.parsed.clearText],
              width: Dimensions.get('window').width + 100,
              fontSize: 10,
            })
          : []
      const discussionRequestHeight =
        discussionRequestTextHeights.length > 0 ? discussionRequestTextHeights.reduce((a, b) => a + b) + 15 : 0
      const videoHeight = post.parsed?.videos?.length > 0 ? post.parsed.videos.length * screenWidth : 0
      const height =
        (adHeight > 0 ? adHeight : textHeight) +
        discussionRequestHeight +
        imagesHeight +
        codeBlocksHeight +
        diceHeight +
        pollHeight +
        headerSize +
        videoHeight +
        paddingBottom
      post.parsed.imagesHeight = imagesHeight
      post.parsed.height = height < 75 ? 75 : height
      post.parsed.offset = posts
        .filter((_, i) => i <= index)
        .map(p => p.parsed.height)
        .reduce((a, b) => a + b)

      index++
    }
  } catch (e) {
    console.warn(e) // TODO: remove
    Bugfender.error('ERROR_LAYOUT_HELPER', e.stack)
  }
  return posts
}
