import React, { useContext } from 'react'
import { createNativeStackNavigator } from 'react-native-screens/native-stack'
import { MainContext, NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, Mail } from '../routes'

export const MailStackContainer = () => {
  const MailStack = createNativeStackNavigator()
  const context = useContext(MainContext)
  return (
    <MailStack.Navigator initialRouteName={'mail'} screenOptions={NavOptions.screenOptions(context.theme)}>
      <MailStack.Screen name={'mail'} component={Mail} options={{ headerShown: false }} />
      <MailStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </MailStack.Navigator>
  )
}
