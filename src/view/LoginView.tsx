import React, { Component } from 'react'
import { Image, View, Linking, LayoutAnimation, ToastAndroid } from 'react-native'
import { Text, TextInput, TouchableRipple } from 'react-native-paper'
import Clipboard from '@react-native-clipboard/clipboard'
import DeviceInfo from 'react-native-device-info'
import { ButtonComponent, TOSComponent } from '../component'
import { t, Theme } from '../lib'

type Props = {
  theme: Theme
  confirmationCode?: string
  onUsername: Function
  onLogin: Function
}
type State = {
  username: string
  areTOSConfirmed: boolean
}
export class LoginView extends Component<Props> {
  state: Readonly<State>
  constructor(props) {
    super(props)
    this.state = {
      username: '',
      areTOSConfirmed: false,
    }
  }

  login() {
    this.setState({ username: '' })
    this.props.onLogin()
  }

  confirmUsername() {
    this.props.onUsername(this.state.username)
  }

  render() {
    const { username, areTOSConfirmed } = this.state
    const { confirmationCode, theme } = this.props
    const isUsernameFilledIn = username && username.length > 0
    if (!theme) {
      return null
    }
    if (!areTOSConfirmed) {
      return (
        <TOSComponent
          theme={theme}
          onConfirm={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.linear)
            this.setState({ areTOSConfirmed: true })
          }}
        />
      )
    }
    return (
      <View style={{ backgroundColor: theme.colors.row, flex: 1 }}>
        <View
          style={{
            backgroundColor: theme.colors.background,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 5,
            paddingBottom: 5,
          }}>
          <TouchableRipple
            rippleColor={theme.colors.ripple}
            onPress={() => Linking.openURL('https://github.com/b3da-cz/rn-nyx-app').catch(() => null)}>
            <View>
              <Text style={{ fontSize: theme.metrics.fontSizes.h1 }}>{t('app')}</Text>
              <Text style={{ fontSize: theme.metrics.fontSizes.small }}>{`v${DeviceInfo.getVersion()}`}</Text>
            </View>
          </TouchableRipple>
          <TouchableRipple
            rippleColor={theme.colors.ripple}
            onPress={() =>
              Linking.openURL(
                confirmationCode && confirmationCode.length > 0
                  ? `https://nyx.cz/profile/${username.toUpperCase()}/settings/authorizations`
                  : 'https://nyx.cz',
              ).catch(() => null)
            }>
            <Image
              style={{
                width: 50,
                height: 50,
                margin: theme.metrics.blocks.medium,
                opacity: 0.5,
              }}
              resizeMode={'contain'}
              source={require('../../assets/nyx.png')}
            />
          </TouchableRipple>
        </View>
        {confirmationCode && confirmationCode.length > 0 ? (
          <View>
            <View
              style={{
                marginTop: theme.metrics.blocks.medium,
                marginHorizontal: theme.metrics.blocks.medium,
              }}>
              <Text
                onPress={() =>
                  Linking.openURL(`https://nyx.cz/profile/${username.toUpperCase()}/settings/authorizations`).catch(
                    () => null,
                  )
                }
                style={{ padding: theme.metrics.blocks.large, fontSize: theme.metrics.fontSizes.h3 }}>
                {t('profile.login.message')}
              </Text>
              <Text
                onPress={() => {
                  Clipboard.setString(confirmationCode)
                  ToastAndroid.showWithGravity(t('coppied'), ToastAndroid.LONG, ToastAndroid.BOTTOM)
                }}
                style={{ padding: theme.metrics.blocks.large, fontSize: theme.metrics.fontSizes.h1 }}>
                {`"${confirmationCode}"`}
              </Text>
            </View>
            <ButtonComponent
              label={t('ok')}
              textAlign={'center'}
              borderWidth={1}
              theme={theme}
              borderColor={theme.colors.primary}
              backgroundColor={theme.colors.background}
              color={theme.colors.primary}
              fontSize={theme.metrics.fontSizes.h1}
              marginTop={theme.metrics.blocks.medium}
              marginHorizontal={theme.metrics.blocks.medium}
              width={theme.metrics.screen.width - theme.metrics.blocks.medium * 2}
              onPress={() => this.login()}
            />
          </View>
        ) : (
          <View>
            <TextInput
              style={{
                color: theme.colors.text,
                marginTop: theme.metrics.blocks.medium,
                marginHorizontal: theme.metrics.blocks.medium,
              }}
              placeholder={t('username')}
              onChangeText={val => this.setState({ username: val })}
              value={`${username}`}
            />
            <ButtonComponent
              isDisabled={!isUsernameFilledIn}
              label={t('profile.login.do')}
              textAlign={'center'}
              borderWidth={1}
              theme={theme}
              borderColor={isUsernameFilledIn ? theme.colors.primary : theme.colors.background}
              backgroundColor={theme.colors.background}
              color={isUsernameFilledIn ? theme.colors.primary : theme.colors.disabled}
              fontSize={theme.metrics.fontSizes.h1}
              marginTop={theme.metrics.blocks.medium}
              marginHorizontal={theme.metrics.blocks.medium}
              width={theme.metrics.screen.width - theme.metrics.blocks.medium * 2}
              onPress={() => this.confirmUsername()}
            />
          </View>
        )}
      </View>
    )
  }
}
