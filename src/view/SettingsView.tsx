import React, { Component } from 'react'
import { ScrollView, View } from 'react-native'
import {
  ButtonComponent,
  confirm,
  FilterSettingsDialog,
  FormRowSelectComponent,
  FormRowToggleComponent,
  SectionHeaderComponent,
} from '../component'
import { MainContext, Storage, t, Theme, initFCM, unregisterFCM, Nyx } from '../lib'

type Props = {
  config: any
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
  isNavGesturesEnabled: boolean
  isUnreadToggleEnabled: boolean
  initialRouteName: string
  theme: Theme
  username: string
  isVisible: boolean
}
export class SettingsView extends Component<Props> {
  static contextType = MainContext
  nyx?: Nyx
  state: Readonly<Partial<State>> = {}
  constructor(props) {
    super(props)
    this.loadSettings()
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.setTheme()
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
      isNavGesturesEnabled: config.isNavGesturesEnabled === undefined ? false : !!config.isNavGesturesEnabled,
      isUnreadToggleEnabled: config.isUnreadToggleEnabled === undefined ? true : !!config.isUnreadToggleEnabled,
      initialRouteName: config?.initialRouteName || 'historyStack',
      username: '',
      isVisible: true,
    }
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
        <ScrollView style={{ backgroundColor: theme.colors.background }}>
          <SectionHeaderComponent title={t('profile.general')} backgroundColor={theme.colors.surface} />
          <ButtonComponent
            label={t('profile.fcm.subscribe.title')}
            icon={'mail'}
            textAlign={'left'}
            color={theme.colors.accent}
            fontSize={theme.metrics.fontSizes.p}
            marginBottom={theme.metrics.blocks.medium}
            onPress={() => this.subscribeFCM()}
          />
          <ButtonComponent
            label={t('profile.fcm.unsubscribe.title')}
            icon={'trash-2'}
            textAlign={'left'}
            color={theme.colors.accent}
            fontSize={theme.metrics.fontSizes.p}
            marginBottom={theme.metrics.blocks.medium}
            onPress={() => this.unsubscribeFCM()}
          />
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
        </ScrollView>
        <FilterSettingsDialog onUpdate={filters => this.setFilters(filters)} />
      </View>
    )
  }
}
