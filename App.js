/**
 * @format
 * @flow
 */
import React, { useState } from 'react'
import type { Node } from 'react'
import { LogBox, Modal, useColorScheme } from 'react-native'
import 'react-native-gesture-handler'
import { Nyx, Storage, initFCM, Context, CustomDarkTheme, CombinedDefaultTheme } from './src/lib'
import { LoginView } from './src/view'
import { Router } from './src/Router'
import { NavigationContainer } from '@react-navigation/native'
import { Provider as PaperProvider } from 'react-native-paper'

LogBox.ignoreLogs(['Animated.event', 'Animated: `useNativeDriver`', 'componentWillMount has', 'Reanimated 2']) // Ignore log notifications from Swipeable todo

const App: () => Node = () => {
  const n = new Nyx()
  const [nyx, setNyx] = useState(n)
  const [confirmationCode, setConfirmationCode] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const refs = {}
  const theme = useColorScheme()
  const initNyx = async (username?) => {
    if (!username) {
      const auth = await Storage.getAuth()
      if (!auth || (auth && !auth.username)) {
        await Storage.removeAll()
        return
      }
      username = auth.username
    }
    const isAuthConfirmed = await nyx.init(username)
    setNyx(nyx)
    setIsAuthenticated(isAuthConfirmed) // todo test
    setConfirmationCode(nyx.auth.confirmationCode)
    return isAuthConfirmed
  }

  initNyx().then(isAuth => (isAuth ? initFCM() : null))

  return (
    <PaperProvider theme={theme === 'dark' ? CustomDarkTheme : CombinedDefaultTheme}>
      <Context.Provider value={{ nyx, theme, refs }}>
        <NavigationContainer theme={theme === 'dark' ? CustomDarkTheme : CombinedDefaultTheme}>
          <Router nyx={nyx} refs={refs} />
        </NavigationContainer>
      </Context.Provider>
      <Modal visible={!isAuthenticated} transparent={false} animationType={'fade'} onRequestClose={() => null}>
        <LoginView
          isDarkMode={theme === 'dark'}
          confirmationCode={confirmationCode}
          onUsername={username => initNyx(username)}
          onLogin={() => setIsAuthenticated(true)}
        />
      </Modal>
    </PaperProvider>
  )
}

export default App
