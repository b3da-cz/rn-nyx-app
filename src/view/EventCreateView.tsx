import React, { useCallback, useRef, useState } from 'react'
import { BackHandler, Linking, View } from 'react-native'
import { ProgressBar } from 'react-native-paper'
import { WebView } from 'react-native-webview'
import { useFocusEffect } from '@react-navigation/native'
import { EVENT_CREATE_URL, isNyxBrowserUrl, NYX_KEEP_LOGGED_SCRIPT, useTheme } from '../lib'

export const EventCreateView = () => {
  const theme = useTheme()
  const webRef = useRef<any>(null)
  const canGoBack = useRef(false)
  const [progress, setProgress] = useState(0)

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!canGoBack.current) {
          return false
        }
        webRef.current?.goBack()
        return true
      })
      return () => subscription.remove()
    }, []),
  )

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <WebView
        ref={webRef}
        source={{ uri: EVENT_CREATE_URL }}
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        // Default cookie store. incognito would drop the nyx login on every close.
        cacheEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures={true}
        allowFileAccess={true}
        nestedScrollEnabled={true}
        originWhitelist={['*']}
        injectedJavaScript={NYX_KEEP_LOGGED_SCRIPT}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        onNavigationStateChange={nav => {
          canGoBack.current = nav.canGoBack
        }}
        onShouldStartLoadWithRequest={request => {
          if (request.isTopFrame === false || isNyxBrowserUrl(request.url)) {
            return true
          }
          Linking.openURL(request.url).catch(() => null)
          return false
        }}
        onOpenWindow={event => {
          const url = event.nativeEvent.targetUrl
          if (isNyxBrowserUrl(url)) {
            webRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(url)}; true;`)
          }
        }}
      />
      {progress > 0 && progress < 1 && (
        <ProgressBar
          progress={progress}
          color={theme.colors.primary}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 1 }}
        />
      )}
    </View>
  )
}
