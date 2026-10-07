import { createContext, Context } from 'react'
import type { Theme } from './Theme'
import { Nyx } from './Nyx'
import { defaultThemeOptions, ThemeOptions } from './Theme'
import { TIMELINE_VISIBLE_DAYS_DEFAULT } from './eventTimeline'
import { IMAGE_DOWNLOAD_UNLIMITED } from './imageDownload'
import type { BookmarkSectionReadFilter } from './bookmarkSections'

export type MainContextConfig = {
  isLoaded: boolean
  isBookmarksEnabled: boolean
  isBottomTabs: boolean
  isHistoryEnabled: boolean
  isSearchEnabled: boolean
  isLastEnabled: boolean
  isRemindersEnabled: boolean
  isEventsEnabled: boolean
  isEventFriendBadgesEnabled: boolean
  isEventSelfIconEnabled: boolean
  eventTimelineVisibleDays: number
  isNavGesturesEnabled: boolean
  isShowingReadOnLists: boolean
  isSwipeablePostHeader: boolean
  isTextSelectionEnabled: boolean
  isUnreadToggleEnabled: boolean
  isBookmarkSectionReadFilterEnabled: boolean
  imageDownloadMaxKb: number | null
  initialRouteName: string
  shownCategories: string[]
  bookmarkSectionFilters: Record<string, BookmarkSectionReadFilter>
  fcmToken?: string
  isFCMSubscribed: boolean
  isLlmEnabled?: boolean
  isLlmUserAvatarsEnabled?: boolean
  openRouterApiKey?: string
  selectedLlmModel?: string
  selectedLlmModelName?: string
  llmSystemPrompt?: string
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
  isEventsEnabled: true,
  isEventFriendBadgesEnabled: true,
  isEventSelfIconEnabled: true,
  eventTimelineVisibleDays: TIMELINE_VISIBLE_DAYS_DEFAULT,
  isNavGesturesEnabled: false,
  isShowingReadOnLists: true,
  isSwipeablePostHeader: true,
  isTextSelectionEnabled: true,
  isUnreadToggleEnabled: true,
  isBookmarkSectionReadFilterEnabled: true,
  imageDownloadMaxKb: IMAGE_DOWNLOAD_UNLIMITED,
  initialRouteName: 'historyStack',
  shownCategories: [],
  bookmarkSectionFilters: {},
  fcmToken: undefined,
  isFCMSubscribed: false,
  isLlmEnabled: false,
  isLlmUserAvatarsEnabled: true,
  openRouterApiKey: '',
  selectedLlmModel: '',
  selectedLlmModelName: '',
  llmSystemPrompt: '',
  theme: 'system',
  themeOptions: { ...defaultThemeOptions },
}

export function isTextSelectionEnabled(config?: { isTextSelectionEnabled?: boolean } | null) {
  return config?.isTextSelectionEnabled !== false
}

export const MainContext: Context<MainContext> = createContext<MainContext>({
  nyx: undefined,
  config: initialConfig,
  filters: [],
  blockedUsers: [],
  theme: {},
  refs: {},
})
