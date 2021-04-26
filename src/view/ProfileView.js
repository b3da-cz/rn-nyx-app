import React, { Component } from 'react'
import { ScrollView, RefreshControl, Text, View } from 'react-native'
import { ButtonComponent, confirm, UserIconComponent } from '../component'
import { Context, Styling, Storage, initFCM, unregisterFCM } from '../lib'

type Props = {}
export class ProfileView extends Component<Props> {
  static contextType = Context
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      username: '',
    }
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.getUsername()
  }

  getUsername() {
    this.setState({ username: this.nyx.auth.username })
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
