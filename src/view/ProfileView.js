import React, { Component } from 'react'
import { LayoutAnimation, RefreshControl, ScrollView, Text, View } from 'react-native'
import { IconButton } from 'react-native-paper'
import { LoaderComponent, MessageBoxDialog, UserIconComponent, UserRowComponent } from '../component'
import { formatDate, MainContext, Styling, t, LayoutAnimConf } from '../lib'

type Props = {
  config: any,
  navigation: any,
  onConfigChange: Function,
}
export class ProfileView extends Component<Props> {
  static contextType = MainContext
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      username: '',
      activeFriends: [],
    }
  }

  componentDidMount() {
    this.nyx = this.context.nyx
    this.isDarkMode = this.context.theme === 'dark'
    this.getUsername()
    this.getActiveFriends()
  }

  getUsername() {
    this.setState({ username: this.nyx.auth.username })
  }

  async getActiveFriends() {
    this.setState({ isFetching: true })
    const res = await this.nyx.getContext()
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({ isFetching: false, activeFriends: res.active_friends || [] })
  }

  render() {
    const { activeFriends, isFetching, username } = this.state
    return (
      <View style={[Styling.groups.themeComponent(this.isDarkMode), { height: '100%', padding: 5 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: Styling.metrics.block.large }}>
          <UserIconComponent username={username} marginRight={10} />
          <View>
            <Text
              style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: Styling.metrics.fontSize.xxlarge }]}>
              {username}
            </Text>
            <Text
              style={[
                Styling.groups.themeComponent(this.isDarkMode),
                { fontSize: Styling.metrics.fontSize.small, marginTop: -5 },
              ]}>
              {`v${this.nyx?.appVersion}`}
            </Text>
          </View>
          <IconButton
            icon={'cog-outline'}
            size={24}
            color={this.isDarkMode ? Styling.colors.lighter : Styling.colors.darker}
            style={{ marginLeft: 'auto', marginTop: -20, marginRight: 10 }}
            onPress={() => this.props.navigation.push('settings')}
            rippleColor={'rgba(18,146,180, 0.3)'}
          />
        </View>
        <View style={{ marginBottom: Styling.metrics.block.small }}>
          <Text style={[Styling.groups.themeComponent(this.isDarkMode), { fontSize: Styling.metrics.fontSize.medium }]}>
            {t('friends')}
          </Text>
        </View>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={Styling.groups.themeComponent(this.isDarkMode)}
          refreshControl={
            <RefreshControl refreshing={this.state.isFetching} onRefresh={() => this.getActiveFriends()} />
          }>
          {isFetching && <LoaderComponent />}
          {activeFriends?.length > 0 &&
            activeFriends.map(u => (
              <UserRowComponent
                key={`${u.username}-${u.last_activity}`}
                user={u}
                extraText={`${u.location?.length > 0 ? u.location.substr(0, 20) : '...'} | ${
                  u.last_access_method
                } | ${formatDate(u.last_activity).substr(12)}`}
                isDarkMode={this.isDarkMode}
                isPressable={false}
                marginBottom={0}
                marginTop={Styling.metrics.block.xsmall}
              />
            ))}
        </ScrollView>
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
      </View>
    )
  }
}
