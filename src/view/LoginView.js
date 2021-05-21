import React, { Component } from 'react'
import { Text, Image, View, Linking, LayoutAnimation } from 'react-native'
import { TextInput, TouchableRipple } from 'react-native-paper'
import DeviceInfo from 'react-native-device-info'
import { ButtonComponent, TOSComponent } from '../component'
import { Styling, t } from '../lib'
import Share from 'react-native-share'

type Props = {
  isDarkMode: boolean,
  confirmationCode: string,
  onUsername: Function,
  onLogin: Function,
}
export class LoginView extends Component<Props> {
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
    const { confirmationCode, isDarkMode } = this.props
    const isUsernameFilledIn = username && username.length > 0
    if (!areTOSConfirmed) {
      return (
        <TOSComponent
          isDarkMode={this.props.isDarkMode}
          onConfirm={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.linear)
            this.setState({ areTOSConfirmed: true })
          }}
        />
      )
    }
    return (
      <View style={[Styling.groups.themeView(isDarkMode), { flex: 1 }]}>
        <View
          style={[
            Styling.groups.themeComponent(isDarkMode),
            {
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 5,
              paddingBottom: 5,
            },
          ]}>
          <TouchableRipple
            rippleColor={'rgba(18,146,180, 0.3)'}
            onPress={() => Linking.openURL('https://github.com/b3da-cz/rn-nyx-app').catch(() => null)}>
            <View>
              <Text style={[Styling.groups.sectionTitle, Styling.groups.themeComponent(isDarkMode)]}>{t('app')}</Text>
              <Text style={Styling.groups.themeComponent(isDarkMode)}>{`v${DeviceInfo.getVersion()}`}</Text>
            </View>
          </TouchableRipple>
          <TouchableRipple
            rippleColor={'rgba(18,146,180, 0.3)'}
            onPress={() => Linking.openURL('https://nyx.cz').catch(() => null)}>
            <Image
              style={{
                width: 50,
                height: 50,
                margin: Styling.metrics.block.small,
                opacity: 0.5,
              }}
              resizeMode={'contain'}
              source={require('../../assets/nyx.png')}
            />
          </TouchableRipple>
        </View>
        {confirmationCode?.length > 0 ? (
          <View>
            <View
              style={[
                Styling.groups.themeComponent(isDarkMode),
                {
                  marginTop: Styling.metrics.block.small,
                  marginHorizontal: Styling.metrics.block.small,
                  fontSize: Styling.metrics.fontSize.large,
                },
              ]}>
              <Text
                onPress={() => Linking.openURL('https://nyx.cz').catch(() => null)}
                style={[
                  Styling.groups.themeComponent(isDarkMode),
                  { padding: Styling.metrics.block.medium, fontSize: Styling.metrics.fontSize.large },
                ]}>
                {t('profile.login.message')}
              </Text>
              <Text
                onPress={() =>
                  Share.open({
                    title: 'Confirmation code',
                    message: confirmationCode,
                  })
                }
                style={[
                  Styling.groups.themeComponent(isDarkMode),
                  Styling.groups.sectionTitle,
                  { padding: Styling.metrics.block.medium },
                ]}>
                {`"${confirmationCode}"`}
              </Text>
            </View>
            <ButtonComponent
              label={t('ok')}
              textAlign={'center'}
              borderWidth={1}
              borderColor={Styling.colors.primary}
              backgroundColor={isDarkMode ? Styling.colors.black : Styling.colors.white}
              color={Styling.colors.primary}
              fontSize={Styling.metrics.fontSize.xxlarge}
              marginTop={Styling.metrics.block.small}
              marginHorizontal={Styling.metrics.block.small}
              width={Styling.metrics.window().width - Styling.metrics.block.small * 2}
              isDarkMode={isDarkMode}
              onPress={() => this.login()}
            />
          </View>
        ) : (
          <View>
            <TextInput
              style={{
                backgroundColor: isDarkMode ? Styling.colors.dark : Styling.colors.light,
                color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
                marginTop: Styling.metrics.block.small,
                marginHorizontal: Styling.metrics.block.small,
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
              borderColor={
                isUsernameFilledIn ? Styling.colors.primary : isDarkMode ? Styling.colors.black : Styling.colors.white
              }
              backgroundColor={isDarkMode ? Styling.colors.black : Styling.colors.white}
              color={isUsernameFilledIn ? Styling.colors.primary : Styling.colors.darker}
              fontSize={Styling.metrics.fontSize.xxlarge}
              marginTop={Styling.metrics.block.small}
              marginHorizontal={Styling.metrics.block.small}
              width={Styling.metrics.window().width - Styling.metrics.block.small * 2}
              isDarkMode={isDarkMode}
              onPress={() => this.confirmUsername()}
            />
          </View>
        )}
      </View>
    )
  }
}
