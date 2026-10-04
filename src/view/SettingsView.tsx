import React, { Component } from 'react'
import { ActivityIndicator, ScrollView, TextInput, TouchableOpacity, View } from 'react-native'
import { Text } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Feather'
import {
  androidStackBottomInset,
  ButtonComponent,
  confirm,
  FilterSettingsDialog,
  FormRowSelectComponent,
  FormRowToggleComponent,
  LlmModelPickerDialog,
  LlmSystemPromptDialog,
  SectionHeaderComponent,
} from '../component'
import {
  fetchOpenRouterModels,
  formatPricing,
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
  normalizeImageDownloadMaxKb,
  normalizeTimelineVisibleDays,
  timelineVisibleDayOptions,
} from '../lib'

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
  imageDownloadMaxKb: number | null
  initialRouteName: string
  isLlmEnabled: boolean
  openRouterApiKey: string
  selectedLlmModel: string
  selectedLlmModelName: string
  isFetchingModels: boolean
  models: OpenRouterModel[]
  isModelPickerVisible: boolean
  isSystemPromptDialogVisible: boolean
  llmError: string | null
  theme: Theme
  username: string
  isVisible: boolean
}
export class SettingsView extends Component<Props> {
  static contextType = MainContext
  nyx?: Nyx
  unsubscribeFocus?: () => void
  state: Readonly<Partial<State>> = {}
  constructor(props) {
    super(props)
    this.loadSettings()
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.setTheme()
    this.loadCachedModels()
    this.unsubscribeFocus = this.props.navigation?.addListener('focus', () => {
      this.refreshTimelineDays()
      this.loadCachedModels()
    })
  }

  async loadCachedModels() {
    try {
      const cached = await Storage.getCachedLlmModels()
      if (Array.isArray(cached) && cached.length > 0 && this.state.models.length === 0) {
        this.setState({ models: cached })
      }
    } catch (e) {
      console.warn('Failed to load cached LLM models', e)
    }
  }

