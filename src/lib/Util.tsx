import React, { FC } from 'react'
// import { Portal } from 'react-native-paper'
import DocumentPicker from 'react-native-document-picker'
import ImageResizer, { Response as RNIRResponse } from '@bam.tech/react-native-image-resizer'
import { RNNotificationBanner } from 'react-native-notification-banner'
import Icon from 'react-native-vector-icons/Feather'
import { clampJpegQuality, isResizableImageUpload, jpegUploadName, JPEG_QUALITY_DEFAULT } from './compose'

// ImageViewer treats IImageInfo width/height as the display size and never
// scales up, so discussion thumbnail layout sizes must not be forwarded.
const toGalleryImage = (img: any, post?: any) => {
  const url = img?.url || img?.src
  if (!url) {
    return null
  }
  const next: any = { url, src: img.src || url }
  if (img.id) {
    next.id = img.id
  }
  if (img.byteLength != null) {
    next.byteLength = img.byteLength
  }
  if (post) {
    next.postId = post.id
    next.discussionId = post.discussion_id
    next.myRating = post.my_rating
    next.canBeRated = !!post.can_be_rated
  } else {
    if (img.postId != null) {
      next.postId = img.postId
    }
    if (img.discussionId != null) {
      next.discussionId = img.discussionId
    }
    if (img.myRating != null) {
      next.myRating = img.myRating
    }
    if (img.canBeRated != null) {
      next.canBeRated = img.canBeRated
    }
  }
  return next
}

export const galleryImagesFromPosts = (posts: any[] = []) =>
  posts.flatMap(p => (p.parsed?.images || []).map(img => toGalleryImage(img, p))).filter(img => !!img)

export const toGalleryImages = (image: any, list: any[] = []) => {
  const images = (list || []).map(img => toGalleryImage(img)).filter(img => !!img)
  const key = image?.url || image?.src
  let imgIndex = images.findIndex(img => img.url === key)
  if (imgIndex < 0) {
    imgIndex = 0
  }
  return { images, imgIndex }
}

export const generateUuidV4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

export const getDistinctPosts = (posts: any[], oldPosts: any[]) => {
  let newPosts: any[] = []
  const map = new Map()
  for (const item of [...posts, ...oldPosts]) {
    if (!map.has(item.id)) {
      map.set(item.id, true)
      if (!item.uuid) {
        item.uuid = generateUuidV4()
      }
      if (!item.parsed) {
        const oldParsedPost = oldPosts.filter(p => p.id === item.id)
        item.parsed = oldParsedPost.length ? oldParsedPost[0].parsed : null
      }
      newPosts.push(item)
    }
  }
  newPosts.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0))
  // console.warn('posts len', newPosts.length); // TODO: remove
  return newPosts
}

export const wait = async (ms = 100) => {
  return new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms)
  })
}

// fixes TextInput wild behavior inside Portal
// export const withPortal = <P>(Component: FC<P>) => (props: P) => (
//   <Portal>
//     <Component {...props} />
//   </Portal>
// )

const asFileUri = (uri?: string, path?: string) => {
  const value = uri || path
  if (!value) {
    return value
  }
  if (value.startsWith('file:') || value.startsWith('content:')) {
    return value
  }
  return `file://${value}`
}

export const pickFileAndResizeJpegs = async (size, quality = JPEG_QUALITY_DEFAULT) => {
  try {
    const file = await DocumentPicker.pickSingle({
      type: [DocumentPicker.types.allFiles],
    })
    let resized: RNIRResponse | null = null
    if (isResizableImageUpload(file) && size !== 'Original') {
      resized = await ImageResizer.createResizedImage(
        file.uri,
        size,
        size,
        'JPEG',
        clampJpegQuality(quality),
        0,
        undefined,
        false,
        {
          onlyScaleDown: true,
        },
      )
    }
    return {
      uri: resized ? asFileUri(resized.uri, resized.path) : file.uri,
      type: resized ? 'image/jpeg' : file.type,
      name: resized ? jpegUploadName(file.name) : file.name,
      size: resized ? resized.size : file.size,
    }
  } catch (e) {
    if (!DocumentPicker.isCancel(e)) {
      console.warn(e)
    }
  }
}

export const formatDate = str => {
  const y = str.substr(0, 4)
  const m = str.substr(5, 2)
  const d = str.substr(8, 2)
  return `${d}.${m}.${y}  ${str.substr(11)}`
}

export const showNotificationBanner = ({ title, body, textColor = '#FFFFFF', tintColor, icon, onClick }) => {
  RNNotificationBanner.Show({
    title,
    subTitle: body,
    titleColor: textColor,
    subTitleColor: textColor,
    tintColor,
    duration: 5000,
    enableProgress: false,
    withIcon: true,
    dismissable: true,
    isSwipeToDismissEnabled: true,
    icon: <Icon name={icon} size={20} color={textColor} family={'Feather'} />,
    onClick: () => onClick(),
  })
}
