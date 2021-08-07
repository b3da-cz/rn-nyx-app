import React from 'react'
import { Modal, TouchableOpacity, PermissionsAndroid, Platform } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import ImageViewer from 'react-native-image-zoom-viewer'
// import CameraRoll from '@react-native-community/cameraroll' // todo on requestLegacyExternalStorage fix
import RNFetchBlob from 'rn-fetch-blob'
import Share from 'react-native-share'
import { LoaderComponent } from '../component'
import { t } from '../lib'

type Props = {
  isShowing?: boolean
  images: any[]
  imgIndex?: number
  animationType?: 'fade' | 'none' | 'slide' | undefined
  onExit: Function
}
export const ImageModal = ({ isShowing, images, imgIndex = 0, animationType = 'fade', onExit }: Props) => {
  const hasWritePermission = async () => {
    const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    const hasPermission = await PermissionsAndroid.check(permission)
    if (hasPermission) {
      return true
    }
    const status = await PermissionsAndroid.request(permission)
    return status === 'granted'
  }

  const fetchFile = async (url, asBase64?) => {
    if (Platform.OS === 'android' && !(await hasWritePermission())) {
      return
    }
    return await RNFetchBlob.config({
      fileCache: true,
    })
      .fetch('GET', url)
      .then(async resp => {
        if (resp.info().status === 200) {
          const res = asBase64 ? await resp.base64() : `file://${resp.path()}`
          setTimeout(() => resp.flush(), 2000)
          return res
        }
      })
      .catch(e => console.warn(e))
  }

  // const save = async url => {
  //   const path = await fetchFile(url)
  //   // todo not working on a > 9, android:requestLegacyExternalStorage="true" with targetSdk 29 or false with target 28..
  //   CameraRoll.save(path, { album: 'nnn', type: 'photo' })
  //     .then(res => console.warn(res))
  //     .catch(e => console.warn(e))
  // }

  const share = async url => {
    try {
      let type = 'image/jpeg'
      const urlParts = url.split('.')
      const fileExtension = urlParts[urlParts.length - 1]
      switch (fileExtension) {
        case 'png':
          type = 'image/png'
          break
        case 'gif':
          type = 'image/gif'
          break
      }
      const base64 = await fetchFile(url, true)
      Share.open({
        title: 'Share image',
        message: `Share image ${url}`,
        url: `data:${type};base64,${base64}`,
        type,
        failOnCancel: false,
      })
    } catch (e) {
      console.warn(e)
    }
  }

  return (
    <Modal visible={isShowing} transparent={true} animationType={animationType} onRequestClose={() => onExit()}>
      <TouchableOpacity
        style={{ position: 'absolute', top: 15, right: 15, zIndex: 1 }}
        accessibilityRole="button"
        onPress={() => onExit()}>
        <Icon name="x" size={24} color="#ccc" />
      </TouchableOpacity>
      <ImageViewer
        imageUrls={images}
        index={imgIndex}
        doubleClickInterval={300}
        onSave={img => share(img)}
        loadingRender={() => <LoaderComponent />}
        menuContext={{ saveToLocal: t('share'), cancel: t('cancel') }}
      />
    </Modal>
  )
}
