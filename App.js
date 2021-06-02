/**
 * @format
 * @flow
 */
import React, { useState, useEffect } from 'react'
import type { Node } from 'react'
import { Linking, LogBox, Modal, Platform, UIManager } from 'react-native'
import useColorScheme from 'react-native/Libraries/Utilities/useColorScheme'
import 'react-native-gesture-handler'
import { NetworkProvider } from 'react-native-offline'
import { NavigationContainer } from '@react-navigation/native'
import { Provider as PaperProvider } from 'react-native-paper'
import RNBootSplash from 'react-native-bootsplash'
import Bugfender from '@bugfender/rn-bugfender'
import { devFilter } from './black-list.json'
import { LoaderComponent } from './src/component'
import {
  createTheme,
  defaultThemeOptions,
  initFCM,
  MainContext,
  Nyx,
  Storage,
  UnreadContextProvider,
  wait,
} from './src/lib'
import { Router } from './src/Router'
import { LoginView } from './src/view'

LogBox.ignoreLogs([
  'Animated.event',
  'Animated: `useNativeDriver`',
  'componentWillMount has',
  'Reanimated 2',
  'Require cycle: node_modules/',
]) // Ignore log notifications from Swipeable todo

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true)
  }
}

const initialConfig = {
  isLoaded: false,
  isBookmarksEnabled: true,
  isBottomTabs: true,
  isHistoryEnabled: true,
  isSearchEnabled: true,
  isLastEnabled: true,
  isRemindersEnabled: true,
  isNavGesturesEnabled: true,
  isShowingReadOnLists: true,
  initialRouteName: 'historyStack',
  shownCategories: null,
  fcmToken: null,
  isFCMSubscribed: false,
  theme: 'system',
  themeOptions: [...defaultThemeOptions],
}

const App: () => Node = () => {
  const n = new Nyx()
  const [nyx, setNyx] = useState(n)
  const [confirmationCode, setConfirmationCode] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAppLoaded, setIsAppLoaded] = useState(false)
  const [config, setConfig] = useState(initialConfig)
  const [filters, setFilters] = useState([])
  const [blockedUsers, setBlockedUsers] = useState([])
  const refs = {}
  const systemTheme = useColorScheme()
  const themeType = config.theme === 'system' ? systemTheme : config.theme

  useEffect(() => {
    Linking.addEventListener('url', ({ url }) => handleDeepLink(url))
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
      await Storage.setConfig(config)
      await wait(300)
      await initFCM(nyx, config, true, true)
    }
    setIsAuthenticated(true)
  }

  const loadConfig = async () => {
    const conf = (await Storage.getConfig()) || initialConfig
    setConfig({
      isLoaded: true,
      isBookmarksEnabled: conf.isBookmarksEnabled === undefined ? true : !!conf.isBookmarksEnabled,
      isBottomTabs: conf.isBottomTabs === undefined ? true : !!conf.isBottomTabs,
      isHistoryEnabled: conf.isHistoryEnabled === undefined ? true : !!conf.isHistoryEnabled,
      isSearchEnabled: conf?.isSearchEnabled !== undefined ? !!conf.isSearchEnabled : true,
      isLastEnabled: conf?.isLastEnabled !== undefined ? !!conf.isLastEnabled : true,
      isRemindersEnabled: conf?.isRemindersEnabled !== undefined ? !!conf.isRemindersEnabled : true,
      isNavGesturesEnabled: conf.isNavGesturesEnabled === undefined ? true : !!conf.isNavGesturesEnabled,
      isShowingReadOnLists: conf.isShowingReadOnLists === undefined ? true : !!conf.isShowingReadOnLists,
      initialRouteName: conf.initialRouteName === undefined ? 'historyStack' : conf.initialRouteName,
      shownCategories: conf.shownCategories || null,
      fcmToken: conf.fcmToken || null,
      isFCMSubscribed: conf.isFCMSubscribed === undefined ? false : !!conf.isFCMSubscribed,
      theme: conf.theme === undefined ? 'system' : conf.theme,
      themeOptions: conf.themeOptions === undefined ? [...defaultThemeOptions] : conf.themeOptions,
    })
    return conf
  }

  const loadFilters = async () => {
    const f = (await Storage.getFilters()) || []
    setFilters(f)
    return f
  }

  const loadBlockedUsers = async () => {
    const f = (await Storage.getBlockedUsers()) || []
    setBlockedUsers(f)
    return f
  }

  const loadStorage = async ({ getConfig = true, getFilters = true, getBlockedUsers = true }) => ({
    config: getConfig ? await loadConfig() : config,
    filters: getFilters ? await loadFilters() : filters,
    blockedUsers: getBlockedUsers ? await loadBlockedUsers() : blockedUsers,
  })

  const handleDeepLink = async url => {
    if (url === 'nnn://setdevfilters') {
      const f = (await Storage.getFilters()) || []
      f.unshift(devFilter)
      await Storage.setFilters(f)
      setFilters(f)
      await wait(300)
      alert('dev filter')
    } else if (url === 'nnn://setprodfilters') {
      const f = (await Storage.getFilters()) || []
      const nextF = f.filter(s => s !== devFilter)
      await Storage.setFilters(nextF)
      setFilters(nextF)
      await wait(300)
      alert('prod filter')
    }
  }

  const init = async () => {
    const conf = await loadConfig()
    const isAuth = await initNyx()
    if (isAuth) {
      await initFCM(nyx, conf, isAuth)
    }
    await loadStorage({ getConfig: false })
    setIsAppLoaded(true)
    setTimeout(() => {
      RNBootSplash.hide({ fade: true })
    }, 600)
    const initialUrl = await Linking.getInitialURL()
    if (initialUrl?.length > 0) {
      handleDeepLink(initialUrl)
    }
  }

  if (!config.isLoaded) {
    init()
  }

  const darkTheme = createTheme(true, ...config.themeOptions)
  const lightTheme = createTheme(false, ...config.themeOptions)
  const selectedTheme = themeType === 'dark' ? darkTheme : lightTheme
  return (
    <NetworkProvider pingServerUrl={'https://nyx.cz'}>
      <PaperProvider theme={themeType === 'dark' ? darkTheme : lightTheme}>
        {!isAppLoaded && <LoaderComponent theme={selectedTheme} />}
        {isAppLoaded && isAuthenticated && (
          <MainContext.Provider value={{ config, nyx, filters, blockedUsers, theme: selectedTheme, refs }}>
            <UnreadContextProvider nyx={nyx}>
              <NavigationContainer theme={selectedTheme}>
                <Router
                  config={config}
                  nyx={nyx}
                  refs={refs}
                  theme={selectedTheme}
                  onConfigReload={() => loadConfig()}
                  onFiltersReload={() => loadStorage({ getConfig: false })}
                />
              </NavigationContainer>
            </UnreadContextProvider>
          </MainContext.Provider>
        )}
        {isAppLoaded && (
          <Modal visible={!isAuthenticated} transparent={false} animationType={'fade'} onRequestClose={() => null}>
            <LoginView
              theme={selectedTheme}
              confirmationCode={confirmationCode}
              onUsername={username => initNyx(username, false)}
              onLogin={() => onLogin()}
            />
          </Modal>
        )}
      </PaperProvider>
    </NetworkProvider>
  )
}

export default App
