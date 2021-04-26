/**
 * @format
 * @flow
 */
import React, { useState } from 'react'
import type { Node } from 'react'
import { LogBox, Modal, useColorScheme } from 'react-native'
import 'react-native-gesture-handler'
import { NavigationContainer } from '@react-navigation/native'
import { Provider as PaperProvider } from 'react-native-paper'
import { Nyx, Storage, initFCM, Context, CustomDarkTheme, CombinedDefaultTheme } from './src/lib'
import { Router } from './src/Router'
import { LoginView } from './src/view'

LogBox.ignoreLogs(['Animated.event', 'Animated: `useNativeDriver`', 'componentWillMount has', 'Reanimated 2']) // Ignore log notifications from Swipeable todo

const App: () => Node = () => {
  const n = new Nyx()
  const [nyx, setNyx] = useState(n)
  const [confirmationCode, setConfirmationCode] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const refs = {}
  // const theme = useColorScheme()
  const theme = 'dark'
  const initNyx = async (username?, isAutologin = true) => {
    if (!username) {
      const auth = await Storage.getAuth()
      if (!auth || (auth && !auth.username)) {
        await Storage.removeAll()
        return
      }
      username = auth.username
    }
    const res = await nyx.init(username)
    nyx.onLogout = () => {
      setConfirmationCode(null)
      setIsAuthenticated(false)
    }
    setNyx(nyx)
    if (isAutologin) {
      setIsAuthenticated(res.isConfirmed)
    } else {
      setConfirmationCode(nyx.auth.confirmationCode)
    }
    return res.isConfirmed
  }

  const onLogin = async () => {
    const auth = await Storage.getAuth()
    if (auth) {
      auth.isConfirmed = true;
      await Storage.setAuth(auth)
    }
    setIsAuthenticated(true)
  }

  initNyx().then(isAuth => (isAuth ? initFCM(nyx, isAuth) : null))

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
          onUsername={username => initNyx(username, false)}
          onLogin={() => onLogin()}
        />
      </Modal>
    </PaperProvider>
  )
}

export default App
