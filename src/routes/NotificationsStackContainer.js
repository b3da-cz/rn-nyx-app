import React, { useContext } from 'react'
import { createNativeStackNavigator } from 'react-native-screens/native-stack'
import { MainContext, NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, Notifications } from '../routes'

export const NotificationsStackContainer = ({ navigation, route }) => {
  const NotificationsStack = createNativeStackNavigator()
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
