import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import rnTextSize from 'react-native-text-size'
import { useTheme } from '../lib'

type Props = {
  html: string
  height: number
  fontSize?: number
}
export const CodeBlockComponent = ({ html, height, fontSize = 11 }: Props) => {
  const [h, setH] = useState<number>(height)
  useEffect(() => {
    if (!height) {
      rnTextSize
        .flatHeights({
          text: [html],
          width: 99999,
          fontSize,
        })
        .then(res => setH(res[0]))
    }
  })
  const {
    metrics: { blocks, screen },
  } = useTheme()
  return !h ? null : (
    <Text>
      <View style={{ flex: 1 }}>
        <WebView
          style={{
            height: h,
            width: screen.width - blocks.large,
            backgroundColor: 'transparent',
            marginVertical: blocks.medium,
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
