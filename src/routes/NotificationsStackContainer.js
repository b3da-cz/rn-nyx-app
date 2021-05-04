import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, Notifications } from '../routes'

export const NotificationsStackContainer = ({ navigation, route }) => {
  const NotificationsStack = createStackNavigator()
  return (
    <NotificationsStack.Navigator initialRouteName={'notifications'} screenOptions={NavOptions.screenOptions}>
      <NotificationsStack.Screen name={'notifications'} component={Notifications} options={{ headerShown: false }} />
      <NotificationsStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </NotificationsStack.Navigator>
  )
}
