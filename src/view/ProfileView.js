import React, { Component } from 'react'
import { ScrollView, Switch, Text, View } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { ButtonComponent, confirm, UserIconComponent } from '../component'
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
      isBottomTabs: config?.isBottomTabs !== undefined ? !!config.isBottomTabs : true,
      isBookmarksEnabled: config?.isBookmarksEnabled !== undefined ? !!config.isBookmarksEnabled : true,
      isHistoryEnabled: config?.isHistoryEnabled !== undefined ? !!config.isHistoryEnabled : true,
      initialRouteName: config?.initialRouteName || 'historyStack',
      username: '',
    }
  }

  getUsername() {
    this.setState({ username: this.nyx.auth.username })
  }

  async setBottomTabs(isBottomTabs) {
    this.setState({ isBottomTabs })
    const conf = await Storage.getConfig()
    conf.isBottomTabs = isBottomTabs
    await Storage.setConfig(conf)
    this.props.onConfigChange()
  }

  async setBookmarksEnabled(isBookmarksEnabled) {
    this.setState({ isBookmarksEnabled })
    const conf = await Storage.getConfig()
    conf.isBookmarksEnabled = isBookmarksEnabled
    await Storage.setConfig(conf)
    this.props.onConfigChange()
  }

  async setHistoryEnabled(isHistoryEnabled) {
    this.setState({ isHistoryEnabled })
    const conf = await Storage.getConfig()
    conf.isHistoryEnabled = isHistoryEnabled
    await Storage.setConfig(conf)
    this.props.onConfigChange()
  }

  async setInitialRouteName(initialRouteName) {
    this.setState({ initialRouteName })
    const conf = await Storage.getConfig()
    conf.initialRouteName = initialRouteName
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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: Styling.metrics.block.large,
          }}>
          <Text style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: 18 }]}>
            {t('profile.tabsOnBottom')}
          </Text>
          <Switch
            thumbColor={this.state.isBottomTabs ? Styling.colors.primary : Styling.colors.lighter}
            onValueChange={val => this.setBottomTabs(val)}
            value={this.state.isBottomTabs}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: Styling.metrics.block.large,
          }}>
          <Text style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: 18 }]}>{t('bookmarks')}</Text>
          <Switch
            thumbColor={this.state.isBookmarksEnabled ? Styling.colors.primary : Styling.colors.lighter}
            onValueChange={val => this.setBookmarksEnabled(val)}
            value={this.state.isBookmarksEnabled}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: Styling.metrics.block.large,
          }}>
          <Text style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: 18 }]}>{t('history')}</Text>
          <Switch
            thumbColor={this.state.isHistoryEnabled ? Styling.colors.primary : Styling.colors.lighter}
            onValueChange={val => this.setHistoryEnabled(val)}
            value={this.state.isHistoryEnabled}
          />
        </View>
        <View>
          <Text style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: 18 }]}>{t('profile.initialView')}</Text>
          <Picker
            mode={'dropdown'}
            style={[Styling.groups.themeComponent(this.isDarkMode), { color: Styling.colors.primary }]}
            prompt={t('profile.initialView')}
            selectedValue={this.state.initialRouteName}
            onValueChange={route => this.setInitialRouteName(route)}>
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
      </ScrollView>
    )
  }
}
