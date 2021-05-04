import React, { useLayoutEffect, useState } from 'react'
import { Image } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import { Styling } from '../lib'

export const ImageComponent = ({ src, backgroundColor, width, height, useExactSize, onPress }) => {
  const [imgSrc, setImgSrc] = useState(src)
  const [imgWidth, setImgWidth] = useState(width)
  const [imgHeight, setImgHeight] = useState(height)
  useLayoutEffect(() => {
    try {
      if (src.startsWith('/files/')) {
        setImgSrc(`https://nyx.cz${src}`)
      }
      if (useExactSize) {
        setImgWidth(width)
        setImgHeight(height)
      } else {
        Image.getSize(imgSrc, (w, h) => {
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
  }, [height, imgSrc, src, useExactSize, width])
  return (
    <TouchableRipple rippleColor={'rgba(18,146,180, 0.3)'} onPress={() => onPress()}>
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
        source={{ uri: imgSrc }}
      />
    </TouchableRipple>
  )
}
