import React, { FC } from 'react'
import { Portal } from 'react-native-paper'
import DocumentPicker from 'react-native-document-picker'
import ImageResizer from 'react-native-image-resizer'
import { RNNotificationBanner } from 'react-native-notification-banner'
import { Styling } from './Styling'
import Icon from 'react-native-vector-icons/Feather'

export const generateUuidV4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

export const getDistinctPosts = (posts, oldPosts) => {
  let newPosts = []
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
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms)
  })
}

// fixes TextInput wild behavior inside Portal
export const withPortal = <P>(Component: FC<P>) => (props: P) => (
  <Portal>
    <Component {...props} />
  </Portal>
)

export const pickFileAndResizeJpegs = async size => {
  try {
    const file = await DocumentPicker.pick({
      type: [DocumentPicker.types.images],
    })
    // console.warn(`original ${Math.floor(file.size / 1024)}Kb`) // TODO: remove
    let resized = null
    if (file.type === 'image/jpeg' && size !== 'Original') {
      resized = await ImageResizer.createResizedImage(file.uri, size, size, 'JPEG', 80, undefined, undefined, false, {
        onlyScaleDown: true,
      })
      // console.warn(`resized ${Math.floor(resized.size / 1024)}Kb`) // TODO: remove
    }
    return {
      uri: resized ? resized.uri : file.uri,
      type: file.type,
      name: file.name,
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
  return `${d}.${m}.${y}  ${str.substring(11)}`
}

export const showNotificationBanner = ({ title, body, tintColor, icon, onClick }) => {
  RNNotificationBanner.Show({
    title,
    subTitle: body,
    titleColor: Styling.colors.white,
    subTitleColor: Styling.colors.white,
    tintColor,
    duration: 5000,
    enableProgress: false,
    withIcon: true,
    dismissable: true,
    icon: <Icon name={icon} size={20} color={Styling.colors.white} family={'Feather'} />,
    onClick: () => onClick(),
  })
}
