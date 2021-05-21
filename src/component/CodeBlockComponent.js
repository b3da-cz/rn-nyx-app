import React from 'react'
import { Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { Styling } from '../lib'

export const CodeBlockComponent = ({ html, height, fontSize = 11 }) => {
  return (
    <Text>
      <View style={{ flex: 1 }}>
        <WebView
          style={{
            width: Styling.metrics.screen().width - Styling.metrics.block.medium,
            height: height,
            backgroundColor: 'transparent',
            marginVertical: Styling.metrics.block.small,
          }}
          source={{
            html: `
              <html lang="en">
                <body style="margin: 0 !important; padding: 0 !important; background-color:#272822">
                  <style>pre { font-size: ${fontSize}px; color: #ccc }</style>
                  ${html}
                </body>
              </html>`,
          }}
          scalesPageToFit={false}
          incognito={true}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Text>
  )
}
