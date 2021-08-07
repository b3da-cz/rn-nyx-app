import React, { Component } from 'react'
import { ScrollView, View } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import {
  ButtonComponent,
  ComponentExamplesComponent,
  confirm,
  FilterSettingsDialog,
  FormRowToggleComponent,
  SectionHeaderComponent,
} from '../component'
import {
  defaultThemeOptions,
  MainContext,
  Storage,
  t,
  Theme,
  ThemeInit,
  IBMColorPalette,
  initFCM,
  unregisterFCM,
  createTheme,
  Nyx,
} from '../lib'

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
  themeOptions: ThemeInit
  selectedTheme: string
  isDarkMode: boolean
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

  // componentWillUnmount() {
  //   this.props.onConfigChange()
  // }

  setTheme() {
    this.setState({ theme: this.context.theme })
  }

  previewTheme() {
    const params = this.state && this.state.themeOptions ? this.state.themeOptions : { ...defaultThemeOptions }
    const theme = createTheme(params)
    this.setState({ theme })
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
      isUnreadToggleEnabled: config.isUnreadToggleEnabled === undefined ? true : !!config.isUnreadToggleEnabled,
      initialRouteName: config?.initialRouteName || 'historyStack',
      themeOptions: config?.themeOptions || { ...defaultThemeOptions },
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

  async setThemeOption(key, val) {
    const conf = await Storage.getConfig()
    const themeOptions = this.state && this.state.themeOptions ? this.state.themeOptions : { ...defaultThemeOptions }
    themeOptions[key] = val
    this.setState({ themeOptions })
    conf.themeOptions = themeOptions
    await Storage.setConfig(conf)
    // this.previewTheme()
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
    const palette = ['blue', 'cyan', 'coolGray', 'green', 'magenta', 'purple', 'red', 'teal']
    const fontSizes = [12, 13, 14, 15, 16, 17, 18]
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
          <View style={{ marginTop: 10, height: theme.metrics.blocks.rowDiscussion + 50 }}>
            <SectionHeaderComponent title={t('profile.initialView')} backgroundColor={theme.colors.surface} />
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
                color={this.state.isHistoryEnabled ? theme.colors.link : theme.colors.disabled}
                style={{ fontSize: theme.metrics.fontSizes.p }}
              />
              <Picker.Item
                key={'bookmarksStack'}
                label={t('bookmarks')}
                value={'bookmarksStack'}
                enabled={this.state.isBookmarksEnabled}
                color={this.state.isBookmarksEnabled ? theme.colors.link : theme.colors.disabled}
                style={{ fontSize: theme.metrics.fontSizes.p }}
              />
              <Picker.Item
                key={'mailStack'}
                label={t('mail')}
                value={'mailStack'}
                color={theme.colors.link}
                style={{ fontSize: theme.metrics.fontSizes.p }}
              />
            </Picker>
          </View>
          <View style={{ marginTop: 10, height: theme.metrics.blocks.rowDiscussion + 50 }}>
            <SectionHeaderComponent title={t('profile.theme')} backgroundColor={theme.colors.surface} />
            <Picker
              mode={'dropdown'}
              prompt={t('profile.theme')}
              selectedValue={this.state.selectedTheme}
              onValueChange={t => this.setOption('selectedTheme', t)}>
              <Picker.Item
                key={'system'}
                label={t('profile.system')}
                value={'system'}
                color={theme.colors.link}
                style={{ fontSize: theme.metrics.fontSizes.p }}
              />
              <Picker.Item
                key={'dark'}
                label={t('profile.dark')}
                value={'dark'}
                color={theme.colors.link}
                style={{ fontSize: theme.metrics.fontSizes.p }}
              />
              <Picker.Item
                key={'light'}
                label={t('profile.light')}
                value={'light'}
                color={theme.colors.link}
                style={{ fontSize: theme.metrics.fontSizes.p }}
              />
            </Picker>
          </View>
          <View style={{ marginTop: 10, height: theme.metrics.blocks.rowDiscussion + 50 }}>
            <SectionHeaderComponent title={`${t('profile.color')} A`} backgroundColor={theme.colors.primary} />
            <Picker
              mode={'dropdown'}
              prompt={`${t('profile.color')} A`}
              dropdownIconColor={theme.colors.primary}
              selectedValue={this.state && this.state.themeOptions && this.state.themeOptions.primaryColor}
              onValueChange={color => this.setThemeOption('primaryColor', color)}>
              {palette.map(color => (
                <Picker.Item
                  key={`${color}-a`}
                  label={color}
                  value={color}
                  color={IBMColorPalette[`${color}60`]}
                  style={{ fontSize: theme.metrics.fontSizes.p }}
                />
              ))}
            </Picker>
          </View>
          <View style={{ marginTop: 10, height: theme.metrics.blocks.rowDiscussion + 50 }}>
            <SectionHeaderComponent title={`${t('profile.color')} B`} backgroundColor={theme.colors.secondary} />
            <Picker
              mode={'dropdown'}
              prompt={`${t('profile.color')} B`}
              dropdownIconColor={theme.colors.secondary}
              selectedValue={this.state && this.state.themeOptions && this.state.themeOptions.secondaryColor}
              onValueChange={color => this.setThemeOption('secondaryColor', color)}>
              {palette.map(color => (
                <Picker.Item
                  key={`${color}-b`}
                  label={color}
                  value={color}
                  color={IBMColorPalette[`${color}60`]}
                  style={{ fontSize: theme.metrics.fontSizes.p }}
                />
              ))}
            </Picker>
          </View>
          <View style={{ marginTop: 10, height: theme.metrics.blocks.rowDiscussion + 50 }}>
            <SectionHeaderComponent title={`${t('profile.color')} C`} backgroundColor={theme.colors.tertiary} />
            <Picker
              mode={'dropdown'}
              prompt={`${t('profile.color')} C`}
              dropdownIconColor={theme.colors.tertiary}
              selectedValue={this.state && this.state.themeOptions && this.state.themeOptions.tertiaryColor}
              onValueChange={color => this.setThemeOption('tertiaryColor', color)}>
              {palette.map(color => (
                <Picker.Item
                  key={`${color}-c`}
                  label={color}
                  value={color}
                  color={IBMColorPalette[`${color}60`]}
                  style={{ fontSize: theme.metrics.fontSizes.p }}
                />
              ))}
            </Picker>
          </View>
          <View style={{ marginTop: 10, height: theme.metrics.blocks.rowDiscussion + 50 }}>
            <SectionHeaderComponent title={`${t('profile.color')} D`} backgroundColor={theme.colors.surface} />
            <Picker
              mode={'dropdown'}
              prompt={`${t('profile.color')} D`}
              dropdownIconColor={theme.colors.surface}
              selectedValue={this.state && this.state.themeOptions && this.state.themeOptions.surfaceColor}
              onValueChange={color => this.setThemeOption('surfaceColor', color)}>
              <Picker.Item
                key={'black-d'}
                label={'black'}
                value={'black'}
                color={theme.colors.text}
                style={{ fontSize: theme.metrics.fontSizes.p }}
              />
              <Picker.Item
                key={'white-d'}
                label={'white'}
                value={'white'}
                color={theme.colors.text}
                style={{ fontSize: theme.metrics.fontSizes.p }}
              />
              {palette.map(color => (
                <Picker.Item
                  key={`${color}-d`}
                  label={color}
                  value={color}
                  color={IBMColorPalette[`${color}60`]}
                  style={{ fontSize: theme.metrics.fontSizes.p }}
                />
              ))}
            </Picker>
          </View>
          <View style={{ marginTop: 10, height: theme.metrics.blocks.rowDiscussion + 50 }}>
            <SectionHeaderComponent title={t('profile.fontSize')} backgroundColor={theme.colors.surface} />
            <Picker
              mode={'dropdown'}
              prompt={t('profile.fontSize')}
              selectedValue={this.state && this.state.themeOptions && this.state.themeOptions.baseFontSize}
              onValueChange={size => this.setThemeOption('baseFontSize', size)}>
              {fontSizes.map(size => (
                <Picker.Item
                  key={`${size}-fontSize`}
                  label={`${size}`}
                  value={size}
                  color={theme.colors.link}
                  style={{ fontSize: theme.metrics.fontSizes.p }}
                />
              ))}
            </Picker>
          </View>
          <View style={{ marginTop: 10, height: theme.metrics.blocks.rowDiscussion + 50 }}>
            <SectionHeaderComponent title={t('profile.padding')} backgroundColor={theme.colors.surface} />
            <Picker
              mode={'dropdown'}
              prompt={t('profile.padding')}
              selectedValue={this.state && this.state.themeOptions && this.state.themeOptions.baseBlockSize}
              onValueChange={size => this.setThemeOption('baseBlockSize', size)}>
              {fontSizes.map(size => (
                <Picker.Item
                  key={`${size}-padding`}
                  label={`${size}`}
                  value={size}
                  color={theme.colors.link}
                  style={{ fontSize: theme.metrics.fontSizes.p }}
                />
              ))}
            </Picker>
          </View>
          <ComponentExamplesComponent nyx={this.nyx} />
        </ScrollView>
        <FilterSettingsDialog onUpdate={filters => this.setFilters(filters)} />
      </View>
    )
  }
}
