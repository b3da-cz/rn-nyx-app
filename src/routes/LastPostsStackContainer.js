import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, LastPosts } from '../routes'

export const LastPostsStackContainer = ({ navigation, route }) => {
  const LastPostsStack = createStackNavigator()
  return (
    <LastPostsStack.Navigator initialRouteName={'last'} screenOptions={NavOptions.screenOptions}>
      <LastPostsStack.Screen name={'last'} component={LastPosts} options={{ headerShown: false }} />
      <LastPostsStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </LastPostsStack.Navigator>
  )
}
