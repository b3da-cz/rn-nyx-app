import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, Mail } from '../routes'

export const MailStackContainer = ({ navigation, route }) => {
  const MailStack = createStackNavigator()
  return (
    <MailStack.Navigator initialRouteName={'mail'} screenOptions={NavOptions.screenOptions}>
      <MailStack.Screen name={'mail'} component={Mail} options={{ headerShown: false }} />
      <MailStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </MailStack.Navigator>
  )
}
