import React, { useLayoutEffect, useState } from 'react'
import { Image } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import { useTheme } from '../lib'

export const ImageComponent = ({ src, width, height, useExactSize, isCoverResizeMode, onPress }) => {
  const [imgWidth, setImgWidth] = useState(width || 0)
  const [imgHeight, setImgHeight] = useState(height || 0)
  useLayoutEffect(() => {
    try {
      if (useExactSize) {
        setImgWidth(width)
        setImgHeight(height)
      } else {
        Image.getSize(
          src,
          (w, h) => {
            if (width && !height) {
              setImgHeight(h * (width / w))
            } else if (!width && height) {
              setImgWidth(w * (height / h))
            } else {
              setImgWidth(w)
              setImgHeight(h)
            }
          },
          error => console.warn(error),
        )
      }
    } catch (e) {
      setImgWidth(width)
      setImgHeight(width / 2.5)
    }
  }, [height, src, useExactSize, width])
  const {
    colors,
    metrics: { blocks },
  } = useTheme()
  return (
    <TouchableRipple
      rippleColor={colors.ripple}
      style={{
        width: imgWidth + 2 * blocks.medium,
        height: imgHeight + 2 * blocks.medium,
      }}
      onPress={() => onPress()}>
      <Image
        style={{
          backgroundColor: 'transparent',
          width: imgWidth,
          height: imgHeight,
          margin: blocks.medium,
        }}
        resizeMode={isCoverResizeMode ? 'cover' : 'contain'}
        source={{ uri: src }}
      />
    </TouchableRipple>
  )
}
