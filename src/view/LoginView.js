import React, { Component } from 'react'
import { ActivityIndicator, ScrollView, Text, TextInput, RefreshControl, TouchableOpacity, View } from 'react-native'
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
      isUsernameConfirmed: false,
    }
  }

  login() {
    this.setState({ username: '' })
    this.props.onLogin()
  }

  confirmUsername() {
    this.setState({ isUsernameConfirmed: true })
    this.props.onUsername(this.state.username)
  }

  render() {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={[
          Styling.groups.themeView(this.props.isDarkMode),
          { maxHeight: Math.max(Styling.metrics.window().height, Styling.metrics.window().width) - 60 },
        ]}>
        {this.props.confirmationCode && this.props.confirmationCode.length > 0 ? (
          <View>
            <Text
              style={[
                Styling.groups.sectionTitle,
                Styling.groups.themeComponent(this.props.isDarkMode),
                { padding: 20, paddingTop: 40 },
              ]}>
              {`Confirm auth in Nyx settings:\n\nOpen nyx.cz -> user settings -> auth -> enter confirmation code for app: \n\n"${this.props.confirmationCode}"\n\nTHEN press continue`}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={{
                flexDirection: 'row',
                marginTop: 10,
                backgroundColor: this.props.isDarkMode ? Styling.colors.black : Styling.colors.white,
              }}
              onPress={() => this.login()}>
              <Text
                style={{
                  color: this.props.isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
                  fontSize: 24,
                  padding: 20,
                  textAlign: 'center',
                  width: '100%',
                }}>
                Continue to app
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text
              style={[
                Styling.groups.sectionTitle,
                Styling.groups.themeComponent(this.props.isDarkMode),
                { padding: 20, paddingTop: 40 },
              ]}>
              Enter your nyx username
            </Text>
            <TextInput
              style={{
                backgroundColor: this.props.isDarkMode ? Styling.colors.dark : Styling.colors.light,
                color: this.props.isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
              }}
              onChangeText={username => this.setState({ username })}
              value={`${this.state.username}`}
            />
            <TouchableOpacity
              accessibilityRole="button"
              style={{
                flexDirection: 'row',
                marginTop: 10,
                backgroundColor: this.props.isDarkMode ? Styling.colors.black : Styling.colors.white,
              }}
              onPress={() => this.confirmUsername()}>
              <Text
                style={{
                  color: this.props.isDarkMode ? Styling.colors.lighter : Styling.colors.darker,
                  fontSize: 24,
                  padding: 20,
                  textAlign: 'center',
                  width: '100%',
                }}>
                Confirm username
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    )
  }
}
