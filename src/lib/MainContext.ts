import { createContext, Context } from 'react'
import type { Theme } from './Theme'
import { Nyx } from './Nyx'
import { defaultThemeOptions, ThemeOptions } from './Theme'
import { TIMELINE_VISIBLE_DAYS_DEFAULT } from './eventTimeline'
import {
  FETCH_PROGRESS_ENTER_DEFAULT, FETCH_PROGRESS_GLOBAL_DEFAULT,
  FETCH_PROGRESS_LISTS_DEFAULT, FETCH_PROGRESS_MORE_DEFAULT,
} from './fetchProgress'
import { DISCUSSION_CACHE_LIMIT_DEFAULT } from './discussionCache'
import { IMAGE_BYTE_FETCH_TIMEOUT_MS, IMAGE_DOWNLOAD_UNLIMITED, IMAGE_SIZE_TIMEOUT_MS } from './imageDownload'
import type { BookmarkSectionReadFilter } from './bookmarkSections'
import { LUMO_DEFAULT_MODEL_ID, LUMO_DEFAULT_MODEL_NAME } from './lumo'

export type MainContextConfig = {
  isLoaded: boolean
  isBookmarksEnabled: boolean
  isBottomTabs: boolean
  isNavbarExpandEnabled: boolean
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
  isLocalLastReadEnabled: boolean
  isTextSelectionEnabled: boolean
  isPostMarkdownEnabled: boolean
  isUploadVideoTagEnabled: boolean
  isFingerprintLockEnabled: boolean
  fingerprintLockMinutes: number
  isAppCoverEnabled: boolean
  isUnreadToggleEnabled: boolean
  isBookmarkSectionReadFilterEnabled: boolean
  imageDownloadMaxKb: number | null
  imageFileTimeoutMs: number
  imageSizeTimeoutMs: number
  isDiscussionCacheEnabled: boolean
  discussionCacheLimit: number
  isFetchProgressEnabled: boolean
  fetchProgress: 'off' | 'detailed'
  fetchProgressEnter: 'off' | 'overall' | 'detailed'
  fetchProgressMore: 'off' | 'overall' | 'detailed'
  fetchProgressLists: 'off' | 'overall' | 'detailed'
  settingsSectionsOpen: Record<string, boolean>
  initialRouteName: string
  shownCategories: string[]
  bookmarkSectionFilters: Record<string, BookmarkSectionReadFilter>
  fcmToken?: string
  isFCMSubscribed: boolean
  isLlmEnabled?: boolean
  isLlmUserAvatarsEnabled?: boolean
  llmProvider?: 'lumo' | 'openrouter' | 'openai'
  llmProviderChosen?: boolean
  openRouterApiKey?: string
  openaiApiKey?: string
  openaiBaseUrl?: string
  llmModels?: Partial<Record<'lumo' | 'openrouter' | 'openai', { id: string; name: string }>>
  selectedLlmModel?: string
  selectedLlmModelName?: string
  llmSystemPrompt?: string
  theme: string
  themeOptions: ThemeOptions
  language?: string
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
  isNavbarExpandEnabled: false,
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
  isLocalLastReadEnabled: true,
  isTextSelectionEnabled: true,
  isPostMarkdownEnabled: true,
  isUploadVideoTagEnabled: true,
  isFingerprintLockEnabled: false,
  fingerprintLockMinutes: 0,
  isAppCoverEnabled: false,
  isUnreadToggleEnabled: true,
  isBookmarkSectionReadFilterEnabled: true,
  imageDownloadMaxKb: IMAGE_DOWNLOAD_UNLIMITED,
  imageFileTimeoutMs: IMAGE_BYTE_FETCH_TIMEOUT_MS,
  imageSizeTimeoutMs: IMAGE_SIZE_TIMEOUT_MS,
  isDiscussionCacheEnabled: true,
  discussionCacheLimit: DISCUSSION_CACHE_LIMIT_DEFAULT,
  isFetchProgressEnabled: true,
  fetchProgress: FETCH_PROGRESS_GLOBAL_DEFAULT,
  fetchProgressEnter: FETCH_PROGRESS_ENTER_DEFAULT,
  fetchProgressMore: FETCH_PROGRESS_MORE_DEFAULT,
  fetchProgressLists: FETCH_PROGRESS_LISTS_DEFAULT,
  settingsSectionsOpen: {},
  initialRouteName: 'historyStack',
  shownCategories: [],
  bookmarkSectionFilters: {},
  fcmToken: undefined,
  isFCMSubscribed: false,
  isLlmEnabled: false,
  isLlmUserAvatarsEnabled: true,
  llmProvider: 'lumo',
  llmProviderChosen: true,
  openRouterApiKey: '',
  openaiApiKey: '',
  openaiBaseUrl: '',
  llmModels: { lumo: { id: LUMO_DEFAULT_MODEL_ID, name: LUMO_DEFAULT_MODEL_NAME } },
  selectedLlmModel: LUMO_DEFAULT_MODEL_ID,
  selectedLlmModelName: LUMO_DEFAULT_MODEL_NAME,
  llmSystemPrompt: '',
  theme: 'system',
  themeOptions: { ...defaultThemeOptions },
  language: 'auto',
}

export function isTextSelectionEnabled(config?: { isTextSelectionEnabled?: boolean } | null) {
  return config?.isTextSelectionEnabled !== false
}

export function isPostMarkdownEnabled(config?: { isPostMarkdownEnabled?: boolean } | null) {
  return config?.isPostMarkdownEnabled !== false
}

export const MainContext: Context<MainContext> = createContext<MainContext>({
  nyx: undefined,
  config: initialConfig,
  filters: [],
  blockedUsers: [],
  theme: {},
  refs: {},
})
