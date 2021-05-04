import React from 'react'
import { Modal, TouchableOpacity } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import ImageViewer from 'react-native-image-zoom-viewer'
import ImgToBase64 from 'react-native-image-base64'
import Share from 'react-native-share'
import { LoaderComponent } from '../component'
import { t } from '../lib'

export const ImageModal = ({ isShowing, images, imgIndex = 0, animationType = 'fade', onExit }) => {
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
      const base64 = await ImgToBase64.getBase64String(url)
      Share.open({
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
        onSave={img => share(img)}
        loadingRender={() => <LoaderComponent />}
        menuContext={{ saveToLocal: t('share'), cancel: t('cancel') }}
      />
    </Modal>
  )
}
