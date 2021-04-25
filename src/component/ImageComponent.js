import React from 'react'
import { Image } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import { Styling } from '../lib'

export const ImageComponent = ({ src, backgroundColor, width, height, onPress }) => {
  return (
    <TouchableRipple rippleColor={'rgba(18,146,180, 0.3)'} onPress={() => onPress()}>
      <Image
        style={{
          backgroundColor,
          width,
          height,
          margin: Styling.metrics.block.small,
        }}
        resizeMethod={'scale'}
        // resizeMode={'cover'} for thumbs
        resizeMode={'contain'}
        // resizeMode={'center'}
        source={{ uri: src }}
      />
    </TouchableRipple>
  )
}
