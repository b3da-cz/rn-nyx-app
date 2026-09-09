import React, { useContext, useEffect, useLayoutEffect, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import {
  fetchImageByteLength,
  formatImageSizeKb,
  hasLoadedImageUrl,
  isImageCached,
  isImageDownloadOff,
  isImageDownloadUnlimited,
  MainContext,
  rememberLoadedImageUrl,
  shouldSkipImageDownload,
  useTheme,
} from '../lib'
import { ImageLoaderComponent } from './ImageLoaderComponent'

type Props = {
  src: string
  width?: number
  height?: number
  useExactSize?: boolean
  isCoverResizeMode?: boolean
  skipDownload?: boolean
  byteLength?: number | null
  onPress: Function
}
export const ImageComponent = ({
  src,
  width,
  height,
  useExactSize,
  isCoverResizeMode,
  skipDownload,
  byteLength,
  onPress,
}: Props) => {
  const { config } = useContext(MainContext) as any
  const maxKb = config?.imageDownloadMaxKb
  const [blocked, setBlocked] = useState(() => {
    if (skipDownload === false || hasLoadedImageUrl(src)) {
      return false
    }
    return !!skipDownload || isImageDownloadOff(maxKb) || !isImageDownloadUnlimited(maxKb)
  })
  const [imgWidth, setImgWidth] = useState(width || 0)
  const [imgHeight, setImgHeight] = useState(height || 0)
  const [isLoaded, setIsLoaded] = useState(() => hasLoadedImageUrl(src))
  const [sizeLabel, setSizeLabel] = useState(() => formatImageSizeKb(byteLength))
  const markLoaded = () => {
    rememberLoadedImageUrl(src)
    setIsLoaded(true)
  }

  useEffect(() => {
    let cancelled = false
    const decide = async () => {
      if (skipDownload === false || hasLoadedImageUrl(src)) {
        if (!cancelled) {
          setBlocked(false)
        }
        return
      }
      if (await isImageCached(src)) {
        if (!cancelled) {
          setBlocked(false)
        }
        return
      }
      if (skipDownload || isImageDownloadOff(maxKb)) {
        if (!cancelled) {
          setBlocked(true)
        }
        const known = formatImageSizeKb(byteLength)
        if (known) {
          if (!cancelled) {
            setSizeLabel(known)
          }
          return
        }
        const bytes = await fetchImageByteLength(src)
        if (!cancelled) {
          setSizeLabel(formatImageSizeKb(bytes))
        }
        return
      }
      if (isImageDownloadUnlimited(maxKb)) {
        if (!cancelled) {
          setBlocked(false)
        }
        return
      }
      const bytes = await fetchImageByteLength(src)
      if (!cancelled) {
        setBlocked(shouldSkipImageDownload(bytes, maxKb))
        setSizeLabel(formatImageSizeKb(bytes))
      }
    }
    decide()
    return () => {
      cancelled = true
    }
  }, [byteLength, maxKb, skipDownload, src])

  useLayoutEffect(() => {
    try {
      if (blocked) {
        const w = width || 300
        setImgWidth(w)
        setImgHeight(w * (2 / 3))
        return
      }
      if (useExactSize && width && height) {
        setImgWidth(width)
        setImgHeight(height)
      } else {
        Image.getSize(
          src,
          (natW, natH) => {
            if (!(natW > 0) || !(natH > 0)) {
              return
            }
            if (width) {
              setImgWidth(width)
              setImgHeight(natH * (width / natW))
            } else if (height) {
              setImgWidth(natW * (height / natH))
              setImgHeight(height)
            } else {
              setImgWidth(natW)
              setImgHeight(natH)
            }
          },
          error => console.warn(error),
        )
      }
    } catch (e) {
      setImgWidth(width || 300)
      setImgHeight((width || 300) / 2.5)
    }
  }, [blocked, height, src, useExactSize, width])

  const {
    colors,
    roundness,
    metrics: { blocks, fontSizes },
  } = useTheme()
  const placeholderHeight = imgHeight || (imgWidth ? imgWidth * (2 / 3) : 200)
  const boxHeight = blocked ? placeholderHeight : imgHeight || placeholderHeight
  return (
    <TouchableRipple
      rippleColor={colors.ripple}
      style={{
        width: imgWidth + 2 * blocks.medium,
        height: boxHeight + 2 * blocks.medium,
        overflow: 'hidden',
        borderRadius: roundness,
      }}
      onPress={() => onPress()}
    >
      <View
        style={{
          width: imgWidth,
          height: boxHeight,
          margin: blocks.medium,
          borderRadius: roundness,
          overflow: 'hidden',
          backgroundColor: blocked ? colors.card : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {blocked ? (
          <>
            <Icon name="image" size={Math.min(48, Math.max(24, imgWidth / 8))} color={colors.disabled} />
            {!!sizeLabel && (
              <Text
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 8,
                  color: sizeLabel.overMb ? colors.error : colors.disabled,
                  fontSize: fontSizes.small,
                  fontWeight: sizeLabel.overMb ? 'bold' : 'normal',
                }}
              >
                {sizeLabel.text}
              </Text>
            )}
          </>
        ) : (
          <>
            <Image
              style={{
                backgroundColor: 'transparent',
                width: imgWidth,
                height: boxHeight,
              }}
              resizeMode={isCoverResizeMode ? 'cover' : 'contain'}
              source={{ uri: src }}
              fadeDuration={0}
              onLoad={markLoaded}
              onLoadEnd={markLoaded}
            />
            {!isLoaded && (
              <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                <ImageLoaderComponent />
              </View>
            )}
          </>
        )}
      </View>
    </TouchableRipple>
  )
}
