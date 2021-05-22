import React, { useContext } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { MainContext, NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, History } from '../routes'

export const HistoryStackContainer = ({ navigation, route }) => {
  const HistoryStack = createStackNavigator()
  const context = useContext(MainContext)
  return (
    <HistoryStack.Navigator
      initialRouteName={'history'}
      screenOptions={NavOptions.screenOptions(context.theme === 'dark')}>
      <HistoryStack.Screen name={'history'} component={History} options={{ headerShown: false }} />
      <HistoryStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </HistoryStack.Navigator>
  )
}
