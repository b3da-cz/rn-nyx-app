import React from 'react'
import { Modal, TouchableOpacity } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import ImageViewer from 'react-native-image-zoom-viewer'

export const ImageModal = ({ isShowing, images, imgIndex = 0, animationType = 'fade', onExit }) => {
  return (
    <Modal visible={isShowing} transparent={true} animationType={animationType} onRequestClose={() => onExit()}>
      <TouchableOpacity
        style={{ position: 'absolute', top: 15, right: 15, zIndex: 1 }}
        accessibilityRole="button"
        onPress={() => onExit()}>
        <Icon name="x" size={24} color="#ccc" />
      </TouchableOpacity>
      <ImageViewer imageUrls={images} index={imgIndex} />
    </Modal>
  )
}
