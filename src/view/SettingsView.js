import React, { Component } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { ButtonComponent, confirm, FilterSettingsDialog, FormRowToggleComponent } from '../component'
import { MainContext, Styling, Storage, t, initFCM, unregisterFCM } from '../lib'

type Props = {
  config: any,
  onConfigChange: Function,
  onFiltersChange: Function,
}
export class SettingsView extends Component<Props> {
  static contextType = MainContext
  constructor(props) {
    super(props)
    this.loadSettings()
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.setState({ isDarkMode: this.context.theme === 'dark' })
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
      isNavGesturesEnabled: config.isNavGesturesEnabled === undefined ? true : !!config.isNavGesturesEnabled,
      initialRouteName: config?.initialRouteName || 'historyStack',
      theme: config?.theme || 'system',
      isDarkMode: config?.theme === 'dark',
      username: '',
      isVisible: true,
    }
  }

  async setOption(name, val) {
    this.setState({ [name]: val })
    const conf = await Storage.getConfig()
    conf[name] = val
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
    await initFCM(this.nyx, this.props.config, true)
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
    this.nyx.logout()
    this.setState({ isFetching: false })
  }

  render() {
    return (
      <View style={[Styling.groups.themeComponent(this.state.isDarkMode), { height: '100%' }]}>
        <ScrollView style={Styling.groups.themeComponent(this.state.isDarkMode)}>
          <FormRowToggleComponent
            label={t('profile.tabsOnBottom')}
            isDarkMode={this.state.isDarkMode}
            value={this.state.isBottomTabs}
            onChange={val => this.setOption('isBottomTabs', val)}
          />
          <FormRowToggleComponent
            label={t('profile.navGestures')}
            isDarkMode={this.state.isDarkMode}
            value={this.state.isNavGesturesEnabled}
            onChange={val => this.setOption('isNavGesturesEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('bookmarks')}
            isDarkMode={this.state.isDarkMode}
            value={this.state.isBookmarksEnabled}
            onChange={val => this.setOption('isBookmarksEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('history')}
            isDarkMode={this.state.isDarkMode}
            value={this.state.isHistoryEnabled}
            onChange={val => this.setOption('isHistoryEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('search.title')}
            isDarkMode={this.state.isDarkMode}
            value={this.state.isSearchEnabled}
            onChange={val => this.setOption('isSearchEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('last')}
            isDarkMode={this.state.isDarkMode}
            value={this.state.isLastEnabled}
            onChange={val => this.setOption('isLastEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('reminders.title')}
            isDarkMode={this.state.isDarkMode}
            value={this.state.isRemindersEnabled}
            onChange={val => this.setOption('isRemindersEnabled', val)}
          />
          <View style={{ marginTop: 10, height: 70 }}>
            <Text
              style={[
                Styling.groups.themeComponent(this.state.isDarkMode),
                { fontSize: 18, backgroundColor: 'transparent' },
              ]}>
              {t('profile.initialView')}
            </Text>
            <Picker
              mode={'dropdown'}
              style={[Styling.groups.themeComponent(this.state.isDarkMode), { color: Styling.colors.primary }]}
              prompt={t('profile.initialView')}
              selectedValue={this.state.initialRouteName}
              onValueChange={route => this.setOption('initialRouteName', route)}>
              <Picker.Item
                key={'historyStack'}
                label={t('history')}
                value={'historyStack'}
                enabled={this.state.isHistoryEnabled}
                color={this.state.isHistoryEnabled ? Styling.colors.primary : Styling.colors.darker}
              />
              <Picker.Item
                key={'bookmarksStack'}
                label={t('bookmarks')}
                value={'bookmarksStack'}
                enabled={this.state.isBookmarksEnabled}
                color={this.state.isBookmarksEnabled ? Styling.colors.primary : Styling.colors.darker}
              />
              <Picker.Item key={'mailStack'} label={t('mail')} value={'mailStack'} color={Styling.colors.primary} />
            </Picker>
          </View>
          <View style={{ marginTop: 10, height: 70 }}>
            <Text
              style={[
                Styling.groups.themeComponent(this.state.isDarkMode),
                { fontSize: 18, backgroundColor: 'transparent' },
              ]}>
              {t('profile.theme')}
            </Text>
            <Picker
              mode={'dropdown'}
              style={[Styling.groups.themeComponent(this.state.isDarkMode), { color: Styling.colors.primary }]}
              prompt={t('profile.theme')}
              selectedValue={this.state.theme}
              onValueChange={route => this.setOption('theme', route)}>
              <Picker.Item key={'system'} label={t('profile.system')} value={'system'} color={Styling.colors.primary} />
              <Picker.Item key={'dark'} label={t('profile.dark')} value={'dark'} color={Styling.colors.primary} />
              <Picker.Item key={'light'} label={t('profile.light')} value={'light'} color={Styling.colors.primary} />
            </Picker>
          </View>
          <ButtonComponent
            label={t('profile.fcm.subscribe.title')}
            icon={'mail'}
            textAlign={'left'}
            color={Styling.colors.secondary}
            fontSize={Styling.metrics.fontSize.medium}
            marginBottom={Styling.metrics.block.small}
            isDarkMode={this.state.isDarkMode}
            onPress={() => this.subscribeFCM()}
          />
          <ButtonComponent
            label={t('profile.fcm.unsubscribe.title')}
            icon={'trash-2'}
            textAlign={'left'}
            color={Styling.colors.secondary}
            fontSize={Styling.metrics.fontSize.medium}
            marginBottom={Styling.metrics.block.small}
            isDarkMode={this.state.isDarkMode}
            onPress={() => this.unsubscribeFCM()}
          />
          <ButtonComponent
            label={t('profile.logout')}
            icon={'lock'}
            textAlign={'left'}
            color={Styling.colors.secondary}
            fontSize={Styling.metrics.fontSize.medium}
            marginBottom={Styling.metrics.block.small}
            isDarkMode={this.state.isDarkMode}
            onPress={() => this.logout()}
          />
        </ScrollView>
        <FilterSettingsDialog onUpdate={filters => this.setFilters(filters)} />
      </View>
    )
  }
}
