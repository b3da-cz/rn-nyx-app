import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { TextInput } from 'react-native-paper'
import { ButtonComponent } from '../component'
import { Styling } from '../lib'

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
    const { username } = this.state
    const { confirmationCode, isDarkMode } = this.props
    const isUsernameFilledIn = username && username.length > 0
    return (
      <View style={[Styling.groups.themeView(isDarkMode), { flex: 1 }]}>
        {confirmationCode?.length > 0 ? (
          <View>
            <Text
              style={[
                Styling.groups.sectionTitle,
                Styling.groups.themeComponent(isDarkMode),
                { padding: Styling.metrics.block.medium },
              ]}>
              {`Confirm auth in Nyx settings:`}
            </Text>
            <Text
              style={[
                Styling.groups.themeComponent(isDarkMode),
                { padding: Styling.metrics.block.medium, fontSize: Styling.metrics.fontSize.large },
              ]}>
              {`Open nyx.cz -> user settings -> auth -> enter confirmation code for app:`}
            </Text>
            <Text
              style={[
                Styling.groups.sectionTitle,
                Styling.groups.themeComponent(isDarkMode),
                { padding: Styling.metrics.block.medium },
              ]}>
              {`"${confirmationCode}"\n\nTHEN press continue`}
            </Text>
            <ButtonComponent
              label={'continue to app'}
              textAlign={'center'}
              borderWidth={1}
              borderColor={Styling.colors.primary}
              backgroundColor={Styling.colors.black}
              color={Styling.colors.primary}
              fontSize={Styling.metrics.fontSize.xlarge}
              marginTop={Styling.metrics.block.large}
              marginBottom={0}
              isDarkMode={isDarkMode}
              onPress={() => this.login()}
            />
          </View>
        ) : (
          <View>
            <Text
              style={[
                Styling.groups.sectionTitle,
                Styling.groups.themeComponent(isDarkMode),
                { padding: 20, paddingTop: 40 },
              ]}>
              Enter your nyx username
            </Text>
            <TextInput
              style={{
                backgroundColor: isDarkMode ? Styling.colors.dark : Styling.colors.light,
                color: isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
              }}
              onChangeText={val => this.setState({ username: val })}
              value={`${username}`}
            />
            <ButtonComponent
              isDisabled={!isUsernameFilledIn}
              label={'continue'}
              textAlign={'center'}
              borderWidth={1}
              borderColor={isUsernameFilledIn ? Styling.colors.primary : Styling.colors.black}
              backgroundColor={Styling.colors.black}
              color={isUsernameFilledIn ? Styling.colors.primary : Styling.colors.darker}
              fontSize={Styling.metrics.fontSize.xlarge}
              marginTop={Styling.metrics.block.large}
              marginBottom={0}
              isDarkMode={isDarkMode}
              onPress={() => this.confirmUsername()}
            />
          </View>
        )}
      </View>
    )
  }
}
