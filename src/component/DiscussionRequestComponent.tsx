import React, { useRef } from 'react'
import { Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { useTheme } from '../lib'

type Props = {
  html: string
  height: number
  fontSize?: number
}
export const DiscussionRequestComponent = ({ html, height, fontSize = 12 }: Props) => {
  const refWebView = useRef<any>(null)
  const {
    colors: { background, text },
    metrics: { blocks, screen },
  } = useTheme()
  return (
    <Text>
      <View style={{ flex: 1 }}>
        <WebView
          ref={refWebView}
          style={{
            height,
            width: screen.width - blocks.large,
            backgroundColor: 'transparent',
            marginVertical: blocks.medium,
          }}
          source={{
            html: `
              <html lang="en">
                <body style="margin: 0 !important; padding: 0 !important; background-color: ${background}">
                  <style>
                    * { font-size: ${fontSize}px; color: ${text}; text-decoration: none; }
                    td { padding: 3px; }
                  </style>
                  ${html}
                  <script>
                    document.addEventListener('click', ev => {
                      ev.stopPropagation()
                      ev.preventDefault()
                    })
                  </script>
                </body>
              </html>`,
          }}
          scalesPageToFit={false}
          incognito={true}
          showsVerticalScrollIndicator={false}
          // onShouldStartLoadWithRequest={event => {
          //   return false
          // }}
        />
      </View>
    </Text>
  )
}
