import React, { useContext } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { MainContext, NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, Events } from '../routes'

export const EventsStackContainer = () => {
  const EventsStack = createNativeStackNavigator()
  const context = useContext(MainContext)
  return (
    <EventsStack.Navigator initialRouteName={'events'} screenOptions={NavOptions.screenOptions(context.theme)}>
      <EventsStack.Screen name={'events'} component={Events} options={{ headerShown: false }} />
      <EventsStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </EventsStack.Navigator>
  )
}
