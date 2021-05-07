import React, { Component } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { ButtonComponent, confirm, FormRowToggleComponent, MessageBoxDialog, UserIconComponent } from '../component'
import { Context, Styling, Storage, t, initFCM, unregisterFCM } from '../lib'

type Props = {
  config: any,
  onConfigChange: Function,
}
export class ProfileView extends Component<Props> {
  static contextType = Context
  constructor(props) {
    super(props)
    this.loadSettings()
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.getUsername()
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
      username: '',
    }
  }

  getUsername() {
    this.setState({ username: this.nyx.auth.username })
  }

  async setOption(name, val) {
    this.setState({ [name]: val })
    const conf = await Storage.getConfig()
    conf[name] = val
    await Storage.setConfig(conf)
    this.props.onConfigChange()
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
    const username = this.state.username
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={[Styling.groups.themeComponent(this.isDarkMode), { height: '100%', padding: 5 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: Styling.metrics.block.large }}>
          <UserIconComponent username={username} marginRight={10} />
          <View>
            <Text
              style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: Styling.metrics.fontSize.xxlarge }]}>
              {username}
            </Text>
            <Text
              style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: Styling.metrics.fontSize.small }]}>
              {`v${this.nyx?.appVersion}`}
            </Text>
          </View>
        </View>
        <FormRowToggleComponent
          label={t('profile.tabsOnBottom')}
          isDarkMode={this.isDarkMode}
          value={this.state.isBottomTabs}
          onChange={val => this.setOption('isBottomTabs', val)}
        />
        <FormRowToggleComponent
          label={t('profile.navGestures')}
          isDarkMode={this.isDarkMode}
          value={this.state.isNavGesturesEnabled}
          onChange={val => this.setOption('isNavGesturesEnabled', val)}
        />
        <FormRowToggleComponent
          label={t('bookmarks')}
          isDarkMode={this.isDarkMode}
          value={this.state.isBookmarksEnabled}
          onChange={val => this.setOption('isBookmarksEnabled', val)}
        />
        <FormRowToggleComponent
          label={t('history')}
          isDarkMode={this.isDarkMode}
          value={this.state.isHistoryEnabled}
          onChange={val => this.setOption('isHistoryEnabled', val)}
        />
        <FormRowToggleComponent
          label={t('search.title')}
          isDarkMode={this.isDarkMode}
          value={this.state.isSearchEnabled}
          onChange={val => this.setOption('isSearchEnabled', val)}
        />
        <FormRowToggleComponent
          label={t('last')}
          isDarkMode={this.isDarkMode}
          value={this.state.isLastEnabled}
          onChange={val => this.setOption('isLastEnabled', val)}
        />
        <FormRowToggleComponent
          label={t('reminders.title')}
          isDarkMode={this.isDarkMode}
          value={this.state.isRemindersEnabled}
          onChange={val => this.setOption('isRemindersEnabled', val)}
        />
        <View style={{ marginTop: 10 }}>
          <Text style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: 18 }]}>
            {t('profile.initialView')}
          </Text>
          <Picker
            mode={'dropdown'}
            style={[Styling.groups.themeComponent(this.isDarkMode), { color: Styling.colors.primary }]}
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
        <ButtonComponent
          label={t('profile.fcm.subscribe.title')}
          icon={'mail'}
          textAlign={'left'}
          color={Styling.colors.secondary}
          fontSize={Styling.metrics.fontSize.medium}
          marginBottom={Styling.metrics.block.small}
          isDarkMode={this.isDarkMode}
          onPress={() => this.subscribeFCM()}
        />
        <ButtonComponent
          label={t('profile.fcm.unsubscribe.title')}
          icon={'trash-2'}
          textAlign={'left'}
          color={Styling.colors.secondary}
          fontSize={Styling.metrics.fontSize.medium}
          marginBottom={Styling.metrics.block.small}
          isDarkMode={this.isDarkMode}
          onPress={() => this.unsubscribeFCM()}
        />
        <ButtonComponent
          label={t('profile.logout')}
          icon={'lock'}
          textAlign={'left'}
          color={Styling.colors.secondary}
          fontSize={Styling.metrics.fontSize.medium}
          marginBottom={Styling.metrics.block.small}
          isDarkMode={this.isDarkMode}
          onPress={() => this.logout()}
        />
        <MessageBoxDialog
          ref={r => (this.refMsgBoxDialog = r)}
          nyx={this.nyx}
          params={{ isGitIssue: true }}
          fabBackgroundColor={Styling.colors.secondary}
          fabIcon={'github'}
          fabTopPosition={0}
          isVisible={false}
          onSend={() => null}
        />
      </ScrollView>
    )
  }
}
