import React, { Component } from 'react'
import { ScrollView, View } from 'react-native'
import { Text } from 'react-native-paper'
import { Picker } from '@react-native-picker/picker'
import { ButtonComponent, confirm, FilterSettingsDialog, FormRowToggleComponent } from '../component'
import { defaultThemeOptions, MainContext, Storage, t, initFCM, unregisterFCM } from '../lib'

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
      isNavGesturesEnabled: config.isNavGesturesEnabled === undefined ? true : !!config.isNavGesturesEnabled,
      initialRouteName: config?.initialRouteName || 'historyStack',
      themeOptions: config?.themeOptions || [...defaultThemeOptions],
      selectedTheme: config?.theme || 'system',
      isDarkMode: config?.theme === 'dark',
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
    } else if (name === 'selectedTheme') {
      this.setState({ selectedTheme: val })
      conf.theme = val
    } else {
      this.setState({ [name]: val })
      conf[name] = val
    }
    await Storage.setConfig(conf)
    this.props.onConfigChange()
  }

  async setThemeOption(index, val) {
    const conf = await Storage.getConfig()
    const themeOptions = [...this.state.themeOptions]
    themeOptions[index] = val
    this.setState({ themeOptions })
    conf.themeOptions = themeOptions
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
    const { theme } = this.state
    if (!theme) {
      return null
    }
    const palette = ['blue', 'cyan', 'coolGray', 'green', 'magenta', 'purple', 'red', 'teal']
    const fontSizes = [12, 13, 14, 15, 16, 17, 18]
    return (
      <View style={{ backgroundColor: theme.colors.background, height: '100%' }}>
        <ScrollView style={{ backgroundColor: theme.colors.background }}>
          <FormRowToggleComponent
            label={t('profile.tabsOnBottom')}
            value={this.state.isBottomTabs}
            onChange={val => this.setOption('isBottomTabs', val)}
          />
          <FormRowToggleComponent
            label={t('profile.navGestures')}
            value={this.state.isNavGesturesEnabled}
            onChange={val => this.setOption('isNavGesturesEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('bookmarks')}
            value={this.state.isBookmarksEnabled}
            onChange={val => this.setOption('isBookmarksEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('history')}
            value={this.state.isHistoryEnabled}
            onChange={val => this.setOption('isHistoryEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('search.title')}
            value={this.state.isSearchEnabled}
            onChange={val => this.setOption('isSearchEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('last')}
            value={this.state.isLastEnabled}
            onChange={val => this.setOption('isLastEnabled', val)}
          />
          <FormRowToggleComponent
            label={t('reminders.title')}
            value={this.state.isRemindersEnabled}
            onChange={val => this.setOption('isRemindersEnabled', val)}
          />
          <View style={{ marginTop: 10, height: 70 }}>
            <Text style={{ fontSize: theme.metrics.fontSizes.h3 }}>{t('profile.initialView')}</Text>
            <Picker
              mode={'dropdown'}
              prompt={t('profile.initialView')}
              selectedValue={this.state.initialRouteName}
              onValueChange={route => this.setOption('initialRouteName', route)}>
              <Picker.Item
                key={'historyStack'}
                label={t('history')}
                value={'historyStack'}
                enabled={this.state.isHistoryEnabled}
                color={this.state.isHistoryEnabled ? theme.colors.text : theme.colors.disabled}
              />
              <Picker.Item
                key={'bookmarksStack'}
                label={t('bookmarks')}
                value={'bookmarksStack'}
                enabled={this.state.isBookmarksEnabled}
                color={this.state.isBookmarksEnabled ? theme.colors.text : theme.colors.disabled}
              />
              <Picker.Item key={'mailStack'} label={t('mail')} value={'mailStack'} color={theme.colors.text} />
            </Picker>
          </View>
          <View style={{ marginTop: 10, height: 70 }}>
            <Text style={{ fontSize: theme.metrics.fontSizes.h3 }}>{t('profile.theme')}</Text>
            <Picker
              mode={'dropdown'}
              prompt={t('profile.theme')}
              selectedValue={this.state.selectedTheme}
              onValueChange={t => this.setOption('selectedTheme', t)}>
              <Picker.Item key={'system'} label={t('profile.system')} value={'system'} color={theme.colors.text} />
              <Picker.Item key={'dark'} label={t('profile.dark')} value={'dark'} color={theme.colors.text} />
              <Picker.Item key={'light'} label={t('profile.light')} value={'light'} color={theme.colors.text} />
            </Picker>
          </View>
          <View style={{ marginTop: 10, height: 70 }}>
            <Text style={{ fontSize: theme.metrics.fontSizes.h3 }}>{`${t('profile.color')} A`}</Text>
            <Picker
              mode={'dropdown'}
              prompt={`${t('profile.color')} A`}
              dropdownIconColor={theme.colors.primary}
              selectedValue={this.state.themeOptions[0]}
              onValueChange={color => this.setThemeOption(0, color)}>
              {palette.map(color => (
                <Picker.Item key={`${color}-a`} label={color} value={color} color={theme.colors.text} />
              ))}
            </Picker>
          </View>
          <View style={{ marginTop: 10, height: 70 }}>
            <Text style={{ fontSize: theme.metrics.fontSizes.h3 }}>{`${t('profile.color')} B`}</Text>
            <Picker
              mode={'dropdown'}
              prompt={`${t('profile.color')} B`}
              dropdownIconColor={theme.colors.secondary}
              selectedValue={this.state.themeOptions[1]}
              onValueChange={color => this.setThemeOption(1, color)}>
              {palette.map(color => (
                <Picker.Item key={`${color}-b`} label={color} value={color} color={theme.colors.text} />
              ))}
            </Picker>
          </View>
          <View style={{ marginTop: 10, height: 70 }}>
            <Text style={{ fontSize: theme.metrics.fontSizes.h3 }}>{`${t('profile.color')} C`}</Text>
            <Picker
              mode={'dropdown'}
              prompt={`${t('profile.color')} C`}
              dropdownIconColor={theme.colors.tertiary}
              selectedValue={this.state.themeOptions[2]}
              onValueChange={color => this.setThemeOption(2, color)}>
              {palette.map(color => (
                <Picker.Item key={`${color}-c`} label={color} value={color} color={theme.colors.text} />
              ))}
            </Picker>
          </View>
          <View style={{ marginTop: 10, height: 70 }}>
            <Text style={{ fontSize: theme.metrics.fontSizes.h3 }}>{t('profile.fontSize')}</Text>
            <Picker
              mode={'dropdown'}
              prompt={t('profile.fontSize')}
              selectedValue={this.state.themeOptions[3]}
              onValueChange={size => this.setThemeOption(3, size)}>
              {fontSizes.map(size => (
                <Picker.Item key={`${size}-fontSize`} label={`${size}`} value={size} color={theme.colors.text} />
              ))}
            </Picker>
          </View>
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
        </ScrollView>
        <FilterSettingsDialog onUpdate={filters => this.setFilters(filters)} />
      </View>
    )
  }
}
