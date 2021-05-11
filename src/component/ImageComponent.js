import React, { useLayoutEffect, useState } from 'react'
import { Image } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import { Styling } from '../lib'

export const ImageComponent = ({ src, backgroundColor, width, height, useExactSize, onPress }) => {
  const [imgWidth, setImgWidth] = useState(width || 0)
  const [imgHeight, setImgHeight] = useState(height || 0)
  useLayoutEffect(() => {
    try {
      if (useExactSize) {
        setImgWidth(width)
        setImgHeight(height)
      } else {
        Image.getSize(src, (w, h) => {
          if (width && !height) {
            setImgHeight(h * (width / w))
          } else if (!width && height) {
            setImgWidth(w * (height / h))
          } else {
            setImgWidth(w)
            setImgHeight(h)
          }
        })
      }
    } catch (e) {
      setImgWidth(width)
      setImgHeight(width / 2.5)
    }
  }, [height, src, useExactSize, width])
  return (
    <TouchableRipple
      rippleColor={'rgba(18,146,180, 0.3)'}
      style={{
        width: imgWidth + 2 * Styling.metrics.block.small,
        height: imgHeight + 2 * Styling.metrics.block.small,
      }}
      onPress={() => onPress()}>
      <Image
        style={{
          backgroundColor,
          width: imgWidth,
          height: imgHeight,
          margin: Styling.metrics.block.small,
        }}
        // resizeMethod={'scale'}
        // resizeMode={'cover'} for thumbs
        resizeMode={'contain'}
        // resizeMode={'center'}
        source={{ uri: src }}
      />
    </TouchableRipple>
  )
}
