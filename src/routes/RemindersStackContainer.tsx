import React, { useContext } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { MainContext, NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, LlmAssistant, Reminders } from '../routes'

export const RemindersStackContainer = () => {
  const RemindersStack = createNativeStackNavigator()
  const context = useContext(MainContext)
  return (
    <RemindersStack.Navigator initialRouteName={'reminders'} screenOptions={NavOptions.screenOptions(context.theme)}>
      <RemindersStack.Screen name={'reminders'} component={Reminders} options={{ headerShown: false }} />
      <RemindersStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
      <RemindersStack.Screen name={'llm'} component={LlmAssistant} options={discussionScreenOptions} />
    </RemindersStack.Navigator>
  )
}
