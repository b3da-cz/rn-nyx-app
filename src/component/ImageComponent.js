import React, { useLayoutEffect, useState } from 'react'
import { Image } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import { Styling } from '../lib'

export const ImageComponent = ({ src, backgroundColor, width, height, onPress }) => {
  const [imgWidth, setImgWidth] = useState(width)
  const [imgHeight, setImgHeight] = useState(height)
  useLayoutEffect(() => {
    Image.getSize(src, (w, h) => {
      if (width && !height) {
        setImgHeight(h * (width / w))
      } else if (!width && height) {
        setImgWidth(w * (height / h))
      } else {
        this.setState({ width: w, height: h })
      }
    })
  })
  return (
    <TouchableRipple rippleColor={'rgba(18,146,180, 0.3)'} onPress={() => onPress()}>
      <Image
        style={{
          backgroundColor,
          width: imgWidth,
          height: imgHeight,
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
