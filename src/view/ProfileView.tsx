import React, { Component } from 'react'
import { LayoutAnimation, RefreshControl, ScrollView, View } from 'react-native'
import { Text } from 'react-native-paper'
import {
  ProfileActionsComponent,
  PurchasedSupportItemsComponent,
  SectionHeaderComponent,
  UserIconComponent,
  UserRowComponent,
} from '../component'
import { formatDate, MainContext, Nyx, t, Theme, LayoutAnimConf } from '../lib'

type Props = {
  navigation: any
}
type State = {
  isFetching: boolean
  username: string
  activeFriends: any[]
  theme?: Theme
  containerWidth: number
  userInfoWidth: number
}
export class ProfileView extends Component<Props> {
  static contextType = MainContext
  state: Readonly<State>
  nyx?: Nyx
  constructor(props) {
    super(props)
    this.state = {
      isFetching: false,
      username: '',
      activeFriends: [],
      theme: undefined,
      containerWidth: 0,
      userInfoWidth: 0,
    }
  }

  componentDidMount() {
    this.nyx = (this.context as any).nyx
    this.getUsername()
    this.setTheme()
    this.getActiveFriends()
  }

  getUsername() {
    this.setState({ username: this.nyx?.api.getAuth().username })
  }

  setTheme() {
    this.setState({ theme: (this.context as any).theme })
  }

  async getActiveFriends() {
    this.setState({ isFetching: true })
    const res = await this.nyx?.api.getContext()
    LayoutAnimation.configureNext(LayoutAnimConf.easeInEaseOut)
    this.setState({ isFetching: false, activeFriends: res?.active_friends || [] })
  }

  render() {
    const { activeFriends, theme, username } = this.state
    if (!theme) {
      return null
    }
    return (
      <View style={{ backgroundColor: theme.colors.background, height: '100%', padding: theme.metrics.blocks.medium }}>
        <View
          onLayout={e => this.setState({ containerWidth: e.nativeEvent.layout.width })}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: theme.metrics.blocks.xlarge }}>
          <View
            onLayout={e => this.setState({ userInfoWidth: e.nativeEvent.layout.width })}
            style={{ flexDirection: 'row', alignItems: 'center' }}>
            <UserIconComponent username={username} marginRight={10} />
            <View>
              <Text style={{ backgroundColor: theme.colors.background, fontSize: theme.metrics.fontSizes.h1 }}>
                {username}
              </Text>
              <Text style={{ fontSize: theme.metrics.fontSizes.small, marginTop: -5 }}>{`v${this.nyx?.appVersion}`}</Text>
            </View>
          </View>
          <ProfileActionsComponent
            navigation={this.props.navigation}
            theme={theme}
            isLlmEnabled={!!(this.context as any)?.config?.isLlmEnabled}
            availableWidth={
              this.state.containerWidth > 0 && this.state.userInfoWidth > 0
                ? this.state.containerWidth - this.state.userInfoWidth - 10
                : undefined
            }
          />
        </View>
        <PurchasedSupportItemsComponent navigation={this.props.navigation} theme={theme} />
        <View>
          <SectionHeaderComponent title={t('friends')} backgroundColor={theme.colors.tertiary} />
        </View>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: theme.colors.background }}
          refreshControl={
            <RefreshControl refreshing={this.state.isFetching} onRefresh={() => this.getActiveFriends()} />
          }>
          {activeFriends?.length === 0 && (
            <SectionHeaderComponent title={t('empty')} backgroundColor={theme.colors.surface} />
          )}
          {activeFriends?.length > 0 &&
            activeFriends.map(u => (
              <UserRowComponent
                key={`${u.username}-${u.last_activity}`}
                user={u}
                extraText={`${u.location?.length > 0 ? u.location.substr(0, 20) : '...'} | ${
                  u.last_access_method
                } | ${formatDate(u.last_activity).substr(12)}`}
                theme={theme}
                isPressable={false}
              />
            ))}
        </ScrollView>
        {/*<MessageBoxDialog*/}
        {/*  ref={r => (this.refMsgBoxDialog = r)}*/}
        {/*  nyx={this.nyx}*/}
        {/*  params={{ isGitIssue: true }}*/}
        {/*  fabBackgroundColor={theme.colors.tertiary}*/}
        {/*  fabIcon={'github'}*/}
        {/*  fabTopPosition={0}*/}
        {/*  isVisible={false}*/}
        {/*  onSend={() => null}*/}
        {/*/>*/}
      </View>
    )
  }
}
