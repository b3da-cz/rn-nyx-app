import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, History } from '../routes'

export const HistoryStackContainer = ({ navigation, route }) => {
  const HistoryStack = createStackNavigator()
  return (
    <HistoryStack.Navigator initialRouteName={'history'} screenOptions={NavOptions.screenOptions}>
      <HistoryStack.Screen name={'history'} component={History} options={{ headerShown: false }} />
      <HistoryStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </HistoryStack.Navigator>
  )
}
