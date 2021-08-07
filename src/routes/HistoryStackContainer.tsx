import React, { useContext } from 'react'
import { createNativeStackNavigator } from 'react-native-screens/native-stack'
import { MainContext, NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, History } from '../routes'

export const HistoryStackContainer = () => {
  const HistoryStack = createNativeStackNavigator()
  const context = useContext(MainContext)
  return (
    <HistoryStack.Navigator initialRouteName={'history'} screenOptions={NavOptions.screenOptions(context.theme)}>
      <HistoryStack.Screen name={'history'} component={History} options={{ headerShown: false }} />
      <HistoryStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </HistoryStack.Navigator>
  )
}
