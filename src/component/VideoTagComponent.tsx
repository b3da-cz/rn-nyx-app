import React from 'react'
import { Text, ToastAndroid, TouchableOpacity, View } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { WebView } from 'react-native-webview'
import Clipboard from '@react-native-clipboard/clipboard'
import { t, useTheme } from '../lib'

export const VideoTagComponent = ({ url }) => {
  const {
    colors,
    metrics: { blocks, screen },
  } = useTheme()
  const copyUrl = () => {
    if (!url) {
      return
    }
    Clipboard.setString(url)
    ToastAndroid.show(t('coppied'), ToastAndroid.SHORT)
  }
  return (
    <View>
      {/* WebView must stay wrapped in <Text> — rendering it inside a plain
          <View> here makes it blank on Android. Keep the copy row a sibling
          below the <Text> so it is not clipped by the inline measurement.
          The row height is reserved in LayoutHelper (videoCopyRowHeight). */}
      <Text>
        <View style={{ flex: 1 }}>
          <WebView
            style={{
              width: screen.width - 2 * blocks.large,
              height: screen.width - 2 * blocks.large,
              backgroundColor: 'transparent',
            }}
            allowsFullscreenVideo={true}
            source={{
              html: `
                <html lang="en">
                  <body style="margin: 0 !important; padding: 0 !important">
                    <style>video { height: 100%; max-width: 100%; display: block; margin: 0 auto; }</style>
                    <video src="${url}" controls loop></video>
                  </body>
                </html>`,
            }}
            scalesPageToFit={false}
            incognito={true}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>
      </Text>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: blocks.medium,
          paddingVertical: blocks.small,
        }}
        accessibilityRole="button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={copyUrl}
      >
        <Icon name="link" size={16} color={colors.link} />
        <Text style={{ color: colors.link, marginLeft: blocks.small }}>{t('copyUrl')}</Text>
      </TouchableOpacity>
    </View>
  )
}
