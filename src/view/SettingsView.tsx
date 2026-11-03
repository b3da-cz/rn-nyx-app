import React, { Component } from 'react'
import { ActivityIndicator, Dimensions, FlatList, Keyboard, LayoutAnimation, Modal, SafeAreaView, ScrollView, TextInput, TouchableOpacity, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import {
  androidStackBottomInset,
  ButtonComponent,
  confirm,
  DoubleTapDeleteButton,
  FilterSettingsDialog,
  FormRowSelectComponent,
  FormRowToggleComponent,
  LlmModelPickerDialog,
  LlmSystemPromptDialog,
} from '../component'
import { LlmLumoQuota } from '../component/llm/LlmLumoQuota'
import {
  fetchLlmModels,
  formatPricing,
  LUMO_MODEL_ID,
  LUMO_MODEL_NAME,
  LlmProviderId,
  LlmSavedModels,
  normalizeLlmProvider,
  normalizeOpenAiBaseUrl,
  resolveStoredLlmProvider,
  openAiBaseUrlError,
  IMAGE_DOWNLOAD_LIMITS_KB,
  IMAGE_DOWNLOAD_OFF,
  MainContext,
  OpenRouterModel,
  Storage,
  t,
  Theme,
  initFCM,
  unregisterFCM,
  Nyx,
  authenticateFingerprint,
  FINGERPRINT_LOCK_MINUTES,
  hasFingerprintSensor,
  FETCH_PROGRESS_ENTER_DEFAULT,
  FETCH_PROGRESS_LISTS_DEFAULT,
  FETCH_PROGRESS_MORE_DEFAULT,
  discussionCacheReport,
  emptyDiscussionCache,
  forgetCachedDiscussion,
  readDiscussionCache,
  readDiscussionListCache,
  readFeedCache,
  updateDiscussionCache,
  updateDiscussionListCache,
  updateFeedCache,
  emptyFeedCache,
  forgetFeed,
  withFeedCacheReport,
  FeedCacheKind,
  normalizeDiscussionCacheLimit,
  normalizeFetchProgressMode,
  resolveFetchProgressGlobal,
  normalizeFingerprintLockMinutes,
  normalizeImageDownloadMaxKb,
  normalizeTimelineVisibleDays,
  setAppLanguage,
  uploadSizeLabel,
  timelineVisibleDayOptions,
  useTheme,
} from '../lib'

const SettingsSection = ({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  return (
    <View style={{ marginBottom: blocks.medium }}>
      <TouchableRipple
        rippleColor={colors.ripple}
        onPress={onToggle}
        style={{
          backgroundColor: colors.tertiary,
          borderRadius: 0,
          marginBottom: open ? blocks.small : 0,
          minHeight: blocks.rowDiscussion,
          justifyContent: 'center',
          paddingHorizontal: blocks.medium,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: blocks.rowDiscussion }}>
          <Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: fontSizes.p, fontWeight: '700' }}>
            {title}
          </Text>
          {!open && <Icon name="plus" size={fontSizes.p} color={colors.text} />}
        </View>
      </TouchableRipple>
      {open ? children : null}
    </View>
  )
}

const SettingsSelectRow = ({
  label,
  value,
  options,
  onSelect,
  rowHeight,
}: {
  label: string
  value?: string
  options: Array<{ value: string; label?: string; disabled?: boolean }>
  onSelect: Function
  rowHeight: number
}) => {
  const {
    colors,
    metrics: { blocks, fontSizes },
  } = useTheme()
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 0,
        marginBottom: blocks.small,
        height: rowHeight,
        paddingHorizontal: blocks.medium,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <Text
        numberOfLines={2}
        style={{ flex: 1, color: colors.text, fontSize: fontSizes.p, paddingRight: blocks.medium }}>
        {label}
      </Text>
      <FormRowSelectComponent value={value} options={options} onSelect={onSelect} />
    </View>
  )
}

type Props = {
  config: any
  navigation?: any
  onConfigChange: Function
  onFiltersChange: Function
}
type State = {
  isFetching: boolean
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
  isUnreadToggleEnabled: boolean
  isBookmarkSectionReadFilterEnabled: boolean
  isSwipeablePostHeader: boolean
  isLocalLastReadEnabled: boolean
  isTextSelectionEnabled: boolean
  isPostMarkdownEnabled: boolean
  isUploadVideoTagEnabled: boolean
  isFingerprintLockEnabled: boolean
  fingerprintLockMinutes: number
  isAppCoverEnabled: boolean
  hasFingerprint: boolean
  imageDownloadMaxKb: number | null
  isDiscussionCacheEnabled: boolean
  discussionCacheLimit: number | string
  discussionCacheReport: {
    bytes: number
    clubs: Array<{ id: string; name: string; posts: number; from: string; to: string }>
    historyCount: number
    bookmarkCount: number
    remindersCount?: number
    mailCount?: number
    eventsCount?: number
    notificationsCount?: number
  } | null
  isDiscussionCacheClubsVisible: boolean
  confirmingCacheClubId?: string | null
  isFetchProgressEnabled: boolean
  fetchProgress: string
  fetchProgressEnter: string
  fetchProgressMore: string
  fetchProgressLists: string
  settingsSectionsOpen: Record<string, boolean>
  initialRouteName: string
  isLlmEnabled: boolean
  isLlmUserAvatarsEnabled: boolean
  llmProvider: LlmProviderId
  openRouterApiKey: string
  openaiApiKey: string
  openaiBaseUrl: string
  llmModels: LlmSavedModels
  selectedLlmModel: string
  selectedLlmModelName: string
  isFetchingModels: boolean
  keyboardPad: number
  models: OpenRouterModel[]
  isModelPickerVisible: boolean
  isSystemPromptDialogVisible: boolean
  llmError: string | null
  theme: Theme
  username: string
  isVisible: boolean
  language: string
}
export class SettingsView extends Component<Props> {
  static contextType = MainContext
  nyx?: Nyx
  unsubscribeFocus?: () => void
  cacheClubTimer?: ReturnType<typeof setTimeout>
  llmListProvider: LlmProviderId = 'openrouter'
  llmIgnoreStoredModel = false
  settingsScroll: ScrollView | null = null
  settingsScrollY = 0
  settingsContentHeight = 0
  endpointField: View | null = null
  apiKeyField: View | null = null
  focusedField: View | null = null
  keyboardFrame?: { screenY?: number; height?: number }
  keyboardShowSub?: { remove: () => void }
  keyboardHideSub?: { remove: () => void }
  state: Readonly<Partial<State>> = {}
  constructor(props) {
    super(props)
    this.loadSettings()
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.setTheme()
    this.loadCachedModels()
    this.keyboardShowSub = Keyboard.addListener('keyboardDidShow', e => {
      this.keyboardFrame = e?.endCoordinates
      setTimeout(() => this.scrollFocusedFieldIntoView(), 60)
    })
    this.keyboardHideSub = Keyboard.addListener('keyboardDidHide', () => {
      this.keyboardFrame = undefined
      this.focusedField = null
      if (this.state.keyboardPad) {
        this.setState({ keyboardPad: 0 })
      }
    })
    hasFingerprintSensor().then(hasFingerprint => this.setState({ hasFingerprint }))
    this.loadDiscussionCacheReport()
    this.unsubscribeFocus = this.props.navigation?.addListener('focus', () => {
      this.refreshTimelineDays()
      this.loadDiscussionCacheReport()
      this.loadCachedModels()
    })
  }

