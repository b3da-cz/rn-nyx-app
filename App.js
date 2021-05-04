/**
 * @format
 * @flow
 */
import React, { useState, useEffect } from 'react'
import type { Node } from 'react'
import { Linking, LogBox, Modal } from 'react-native'
import 'react-native-gesture-handler'
import { NavigationContainer } from '@react-navigation/native'
import { Provider as PaperProvider } from 'react-native-paper'
import RNBootSplash from 'react-native-bootsplash'
import Bugfender from '@bugfender/rn-bugfender'
import { LoaderComponent } from './src/component'
import { Nyx, Storage, initFCM, Context, CustomDarkTheme, CombinedDefaultTheme } from './src/lib'
import { Router } from './src/Router'
import { LoginView } from './src/view'

LogBox.ignoreLogs(['Animated.event', 'Animated: `useNativeDriver`', 'componentWillMount has', 'Reanimated 2']) // Ignore log notifications from Swipeable todo

const initialConfig = {
  isLoaded: false,
  isBookmarksEnabled: true,
  isHistoryEnabled: true,
  isBottomTabs: true,
  isNavGesturesEnabled: true,
  initialRouteName: 'historyStack',
  fcmToken: null,
  isFCMSubscribed: false,
}

const App: () => Node = () => {
  const n = new Nyx()
  const [nyx, setNyx] = useState(n)
  const [confirmationCode, setConfirmationCode] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAppLoaded, setIsAppLoaded] = useState(false)
  const [config, setConfig] = useState(initialConfig)
  const refs = {}
  // const theme = useColorScheme()
  const theme = 'dark'

  useEffect(() => {
    return () => {
      Linking.removeAllListeners('url')
    }
  })

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
    Bugfender.setDeviceString('@username', username)
    Bugfender.d('INFO', 'App: Nyx initialized')
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
      auth.isConfirmed = true
      await Storage.setAuth(auth)
    }
    setIsAuthenticated(true)
  }

  const loadConfig = async () => {
    const conf = (await Storage.getConfig()) || initialConfig
    setConfig({
      isLoaded: true,
      isBookmarksEnabled: conf.isBookmarksEnabled === undefined ? true : !!conf.isBookmarksEnabled,
      isHistoryEnabled: conf.isHistoryEnabled === undefined ? true : !!conf.isHistoryEnabled,
      isBottomTabs: conf.isBottomTabs === undefined ? true : !!conf.isBottomTabs,
      isNavGesturesEnabled: conf.isNavGesturesEnabled === undefined ? true : !!conf.isNavGesturesEnabled,
      initialRouteName: conf.initialRouteName === undefined ? 'historyStack' : conf.initialRouteName,
      fcmToken: conf.fcmToken || null,
      isFCMSubscribed: conf.isFCMSubscribed === undefined ? false : !!conf.isFCMSubscribed,
    })
    return conf
  }

  const init = async () => {
    const conf = await loadConfig()
    const isAuth = await initNyx()
    if (isAuth) {
      await initFCM(nyx, conf, isAuth)
    }
    setIsAppLoaded(true)
    setTimeout(() => {
      RNBootSplash.hide({ fade: true })
    }, 500)
    const handleDeepLinks = async () => {
      const initialUrl = await Linking.getInitialURL()
      Linking.addEventListener('url', ({ url }) => console.warn(url))
      // console.warn('initialUrl', initialUrl) // todo pass to messagebox
    }
    handleDeepLinks()
  }
  if (!config.isLoaded) {
    init()
  }

  return (
    <PaperProvider theme={theme === 'dark' ? CustomDarkTheme : CombinedDefaultTheme}>
      {!isAppLoaded && <LoaderComponent />}
      {isAuthenticated && (
        <Context.Provider value={{ nyx, theme, refs }}>
          <NavigationContainer theme={theme === 'dark' ? CustomDarkTheme : CombinedDefaultTheme}>
            <Router config={config} nyx={nyx} refs={refs} onConfigReload={() => loadConfig()} />
          </NavigationContainer>
        </Context.Provider>
      )}
      {isAppLoaded && (
        <Modal visible={!isAuthenticated} transparent={false} animationType={'fade'} onRequestClose={() => null}>
          <LoginView
            isDarkMode={theme === 'dark'}
            confirmationCode={confirmationCode}
            onUsername={username => initNyx(username, false)}
            onLogin={() => onLogin()}
          />
        </Modal>
      )}
    </PaperProvider>
  )
}

export default App
