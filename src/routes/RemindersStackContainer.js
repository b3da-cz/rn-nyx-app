import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, Reminders } from '../routes'

export const RemindersStackContainer = ({ navigation, route }) => {
  const RemindersStack = createStackNavigator()
  return (
    <RemindersStack.Navigator initialRouteName={'reminders'} screenOptions={NavOptions.screenOptions}>
      <RemindersStack.Screen name={'reminders'} component={Reminders} options={{ headerShown: false }} />
      <RemindersStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </RemindersStack.Navigator>
  )
}
