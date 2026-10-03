import React, { useContext } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StackHeaderComponent } from '../component'
import { MainContext, NavOptions, discussionScreenOptions, t } from '../lib'
import { Discussion, EventCreate, EventTimeline, Events } from '../routes'

export const EventsStackContainer = () => {
  const EventsStack = createNativeStackNavigator()
  const context = useContext(MainContext)
  return (
    <EventsStack.Navigator initialRouteName={'events'} screenOptions={NavOptions.screenOptions(context.theme)}>
      <EventsStack.Screen name={'events'} component={Events} options={{ headerShown: false }} />
      <EventsStack.Screen
        name={'eventCreate'}
        component={EventCreate}
        options={{
          title: t('events.create'),
          gestureEnabled: false,
          fullScreenGestureEnabled: false,
          header: props => <StackHeaderComponent {...props} theme={context.theme} />,
        }}
      />
      <EventsStack.Screen
        name={'eventTimeline'}
        component={EventTimeline}
        options={{
          title: t('events.timeline'),
          header: props => <StackHeaderComponent {...props} theme={context.theme} />,
        }}
      />
      <EventsStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </EventsStack.Navigator>
  )
}
