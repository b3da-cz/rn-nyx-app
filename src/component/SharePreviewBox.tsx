import React, { FC } from 'react'
import { Image, View } from 'react-native'
import { Text } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import { SharedData, Theme } from '../lib'

type Props = {
  sharedData: SharedData
  theme?: Theme
}

const formatSize = (b?: number) =>
  !b ? '' : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`

export const SharePreviewBox: FC<Props> = ({ sharedData, theme }) => {
  const colors = theme?.colors || ({} as any)
  const isVideo = sharedData.file?.type?.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(sharedData.file?.name || '')
  const hasThumb = Boolean(
    sharedData.file?.thumbnailUri ||
      sharedData.file?.type?.startsWith('image/') ||
      /\.(jpe?g|png|webp|gif)$/i.test(sharedData.file?.name || ''),
  )
  const thumbUri = sharedData.file?.thumbnailUri || sharedData.file?.uri

  return (
    <View
      style={{
        backgroundColor: colors.background || '#161719',
        borderLeftWidth: 3,
        borderLeftColor: colors.primary || '#d32f2f',
        borderRadius: 0,
        padding: 10,
        marginBottom: 12,
      }}>
      {sharedData.type === 'file' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {hasThumb && thumbUri ? (
            <View style={{ position: 'relative', marginRight: 10 }}>
              <Image
                source={{ uri: thumbUri }}
                style={{ width: 48, height: 48, borderRadius: 2, backgroundColor: colors.surface }}
                resizeMode="cover"
              />
              {isVideo && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    borderRadius: 2,
                  }}>
                  <Icon name="play" size={16} color="#fff" />
                </View>
              )}
            </View>
          ) : (
            <Icon
              name={isVideo ? 'video' : 'file'}
              size={24}
              color={colors.primary || '#d32f2f'}
              style={{ marginRight: 10 }}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: colors.text, fontWeight: 'bold', fontSize: 13 }}>
              {sharedData.file?.name}
            </Text>
            {!!sharedData.file?.size && (
              <Text style={{ color: colors.disabled, fontSize: 11, marginTop: 2 }}>
                {formatSize(sharedData.file?.size)}
              </Text>
            )}
          </View>
        </View>
      ) : (
        <Text numberOfLines={3} style={{ color: colors.text, fontSize: 13, lineHeight: 18 }}>
          {sharedData.text}
        </Text>
      )}
    </View>
  )
}