  llmProvider(): LlmProviderId {
    return normalizeLlmProvider(this.state.llmProvider)
  }

  async loadCachedModels() {
    const provider = this.llmProvider()
    this.llmListProvider = provider
    try {
      const cached = await Storage.getCachedLlmModels(provider)
      if (
        this.llmListProvider === provider &&
        Array.isArray(cached) &&
        cached.length > 0 &&
        (this.state.models || []).length === 0
      ) {
        this.setState({ models: cached })
      }
    } catch (e) {
      console.warn('Failed to load cached LLM models', e)
    }
  }

  componentWillUnmount() {
    this.unsubscribeFocus?.()
    this.keyboardShowSub?.remove()
    this.keyboardHideSub?.remove()
    if (this.cacheClubTimer) {
      clearTimeout(this.cacheClubTimer)
    }
  }

  focusLlmField(field: View | null) {
    this.focusedField = field
    setTimeout(() => this.scrollFocusedFieldIntoView(), 60)
  }

  // The LLM endpoint and key sit at the bottom of settings. Scroll that row
  // above the keyboard, and add only the padding the scroll range still lacks.
  scrollFocusedFieldIntoView() {
    const field = this.focusedField
    const scroll = this.settingsScroll
    if (!field?.measureInWindow || !scroll?.measureInWindow) {
      return
    }
    field.measureInWindow((_x, y, _w, h) => {
      if (!h) {
        return
      }
      scroll.measureInWindow((_sx, sy, _sw, sh) => {
        const frame = this.keyboardFrame
        const windowHeight = Dimensions.get('window').height
        const screenHeight = Dimensions.get('screen').height
        const shrunkBy = Math.max(0, screenHeight - windowHeight)
        let visibleBottom = sy + sh - 12
        if (typeof frame?.screenY === 'number' && frame.screenY > 0 && frame.screenY < visibleBottom) {
          visibleBottom = frame.screenY - 12
        } else if ((frame?.height || 0) > 80 && shrunkBy < 80) {
          visibleBottom -= Math.min(frame?.height || 0, sh * 0.55)
        }
        const delta = y + h - visibleBottom
        if (delta <= 8) {
          return
        }
        const maxScroll = Math.max(0, this.settingsContentHeight - sh)
        const room = maxScroll - this.settingsScrollY
        if (room + 8 >= delta) {
          scroll.scrollTo({ y: this.settingsScrollY + delta, animated: true })
          return
        }
        const missing = Math.ceil(delta - Math.max(0, room) + 24)
        if ((this.state.keyboardPad || 0) >= missing) {
          scroll.scrollTo({ y: this.settingsScrollY + delta, animated: true })
          return
        }
        this.setState({ keyboardPad: missing }, () => {
          setTimeout(() => {
            this.settingsScroll?.scrollTo({ y: this.settingsScrollY + delta + 24, animated: true })
          }, 50)
        })
      })
    })
  }

  async cacheReport() {
    const [clubs, lists, feeds] = await Promise.all([readDiscussionCache(), readDiscussionListCache(), readFeedCache()])
    return withFeedCacheReport(
      discussionCacheReport({ ...clubs, history: lists.history, bookmarks: lists.bookmarks }),
      feeds,
    )
  }

  async writeDiscussionCache(mutate) {
    const [next, lists, feeds] = await Promise.all([
      updateDiscussionCache(mutate),
      readDiscussionListCache(),
      readFeedCache(),
    ])
    this.setState({
      discussionCacheReport: withFeedCacheReport(
        discussionCacheReport({ ...next, history: lists.history, bookmarks: lists.bookmarks }),
        feeds,
      ),
      confirmingCacheClubId: null,
    })
  }

  async deleteCachedClub(id: string) {
    await this.writeDiscussionCache(store => forgetCachedDiscussion(store, id))
  }

  async deleteFeedCache(kind: FeedCacheKind) {
    await updateFeedCache(store => forgetFeed(store, kind))
    const discussionCacheReport = await this.cacheReport()
    this.setState({ discussionCacheReport })
  }

  async deleteDiscussionCache() {
    await updateDiscussionListCache(() => ({ history: null, bookmarks: null }))
    await updateFeedCache(() => emptyFeedCache())
    await this.writeDiscussionCache(() => emptyDiscussionCache())
    this.setState({ isDiscussionCacheClubsVisible: false })
  }

  onCachedClubPress(id: string) {
    if (this.cacheClubTimer) {
      clearTimeout(this.cacheClubTimer)
    }
    if (this.state.confirmingCacheClubId === id) {
      this.deleteCachedClub(id)
      return
    }
    this.setState({ confirmingCacheClubId: id })
    this.cacheClubTimer = setTimeout(() => {
      if (this.state.confirmingCacheClubId === id) {
        this.setState({ confirmingCacheClubId: null })
      }
    }, 3500)
  }

  async loadDiscussionCacheReport() {
    try {
      this.setState({ discussionCacheReport: await this.cacheReport() })
    } catch (e) {
      console.warn(e)
      this.setState({
        discussionCacheReport: withFeedCacheReport(
          discussionCacheReport({ discussions: [], history: null, bookmarks: null }),
          null,
        ),
      })
    }
  }

