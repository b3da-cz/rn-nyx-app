/**
 * @format
 * @flow
 */

import React, { Component } from 'react';
import type {Node} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  LogBox,
  StyleSheet,
  Text, TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import openURLInBrowser from 'react-native/Libraries/Core/Devtools/openURLInBrowser';

import { MainView, Styling } from './src'

LogBox.ignoreLogs(['Animated.event', 'Animated: `useNativeDriver`']) // Ignore log notifications from Swipeable todo

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
