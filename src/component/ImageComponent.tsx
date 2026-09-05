import React, { useLayoutEffect, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { TouchableRipple } from 'react-native-paper'
import { useTheme } from '../lib'
import { ImageLoaderComponent } from './ImageLoaderComponent'

type Props = {
  src: string
  width?: number
  height?: number
  useExactSize?: boolean
  isCoverResizeMode?: boolean
  onPress: Function
}
export const ImageComponent = ({ src, width, height, useExactSize, isCoverResizeMode, onPress }: Props) => {
  const [imgWidth, setImgWidth] = useState(width || 0)
  const [imgHeight, setImgHeight] = useState(height || 0)
  const [isLoaded, setIsLoaded] = useState(false)
  useLayoutEffect(() => {
    try {
      if (useExactSize && width && height) {
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
      setImgWidth(width || 300)
      setImgHeight((width || 300) / 2.5)
    }
  }, [height, src, useExactSize, width])
  const {
    colors,
    roundness,
    metrics: { blocks },
  } = useTheme()
  // keep a sensible placeholder box while the image bytes are still loading
  const placeholderHeight = imgHeight || (imgWidth ? imgWidth / 2.5 : 200)
  const boxHeight = isLoaded ? imgHeight : placeholderHeight
  return (
    <TouchableRipple
      rippleColor={colors.ripple}
      style={{
        width: imgWidth + 2 * blocks.medium,
        height: boxHeight + 2 * blocks.medium,
      }}
      onPress={() => onPress()}>
      <View
        style={{
          width: imgWidth,
          height: boxHeight,
          margin: blocks.medium,
          borderRadius: roundness,
          overflow: 'hidden',
          backgroundColor: isLoaded ? 'transparent' : colors.card,
        }}>
        <Image
          style={{
            backgroundColor: 'transparent',
            width: imgWidth,
            height: boxHeight,
            opacity: isLoaded ? 1 : 0,
          }}
          resizeMode={isCoverResizeMode ? 'cover' : 'contain'}
          source={{ uri: src }}
          onLoad={() => setIsLoaded(true)}
        />
        {!isLoaded && (
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <ImageLoaderComponent />
          </View>
        )}
      </View>
    </TouchableRipple>
  )
}
