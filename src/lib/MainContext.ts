import { createContext, Context } from 'react'
import type { Theme } from './Theme'
import { Nyx } from './Nyx'
import { defaultThemeOptions, ThemeOptions } from './Theme'
import { IMAGE_DOWNLOAD_UNLIMITED } from './imageDownload'

export type MainContextConfig = {
  isLoaded: boolean
  isBookmarksEnabled: boolean
  isBottomTabs: boolean
  isHistoryEnabled: boolean
  isSearchEnabled: boolean
  isLastEnabled: boolean
  isRemindersEnabled: boolean
  isNavGesturesEnabled: boolean
  isShowingReadOnLists: boolean
  isSwipeablePostHeader: boolean
  isUnreadToggleEnabled: boolean
  imageDownloadMaxKb: number | null
  initialRouteName: string
  shownCategories: string[]
  fcmToken?: string
  isFCMSubscribed: boolean
  theme: string
  themeOptions: ThemeOptions
}

type MainContext = {
  nyx?: Nyx
  config: MainContextConfig
  filters: string[]
  blockedUsers: string[]
  theme: Theme | any
  refs: any
}

export const initialConfig: MainContextConfig = {
  isLoaded: false,
  isBookmarksEnabled: true,
  isBottomTabs: true,
  isHistoryEnabled: true,
  isSearchEnabled: true,
  isLastEnabled: true,
  isRemindersEnabled: true,
  isNavGesturesEnabled: false,
  isShowingReadOnLists: true,
  isSwipeablePostHeader: true,
  isUnreadToggleEnabled: true,
  imageDownloadMaxKb: IMAGE_DOWNLOAD_UNLIMITED,
  initialRouteName: 'historyStack',
  shownCategories: [],
  fcmToken: undefined,
  isFCMSubscribed: false,
  theme: 'system',
  themeOptions: { ...defaultThemeOptions },
}

export const MainContext: Context<MainContext> = createContext<MainContext>({
  nyx: undefined,
  config: initialConfig,
  filters: [],
  blockedUsers: [],
  theme: {},
  refs: {},
})
