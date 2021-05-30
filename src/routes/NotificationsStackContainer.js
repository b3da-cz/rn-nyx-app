import React, { useContext } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { MainContext, NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, Notifications } from '../routes'

export const NotificationsStackContainer = ({ navigation, route }) => {
  const NotificationsStack = createStackNavigator()
  const context = useContext(MainContext)
  return (
    <NotificationsStack.Navigator
      initialRouteName={'notifications'}
      screenOptions={NavOptions.screenOptions(context.theme)}>
      <NotificationsStack.Screen name={'notifications'} component={Notifications} options={{ headerShown: false }} />
      <NotificationsStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </NotificationsStack.Navigator>
  )
}
