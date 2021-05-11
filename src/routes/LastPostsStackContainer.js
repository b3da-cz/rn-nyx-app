import React, { useContext } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { Context, NavOptions, discussionScreenOptions } from '../lib'
import { Discussion, LastPosts } from '../routes'

export const LastPostsStackContainer = ({ navigation, route }) => {
  const LastPostsStack = createStackNavigator()
  const context = useContext(Context)
  return (
    <LastPostsStack.Navigator
      initialRouteName={'last'}
      screenOptions={NavOptions.screenOptions(context.theme === 'dark')}>
      <LastPostsStack.Screen name={'last'} component={LastPosts} options={{ headerShown: false }} />
      <LastPostsStack.Screen name={'discussion'} component={Discussion} options={discussionScreenOptions} />
    </LastPostsStack.Navigator>
  )
}