  componentWillUnmount() {
    this.unsubscribeFocus?.()
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
      imageDownloadMaxKb: normalizeImageDownloadMaxKb(config?.imageDownloadMaxKb),
      initialRouteName: config?.initialRouteName || 'historyStack',
      isLlmEnabled: !!config?.isLlmEnabled,
      openRouterApiKey: config?.openRouterApiKey || '',
      selectedLlmModel: config?.selectedLlmModel || '',
      selectedLlmModelName: config?.selectedLlmModelName || '',
      isFetchingModels: false,
      models: [],
      isModelPickerVisible: false,
      isSystemPromptDialogVisible: false,
      isHistoryModalVisible: false,
      historyCount: 0,
      llmError: null,
      username: '',
      isVisible: true,
    }
  }

  async fetchModels(keyToUse?: string) {
    const key = (keyToUse !== undefined ? keyToUse : this.state.openRouterApiKey) || ''
    if (!key.trim()) {
      this.setState({ llmError: 'Nejprve zadejte OpenRouter API klíč.' })
      return
    }
    this.setState({ isFetchingModels: true, llmError: null })
    try {
      const models = await fetchOpenRouterModels(key)
      this.setState({ models, isFetchingModels: false })
      await Storage.setCachedLlmModels(models)
      if (!this.state.selectedLlmModel && models.length > 0) {
        await this.onSelectModel(models[0])
      }
    } catch (e: any) {
      this.setState({ isFetchingModels: false, llmError: e?.message || 'Chyba při stahování modelů.' })
    }
  }

  async onSelectModel(model: OpenRouterModel) {
    await this.setOption('selectedLlmModel', model.id)
    await this.setOption('selectedLlmModelName', model.name)
    this.setState({ isModelPickerVisible: false })
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
    const { theme } = this.state
    if (!theme) {
      return null
    }
    return (
      <View style={{ backgroundColor: theme.colors.background, height: '100%' }}>
        <ScrollView
          style={{ backgroundColor: theme.colors.background }}
          contentContainerStyle={{ paddingBottom: 150 + androidStackBottomInset }}>
          <SectionHeaderComponent title={t('profile.general')} backgroundColor={theme.colors.surface} />
          {/*<ButtonComponent*/}
          {/*  label={t('profile.fcm.subscribe.title')}*/}
          {/*  icon={'mail'}*/}
          {/*  textAlign={'left'}*/}
          {/*  color={theme.colors.accent}*/}
          {/*  fontSize={theme.metrics.fontSizes.p}*/}
          {/*  marginBottom={theme.metrics.blocks.medium}*/}
          {/*  onPress={() => this.subscribeFCM()}*/}
          {/*/>*/}
          {/*<ButtonComponent*/}
          {/*  label={t('profile.fcm.unsubscribe.title')}*/}
          {/*  icon={'trash-2'}*/}
          {/*  textAlign={'left'}*/}
          {/*  color={theme.colors.accent}*/}
          {/*  fontSize={theme.metrics.fontSizes.p}*/}
          {/*  marginBottom={theme.metrics.blocks.medium}*/}
          {/*  onPress={() => this.unsubscribeFCM()}*/}
          {/*/>*/}
          <ButtonComponent
            label={t('profile.logout')}
            icon={'lock'}
            textAlign={'left'}
            color={theme.colors.accent}
            fontSize={theme.metrics.fontSizes.p}
            marginBottom={theme.metrics.blocks.medium}
            onPress={() => this.logout()}
          />
          <FormRowToggleComponent
            label={t('profile.tabsOnBottom')}
            value={!!this.state.isBottomTabs}
            onChange={val => this.setOption('isBottomTabs', val)}
          />
          <FormRowToggleComponent
            label={t('profile.navGestures')}
            value={!!this.state.isNavGesturesEnabled}
            onChange={val => this.setOption('isNavGesturesEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('profile.isUnreadToggleEnabled')}
            value={!!this.state.isUnreadToggleEnabled}
            onChange={val => this.setOption('isUnreadToggleEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('profile.bookmarkSectionReadFilter')}
            value={this.state.isBookmarkSectionReadFilterEnabled !== false}
            onChange={val => this.setOption('isBookmarkSectionReadFilterEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('profile.isSwipeablePostHeader')}
            value={!!this.state.isSwipeablePostHeader}
            onChange={val => this.setOption('isSwipeablePostHeader', val)}
          />
          <FormRowToggleComponent
            label={t('events.friendBadges')}
            value={this.state.isEventFriendBadgesEnabled !== false}
            onChange={val => this.setOption('isEventFriendBadgesEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('events.selfIcon')}
            value={this.state.isEventSelfIconEnabled !== false}
            onChange={val => this.setOption('isEventSelfIconEnabled', val)}
          />
          <View
            style={{
              paddingVertical: theme.metrics.blocks.medium,
              paddingHorizontal: theme.metrics.blocks.medium,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{ fontSize: theme.metrics.fontSizes.p, flex: 1, paddingRight: theme.metrics.blocks.medium }}>
              {t('events.timelineDays')}
            </Text>
            <FormRowSelectComponent
              value={`${normalizeTimelineVisibleDays(this.state.eventTimelineVisibleDays)}`}
              onSelect={val => this.setOption('eventTimelineVisibleDays', normalizeTimelineVisibleDays(val))}
              options={timelineVisibleDayOptions()}
            />
          </View>
          <View
            style={{
              paddingVertical: theme.metrics.blocks.medium,
              paddingHorizontal: theme.metrics.blocks.medium,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{ fontSize: theme.metrics.fontSizes.p, flex: 1, paddingRight: theme.metrics.blocks.medium }}>
              {t('profile.imageDownload')}
            </Text>
            <FormRowSelectComponent
              value={this.imageDownloadLabel(this.state.imageDownloadMaxKb)}
              onSelect={val => this.setOption('imageDownloadMaxKb', normalizeImageDownloadMaxKb(val))}
              options={this.imageDownloadOptions()}
            />
          </View>
          <SectionHeaderComponent title={t('profile.sections')} backgroundColor={theme.colors.surface} />
          <FormRowToggleComponent
            label={t('bookmarks')}
            value={!!this.state.isBookmarksEnabled}
            onChange={val => this.setOption('isBookmarksEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('history')}
            value={!!this.state.isHistoryEnabled}
            onChange={val => this.setOption('isHistoryEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('search.title')}
            value={!!this.state.isSearchEnabled}
            onChange={val => this.setOption('isSearchEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('last')}
            value={!!this.state.isLastEnabled}
            onChange={val => this.setOption('isLastEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('reminders.title')}
            value={!!this.state.isRemindersEnabled}
            onChange={val => this.setOption('isRemindersEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('events.title')}
            value={this.state.isEventsEnabled !== false}
            onChange={val => this.setOption('isEventsEnabled', val)}
          />
          <SectionHeaderComponent title={t('profile.initialView')} backgroundColor={theme.colors.surface} />
          <FormRowSelectComponent
            value={t(`${this.state.initialRouteName}`.replace('Stack', ''))}
            onSelect={route => this.setOption('initialRouteName', route)}
            options={[
              { value: 'historyStack', label: t('history'), disabled: !this.state.isHistoryEnabled },
              { value: 'bookmarksStack', label: t('bookmarks'), disabled: !this.state.isBookmarksEnabled },
              { value: 'mailStack', label: t('mail') },
            ]}
          />
          <SectionHeaderComponent
            title={t('profile.llm.title') || 'LLM Asistent'}
            backgroundColor={theme.colors.surface}
          />
          <FormRowToggleComponent
            label={t('profile.llm.enable') || 'Povolit LLM podporu'}
            value={!!this.state.isLlmEnabled}
            onChange={val => this.setOption('isLlmEnabled', val)}
          />
          {this.state.isLlmEnabled && (
            <View
              style={{
                paddingHorizontal: theme.metrics.blocks.medium,
                paddingBottom: theme.metrics.blocks.medium,
              }}>
              <Text
                style={{
                  fontSize: theme.metrics.fontSizes.small,
                  color: theme.colors.faded,
                  marginBottom: 8,
                }}>
                {t('profile.llm.notice') || 'API klíč je uložen pouze lokálně ve tvém zařízení.'}
              </Text>

              {/* API Key Row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.disabled,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  marginBottom: 10,
                }}>
                <TextInput
                  value={this.state.openRouterApiKey}
                  onChangeText={val => this.setState({ openRouterApiKey: val })}
                  onBlur={() => this.setOption('openRouterApiKey', this.state.openRouterApiKey)}
                  placeholder={t('profile.llm.apiKeyPlaceholder') || 'sk-or-v1-...'}
                  placeholderTextColor={theme.colors.faded}
                  secureTextEntry={true}
                  style={{
                    flex: 1,
                    color: theme.colors.text,
                    fontSize: theme.metrics.fontSizes.p,
                    paddingVertical: 10,
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={async () => {
                    await this.setOption('openRouterApiKey', this.state.openRouterApiKey)
                    await this.fetchModels(this.state.openRouterApiKey)
                  }}
                  disabled={this.state.isFetchingModels}
                  style={{
                    backgroundColor: theme.colors.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 6,
                    marginLeft: 8,
                  }}>
                  {this.state.isFetchingModels ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: theme.metrics.fontSizes.small,
                        fontWeight: 'bold',
                      }}>
                      {(this.state.models?.length || 0) > 0
                        ? t('profile.llm.fetchModels') || 'Aktualizovat'
                        : t('profile.llm.fetchModels') || 'Načíst'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Error banner */}
              {this.state.llmError ? (
                <View
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.error || theme.colors.accent,
                    borderWidth: 1,
                    borderLeftWidth: 4,
                    borderRadius: 6,
                    padding: 10,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Icon
                    name="alert-triangle"
                    size={18}
                    color={theme.colors.error || theme.colors.accent}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    selectable
                    style={{
                      color: theme.colors.text,
                      fontSize: theme.metrics.fontSizes.small,
                      flex: 1,
                    }}>
                    {this.state.llmError}
                  </Text>
                </View>
              ) : null}

              {/* Model Picker Trigger */}
              <TouchableOpacity
                onPress={async () => {
                  if (!this.state.models || this.state.models.length === 0) {
                    await this.fetchModels()
                  }
                  if (this.state.models && this.state.models.length > 0) {
                    this.setState({ isModelPickerVisible: true })
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.disabled,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text
                    style={{
                      color: theme.colors.faded,
                      fontSize: theme.metrics.fontSizes.small,
                      marginBottom: 2,
                    }}>
                    {t('profile.llm.selectedModel') || 'Vybraný model'}:
                  </Text>
                  <Text
                    style={{
                      color: this.state.selectedLlmModel ? theme.colors.text : theme.colors.faded,
                      fontSize: theme.metrics.fontSizes.p,
                      fontWeight: '600',
                    }}>
                    {this.state.selectedLlmModelName ||
                      this.state.selectedLlmModel ||
                      t('profile.llm.selectModel') ||
                      'Vyberte model...'}
                  </Text>
                  {this.state.selectedLlmModel ? (
                    <Text style={{ color: theme.colors.faded, fontSize: 11, marginTop: 2 }}>
                      {this.state.selectedLlmModel}
                    </Text>
                  ) : null}
                </View>
                <Icon name="chevron-right" size={20} color={theme.colors.faded} />
              </TouchableOpacity>

              {/* System Prompt Row */}
              <TouchableOpacity
                onPress={() => this.setState({ isSystemPromptDialogVisible: true })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.disabled,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  marginTop: 10,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                  <Icon name="sliders" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: theme.colors.text,
                        fontSize: theme.metrics.fontSizes.p,
                        fontWeight: '600',
                      }}>
                      Systémový prompt
                    </Text>
                    <Text
                      style={{
                        color: theme.colors.faded,
                        fontSize: theme.metrics.fontSizes.small,
                        marginTop: 2,
                      }}>
                      Instrukce pro chování modelu a formátování odkazů
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color={theme.colors.faded} />
              </TouchableOpacity>

            </View>
          )}
        </ScrollView>
        <LlmModelPickerDialog
          isVisible={!!this.state.isModelPickerVisible}
          models={this.state.models || []}
          selectedModelId={this.state.selectedLlmModel || ''}
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
      </View>
    )
  }
}
