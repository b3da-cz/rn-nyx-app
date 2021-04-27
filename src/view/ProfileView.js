import React, { Component } from 'react'
import { ScrollView, Switch, Text, View } from 'react-native'
import { ButtonComponent, confirm, UserIconComponent } from '../component'
import { Context, Styling, Storage, initFCM, unregisterFCM } from '../lib'

type Props = {
  onSettingsChange: Function,
}
export class ProfileView extends Component<Props> {
  static contextType = Context
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      isBookmarksEnabled: true,
      isHistoryEnabled: true,
      username: '',
    }
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.getUsername()
  }

  async getUsername() {
    const conf = await Storage.getConfig()
    const { isBookmarksEnabled, isHistoryEnabled } = conf
    this.setState({
      username: this.nyx.auth.username,
      isBookmarksEnabled: !!isBookmarksEnabled,
      isHistoryEnabled: !!isHistoryEnabled,
    })
  }

  async setBookmarksEnabled(isBookmarksEnabled) {
    const conf = await Storage.getConfig()
    conf.isBookmarksEnabled = isBookmarksEnabled
    await Storage.setConfig(conf)
    this.setState({ isBookmarksEnabled })
    this.props.onSettingsChange({
      isBookmarksEnabled,
      isHistoryEnabled: this.state.isHistoryEnabled,
    })
  }

  async setHistoryEnabled(isHistoryEnabled) {
    const conf = await Storage.getConfig()
    conf.isHistoryEnabled = isHistoryEnabled
    await Storage.setConfig(conf)
    this.setState({ isHistoryEnabled })
    this.props.onSettingsChange({
      isBookmarksEnabled: this.state.isBookmarksEnabled,
      isHistoryEnabled,
    })
  }

  async subscribeFCM() {
    const isConfirmed = await confirm('Warning', 'You are about to subscribe to FCM. Are you sure?')
    if (!isConfirmed) {
      return
    }
    this.setState({ isFetching: true })
    const res = await initFCM(this.nyx, true)
    console.warn(res); // TODO: remove
    this.setState({ isFetching: false })
  }

  async unsubscribeFCM() {
    const isConfirmed = await confirm('Warning', 'You are about to unsubscribe from FCM. Are you sure?')
    if (!isConfirmed) {
      return
    }
    this.setState({ isFetching: true })
    const res = await unregisterFCM(this.nyx, true)
    console.warn(res); // TODO: remove
    this.setState({ isFetching: false })
  }

  async logout() {
    const isConfirmed = await confirm('Warning', 'You are about to logout from app. Are you sure?')
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
          <Text
            style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: Styling.metrics.fontSize.xxlarge }]}>
            {username}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: Styling.metrics.block.large,
          }}>
          <Text style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: 18 }]}>Show bookmarks</Text>
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
          <Text style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: 18 }]}>Show history</Text>
          <Switch
            thumbColor={this.state.isHistoryEnabled ? Styling.colors.primary : Styling.colors.lighter}
            onValueChange={val => this.setHistoryEnabled(val)}
            value={this.state.isHistoryEnabled}
          />
        </View>
        <ButtonComponent
          label={'subscribe FCM'}
          icon={'mail'}
          textAlign={'left'}
          color={Styling.colors.secondary}
          fontSize={Styling.metrics.fontSize.medium}
          marginBottom={Styling.metrics.block.small}
          isDarkMode={this.isDarkMode}
          onPress={() => this.subscribeFCM()}
        />
        <ButtonComponent
          label={'unsubscribe FCM'}
          icon={'trash-2'}
          textAlign={'left'}
          color={Styling.colors.secondary}
          fontSize={Styling.metrics.fontSize.medium}
          marginBottom={Styling.metrics.block.small}
          isDarkMode={this.isDarkMode}
          onPress={() => this.unsubscribeFCM()}
        />
        <ButtonComponent
          label={'logout'}
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
