import { Dimensions, Image } from 'react-native'
import Bugfender from '@bugfender/rn-bugfender'
import rnTextSize, { TSFontSpecs } from 'react-native-text-size'

const getImageSizes = async (images: any[], isFullImgSize?: boolean) => {
  return new Promise(async resolve => {
    try {
      const nextImages: any[] = []
      for (const img of images) {
        const { width, height } = await getImageSize(isFullImgSize ? img.src : img.thumb)
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

const getImageSize = async (url: string): Promise<{ width: number; height: number }> => {
  return new Promise(async resolve => {
    try {
      Image.getSize(
        url,
        (width, height) => {
          resolve({ width, height })
        },
        _ => resolve({ width: 100, height: 5 }),
      )
    } catch (e) {
      console.warn(e) // TODO: remove
      resolve({ width: 100, height: 5 })
    }
  })
}

export const fetchImageSizes = async (posts: any[], isFullImgSize?: boolean, onProgress?: Function) => {
  try {
    let i = 0
    for (const post of posts) {
      if (post.parsed.images?.length > 0 && post.content_raw?.type !== 'advertisement') {
        post.parsed.images = await getImageSizes(post.parsed.images, isFullImgSize)
      }
      i++
      typeof onProgress === 'function' ? onProgress({ length: posts.length, done: i }) : null // + ~4s in debug :( .. what about Promise.allSettled() ?
    }
  } catch (e) {
    console.warn(e) // TODO: remove
    Bugfender.e('ERROR_LAYOUT_HELPER', e.stack)
  }
  return posts
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
    const screenWidth = Dimensions.get('window').width - 12
    let index = 0
    for (const post of posts) {
      const str = post.parsed.clearText || ''
      const textHeights = await rnTextSize.flatHeights({
        text: [str],
        width: screenWidth,
        ...fontSpecs,
      })
      const textHeight = textHeights.reduce((a, b) => a + b)
      const imagesHeight =
        post.parsed.images?.length > 0
          ? post.content_raw?.type === 'advertisement'
            ? 120
            : post.parsed.images
                .map(img => {
                  let w = screenWidth
                  const isYtPreview = img.src.includes('youtu')
                  if (img.width > 0 && img.width < w && !isYtPreview) {
                    // w = img.width // todo cant do this while prefetching thumbnail sizes
                  } else if (isYtPreview) {
                    w = w * 0.8
                  }
                  return img.height * (w / img.width) + 20
                })
                .reduce((a, b) => a + b)
          : 0
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
      const videoHeight = post.parsed?.videos?.length > 0 ? post.parsed.videos.length * screenWidth : 0
      const height =
        (adHeight > 0 ? adHeight : textHeight) +
        imagesHeight +
        codeBlocksHeight +
        diceHeight +
        pollHeight +
        headerSize +
        videoHeight +
        paddingBottom
      post.parsed.height = height < 75 ? 75 : height
      post.parsed.offset = posts
        .filter((_, i) => i <= index)
        .map(p => p.parsed.height)
        .reduce((a, b) => a + b)

      index++
    }
  } catch (e) {
    console.warn(e) // TODO: remove
    Bugfender.e('ERROR_LAYOUT_HELPER', e.stack)
  }
  return posts
}
