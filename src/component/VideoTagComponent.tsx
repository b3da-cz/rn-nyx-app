import React from 'react'
import { Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { useTheme } from '../lib'

export const VideoTagComponent = ({ url }) => {
  const {
    metrics: { blocks, screen },
  } = useTheme()
  return (
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
  )
}
