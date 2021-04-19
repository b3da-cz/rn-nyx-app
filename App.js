/**
 * @format
 * @flow
 */

import React from 'react'
import type { Node } from 'react'
import { SafeAreaView, StatusBar, LogBox } from 'react-native'
// import openURLInBrowser from 'react-native/Libraries/Core/Devtools/openURLInBrowser'
import { Styling } from './src/lib'
import { MainView } from './src/view'

LogBox.ignoreLogs(['Animated.event', 'Animated: `useNativeDriver`', 'componentWillMount has']) // Ignore log notifications from Swipeable todo

const App: () => Node = () => {
  // const isDarkMode = useColorScheme() === 'dark'
  const isDarkMode = true

  return (
    <SafeAreaView style={Styling.groups.themeView(isDarkMode)}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <MainView isDarkMode={isDarkMode} />
    </SafeAreaView>
  )
}

export default App
