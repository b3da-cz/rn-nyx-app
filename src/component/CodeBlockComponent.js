import React from 'react'
import { Styling } from '../lib'
import AutoHeightWebView from 'react-native-autoheight-webview';

export const CodeBlockComponent = ({ html, fontSize = 10 }) => {
  return (
    <AutoHeightWebView
      style={{
        width: Styling.metrics.screen().width - Styling.metrics.block.medium,
        marginHorizontal: Styling.metrics.block.small,
      }}
      customStyle={`pre { font-size: ${fontSize}px; }`}
      source={{ html }}
      scalesPageToFit={false}
      viewportContent={'width=device-width, user-scalable=no'}
    />
  )
}
