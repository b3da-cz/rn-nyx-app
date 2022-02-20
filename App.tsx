/**
 * @format
 * @flow
 */
import React, { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Linking, LogBox, Platform, UIManager, SafeAreaView } from 'react-native'
import useColorScheme from 'react-native/Libraries/Utilities/useColorScheme'
import 'react-native-gesture-handler'
import { NetworkProvider } from 'react-native-offline'
import { NavigationContainer } from '@react-navigation/native'
import { Provider as PaperProvider } from 'react-native-paper'
import RNBootSplash from 'react-native-bootsplash'
import Bugfender from '@bugfender/rn-bugfender'
import { confirm, LoaderComponent } from './src/component'
// import Feather from 'react-native-vector-icons/Feather'
// Feather.loadFont()

import {
  createTheme,
  defaultThemeOptions,
  importTheme,
  initialConfig,
  initFCM,
  MainContext,
  MainContextConfig,
  Nyx,
  Storage,
  UnreadContextProvider,
  wait,
} from './src/lib'
import { Router } from './src/Router'
import { LoginView } from './src/view'
// @ts-ignore
import { gplayTestId } from './keys.json'

LogBox.ignoreLogs([
  'Animated.event',
  'Animated: `useNativeDriver`',
  'componentWillMount has',
  'Reanimated 2',
  'Require cycle: node_modules/',
  'new NativeEventEmitter',
  "EventEmitter.removeListener('change', ...)",
]) // Ignore log notifications from Swipeable todo

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true)
  }
}

const App: () => ReactNode = () => {
  const n = new Nyx()
  const [nyx, setNyx] = useState(n)
  const [confirmationCode, setConfirmationCode] = useState<string>()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAppLoaded, setIsAppLoaded] = useState(false)
  const [config, setConfig] = useState<MainContextConfig>(initialConfig)
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

  const initNyx = async (username?: string, isAutologin = true) => {
    if (!username) {
      const auth = await Storage.getAuth()
      if (!auth || (auth && !auth.username)) {
        await Storage.removeAll()
        return
      }
      username = auth.username
    }
    const res: any = await nyx.init(username)
    nyx.api.onLogout.subscribe().then(() => {
      setConfirmationCode(undefined)
      setIsAuthenticated(false)
    })
    Bugfender.setDeviceString('@username', username)
    Bugfender.d('INFO', 'App: Nyx initialized')
    setNyx(nyx)
    if (username?.toLowerCase() === gplayTestId.toLowerCase()) {
      await onLogin()
      return true
    }
    if (isAutologin) {
      setIsAuthenticated(res.isConfirmed)
    } else {
      setConfirmationCode(nyx.api.getAuth().confirmationCode)
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
      isNavGesturesEnabled: conf.isNavGesturesEnabled === undefined ? false : !!conf.isNavGesturesEnabled,
      isShowingReadOnLists: conf.isShowingReadOnLists === undefined ? true : !!conf.isShowingReadOnLists,
      isUnreadToggleEnabled: conf.isUnreadToggleEnabled === undefined ? true : !!conf.isUnreadToggleEnabled,
      initialRouteName: conf.initialRouteName === undefined ? 'historyStack' : conf.initialRouteName,
      shownCategories: conf.shownCategories || [],
      fcmToken: conf.fcmToken,
      isFCMSubscribed: conf.isFCMSubscribed === undefined ? false : !!conf.isFCMSubscribed,
      theme: conf.theme === undefined ? 'system' : conf.theme,
      themeOptions: conf.themeOptions === undefined ? { ...defaultThemeOptions } : conf.themeOptions,
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

  const handleDeepLink = async (url: string) => {
    if (url === 'nnn://setdevfilters' || url === 'nnn://setprodfilters') {
      alert('dev version without blacklist')
    } else if (url.includes('nnn://theme::')) {
      // const themeOptions = JSON.parse(decodeURIComponent(url.split('::')[1]))
      const themeOptions = importTheme(url)
      if (!themeOptions?.primaryColor) {
        return alert('Chyba formátu nastavení')
      }
      const isConfirmed = await confirm('Nastavit vzhled?', JSON.stringify(themeOptions, undefined, 2))
      if (themeOptions?.primaryColor && isConfirmed) {
        const c = (await Storage.getConfig()) || []
        const nextC = { ...c, themeOptions }
        await Storage.setConfig(nextC)
        setConfig(nextC)
        await wait(300)
      }
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
    if (initialUrl && initialUrl.length > 0) {
      handleDeepLink(initialUrl)
    }
  }

  if (!config.isLoaded) {
    init()
  }

  const theme = createTheme({ ...config.themeOptions, isDarkTheme: themeType === 'dark' })
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NetworkProvider pingServerUrl={'https://nyx.cz'}>
        <PaperProvider theme={theme}>
          {!isAppLoaded && <LoaderComponent theme={theme} />}
          {isAppLoaded && isAuthenticated && (
            <MainContext.Provider value={{ config, nyx, filters, blockedUsers, theme, refs }}>
              <UnreadContextProvider>
                <NavigationContainer theme={theme}>
                  <Router
                    config={config}
                    nyx={nyx}
                    refs={refs}
                    theme={theme}
                    onConfigReload={() => loadConfig()}
                    onFiltersReload={() => loadStorage({ getConfig: false })}
                  />
                </NavigationContainer>
              </UnreadContextProvider>
            </MainContext.Provider>
          )}
          {isAppLoaded && !isAuthenticated && (
            <LoginView
              theme={theme}
              confirmationCode={confirmationCode}
              onUsername={username => initNyx(username, false)}
              onLogin={() => onLogin()}
            />
          )}
        </PaperProvider>
      </NetworkProvider>
    </SafeAreaView>
  )
}

export default App