  renderFeedCacheRow(label: string, count: number | undefined, kind: FeedCacheKind) {
    if (!count) {
      return null
    }
    const liveTheme = (this.context as any)?.theme
    const theme = liveTheme?.colors ? liveTheme : this.state.theme
    if (!theme?.colors) {
      return null
    }
    const rowHeight = Math.max(48, Math.round(theme.metrics.blocks.rowDiscussion + theme.metrics.blocks.large))
    return (
      <View
        key={kind}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderRadius: 0,
          marginBottom: theme.metrics.blocks.small,
          minHeight: rowHeight,
          paddingHorizontal: theme.metrics.blocks.medium,
        }}>
        <Text style={{ flex: 1, color: theme.colors.text, fontSize: theme.metrics.fontSizes.p }}>{label}</Text>
        <Text style={{ color: theme.colors.faded, fontSize: theme.metrics.fontSizes.small, marginRight: 8 }}>{count}</Text>
        <DoubleTapDeleteButton
          iconSize={theme.metrics.fontSizes.p}
          onDelete={() => this.deleteFeedCache(kind)}
          style={{ borderRadius: 0, alignSelf: 'center' }}
        />
      </View>
    )
  }

  discussionCacheContentLabel(report: { clubs: any[]; historyCount: number; bookmarkCount: number }) {
    const clubs = this.czechCount(
      report.clubs.length,
      t('profile.discussionCacheClubOne'),
      `${t('profile.discussionCacheClubFew')}`.replace('%s', String(report.clubs.length)),
      `${t('profile.discussionCacheClubMany')}`.replace('%s', String(report.clubs.length)),
    )
    return `${clubs}, ${t('history')} ${report.historyCount}, ${t('bookmarks')} ${report.bookmarkCount}`
  }

  czechCount(count: number, one: string, few: string, many: string) {
    const n = Math.abs(count)
    if (n === 1) {
      return one
    }
    if (n >= 2 && n <= 4) {
      return few
    }
    return many
  }

  async refreshTimelineDays() {
    const conf = await Storage.getConfig()
    const days = normalizeTimelineVisibleDays(conf?.eventTimelineVisibleDays)
    if (days !== this.state.eventTimelineVisibleDays) {
      this.setState({ eventTimelineVisibleDays: days })
    }
  }

  setTheme() {
    this.setState({ theme: this.context.theme })
  }

  async loadSettings() {
    let { config } = this.props
    if (!config) {
      config = await Storage.getConfig()
    }
    this.state = {
      isFetching: false,
      isBookmarksEnabled: config?.isBookmarksEnabled !== undefined ? !!config.isBookmarksEnabled : true,
      isBottomTabs: config?.isBottomTabs !== undefined ? !!config.isBottomTabs : true,
      isNavbarExpandEnabled:
        config?.isNavbarExpandEnabled !== undefined ? !!config.isNavbarExpandEnabled : false,
      isHistoryEnabled: config?.isHistoryEnabled !== undefined ? !!config.isHistoryEnabled : true,
      isSearchEnabled: config?.isSearchEnabled !== undefined ? !!config.isSearchEnabled : true,
      isLastEnabled: config?.isLastEnabled !== undefined ? !!config.isLastEnabled : true,
      isRemindersEnabled: config?.isRemindersEnabled !== undefined ? !!config.isRemindersEnabled : true,
      isEventsEnabled: config?.isEventsEnabled !== undefined ? !!config.isEventsEnabled : true,
      isEventFriendBadgesEnabled:
        config?.isEventFriendBadgesEnabled !== undefined ? !!config.isEventFriendBadgesEnabled : true,
      isEventSelfIconEnabled: config?.isEventSelfIconEnabled !== undefined ? !!config.isEventSelfIconEnabled : true,
      eventTimelineVisibleDays: normalizeTimelineVisibleDays(config?.eventTimelineVisibleDays),
      isNavGesturesEnabled: config.isNavGesturesEnabled === undefined ? false : !!config.isNavGesturesEnabled,
      isUnreadToggleEnabled: config.isUnreadToggleEnabled === undefined ? true : !!config.isUnreadToggleEnabled,
      isBookmarkSectionReadFilterEnabled:
        config.isBookmarkSectionReadFilterEnabled === undefined ? true : !!config.isBookmarkSectionReadFilterEnabled,
      isSwipeablePostHeader: config.isSwipeablePostHeader === undefined ? true : !!config.isSwipeablePostHeader,
      isLocalLastReadEnabled: config.isLocalLastReadEnabled === undefined ? true : !!config.isLocalLastReadEnabled,
      isTextSelectionEnabled: config.isTextSelectionEnabled === undefined ? true : !!config.isTextSelectionEnabled,
      isPostMarkdownEnabled: config.isPostMarkdownEnabled === undefined ? true : !!config.isPostMarkdownEnabled,
      isUploadVideoTagEnabled:
        config.isUploadVideoTagEnabled === undefined ? true : !!config.isUploadVideoTagEnabled,
      isFingerprintLockEnabled: !!config?.isFingerprintLockEnabled,
      fingerprintLockMinutes: normalizeFingerprintLockMinutes(config?.fingerprintLockMinutes),
      isAppCoverEnabled: !!config?.isAppCoverEnabled,
      hasFingerprint: false,
      imageDownloadMaxKb: normalizeImageDownloadMaxKb(config?.imageDownloadMaxKb),
      isDiscussionCacheEnabled: config?.isDiscussionCacheEnabled !== false,
      discussionCacheLimit: normalizeDiscussionCacheLimit(config?.discussionCacheLimit),
      discussionCacheReport: null,
      isDiscussionCacheClubsVisible: false,
      confirmingCacheClubId: null,
      isFetchProgressEnabled: resolveFetchProgressGlobal(config) !== 'off',
      fetchProgress: resolveFetchProgressGlobal(config),
      fetchProgressEnter: normalizeFetchProgressMode(config?.fetchProgressEnter, FETCH_PROGRESS_ENTER_DEFAULT),
      fetchProgressMore: normalizeFetchProgressMode(config?.fetchProgressMore, FETCH_PROGRESS_MORE_DEFAULT),
      fetchProgressLists: normalizeFetchProgressMode(config?.fetchProgressLists, FETCH_PROGRESS_LISTS_DEFAULT),
      settingsSectionsOpen:
        config?.settingsSectionsOpen && typeof config.settingsSectionsOpen === 'object'
          ? config.settingsSectionsOpen
          : {},
      initialRouteName: config?.initialRouteName || 'historyStack',
      isLlmEnabled: !!config?.isLlmEnabled,
      isLlmUserAvatarsEnabled:
        config?.isLlmUserAvatarsEnabled !== undefined ? !!config.isLlmUserAvatarsEnabled : true,
      llmProvider: resolveStoredLlmProvider(config),
      openRouterApiKey: config?.openRouterApiKey || '',
      openaiApiKey: config?.openaiApiKey || '',
      openaiBaseUrl: config?.openaiBaseUrl || '',
      llmModels: this.llmModelsFromConfig(config),
      selectedLlmModel: resolveStoredLlmProvider(config) === 'lumo' ? LUMO_MODEL_ID : config?.selectedLlmModel || '',
      selectedLlmModelName:
        resolveStoredLlmProvider(config) === 'lumo' ? LUMO_MODEL_NAME : config?.selectedLlmModelName || '',
      isFetchingModels: false,
      keyboardPad: 0,
      models: [],
      isModelPickerVisible: false,
      isSystemPromptDialogVisible: false,
      llmError: null,
      username: '',
      isVisible: true,
      language: config?.language || 'auto',
    }
  }

  llmModelsFromConfig(config?: any): LlmSavedModels {
    const stored: LlmSavedModels =
      config?.llmModels && typeof config.llmModels === 'object' ? { ...config.llmModels } : {}
    const provider = resolveStoredLlmProvider(config)
    if (provider === 'lumo') {
      stored.lumo = { id: LUMO_MODEL_ID, name: LUMO_MODEL_NAME }
      return stored
    }
    if (!stored[provider] && config?.selectedLlmModel) {
      stored[provider] = {
        id: config.selectedLlmModel,
        name: config.selectedLlmModelName || config.selectedLlmModel,
      }
    }
    return stored
  }

  llmProviderLabel(provider: LlmProviderId = this.llmProvider()): string {
    if (provider === 'lumo') {
      return t('profile.llm.providerLumo') || 'Proton Lumo'
    }
    if (provider === 'openai') {
      return t('profile.llm.providerOpenai') || 'OpenAI'
    }
    return t('profile.llm.providerOpenRouter') || 'OpenRouter'
  }

  async fetchModels(options?: { keepSelection?: boolean }): Promise<OpenRouterModel[] | null> {
    const provider = this.llmProvider()
    this.llmListProvider = provider
    const apiKey = provider === 'openai' ? this.state.openaiApiKey || '' : this.state.openRouterApiKey || ''
    const baseUrl = this.state.openaiBaseUrl || ''
    if (provider === 'openai') {
      const endpointError = openAiBaseUrlError(baseUrl)
      if (endpointError) {
        this.setState({ llmError: endpointError })
        return null
      }
    }
    if (!apiKey.trim()) {
      this.setState({
        llmError:
          provider === 'openai'
            ? t('profile.llm.apiKeyRequiredOpenai') || 'Nejprve zadejte API klíč.'
            : t('profile.llm.apiKeyRequired') || 'Nejprve zadejte OpenRouter API klíč.',
      })
      return null
    }
    this.setState({ isFetchingModels: true, llmError: null })
    try {
      const models = await fetchLlmModels({ provider, apiKey, baseUrl })
      if (this.llmListProvider !== provider) {
        return null
      }
      if (models.length === 0) {
        this.setState({
          models: [],
          isFetchingModels: false,
          llmError: t('profile.llm.noModels') || 'Server nevrátil žádné modely.',
        })
        return null
      }
      const ignoreStored = this.llmIgnoreStoredModel
      this.llmIgnoreStoredModel = false
      this.setState({ models, isFetchingModels: false })
      await Storage.setCachedLlmModels(models, provider)
      if (
        !options?.keepSelection &&
        this.llmListProvider === provider &&
        (ignoreStored || !this.state.selectedLlmModel)
      ) {
        await this.onSelectModel(models[0])
      }
      return models
    } catch (e: any) {
      if (this.llmListProvider !== provider) {
        return null
      }
      this.setState({
        isFetchingModels: false,
        llmError: e?.message || t('profile.llm.errorFetchingModels') || 'Chyba při stahování modelů.',
      })
      return null
    }
  }

  async onSelectModel(model: OpenRouterModel) {
    const provider = this.llmProvider()
    const llmModels: LlmSavedModels = {
      ...(this.state.llmModels || {}),
      [provider]: { id: model.id, name: model.name || model.id },
    }
    await this.setOptions({
      selectedLlmModel: model.id,
      selectedLlmModelName: model.name || model.id,
      llmModels,
    })
    this.setState({ isModelPickerVisible: false })
  }

  async persistOpenAiCredentials() {
    const nextUrl = this.state.openaiBaseUrl || ''
    const nextKey = this.state.openaiApiKey || ''
    const conf = (await Storage.getConfig()) || {}
    const urlChanged = normalizeOpenAiBaseUrl(nextUrl) !== normalizeOpenAiBaseUrl(conf.openaiBaseUrl || '')
    const patch: Record<string, any> = {
      openaiBaseUrl: nextUrl,
      openaiApiKey: nextKey,
    }
    if (urlChanged) {
      await Storage.setCachedLlmModels([], 'openai')
      const llmModels: LlmSavedModels = { ...(this.state.llmModels || conf.llmModels || {}) }
      delete llmModels.openai
      patch.llmModels = llmModels
      if (this.llmProvider() === 'openai') {
        patch.selectedLlmModel = ''
        patch.selectedLlmModelName = ''
      }
    }
    if (urlChanged && this.llmProvider() === 'openai') {
      this.llmIgnoreStoredModel = true
      this.llmListProvider = 'openai'
    }
    await this.setOptions(patch)
    if (urlChanged && this.llmProvider() === 'openai') {
      this.setState({ models: [], llmError: null, isModelPickerVisible: false })
    }
  }

  async onChangeLlmProvider(nextValue: string) {
    const next = normalizeLlmProvider(nextValue)
    const current = this.llmProvider()
    if (next === current) {
      return
    }
    this.llmListProvider = next
    this.llmIgnoreStoredModel = false
    const llmModels: LlmSavedModels = { ...(this.state.llmModels || {}) }
    if (this.state.selectedLlmModel) {
      llmModels[current] = {
        id: this.state.selectedLlmModel,
        name: this.state.selectedLlmModelName || this.state.selectedLlmModel,
      }
    }
    if (next === 'lumo') {
      llmModels.lumo = { id: LUMO_MODEL_ID, name: LUMO_MODEL_NAME }
    }
    const restored = next === 'lumo' ? llmModels.lumo : llmModels[next]
    await this.setOptions({
      llmProvider: next,
      llmProviderChosen: true,
      llmModels,
      selectedLlmModel: restored?.id || '',
      selectedLlmModelName: restored?.name || '',
    })
    this.setState({ models: [], llmError: null, isModelPickerVisible: false })
    try {
      const cached = await Storage.getCachedLlmModels(next)
      if (this.llmListProvider === next && Array.isArray(cached)) {
        this.setState({ models: cached })
      }
    } catch (e) {
      console.warn('Failed to load cached LLM models', e)
    }
  }

  settingsSectionOpen(id: string) {
    return this.state.settingsSectionsOpen?.[id] !== false
  }

  toggleSettingsSection(id: string) {
    const current = this.state.settingsSectionsOpen || {}
    const next = { ...current, [id]: current[id] === false }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    this.setOption('settingsSectionsOpen', next)
  }

  async setOptions(patch: Record<string, any>) {
    const conf = (await Storage.getConfig()) || {}
    this.setState(patch)
    Object.assign(conf, patch)
    await Storage.setConfig(conf)
    this.props.onConfigChange()
  }

  async setOption(name, val) {
    const conf = await Storage.getConfig()
    const isBookmarksCollision =
      name === 'isBookmarksEnabled' && !val && this.state.initialRouteName === 'bookmarksStack'
    const isHistoryCollision = name === 'isHistoryEnabled' && !val && this.state.initialRouteName === 'historyStack'
    if (isBookmarksCollision || isHistoryCollision) {
      const nextInitialRoute =
        isBookmarksCollision || !this.state.isBookmarksEnabled
          ? isHistoryCollision || !this.state.isHistoryEnabled
            ? 'mailStack'
            : 'historyStack'
          : 'bookmarksStack'
      this.setState({ [name]: val, initialRouteName: nextInitialRoute })
      conf.initialRouteName = nextInitialRoute
    } else {
      this.setState({ [name]: val })
      conf[name] = val
    }
    await Storage.setConfig(conf)
    this.props.onConfigChange()
  }

  languageLabel(lang?: string) {
    switch (lang) {
      case 'cs':
        return t('profile.languageCs') || 'Čeština'
      case 'en':
        return t('profile.languageEn') || 'English'
      case 'auto':
      default:
        return t('profile.languageAuto') || 'Auto (podle systému)'
    }
  }

  languageOptions() {
    return [
      { value: 'auto', label: t('profile.languageAuto') || 'Auto (podle systému)' },
      { value: 'cs', label: t('profile.languageCs') || 'Čeština' },
      { value: 'en', label: t('profile.languageEn') || 'English' },
    ]
  }

  async onSelectLanguage(lang: string) {
    setAppLanguage(lang)
    await this.setOption('language', lang)
  }

  fingerprintAfterLabel(minutes?: number) {
    const value = normalizeFingerprintLockMinutes(minutes)
    if (value <= 0) {
      return t('profile.fingerprintImmediately')
    }
    return `${value} min`
  }

  async onFingerprintLock(enabled: boolean) {
    if (!enabled) {
      await this.setOption('isFingerprintLockEnabled', false)
      return
    }
    const ok = await authenticateFingerprint(t('profile.fingerprintPrompt'), t('cancel'))
    if (!ok) {
      return
    }
    await this.setOption('isFingerprintLockEnabled', true)
  }

  imageDownloadLabel(maxKb?: number | null) {
    if (maxKb === IMAGE_DOWNLOAD_OFF) {
      return t('profile.imageDownloadOff')
    }
    if (maxKb == null) {
      return t('profile.imageDownloadUnlimited')
    }
    const size = maxKb >= 1024 ? '1 MB' : `${maxKb} kB`
    return `${t('profile.imageDownloadMax')}`.replace('%s', size)
  }

  fetchProgressLabel(mode?: string) {
    if (mode === 'off') {
      return t('profile.fetchProgressOff')
    }
    if (mode === 'overall') {
      return t('profile.fetchProgressOverall')
    }
    return t('profile.fetchProgressDetailed')
  }

  fetchProgressOptions() {
    return [
      { value: 'off', label: t('profile.fetchProgressOff') },
      { value: 'overall', label: t('profile.fetchProgressOverall') },
      { value: 'detailed', label: t('profile.fetchProgressDetailed') },
    ]
  }

  fetchProgressGlobalOptions() {
    return [
      { value: 'detailed', label: t('profile.fetchProgressDetailed') },
      { value: 'off', label: t('profile.fetchProgressNone') },
    ]
  }

  async setFetchProgress(mode: string) {
    const next = mode === 'off' ? 'off' : 'detailed'
    const conf = await Storage.getConfig()
    conf.fetchProgress = next
    conf.isFetchProgressEnabled = next !== 'off'
    this.setState({ fetchProgress: next, isFetchProgressEnabled: next !== 'off' })
    await Storage.setConfig(conf)
    this.props.onConfigChange()
  }

  imageDownloadOptions() {
    return [
      { value: 'off', label: t('profile.imageDownloadOff') },
      ...IMAGE_DOWNLOAD_LIMITS_KB.map(kb => ({
        value: `${kb}`,
        label: this.imageDownloadLabel(kb),
      })),
      { value: 'unlimited', label: t('profile.imageDownloadUnlimited') },
    ]
  }

  async setFilters({ filters, blockedUsers }) {
    await Storage.setFilters(filters)
    await Storage.setBlockedUsers(blockedUsers)
    this.props.onFiltersChange()
  }

  async subscribeFCM() {
    const isConfirmed = await confirm(t('confirm'), t('profile.fcm.subscribe.message'))
    if (!isConfirmed) {
      return
    }
    this.setState({ isFetching: true })
    await initFCM(this.nyx!, this.props.config, true, true)
    this.setState({ isFetching: false })
  }

  async unsubscribeFCM() {
    const isConfirmed = await confirm(t('confirm'), t('profile.fcm.unsubscribe.message'))
    if (!isConfirmed) {
      return
    }
    this.setState({ isFetching: true })
    const res = await unregisterFCM(this.nyx, this.props.config, true)
    console.warn(res) // TODO: remove
    this.setState({ isFetching: false })
  }

  async logout() {
    const isConfirmed = await confirm(t('confirm'), `${t('profile.logout')}?`)
    if (!isConfirmed) {
      return
    }
    this.setState({ isFetching: true })
    // await this.unsubscribeFCM()
    this.nyx && this.nyx.logout()
    this.setState({ isFetching: false })
  }

  render() {
    const liveTheme = (this.context as any)?.theme
    const theme = liveTheme?.colors ? liveTheme : this.state.theme
    if (!theme?.colors) {
      return null
    }
    const rowHeight = Math.max(48, Math.round(theme.metrics.blocks.rowDiscussion + theme.metrics.blocks.large))
    return (
      <View style={{ backgroundColor: theme.colors.background, height: '100%' }}>
        <ScrollView
          ref={ref => {
            this.settingsScroll = ref
          }}
          style={{ backgroundColor: theme.colors.background }}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={e => {
            this.settingsScrollY = e.nativeEvent.contentOffset.y
          }}
          onContentSizeChange={(_w, h) => {
            this.settingsContentHeight = h
          }}
          contentContainerStyle={{
            paddingBottom: 150 + androidStackBottomInset + (this.state.keyboardPad || 0),
          }}>
          <SettingsSection
            title={t('profile.general')}
            open={this.settingsSectionOpen('general')}
            onToggle={() => this.toggleSettingsSection('general')}>
            <ButtonComponent
              label={t('profile.logout')}
              icon={'lock'}
              textAlign={'left'}
              color={theme.colors.accent}
              backgroundColor={theme.colors.surface}
              borderRadius={0}
              fontSize={theme.metrics.fontSizes.p}
              lineHeight={rowHeight}
              marginBottom={theme.metrics.blocks.small}
              onPress={() => this.logout()}
            />
            <SettingsSelectRow
              rowHeight={rowHeight}
              label={t('profile.language')}
              value={this.languageLabel(this.state.language)}
              onSelect={val => this.onSelectLanguage(val)}
              options={this.languageOptions()}
            />
          </SettingsSection>
          <SettingsSection
            title={t('profile.security')}
            open={this.settingsSectionOpen('security')}
            onToggle={() => this.toggleSettingsSection('security')}>
            {(this.state.hasFingerprint || this.state.isFingerprintLockEnabled) && (
              <FormRowToggleComponent
                card
              rowHeight={rowHeight}
                label={t('profile.fingerprintLock')}
                value={!!this.state.isFingerprintLockEnabled}
                onChange={val => this.onFingerprintLock(val)}
              />
            )}
            {!!this.state.isFingerprintLockEnabled && (
              <SettingsSelectRow
                rowHeight={rowHeight}
                label={t('profile.fingerprintAfter')}
                value={this.fingerprintAfterLabel(this.state.fingerprintLockMinutes)}
                onSelect={val => this.setOption('fingerprintLockMinutes', normalizeFingerprintLockMinutes(val))}
                options={FINGERPRINT_LOCK_MINUTES.map(minutes => ({
                  value: `${minutes}`,
                  label: this.fingerprintAfterLabel(minutes),
                }))}
              />
            )}
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('profile.appCover')}
              value={!!this.state.isAppCoverEnabled}
              onChange={val => this.setOption('isAppCoverEnabled', val)}
            />
          </SettingsSection>
          <SettingsSection
            title={t('profile.navigation')}
            open={this.settingsSectionOpen('navigation')}
            onToggle={() => this.toggleSettingsSection('navigation')}>
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('profile.tabsOnBottom')}
              value={!!this.state.isBottomTabs}
              onChange={val => this.setOption('isBottomTabs', val)}
            />
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('profile.navbarExpand')}
              value={!!this.state.isNavbarExpandEnabled}
              onChange={val => this.setOption('isNavbarExpandEnabled', val)}
            />
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('profile.navGestures')}
              value={!!this.state.isNavGesturesEnabled}
              onChange={val => this.setOption('isNavGesturesEnabled', val)}
            />
          </SettingsSection>
          <SettingsSection
            title={t('profile.reading')}
            open={this.settingsSectionOpen('reading')}
            onToggle={() => this.toggleSettingsSection('reading')}>
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('profile.isUnreadToggleEnabled')}
              value={!!this.state.isUnreadToggleEnabled}
              onChange={val => this.setOption('isUnreadToggleEnabled', val)}
            />
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('profile.bookmarkSectionReadFilter')}
              value={this.state.isBookmarkSectionReadFilterEnabled !== false}
              onChange={val => this.setOption('isBookmarkSectionReadFilterEnabled', val)}
            />
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('profile.isSwipeablePostHeader')}
              value={!!this.state.isSwipeablePostHeader}
              onChange={val => this.setOption('isSwipeablePostHeader', val)}
            />
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('profile.isLocalLastReadEnabled')}
              value={this.state.isLocalLastReadEnabled !== false}
              onChange={val => this.setOption('isLocalLastReadEnabled', val)}
            />
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('profile.isTextSelectionEnabled')}
              value={this.state.isTextSelectionEnabled !== false}
              onChange={val => this.setOption('isTextSelectionEnabled', val)}
            />
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('profile.isPostMarkdownEnabled')}
              value={this.state.isPostMarkdownEnabled !== false}
              onChange={val => this.setOption('isPostMarkdownEnabled', val)}
            />
          </SettingsSection>
          <SettingsSection
            title={t('profile.media')}
            open={this.settingsSectionOpen('media')}
            onToggle={() => this.toggleSettingsSection('media')}>
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('profile.uploadVideoTag')}
              value={this.state.isUploadVideoTagEnabled !== false}
              onChange={val => this.setOption('isUploadVideoTagEnabled', val)}
            />
            <SettingsSelectRow
              rowHeight={rowHeight}
              label={t('profile.imageDownload')}
              value={this.imageDownloadLabel(this.state.imageDownloadMaxKb)}
              onSelect={val => this.setOption('imageDownloadMaxKb', normalizeImageDownloadMaxKb(val))}
              options={this.imageDownloadOptions()}
            />
            <SettingsSelectRow
              rowHeight={rowHeight}
              label={t('profile.fetchProgress')}
              value={
                this.state.fetchProgress === 'off'
                  ? t('profile.fetchProgressNone')
                  : t('profile.fetchProgressDetailed')
              }
              onSelect={val => this.setFetchProgress(val)}
              options={this.fetchProgressGlobalOptions()}
            />
            {this.state.fetchProgress !== 'off' && (
              <View>
                <SettingsSelectRow
                  rowHeight={rowHeight}
                  label={t('profile.fetchProgressEnter')}
                  value={this.fetchProgressLabel(this.state.fetchProgressEnter)}
                  onSelect={val =>
                    this.setOption('fetchProgressEnter', normalizeFetchProgressMode(val, FETCH_PROGRESS_ENTER_DEFAULT))
                  }
                  options={this.fetchProgressOptions()}
                />
                <SettingsSelectRow
                  rowHeight={rowHeight}
                  label={t('profile.fetchProgressMore')}
                  value={this.fetchProgressLabel(this.state.fetchProgressMore)}
                  onSelect={val =>
                    this.setOption('fetchProgressMore', normalizeFetchProgressMode(val, FETCH_PROGRESS_MORE_DEFAULT))
                  }
                  options={this.fetchProgressOptions()}
                />
                <SettingsSelectRow
                  rowHeight={rowHeight}
                  label={t('profile.fetchProgressLists')}
                  value={this.fetchProgressLabel(this.state.fetchProgressLists)}
                  onSelect={val =>
                    this.setOption('fetchProgressLists', normalizeFetchProgressMode(val, FETCH_PROGRESS_LISTS_DEFAULT))
                  }
                  options={this.fetchProgressOptions()}
                />
              </View>
            )}
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('profile.discussionCache')}
              value={this.state.isDiscussionCacheEnabled !== false}
              onChange={val => this.setOption('isDiscussionCacheEnabled', val)}
            />
            {this.state.isDiscussionCacheEnabled !== false && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: rowHeight,
                  overflow: 'hidden',
                  backgroundColor: theme.colors.surface,
                  borderRadius: 0,
                  marginBottom: theme.metrics.blocks.small,
                  paddingHorizontal: theme.metrics.blocks.medium,
                }}>
                <Text style={{ flex: 1, color: theme.colors.text, fontSize: theme.metrics.fontSizes.p }}>
                  {t('profile.discussionCacheLimit')}
                </Text>
                <TextInput
                  value={String(this.state.discussionCacheLimit ?? 30)}
                  keyboardType="number-pad"
                  onChangeText={val => this.setState({ discussionCacheLimit: val.replace(/[^0-9]/g, '') })}
                  onBlur={() =>
                    this.setOption(
                      'discussionCacheLimit',
                      normalizeDiscussionCacheLimit(this.state.discussionCacheLimit),
                    )
                  }
                  style={{
                    width: 72,
                    color: theme.colors.text,
                    fontSize: theme.metrics.fontSizes.p,
                    textAlign: 'right',
                    paddingVertical: 8,
                  }}
                />
              </View>
            )}
            {this.state.isDiscussionCacheEnabled !== false && this.state.discussionCacheReport && (
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.surface,
                    borderRadius: 0,
                    marginBottom: theme.metrics.blocks.small,
                    paddingHorizontal: theme.metrics.blocks.medium,
                    paddingVertical: theme.metrics.blocks.small,
                  }}>
                  <View style={{ flex: 1, paddingRight: theme.metrics.blocks.medium }}>
                    <Text style={{ color: theme.colors.text, fontSize: theme.metrics.fontSizes.p }}>
                      {`${t('profile.discussionCacheSize')} ${uploadSizeLabel(this.state.discussionCacheReport.bytes)}`}
                    </Text>
                    <Text style={{ color: theme.colors.faded, fontSize: theme.metrics.fontSizes.small, marginTop: 4 }}>
                      {this.discussionCacheContentLabel(this.state.discussionCacheReport)}
                    </Text>
                  </View>
                  <DoubleTapDeleteButton
                    iconSize={theme.metrics.fontSizes.p}
                    onDelete={() => this.deleteDiscussionCache()}
                    style={{ borderRadius: 0, alignSelf: 'center' }}
                  />
                </View>
                {this.renderFeedCacheRow(t('events.title'), this.state.discussionCacheReport.eventsCount, 'events')}
                {this.renderFeedCacheRow(t('reminders.title'), this.state.discussionCacheReport.remindersCount, 'reminders')}
                {this.renderFeedCacheRow(t('mail'), this.state.discussionCacheReport.mailCount, 'mail')}
                {this.renderFeedCacheRow(
                  t('notifications'),
                  this.state.discussionCacheReport.notificationsCount,
                  'notifications',
                )}
                <TouchableRipple
                  rippleColor={theme.colors.ripple}
                  onPress={() => this.setState({ isDiscussionCacheClubsVisible: true })}
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 0,
                    marginBottom: theme.metrics.blocks.small,
                    minHeight: rowHeight,
                    paddingHorizontal: theme.metrics.blocks.medium,
                    justifyContent: 'center',
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: rowHeight }}>
                    <Text style={{ flex: 1, color: theme.colors.text, fontSize: theme.metrics.fontSizes.p }}>
                      {t('profile.discussionCacheClubs')}
                    </Text>
                    <Icon name="chevron-right" size={theme.metrics.fontSizes.p} color={theme.colors.faded} />
                  </View>
                </TouchableRipple>
              </View>
            )}
          </SettingsSection>
          <SettingsSection
            title={t('events.title')}
            open={this.settingsSectionOpen('events')}
            onToggle={() => this.toggleSettingsSection('events')}>
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('events.friendBadges')}
              value={this.state.isEventFriendBadgesEnabled !== false}
              onChange={val => this.setOption('isEventFriendBadgesEnabled', val)}
            />
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('events.selfIcon')}
              value={this.state.isEventSelfIconEnabled !== false}
              onChange={val => this.setOption('isEventSelfIconEnabled', val)}
            />
            <SettingsSelectRow
              rowHeight={rowHeight}
              label={t('events.timelineDays')}
              value={`${normalizeTimelineVisibleDays(this.state.eventTimelineVisibleDays)}`}
              onSelect={val => this.setOption('eventTimelineVisibleDays', normalizeTimelineVisibleDays(val))}
              options={timelineVisibleDayOptions()}
            />
          </SettingsSection>
          <SettingsSection
            title={t('profile.sections')}
            open={this.settingsSectionOpen('sections')}
            onToggle={() => this.toggleSettingsSection('sections')}>
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('bookmarks')}
              value={!!this.state.isBookmarksEnabled}
              onChange={val => this.setOption('isBookmarksEnabled', val)}
            />
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('history')}
              value={!!this.state.isHistoryEnabled}
              onChange={val => this.setOption('isHistoryEnabled', val)}
            />
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('search.title')}
              value={!!this.state.isSearchEnabled}
              onChange={val => this.setOption('isSearchEnabled', val)}
            />
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('last')}
              value={!!this.state.isLastEnabled}
              onChange={val => this.setOption('isLastEnabled', val)}
            />
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('reminders.title')}
              value={!!this.state.isRemindersEnabled}
              onChange={val => this.setOption('isRemindersEnabled', val)}
            />
            <FormRowToggleComponent
              card
              rowHeight={rowHeight}
              label={t('events.title')}
              value={this.state.isEventsEnabled !== false}
              onChange={val => this.setOption('isEventsEnabled', val)}
            />
            <SettingsSelectRow
              rowHeight={rowHeight}
              label={t('profile.initialView')}
              value={t(`${this.state.initialRouteName}`.replace('Stack', ''))}
              onSelect={route => this.setOption('initialRouteName', route)}
              options={[
                { value: 'historyStack', label: t('history'), disabled: !this.state.isHistoryEnabled },
                { value: 'bookmarksStack', label: t('bookmarks'), disabled: !this.state.isBookmarksEnabled },
                { value: 'mailStack', label: t('mail') },
              ]}
            />
          </SettingsSection>
          <SettingsSection
            title={t('profile.llm.title') || 'LLM Asistent'}
            open={this.settingsSectionOpen('llm')}
            onToggle={() => this.toggleSettingsSection('llm')}>
          <FormRowToggleComponent
            card
              rowHeight={rowHeight}
            label={t('profile.llm.enable') || 'Povolit LLM podporu'}
            value={!!this.state.isLlmEnabled}
            onChange={val => this.setOption('isLlmEnabled', val)}
          />
          {this.state.isLlmEnabled && (
            <View>
              <FormRowToggleComponent
                card
              rowHeight={rowHeight}
                label={t('profile.llm.showUserAvatars') || 'Zobrazovat avatary uživatelů'}
                value={this.state.isLlmUserAvatarsEnabled !== undefined ? !!this.state.isLlmUserAvatarsEnabled : true}
                onChange={val => this.setOption('isLlmUserAvatarsEnabled', val)}
              />
              <SettingsSelectRow
                rowHeight={rowHeight}
                label={t('profile.llm.provider') || 'Připojení'}
                value={this.llmProviderLabel()}
                onSelect={next => this.onChangeLlmProvider(next)}
                options={[
                  { value: 'lumo', label: this.llmProviderLabel('lumo') },
                  { value: 'openrouter', label: this.llmProviderLabel('openrouter') },
                  { value: 'openai', label: this.llmProviderLabel('openai') },
                ]}
              />
              {this.llmProvider() === 'openai' && (
                <View
                  ref={ref => {
                    this.endpointField = ref
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    height: rowHeight,
                    overflow: 'hidden',
                    backgroundColor: theme.colors.surface,
                    borderRadius: 0,
                    marginBottom: theme.metrics.blocks.small,
                    paddingHorizontal: theme.metrics.blocks.medium,
                  }}>
                  <TextInput
                    value={this.state.openaiBaseUrl}
                    onChangeText={val => this.setState({ openaiBaseUrl: val })}
                    onFocus={() => this.focusLlmField(this.endpointField)}
                    onBlur={() => this.persistOpenAiCredentials()}
                    placeholder={t('profile.llm.endpointPlaceholder') || 'https://api.openai.com/v1'}
                    placeholderTextColor={theme.colors.faded}
                    style={{
                      flex: 1,
                      color: theme.colors.text,
                      fontSize: theme.metrics.fontSizes.p,
                      paddingVertical: 8,
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                </View>
              )}
              {this.llmProvider() !== 'lumo' && (
              <View
                ref={ref => {
                  this.apiKeyField = ref
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: rowHeight,
                  overflow: 'hidden',
                  backgroundColor: theme.colors.surface,
                  borderRadius: 0,
                  marginBottom: theme.metrics.blocks.small,
                  paddingHorizontal: theme.metrics.blocks.medium,
                }}>
                <TextInput
                  value={this.llmProvider() === 'openai' ? this.state.openaiApiKey : this.state.openRouterApiKey}
                  onChangeText={val =>
                    this.setState(this.llmProvider() === 'openai' ? { openaiApiKey: val } : { openRouterApiKey: val })
                  }
                  onFocus={() => this.focusLlmField(this.apiKeyField)}
                  onBlur={() =>
                    this.llmProvider() === 'openai'
                      ? this.setOption('openaiApiKey', this.state.openaiApiKey)
                      : this.setOption('openRouterApiKey', this.state.openRouterApiKey)
                  }
                  placeholder={
                    this.llmProvider() === 'openai'
                      ? t('profile.llm.openaiApiKeyPlaceholder') || 'sk-...'
                      : t('profile.llm.apiKeyPlaceholder') || 'sk-or-v1-...'
                  }
                  placeholderTextColor={theme.colors.faded}
                  secureTextEntry={true}
                  style={{
                    flex: 1,
                    color: theme.colors.text,
                    fontSize: theme.metrics.fontSizes.p,
                    paddingVertical: 8,
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={async () => {
                    if (this.llmProvider() === 'openai') {
                      await this.persistOpenAiCredentials()
                    } else {
                      await this.setOption('openRouterApiKey', this.state.openRouterApiKey)
                    }
                    await this.fetchModels()
                  }}
                  disabled={this.state.isFetchingModels}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 0,
                    marginLeft: 8,
                  }}>
                  {this.state.isFetchingModels ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <Text
                      style={{
                        color: theme.colors.primary,
                        fontSize: theme.metrics.fontSizes.small,
                        fontWeight: 'bold',
                      }}>
                      {(this.state.models?.length || 0) > 0
                        ? t('profile.llm.refreshModels') || 'Aktualizovat'
                        : t('profile.llm.fetchModels') || 'Načíst modely'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              )}

              {/* Error banner */}
              {this.state.llmError ? (
                <View
                  style={{
                    height: rowHeight,
                    overflow: 'hidden',
                    backgroundColor: theme.colors.surface,
                    borderRadius: 0,
                    marginBottom: theme.metrics.blocks.small,
                    paddingHorizontal: theme.metrics.blocks.medium,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Icon
                    name="alert-triangle"
                    size={16}
                    color={theme.colors.accent}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    selectable
                    style={{
                      color: theme.colors.accent,
                      fontSize: theme.metrics.fontSizes.small,
                      flex: 1,
                    }}>
                    {this.state.llmError}
                  </Text>
                </View>
              ) : null}

              {this.llmProvider() === 'lumo' ? (
                <>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: rowHeight,
                      overflow: 'hidden',
                      backgroundColor: theme.colors.surface,
                      borderRadius: 0,
                      marginBottom: theme.metrics.blocks.small,
                      paddingHorizontal: theme.metrics.blocks.medium,
                    }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text
                        style={{
                          color: theme.colors.faded,
                          fontSize: theme.metrics.fontSizes.small - 1,
                        }}>
                        {t('profile.llm.selectedModel') || 'Model'}:
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: theme.colors.faded,
                          fontSize: theme.metrics.fontSizes.p,
                          fontWeight: '600',
                          marginTop: 2,
                        }}>
                        {LUMO_MODEL_NAME}
                      </Text>
                    </View>
                  </View>
                  <LlmLumoQuota />
                </>
              ) : (this.llmProvider() !== 'openai' ||
                (!!(this.state.openaiBaseUrl || '').trim() && !!(this.state.openaiApiKey || '').trim())) && (
              <TouchableOpacity
                onPress={async () => {
                  let models = this.state.models || []
                  if (models.length === 0) {
                    models = (await this.fetchModels()) || []
                  }
                  if (models.length > 0) {
                    this.setState({ models, isModelPickerVisible: true })
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: rowHeight,
                  overflow: 'hidden',
                  backgroundColor: theme.colors.surface,
                  borderRadius: 0,
                  marginBottom: theme.metrics.blocks.small,
                  paddingHorizontal: theme.metrics.blocks.medium,
                }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text
                    style={{
                      color: theme.colors.faded,
                      fontSize: theme.metrics.fontSizes.small - 1,
                    }}>
                    {t('profile.llm.selectedModel') || 'Model'}:
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: this.state.selectedLlmModel ? theme.colors.text : theme.colors.faded,
                      fontSize: theme.metrics.fontSizes.p,
                      fontWeight: '600',
                      marginTop: 2,
                    }}>
                    {this.state.selectedLlmModelName ||
                      this.state.selectedLlmModel ||
                      t('profile.llm.selectModel') ||
                      'Vyberte model...'}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color={theme.colors.faded} />
              </TouchableOpacity>
              )}

              {/* System Prompt Row */}
              <TouchableOpacity
                onPress={() => this.setState({ isSystemPromptDialogVisible: true })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: rowHeight,
                  overflow: 'hidden',
                  backgroundColor: theme.colors.surface,
                  borderRadius: 0,
                  marginBottom: theme.metrics.blocks.small,
                  paddingHorizontal: theme.metrics.blocks.medium,
                }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontSize: theme.metrics.fontSizes.p,
                    }}>
                    {t('llm.systemPrompt') || 'Systémový prompt'}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: theme.colors.faded,
                      fontSize: theme.metrics.fontSizes.small,
                      marginTop: 2,
                    }}>
                    {this.context?.config?.llmSystemPrompt?.trim()
                      ? t('profile.llm.systemPromptCustom') || 'Vlastní instrukce'
                      : t('profile.llm.systemPromptDefault') || 'Výchozí instrukce pro model'}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color={theme.colors.faded} />
              </TouchableOpacity>
            </View>
          )}
          </SettingsSection>
        </ScrollView>
        <LlmModelPickerDialog
          isVisible={!!this.state.isModelPickerVisible}
          models={this.state.models || []}
          catalog={this.llmProvider() === 'openai' ? 'openai' : 'openrouter'}
          isLoading={!!this.state.isFetchingModels}
          loadError={this.state.llmError}
          selectedModelId={this.state.selectedLlmModel || ''}
          onReload={() => {
            void this.fetchModels({ keepSelection: true })
          }}
          onSelect={model => this.onSelectModel(model)}
          onCancel={() => this.setState({ isModelPickerVisible: false })}
        />
        <LlmSystemPromptDialog
          isVisible={!!this.state.isSystemPromptDialogVisible}
          initialPrompt={this.context?.config?.llmSystemPrompt}
          onSave={async prompt => {
            await this.setOption('llmSystemPrompt', prompt)
            this.setState({ isSystemPromptDialogVisible: false })
          }}
          onCancel={() => this.setState({ isSystemPromptDialogVisible: false })}
        />
        <FilterSettingsDialog onUpdate={filters => this.setFilters(filters)} />
        <Modal
          visible={!!this.state.isDiscussionCacheClubsVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => this.setState({ isDiscussionCacheClubsVisible: false })}>
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', height: 50 }}>
              <TouchableRipple
                rippleColor={theme.colors.ripple}
                onPress={() => this.setState({ isDiscussionCacheClubsVisible: false })}
                style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="arrow-left" size={24} color={theme.colors.primary} />
              </TouchableRipple>
              <Text numberOfLines={1} style={{ flex: 1, color: theme.colors.text, fontSize: theme.metrics.fontSizes.p }}>
                {t('profile.discussionCacheClubs')}
              </Text>
            </View>
            <FlatList
              style={{ flex: 1 }}
              data={this.state.discussionCacheReport?.clubs || []}
              keyExtractor={item => item.id}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 60 + androidStackBottomInset }}
              ListEmptyComponent={
                <Text
                  style={{
                    color: theme.colors.faded,
                    fontSize: theme.metrics.fontSizes.p,
                    paddingHorizontal: theme.metrics.blocks.medium,
                  }}>
                  {t('profile.discussionCacheEmpty')}
                </Text>
              }
              renderItem={({ item: club }) => {
                  const confirming = this.state.confirmingCacheClubId === club.id
                  return (
                    <TouchableRipple
                      key={club.id}
                      rippleColor={theme.colors.ripple}
                      onPress={() => this.onCachedClubPress(club.id)}>
                      <View
                        style={{
                          backgroundColor: theme.colors.surface,
                          marginBottom: theme.metrics.blocks.small,
                          paddingHorizontal: theme.metrics.blocks.medium,
                          paddingVertical: theme.metrics.blocks.small,
                          borderLeftWidth: 3,
                          borderLeftColor: confirming ? '#DC2626' : theme.colors.surface,
                        }}>
                        <Text numberOfLines={2} style={{ color: theme.colors.text, fontSize: theme.metrics.fontSizes.p }}>
                          {club.name}
                        </Text>
                        <Text style={{ color: confirming ? '#DC2626' : theme.colors.faded, fontSize: theme.metrics.fontSizes.small, marginTop: 2 }}>
                          {confirming
                            ? t('profile.discussionCacheDeleteAgain')
                            : `${this.czechCount(
                                club.posts,
                                t('profile.discussionCachePostOne'),
                                t('profile.discussionCachePostFew').replace('%s', String(club.posts)),
                                t('profile.discussionCachePostMany').replace('%s', String(club.posts)),
                              )}${club.from ? ` · ${club.to ? `${club.from} – ${club.to}` : club.from}` : ''}`}
                        </Text>
                      </View>
                    </TouchableRipple>
                  )
              }}
            />
          </SafeAreaView>
        </Modal>
      </View>
    )
  }
}
