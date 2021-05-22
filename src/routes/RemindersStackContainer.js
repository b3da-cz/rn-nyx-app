import React, { useContext } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { MainContext, NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, Reminders } from '../routes'

export const RemindersStackContainer = ({ navigation, route }) => {
  const RemindersStack = createStackNavigator()
  const context = useContext(MainContext)
  return (
    <RemindersStack.Navigator
      initialRouteName={'reminders'}
      screenOptions={NavOptions.screenOptions(context.theme === 'dark')}>
      <RemindersStack.Screen name={'reminders'} component={Reminders} options={{ headerShown: false }} />
      <RemindersStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </RemindersStack.Navigator>
  )
}
