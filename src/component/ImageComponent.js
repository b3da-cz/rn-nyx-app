import React from 'react'
import { Image, TouchableOpacity } from 'react-native'
import { Styling } from '../lib'

export const ImageComponent = ({ src, backgroundColor, width, height, onPress }) => {
  return (
    <TouchableOpacity
      // style={{borderWidth: 1, borderColor: 'green'}}
      accessibilityRole="button"
      onPress={() => onPress()}>
      <Image
        style={{
          backgroundColor,
          width,
          height,
          margin: Styling.metrics.block.small,
        }}
        resizeMethod={'scale'}
        resizeMode={'center'}
        source={{ uri: src }}
      />
    </TouchableOpacity>
  )
}
